from __future__ import annotations

import logging
from decimal import Decimal, ROUND_UP
from typing import Any, Dict, List, Optional

from django.conf import settings
from py3dbp import Packer, Bin, Item

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

logger = logging.getLogger(__name__)

COURIER_CODE_GLS = "gls"

# --- конфигурируемые ставки и лимиты (значения по прайсу/нашим договорённостям) ---
VOLUME_FACTOR = getattr(settings, "SHIPMENT_VOLUME_FACTOR", 7000)               # см³ → кг
VAT_RATE = getattr(settings, "VAT_RATE", Decimal("0.21"))

GLS_MAX_WEIGHT_KG = Decimal(str(getattr(settings, "GLS_MAX_WEIGHT_KG", "31.5")))
GLS_MAX_SIDE_CM = Decimal(str(getattr(settings, "GLS_MAX_SIDE_CM", "120")))
GLS_MAX_SUM_SIDES_CM = Decimal(str(getattr(settings, "GLS_MAX_SUM_SIDES_CM", "300")))

# Palivový příplatek (текущая ставка 1,10% из прайса)
GLS_FUEL_PCT = Decimal(str(getattr(settings, "GLS_FUEL_PCT", "0.011")))         # 1.10%

# PUDO Export: скидка к EuroBusinessParcel (HD)
GLS_PUDO_EXPORT_DISCOUNT_CZK = Decimal(str(
    getattr(settings, "GLS_PUDO_EXPORT_DISCOUNT_CZK", "27.00")
))  # -27 Kč

# Mýtný příplatek: Kč за каждый начатый кг
GLS_TOLL_PER_KG_CZK = Decimal(str(
    getattr(settings, "GLS_TOLL_PER_KG_CZK", "1.47")
))  # 1.47 Kč / kg


# ---------- helpers ----------

def _ceil_kg(x: Decimal) -> Decimal:
    """Округление вверх до целых килограммов."""
    return x.to_integral_value(rounding=ROUND_UP)


def _toll_surcharge_czk(weight_kg: Decimal) -> Decimal:
    """Mýtný příplatek = ceil(kg) * ставка."""
    return (_ceil_kg(weight_kg) * GLS_TOLL_PER_KG_CZK).quantize(Decimal("0.01"))


def _weight_tag_gls(weight_kg: Decimal) -> str:
    """
    GLS has tiers: 5, 10, 20, 31.5 kg (stored as '31_5').
    Map any weight to the smallest tier >= weight.
    """
    if weight_kg <= Decimal("5"):
        return "5"
    if weight_kg <= Decimal("10"):
        return "10"
    if weight_kg <= Decimal("20"):
        return "20"
    if weight_kg <= Decimal("31.5"):
        return "31_5"
    return "over_limit"


def _calc_dims_and_weights(items: List[Dict[str, Any]], variant_map: Dict[str, ProductVariant]) -> Dict[str, Decimal]:
    total_weight_kg = Decimal("0")
    total_volume_cm3 = Decimal("0")

    for it in items:
        v = variant_map.get(it["sku"])
        if not v:
            raise ValueError(f"ProductVariant with sku={it['sku']} not found")
        qty = int(it["quantity"])
        weight_kg = Decimal(v.weight_grams or 0) / Decimal("1000")
        volume_cm3 = (
            Decimal(v.length_mm or 0) / 10 *
            Decimal(v.width_mm or 0) / 10 *
            Decimal(v.height_mm or 0) / 10
        )
        total_weight_kg += weight_kg * qty
        total_volume_cm3 += volume_cm3 * qty

    volumetric_weight = (total_volume_cm3 / VOLUME_FACTOR).quantize(Decimal("0.01"))
    chargeable = max(total_weight_kg, volumetric_weight)

    return {
        "total_weight_kg": total_weight_kg,
        "total_volume_cm3": total_volume_cm3,
        "volumetric_weight": volumetric_weight,
        "chargeable_weight": chargeable,
    }


def _pack_dims(items: List[Dict[str, Any]], variant_map: Dict[str, ProductVariant], chargeable_weight: Decimal):
    """
    Грубая укладка (как в логике Zásilkovna) через py3dbp, чтобы получить габариты.
    Возвращает (L, W, H, sum_sides, max_side) в сантиметрах.
    """
    packer = Packer()
    packer.add_bin(Bin("master-box", 1000, 1000, 1000, float(chargeable_weight)))

    for it in items:
        v = variant_map[it["sku"]]
        for _ in range(int(it["quantity"])):
            packer.add_item(Item(
                it["sku"],
                float(Decimal(v.length_mm or 0) / 10),
                float(Decimal(v.width_mm or 0) / 10),
                float(Decimal(v.height_mm or 0) / 10),
                float(Decimal(v.weight_grams or 0) / 1000),
            ))

    packer.pack(bigger_first=True, number_of_decimals=2)
    used_bin = packer.bins[0]

    max_x = max((it.position[0] + it.width for it in used_bin.items), default=0)
    max_y = max((it.position[1] + it.height for it in used_bin.items), default=0)
    max_z = max((it.position[2] + it.depth for it in used_bin.items), default=0)

    L, W, H = Decimal(max_x), Decimal(max_y), Decimal(max_z)
    return L, W, H, (L + W + H), max(L, W, H)


