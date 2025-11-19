import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Optional, Tuple

from django.conf import settings

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

logger = logging.getLogger(__name__)

# === Конфигурация (используем Decimal для точности финансов и веса) ===

# Объёмный коэффициент (см³ -> кг) для расчёта объёмного веса
VOLUME_FACTOR = Decimal(str(getattr(settings, "SHIPMENT_VOLUME_FACTOR", 7000)))
# НДС (накладывается ПОСЛЕ конвертации CZK -> EUR)
VAT_RATE = Decimal(str(getattr(settings, "VAT_RATE", Decimal("0.21"))))

COURIER_CODE_ZASILKOVNA = "zasilkovna"


# === Вспомогательные функции ===

def _to_cm(mm: Optional[int]) -> Decimal:
    return (Decimal(mm or 0) / Decimal("10")).quantize(Decimal("0.01"))


def _to_kg(grams: Optional[int]) -> Decimal:
    return (Decimal(grams or 0) / Decimal("1000")).quantize(Decimal("0.001"))


def _round2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _toll_surcharge(weight_kg: Decimal) -> Decimal:
    """
    Packeta toll surcharge (CZ sheet):
    ≤5 кг -> 2.10 CZK ;  >5 кг -> 4.80 CZK
    """
    return Decimal("2.10") if weight_kg <= Decimal("5") else Decimal("4.80")


