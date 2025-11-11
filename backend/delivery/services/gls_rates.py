from __future__ import annotations

import logging
from decimal import Decimal, ROUND_UP, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings
from py3dbp import Packer, Bin, Item

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur
from .gls_split import split_items_into_parcels_gls

logger = logging.getLogger(__name__)

# ----- Константы/настройки -----
COURIER_CODE_GLS = "gls"

VOLUME_FACTOR = getattr(settings, "SHIPMENT_VOLUME_FACTOR", 7000)  # см³ → кг
VAT_RATE = getattr(settings, "VAT_RATE", Decimal("0.21"))

GLS_MAX_WEIGHT_KG = Decimal(str(getattr(settings, "GLS_MAX_WEIGHT_KG", "31.5")))
GLS_MAX_SIDE_CM = Decimal(str(getattr(settings, "GLS_MAX_SIDE_CM", "120")))
GLS_MAX_SUM_SIDES_CM = Decimal(str(getattr(settings, "GLS_MAX_SUM_SIDES_CM", "300")))

# Топливо (из прайса GLS — 1.10%)
GLS_FUEL_PCT = Decimal(str(getattr(settings, "GLS_FUEL_PCT", "0.011")))

# PUDO Export: скидка к базовой HD (EuroBusinessParcel)
GLS_PUDO_EXPORT_DISCOUNT_CZK = Decimal(str(
    getattr(settings, "GLS_PUDO_EXPORT_DISCOUNT_CZK", "27.00")
))

# Мытный сбор: Kč за каждый начатый кг
GLS_TOLL_PER_KG_CZK = Decimal(str(
    getattr(settings, "GLS_TOLL_PER_KG_CZK", "1.47")
))


# ----- Внутренние утилиты -----

def _ceil_kg(x: Decimal) -> Decimal:
    """Округление вверх до целых килограммов."""
    return x.to_integral_value(rounding=ROUND_UP)


def _toll_surcharge_czk(weight_kg: Decimal) -> Decimal:
    """Мытный сбор = ceil(kg) * ставка."""
    return (_ceil_kg(weight_kg) * GLS_TOLL_PER_KG_CZK).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _weight_tag_gls(weight_kg: Decimal) -> str:
    """
    Мэппинг веса в тег тарифной сетки GLS.
    5, 10, 20, 31.5 (хранится как '31_5'), иначе 'over_limit'.
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


def _calc_dims_and_weights(
    items: List[Dict[str, Any]],
    variant_map: Dict[str, ProductVariant],
) -> Dict[str, Decimal]:
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

    volumetric_weight = (total_volume_cm3 / Decimal(VOLUME_FACTOR)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    chargeable = max(total_weight_kg, volumetric_weight)

    return {
        "total_weight_kg": total_weight_kg,
        "total_volume_cm3": total_volume_cm3,
        "volumetric_weight": volumetric_weight,
        "chargeable_weight": chargeable,
    }


def _pack_dims(
    items: List[Dict[str, Any]],
    variant_map: Dict[str, ProductVariant],
    chargeable_weight: Decimal,
) -> Tuple[Decimal, Decimal, Decimal, Decimal, Decimal]:
    """
    Грубая укладка через py3dbp для оценки габаритов.
    Возвращает: (L, W, H, sum_sides, max_side) — всё в сантиметрах.
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

    max_x = max((it.position[0] + it.width for it in used_bin.items), default=0.0)
    max_y = max((it.position[1] + it.height for it in used_bin.items), default=0.0)
    max_z = max((it.position[2] + it.depth for it in used_bin.items), default=0.0)

    L, W, H = Decimal(max_x), Decimal(max_y), Decimal(max_z)
    return L, W, H, (L + W + H), max(L, W, H)


def _gls_category(chargeable_weight: Decimal, max_side: Decimal, sum_sides: Decimal) -> str:
    """
    Деление на две категории — 'standard' и 'oversized' — по вашим порогам.
    """
    if chargeable_weight <= Decimal("15") and max_side <= GLS_MAX_SIDE_CM and sum_sides <= Decimal("150"):
        return "standard"
    if chargeable_weight <= GLS_MAX_WEIGHT_KG and max_side <= GLS_MAX_SIDE_CM and sum_sides <= GLS_MAX_SUM_SIDES_CM:
        return "oversized"
    raise ValueError("GLS: package exceeds allowed dimensions or weight")


