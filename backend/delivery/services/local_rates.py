import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Optional

from py3dbp import Packer, Bin, Item
from django.conf import settings

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

# Коэффициент для перевода объёма в кг (см³ → кг)
# Храним как Decimal для точности
VOLUME_FACTOR = Decimal(str(getattr(settings, "SHIPMENT_VOLUME_FACTOR", 7000)))
# Ставка НДС
VAT_RATE = Decimal(str(getattr(settings, "VAT_RATE", Decimal("0.21"))))

COURIER_CODE_ZASILKOVNA = "zasilkovna"

logger = logging.getLogger(__name__)


def get_toll_surcharge(weight_kg: Decimal) -> Decimal:
    """
    Возвращает надбавку за проезд (toll surcharge) по весу.
    ≤5 кг: 2.10 CZK, ≤30 кг: 4.80 CZK, иначе 4.80 CZK.
    """
    w = weight_kg
    if w <= Decimal("5"):
        return Decimal("2.10")
    elif w <= Decimal("30"):
        return Decimal("4.80")
    return Decimal("4.80")


def get_weight_limit_tag(channel: str, weight_kg: Decimal) -> str:
    """
    Возвращает тег weight_limit в зависимости от канала:
    - PUDO: 5 / 10 / 15
    - HD  : 1 / 2 / 5 / 10 / 15 / 30
    """
    w = weight_kg
    if channel == "PUDO":
        if w <= Decimal("5"):
            return "5"
        if w <= Decimal("10"):
            return "10"
        if w <= Decimal("15"):
            return "15"
        return "over_limit"

    # HD
    if w <= Decimal("1"):
        return "1"
    if w <= Decimal("2"):
        return "2"
    if w <= Decimal("5"):
        return "5"
    if w <= Decimal("10"):
        return "10"
    if w <= Decimal("15"):
        return "15"
    if w <= Decimal("30"):
        return "30"
    return "over_limit"