def _weight_tag(channel: str, weight_kg: Decimal) -> str:
    """
    Весовые коридоры для поиска ShippingRate.weight_limit:

    PUDO (Z-Point/Box):
      - 5 / 10 / 15

    HD (Home):
      - 1 / 2 / 5 / 10 / 15 / 30
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


def _pick_rate(country: str, channel: str, category: str, weight_kg: Decimal) -> ShippingRate:
    """
    Достаём ставку из БД по (courier, country, channel, category, weight_tag).
    Если точного коридора нет — пробуем 'over_limit' в рамках того же channel/category.
    """
    tag = _weight_tag(channel, weight_kg)
    base_qs = (
        ShippingRate.objects
        .select_related("courier_service")
        .filter(
            courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
            country=country.upper(),
            channel=channel,
            category=category,
        )
    )

    try:
        return base_qs.get(weight_limit=tag)
    except ShippingRate.DoesNotExist:
        try:
            return base_qs.get(weight_limit="over_limit")
        except ShippingRate.DoesNotExist:
            raise ValueError(
                f"No Zásilkovna rate for {country}/{channel}/{category} with weight_tag={tag}"
            )


def _format_option(rate_obj: ShippingRate, total_czk: Decimal, is_oversize: bool = False) -> Dict:
    """
    Приводим стоимость к EUR, затем начисляем VAT (после конвертации).
    """
    total_czk = _round2(total_czk)
    price_eur = _round2(convert_czk_to_eur(total_czk))
    price_eur_vat = _round2(price_eur * (Decimal("1") + VAT_RATE))

    return {
        "courier": rate_obj.courier_service.name or "Zásilkovna",
        "service": "Pick-up point" if rate_obj.channel == "PUDO" else "Home Delivery",
        "channel": rate_obj.channel,
        "price": price_eur,
        "priceWithVat": price_eur_vat,
        "currency": "EUR",
        "estimate": rate_obj.estimate or "",
        "isOversize": is_oversize,
    }


# === Габариты посылки: СИНХРОНИЗАЦИЯ СО СПЛИТОМ ===

def _stack_dims_by_height(
    items: List[Dict],
    variant_map: Dict[str, ProductVariant],
) -> Tuple[Decimal, Decimal, Decimal]:
    """
    Ровно та же эвристика, что использует сплит Packeta:
      L = max(length_i)
      W = max(width_i)
      H = sum(height_i)  (укладка «по высоте»)
    """
    max_L = Decimal("0")
    max_W = Decimal("0")
    sum_H = Decimal("0")

    for it in items:
        v = variant_map[str(it["sku"])]
        l = _to_cm(v.length_mm)
        w = _to_cm(v.width_mm)
        h = _to_cm(v.height_mm)
        qty = int(it["quantity"])

        if l > max_L:
            max_L = l
        if w > max_W:
            max_W = w
        # высота суммируется по количеству
        sum_H += (h * qty)

    # Округлим до сотых, чтобы избежать «лежака» 120.0000001
    return (
        max_L.quantize(Decimal("0.01")),
        max_W.quantize(Decimal("0.01")),
        sum_H.quantize(Decimal("0.01")),
    )


# === Основная функция расчёта ДЛЯ ОДНОЙ «МАЛОЙ» ПОСЫЛКИ ===
# (Эту функцию вызывает твой shipping_split.py для каждой разбиённой посылки.)

def calculate_shipping_options(
    country: str,
    items: List[Dict],
    cod: bool,
    currency: str,
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> List[Dict]:
    """
    Расчёт опций Zásilkovna (PUDO + HD) для одной посылки (после сплита).

    Габаритно-весовые правила (по прайсу):
      PUDO:
        - standard : вес ≤ 5 кг,   max_side ≤ 70 см,  sum_sides ≤ 120 см
        - oversized: вес ≤ 15 кг,  max_side ≤ 120 см, sum_sides ≤ 150 см
      HD:
        - standard : вес ≤ 5 кг,   max_side ≤ 70 см,  sum_sides ≤ 120 см
        - oversized: вес ≤ 15 кг,  max_side ≤ 120 см, sum_sides ≤ 150 см
        - extended : вес ≤ 30 кг,  max_side ≤ 120 см, sum_sides ≤ 999 см

    Надбавки:
      - fuel: 5% от базовой ставки в CZK
      - toll: 2.10 CZK если вес ≤5 кг, иначе 4.80 CZK
      - COD: берём из ShippingRate.cod_fee (если cod=True), иначе 0
    Порядок:
      (base + fuel + toll + cod) [CZK] -> convert_czk_to_eur -> VAT
    """

    # 1) Загружаем варианты
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    # 2) Масса и объём
    total_weight_kg = Decimal("0.000")
    total_volume_cm3 = Decimal("0.00")

    for it in items:
        v = variant_map.get(str(it["sku"]))
        if not v:
            raise ValueError(f"ProductVariant with sku={it['sku']} not found")

        qty = int(it["quantity"])
        lw = _to_cm(v.length_mm)
        ww = _to_cm(v.width_mm)
        hh = _to_cm(v.height_mm)
        wg = _to_kg(v.weight_grams)

        total_weight_kg += (wg * qty)
        total_volume_cm3 += (lw * ww * hh) * qty

    volumetric_weight = _round2(total_volume_cm3 / VOLUME_FACTOR)
    chargeable_weight = max(total_weight_kg, volumetric_weight)

    logger.info(
        "Zásilkovna weights %s: total=%s kg volumetric=%s kg chargeable=%s kg",
        country, total_weight_kg, volumetric_weight, chargeable_weight
    )

    # 3) Габариты посылки — ТА ЖЕ ЛОГИКА, ЧТО В СПЛИТЕ (без py3dbp)
    L, W, H = _stack_dims_by_height(items, variant_map)
    sum_sides = L + W + H
    max_side = max(L, W, H)

    logger.info(
        "Zásilkovna dims %s: L=%s W=%s H=%s sum=%s max=%s",
        country, L, W, H, sum_sides, max_side
    )

    # 4) Категории (по прайсу)
    def cat_pudo(w: Decimal, mx: Decimal, sm: Decimal) -> Optional[str]:
        if w <= Decimal("5") and mx <= Decimal("70") and sm <= Decimal("120"):
            return "standard"
        if w <= Decimal("15") and mx <= Decimal("120") and sm <= Decimal("150"):
            return "oversized"
        return None

    def cat_hd(w: Decimal, mx: Decimal, sm: Decimal) -> Optional[str]:
        if w <= Decimal("5") and mx <= Decimal("70") and sm <= Decimal("120"):
            return "standard"
        if w <= Decimal("15") and mx <= Decimal("120") and sm <= Decimal("150"):
            return "oversized"
        if w <= Decimal("30") and mx <= Decimal("120") and sm <= Decimal("999"):
            return "extended"
        return None

    options: List[Dict] = []

    # 5) PUDO
    pudo_cat = cat_pudo(chargeable_weight, max_side, sum_sides)
    if pudo_cat:
        try:
            rate = _pick_rate(country, "PUDO", pudo_cat, chargeable_weight)
            base = Decimal(rate.price)  # CZK
            cod_fee = Decimal(rate.cod_fee or 0) if cod else Decimal("0.00")
            fuel = _round2(base * Decimal("0.05"))
            toll = _toll_surcharge(chargeable_weight)
            total_czk = base + fuel + toll + cod_fee

            logger.debug("Zásilkovna PUDO: base=%s fuel=%s toll=%s cod=%s total=%s",
                         base, fuel, toll, cod_fee, total_czk)
            options.append(_format_option(rate, total_czk, is_oversize=(chargeable_weight > 5 or sum_sides > 120)))
        except Exception as e:
            logger.info("Zásilkovna PUDO skipped: %s", e)
    else:
        logger.info("Zásilkovna PUDO not available (w=%s sum=%s max=%s)",
                    chargeable_weight, sum_sides, max_side)

    # 6) HD
    hd_cat = cat_hd(chargeable_weight, max_side, sum_sides)
    if hd_cat:
        try:
            rate = _pick_rate(country, "HD", hd_cat, chargeable_weight)
            base = Decimal(rate.price)  # CZK
            cod_fee = Decimal(rate.cod_fee or 0) if cod else Decimal("0.00")
            fuel = _round2(base * Decimal("0.05"))
            toll = _toll_surcharge(chargeable_weight)
            total_czk = base + fuel + toll + cod_fee

            logger.debug("Zásilkovna HD: base=%s fuel=%s toll=%s cod=%s total=%s",
                         base, fuel, toll, cod_fee, total_czk)
            options.append(_format_option(rate, total_czk, is_oversize=(chargeable_weight > 5 or sum_sides > 120)))
        except Exception as e:
            logger.info("Zásilkovna HD skipped: %s", e)
    else:
        logger.info("Zásilkovna HD not available (w=%s sum=%s max=%s)",
                    chargeable_weight, sum_sides, max_side)

    if not options:
        raise ValueError("Zásilkovna: no available options for given parcel/limits")

    # PUDO выводим первой
    options.sort(key=lambda o: 0 if o["channel"] == "PUDO" else 1)
    return options