def _gls_category(chargeable_weight: Decimal, max_side: Decimal, sum_sides: Decimal) -> str:
    """
    Простое сопоставление к нашим двум категориям.
    При необходимости поправим пороги под точные ограничения.
    """
    # "standard" — до 15 кг и умеренные габариты
    if chargeable_weight <= Decimal("15") and max_side <= GLS_MAX_SIDE_CM and sum_sides <= Decimal("150"):
        return "standard"
    # "oversized" — до предельных лимитов GLS
    if chargeable_weight <= GLS_MAX_WEIGHT_KG and max_side <= GLS_MAX_SIDE_CM and sum_sides <= GLS_MAX_SUM_SIDES_CM:
        return "oversized"
    raise ValueError("GLS: package exceeds allowed dimensions or weight")


def _pick_rate(country: str, channel: str, category: str, tag: str, address_bundle: str) -> ShippingRate:
    """
    Достаёт тариф GLS из БД. Для PUDO address_bundle = 'one'.
    """
    try:
        return (
            ShippingRate.objects
            .select_related("courier_service")
            .get(
                courier_service__code__iexact=COURIER_CODE_GLS,
                country=country.upper(),
                channel=channel,
                category=category,
                weight_limit=tag,
                address_bundle=address_bundle,
            )
        )
    except ShippingRate.DoesNotExist:
        # Фолбэк на over_limit в той же категории/канале/бандле
        try:
            return (
                ShippingRate.objects
                .select_related("courier_service")
                .get(
                    courier_service__code__iexact=COURIER_CODE_GLS,
                    country=country.upper(),
                    channel=channel,
                    category=category,
                    weight_limit="over_limit",
                    address_bundle=address_bundle,
                )
            )
        except ShippingRate.DoesNotExist:
            raise ValueError(
                f"No GLS rate for {channel} {country.upper()} {category} tag={tag} bundle={address_bundle}"
            )


# ---------- публичная функция расчёта ----------

def calculate_gls_shipping_options(
    country: str,
    items: List[Dict[str, Any]],
    currency: str,
    *,
    cod: bool = False,
    address_bundle: str = "one",                       # 'one' или 'multi' (для HD)
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> List[Dict[str, Any]]:
    """
    Возвращает список опций (PUDO, HD), если тарифы доступны.
    Логика прайса:
    - Fuel 1.10% — от базы HD (EuroBusinessParcel).
    - PUDO Export = HD base - 27 Kč (минимум 0).
    - Mýtný příplatek = ceil(вес) * 1.47 Kč (применяем к обоим каналам).
    """
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    w = _calc_dims_and_weights(items, variant_map)
    chargeable = w["chargeable_weight"]

    logger.info(
        "GLS weights %s: total=%.3fkg volumetric=%.3fkg chargeable=%.3fkg",
        country, w["total_weight_kg"], w["volumetric_weight"], chargeable
    )

    if chargeable > GLS_MAX_WEIGHT_KG:
        raise ValueError(f"GLS: weight exceeds {GLS_MAX_WEIGHT_KG} kg")

    L, W, H, sum_sides, max_side = _pack_dims(items, variant_map, chargeable)
    logger.info("GLS dims %s: L=%s W=%s H=%s sum=%s max_side=%s", country, L, W, H, sum_sides, max_side)

    category = _gls_category(chargeable, max_side, sum_sides)
    tag = _weight_tag_gls(chargeable)

    # База HD всегда нужна (от неё считаем fuel и скидку для PUDO)
    hd_rate = _pick_rate(country, "HD", category, tag, address_bundle)
    base_hd = hd_rate.price
    cod_fee = hd_rate.cod_fee if cod else Decimal("0.00")

    fuel_czk = (base_hd * GLS_FUEL_PCT).quantize(Decimal("0.01"))
    toll_czk = _toll_surcharge_czk(chargeable)

    def make_option(channel: str):
        if channel == "PUDO":
            # PUDO export = EuroBusinessParcel (HD base) - 27 Kč, bundle для PUDO не влияет
            base_service = (base_hd - GLS_PUDO_EXPORT_DISCOUNT_CZK)
            if base_service < 0:
                base_service = Decimal("0.00")
            bundle_used = "one"
        else:
            base_service = base_hd
            bundle_used = address_bundle

        total_czk = (base_service + cod_fee + fuel_czk + toll_czk).quantize(Decimal("0.01"))
        total_czk_vat = (total_czk * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))

        price_eur = convert_czk_to_eur(total_czk)
        price_eur_vat = convert_czk_to_eur(total_czk_vat)

        logger.debug(
            "GLS %s: base_hd=%s base_service=%s fuel=%s toll=%s cod=%s tag=%s bundle=%s total=%s",
            channel, base_hd, base_service, fuel_czk, toll_czk, cod_fee, tag, bundle_used, total_czk
        )

        return {
            "courier": hd_rate.courier_service.name,
            "service": "Pick-up point" if channel == "PUDO" else "Home Delivery",
            "channel": channel,
            "price": float(price_eur),
            "priceWithVat": float(price_eur_vat),
            "currency": "EUR",
            "estimate": hd_rate.estimate or "",
        }

    options: List[Dict[str, Any]] = []

    # PUDO (если тарифы/база HD доступны, рассчитываем on-the-fly)
    try:
        options.append(make_option("PUDO"))
    except Exception as e:
        logger.info("GLS PUDO not available for %s %s: %s", country, category, e)

    # HD
    try:
        options.append(make_option("HD"))
    except Exception as e:
        logger.info("GLS HD not available for %s %s: %s", country, category, e)

    if not options:
        raise ValueError("GLS: no rates found for given parameters")

    return options