def calculate_shipping_options(
    country: str,
    items: List[Dict],
    cod: bool,
    currency: str,
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> List[Dict]:
    """
    Возвращает доступные опции Zásilkovna (PUDO & HD) в EUR.

    Веса:
      - PUDO: 5 / 10 / 15
      - HD  : 1 / 2 / 5 / 10 / 15 / 30

    Категории (приближено к Packeta sheet):
      - PUDO standard  : ≤5 кг  & max_side ≤70  & sum_sides ≤120
      - PUDO oversized : ≤15 кг & max_side ≤120 & sum_sides ≤150
      - HD   standard  : ≤5 кг  & max_side ≤70  & sum_sides ≤120
      - HD   oversized : ≤30 кг & max_side ≤120 & sum_sides ≤999

    Надбавки:
      - PUDO: toll по весу + fuel = 5% от базы
      - HD  : toll по весу + fuel = 5% от базы

    Порядок:
      CZK (база + надбавки) → convert_czk_to_eur → VAT
    """

    # Собираем variant_map из БД при необходимости
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    # агрегируем физику
    total_weight_kg = Decimal("0")
    total_volume_cm3 = Decimal("0")
    for it in items:
        v = variant_map.get(it["sku"])
        if not v:
            raise ValueError(f"ProductVariant with sku={it['sku']} not found")
        qty = Decimal(str(it["quantity"]))

        weight_kg = (Decimal(v.weight_grams or 0) / Decimal("1000")) * qty
        volume_cm3 = (
            (Decimal(v.length_mm or 0) / Decimal("10")) *
            (Decimal(v.width_mm or 0)  / Decimal("10")) *
            (Decimal(v.height_mm or 0) / Decimal("10"))
        ) * qty

        total_weight_kg += weight_kg
        total_volume_cm3 += volume_cm3

    volumetric_weight = (total_volume_cm3 / VOLUME_FACTOR).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    chargeable_weight = max(total_weight_kg, volumetric_weight)

    logger.info(
        "Zasilkovna weights %s: total=%s kg volumetric=%s kg chargeable=%s kg",
        country, total_weight_kg, volumetric_weight, chargeable_weight
    )

    # Грубая укладка для оценки габаритов (см)
    packer = Packer()
    packer.add_bin(Bin("master-box", 1000, 1000, 1000, float(chargeable_weight)))
    for it in items:
        v = variant_map[it["sku"]]
        for _ in range(int(it["quantity"])):
            packer.add_item(Item(
                it["sku"],
                float(Decimal(v.length_mm or 0) / Decimal("10")),
                float(Decimal(v.width_mm  or 0) / Decimal("10")),
                float(Decimal(v.height_mm or 0) / Decimal("10")),
                float(Decimal(v.weight_grams or 0) / Decimal("1000")),
            ))
    packer.pack(bigger_first=True, number_of_decimals=2)
    used_bin = packer.bins[0]
    max_x = max((x.position[0] + x.width  for x in used_bin.items), default=0.0)
    max_y = max((x.position[1] + x.height for x in used_bin.items), default=0.0)
    max_z = max((x.position[2] + x.depth  for x in used_bin.items), default=0.0)
    L, W, H = Decimal(str(max_x)), Decimal(str(max_y)), Decimal(str(max_z))
    sum_sides = L + W + H
    max_side = max(L, W, H)

    logger.info("Zasilkovna dims %s: L=%s W=%s H=%s sum=%s max_side=%s", country, L, W, H, sum_sides, max_side)

    # категории
    def _category_pudo(weight_kg: Decimal, mx: Decimal, sm: Decimal):
        if weight_kg <= Decimal("5") and mx <= Decimal("70") and sm <= Decimal("120"):
            return "standard"
    # oversized
        if weight_kg <= Decimal("15") and mx <= Decimal("120") and sm <= Decimal("150"):
            return "oversized"
        return None

    def _category_hd(weight_kg: Decimal, mx: Decimal, sm: Decimal):
        if weight_kg <= Decimal("5") and mx <= Decimal("70") and sm <= Decimal("120"):
            return "standard"
        if weight_kg <= Decimal("30") and mx <= Decimal("120") and sm <= Decimal("999"):
            return "oversized"
        return None

    def _pick_rate(channel: str, category: str, weight_kg: Decimal) -> ShippingRate:
        tag = get_weight_limit_tag(channel, weight_kg)
        try:
            return (
                ShippingRate.objects
                .select_related("courier_service")
                .get(
                    courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
                    country=country.upper(),
                    channel=channel,
                    category=category,
                    weight_limit=tag,
                )
            )
        except ShippingRate.DoesNotExist:
            # fallback на over_limit в рамках того же channel/category
            try:
                return (
                    ShippingRate.objects
                    .select_related("courier_service")
                    .get(
                        courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
                        country=country.upper(),
                        channel=channel,
                        category=category,
                        weight_limit="over_limit",
                    )
                )
            except ShippingRate.DoesNotExist:
                raise ValueError(
                    f"No shipping rate for {channel} {country.upper()} {category} "
                    f"Zásilkovna with weight {weight_kg} kg (tag={tag})"
                )

    def _format(rate_obj: ShippingRate, total_czk: Decimal) -> Dict:
        """
        Единый порядок: CZK → EUR → VAT, округление HALF_UP.
        """
        total_czk = Decimal(total_czk).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        price_eur = convert_czk_to_eur(total_czk).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        price_eur_vat = (price_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "courier": rate_obj.courier_service.name or "Zásilkovna",
            "service": "Pick-up point" if rate_obj.channel == "PUDO" else "Home Delivery",
            "channel": rate_obj.channel,         # "PUDO" | "HD"
            "price": price_eur,                  # EUR без НДС
            "priceWithVat": price_eur_vat,       # EUR с НДС
            "currency": "EUR",
            "estimate": rate_obj.estimate or "",
        }

    options: List[Dict] = []

    # --- PUDO ---
    pudo_category = _category_pudo(chargeable_weight, max_side, sum_sides)
    if pudo_category:
        try:
            rate = _pick_rate("PUDO", pudo_category, chargeable_weight)
            base = rate.price
            cod_fee = rate.cod_fee if cod else Decimal("0.00")
            toll = get_toll_surcharge(chargeable_weight)  # 2.10 / 4.80 CZK
            fuel = (base * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)  # 5% от базы
            total = (base + cod_fee + toll + fuel).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            logger.debug(
                "Zasilkovna PUDO: base=%s cod=%s toll=%s fuel=%s total=%s",
                base, cod_fee, toll, fuel, total
            )
            options.append(_format(rate, total))
        except Exception as e:
            logger.info("Zásilkovna PUDO skipped: %s", e)
    else:
        logger.info(
            "Zásilkovna PUDO not available for %s (w=%s; sum=%s; max=%s)",
            country, chargeable_weight, sum_sides, max_side
        )

    # --- HD ---
    hd_category = _category_hd(chargeable_weight, max_side, sum_sides)
    if hd_category:
        try:
            rate = _pick_rate("HD", hd_category, chargeable_weight)
            base = rate.price
            cod_fee = rate.cod_fee if cod else Decimal("0.00")
            toll = get_toll_surcharge(chargeable_weight)
            fuel = (base * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total = (base + cod_fee + toll + fuel).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            logger.debug(
                "Zasilkovna HD: base=%s cod=%s toll=%s fuel=%s total=%s",
                base, cod_fee, toll, fuel, total
            )
            options.append(_format(rate, total))
        except Exception as e:
            logger.info("Zásilkovna HD skipped: %s", e)
    else:
        logger.info(
            "Zásilkovna HD not available for %s (w=%s; sum=%s; max=%s)",
            country, chargeable_weight, sum_sides, max_side
        )

    if not options:
        raise ValueError("Zásilkovna: no available options for given items/limits")

    # PUDO всегда первой
    options.sort(key=lambda o: 0 if o["channel"] == "PUDO" else 1)
    return options
