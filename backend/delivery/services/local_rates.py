from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Literal, Optional

from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

# Единая ставка НДС (по вашим требованиям)
VAT_RATE = Decimal("0.21")  # 21%

# Топливные/платные дороги и прочие надбавки (пример — оставьте вашу бизнес-логику)
FUEL_SURCHARGE_PCT = Decimal("0.05")  # 5% от базы в CZK
# Для Packeta у вас, как правило, платных дорог нет; если есть своя надбавка — оставьте
TOLL_ABS_CZK_UPTO_5KG = Decimal("2.10")
TOLL_ABS_CZK_UPTO_30KG = Decimal("4.80")

Channel = Literal["PUDO", "HD"]


def _select_rate(courier_service: str, country: str, channel: Channel, category: str, weight_limit: str) -> Optional[ShippingRate]:
    """
    Поиск ставки в ShippingRate.
    category: 'standard' / 'oversized'
    weight_limit: '1', '2', ..., '15', 'over_limit' (пример)
    """
    return (
        ShippingRate.objects
        .filter(
            courier_service__code=courier_service,
            country=country,
            channel=channel,
            category=category,
            weight_limit=weight_limit,
        )
        .order_by("price")
        .first()
    )


def _calc_czk_total(base_czk: Decimal, actual_weight_kg: Decimal) -> Decimal:
    """
    База + топливо + платные дороги (если применимо) в CZK.
    """
    if not isinstance(base_czk, Decimal):
        base_czk = Decimal(str(base_czk))

    # Топливо (пример: 5% от базы)
    fuel = (base_czk * FUEL_SURCHARGE_PCT).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Платные дороги (пример логики; при необходимости подправьте под вашу)
    if actual_weight_kg <= Decimal("5"):
        toll = TOLL_ABS_CZK_UPTO_5KG
    else:
        toll = TOLL_ABS_CZK_UPTO_30KG

    return (base_czk + fuel + toll).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _make_option(channel: Channel, service: str, price_eur: Decimal, courier_code: str = "zasilkovna") -> Dict:
    """
    Формирует одну опцию канала с начислением VAT ПОСЛЕ конвертации.
    """
    if not isinstance(price_eur, Decimal):
        price_eur = Decimal(str(price_eur))

    price_eur = price_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    price_eur_vat = (price_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "channel": channel,                       # "PUDO" / "HD"
        "service": service,                       # "Pick-up point" / "Home Delivery"
        "courier": courier_code,                  # "zasilkovna"
        "price": price_eur,                       # EUR без НДС
        "priceWithVat": price_eur_vat,            # EUR с НДС
        "currency": "EUR",
        "estimate": "",                           # если есть SLA/дни — подставьте
    }


def calculate_shipping_options(
    *,
    country: str,
    category: str,
    weight_limit: str,
    actual_weight_kg: Decimal,
) -> Dict[str, List[Dict]]:
    """
    Рассчитывает опции Packeta по двум каналам: PUDO и HD.
    ВАЖНО: сначала суммируем CZK (база+надбавки), потом КОНВЕРТИРУЕМ в EUR, затем начисляем VAT.
    """
    results: Dict[str, List[Dict]] = {"PUDO": [], "HD": []}

    # --- PUDO ---
    rate_pudo = _select_rate("zasilkovna", country, "PUDO", category, weight_limit)
    if rate_pudo:
        total_czk_pudo = _calc_czk_total(rate_pudo.price, actual_weight_kg)
        price_eur_pudo = convert_czk_to_eur(total_czk_pudo)  # СНАЧАЛА конверсия
        results["PUDO"].append(_make_option("PUDO", "PICKUP_POINT", price_eur_pudo))

    # --- HD ---
    rate_hd = _select_rate("zasilkovna", country, "HD", category, weight_limit)
    if rate_hd:
        total_czk_hd = _calc_czk_total(rate_hd.price, actual_weight_kg)
        price_eur_hd = convert_czk_to_eur(total_czk_hd)  # СНАЧАЛА конверсия
        results["HD"].append(_make_option("HD", "HOME_DELIVERY", price_eur_hd))

    return results