def _pick_rate(
    country: str,
    channel: str,
    category: str,
    weight_tag: str,
    address_bundle: str,
) -> ShippingRate:
    """
    Достаёт тариф GLS из БД (точное совпадение), без чувствительности к регистру кода курьера.
    Для PUDO address_bundle всегда 'one'.
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
                weight_limit=weight_tag,
                address_bundle=address_bundle,
            )
        )
    except ShippingRate.DoesNotExist:
        # Фолбэк на over_limit в той же комбинации
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
                f"No GLS rate for {channel} {country.upper()} {category} tag={weight_tag} bundle={address_bundle}"
            )


# ----- Внутренняя генерация опций для ОДНОЙ посылки -----

def _gls_options_for_single_parcel(
    *,
    country: str,
    items: List[Dict[str, Any]],
    currency: str,
    cod: bool,
    address_bundle: str,
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> List[Dict[str, Any]]:
    """
    Возвращает список опций GLS (PUDO, HD) для одной посылки.
    """
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    weights = _calc_dims_and_weights(items, variant_map)
    chargeable = weights["chargeable_weight"]

    logger.info(
        "GLS weights %s: total=%.3fkg volumetric=%.3fkg chargeable=%.3fkg",
        country, weights["total_weight_kg"], weights["volumetric_weight"], chargeable
    )

    if chargeable > GLS_MAX_WEIGHT_KG:
        raise ValueError(f"GLS: weight exceeds {GLS_MAX_WEIGHT_KG} kg")

    L, W, H, sum_sides, max_side = _pack_dims(items, variant_map, chargeable)
    logger.info("GLS dims %s: L=%s W=%s H=%s sum=%s max_side=%s", country, L, W, H, sum_sides, max_side)

    category = _gls_category(chargeable, max_side, sum_sides)
    tag = _weight_tag_gls(chargeable)

    # Берём HD-ставку — она нужна всегда
    hd_rate = _pick_rate(country, "HD", category, tag, address_bundle)
    base_hd = hd_rate.price
    cod_fee = hd_rate.cod_fee if cod else Decimal("0.00")

    # Сурчаржи (в CZK)
    fuel_czk = (base_hd * GLS_FUEL_PCT).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    toll_czk = _toll_surcharge_czk(chargeable)

    def make_option(channel: str) -> Dict[str, Any]:
        if channel == "PUDO":
            # PUDO Export = EuroBusinessParcel base - 27 Kč
            base_service = base_hd - GLS_PUDO_EXPORT_DISCOUNT_CZK
            if base_service < 0:
                base_service = Decimal("0.00")
            bundle_used = "one"  # для PUDO всегда 'one'
            service_name = "Pick-up point"
        else:
            base_service = base_hd
            bundle_used = address_bundle
            service_name = "Home Delivery"

        # CZK нетто (база + COD + топливо + мыто)
        total_czk = (base_service + cod_fee + fuel_czk + toll_czk).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Сначала конвертируем нетто CZK → EUR...
        price_eur = convert_czk_to_eur(total_czk).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        # ...затем начисляем VAT уже в EUR:
        price_eur_vat = (price_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        logger.debug(
            "GLS %s: base_hd=%s base_service=%s fuel=%s toll=%s cod=%s tag=%s bundle=%s total_czk=%s price_eur=%s price_eur_vat=%s",
            channel, base_hd, base_service, fuel_czk, toll_czk, cod_fee, tag, bundle_used, total_czk, price_eur, price_eur_vat
        )

        return {
            "courier": hd_rate.courier_service.name or "GLS",
            "service": service_name,
            "channel": channel,                       # "PUDO" | "HD"
            "price": price_eur,                       # EUR без НДС
            "priceWithVat": price_eur_vat,            # EUR с НДС
            "currency": "EUR",
            "estimate": hd_rate.estimate or "",
        }

    options: List[Dict[str, Any]] = []

    # PUDO — считаем на основе HD
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


# ----- Публичные функции с ЕДИНЫМ контрактом -----

def calculate_gls_shipping_options(
    country: str,
    items: List[Dict[str, Any]],
    currency: str,
    *,
    cod: bool = False,
    address_bundle: str = "one",
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> Dict[str, Any]:
    """
    ВЕРСИЯ ДЛЯ ОДНОЙ ПОСЫЛКИ.
    Возвращает ЕДИНЫЙ контракт:
        {"options": [...], "total_parcels": 1}
    """
    options = _gls_options_for_single_parcel(
        country=country,
        items=items,
        currency=currency,
        cod=cod,
        address_bundle=address_bundle,
        variant_map=variant_map,
    )
    # Логируем как раньше (для наглядности в логах)
    logger.info("[GLS] Shipping result (single) for %s: %s", country, options)
    return {"options": options, "total_parcels": 1}


def calculate_order_shipping_gls(
    country: str,
    items: List[Dict[str, Any]],
    cod: bool,
    currency: str,
) -> Dict[str, Any]:
    """
    МУЛЬТИ-ПОСЫЛКА (сплит по GLS).
    Возвращает: {"options": [...], "total_parcels": N}
    """
    parcels = split_items_into_parcels_gls(items)
    address_bundle = "multi" if len(parcels) >= 2 else "one"

    per_parcel_opts: List[List[Dict[str, Any]]] = []
    for parcel in parcels:
        single = calculate_gls_shipping_options(
            country=country,
            items=parcel,
            currency=currency,
            cod=cod,
            address_bundle=address_bundle,
        )
        per_parcel_opts.append(single["options"])

    # аккумулируем по каналу PUDO/HD отдельно нетто и брутто
    sum_net = {"PUDO": Decimal("0.00"), "HD": Decimal("0.00")}
    sum_gross = {"PUDO": Decimal("0.00"), "HD": Decimal("0.00")}
    opt_by_channel: Dict[str, Optional[Dict[str, Any]]] = {"PUDO": None, "HD": None}

    for opts in per_parcel_opts:
        for opt in opts:
            ch = opt["channel"]
            sum_net[ch] += opt["price"]
            sum_gross[ch] += opt["priceWithVat"]
            opt_by_channel[ch] = opt  # для estimate/названия

    result: List[Dict[str, Any]] = []
    for ch in ("PUDO", "HD"):
        base = opt_by_channel[ch]
        if base:
            result.append({
                "courier": "GLS",
                "service": base["service"],
                "channel": ch,
                "price": sum_net[ch].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "priceWithVat": sum_gross[ch].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "currency": "EUR",
                "estimate": base.get("estimate", ""),
            })

    aggregated = {"options": result, "total_parcels": len(parcels)}
    logger.info("[GLS] Shipping result (aggregated %s parcels) for %s: %s", len(parcels), country, aggregated)
    return aggregated
