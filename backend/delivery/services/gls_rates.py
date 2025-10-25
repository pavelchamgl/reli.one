from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Literal, Optional

from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

VAT_RATE = Decimal("0.21")  # 21%

# GLS топливо/трассы (пример; подставьте ваши коэффициенты)
GLS_FUEL_PCT = Decimal("0.011")  # ~1.1%
TOLL_PER_KG_CZK = Decimal("1.47")  # ceil(kg) * 1.47 CZK

Channel = Literal["PUDO", "HD"]
AddressBundle = Literal["one", "multi"]  # влияет на ставку в ShippingRate


def _select_rate_gls(country: str, channel: Channel, category: str, weight_limit: str, address_bundle: AddressBundle) -> Optional[ShippingRate]:
    return (
        ShippingRate.objects
        .filter(
            courier_service__code="gls",
            country=country,
            channel=channel,
            category=category,
            weight_limit=weight_limit,
            address_bundle=address_bundle,
        )
        .order_by("price")
        .first()
    )


def _calc_czk_total_gls(base_czk: Decimal, actual_weight_kg: Decimal) -> Decimal:
    if not isinstance(base_czk, Decimal):
        base_czk = Decimal(str(base_czk))

    fuel = (base_czk * GLS_FUEL_PCT).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # платные дороги — как в вашей бизнес-логике (ceil(weight)*1.47 CZK)
    from math import ceil
    toll = (Decimal(ceil(actual_weight_kg)) * TOLL_PER_KG_CZK).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return (base_czk + fuel + toll).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _make_option_gls(channel: Channel, service: str, price_eur: Decimal) -> Dict:
    if not isinstance(price_eur, Decimal):
        price_eur = Decimal(str(price_eur))

    price_eur = price_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    price_eur_vat = (price_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "channel": channel,
        "service": service,
        "courier": "gls",
        "price": price_eur,
        "priceWithVat": price_eur_vat,
        "currency": "EUR",
        "estimate": "",
    }


def calculate_gls_shipping_options(
    *,
    country: str,
    category: str,
    weight_limit: str,
    actual_weight_kg: Decimal,
    address_bundle: AddressBundle,  # "one" если 1 посылка, "multi" при >=2
) -> Dict[str, List[Dict]]:
    """
    GLS: сначала CZK расчёт (база+надбавки), затем КОНВЕРСИЯ в EUR, затем VAT.
    """
    results: Dict[str, List[Dict]] = {"PUDO": [], "HD": []}

    # PUDO
    rate_pudo = _select_rate_gls(country, "PUDO", category, weight_limit, address_bundle)
    if rate_pudo:
        total_czk_pudo = _calc_czk_total_gls(rate_pudo.price, actual_weight_kg)
        price_eur_pudo = convert_czk_to_eur(total_czk_pudo)  # СНАЧАЛА конверсия
        results["PUDO"].append(_make_option_gls("PUDO", "PUDO", price_eur_pudo))

    # HD
    rate_hd = _select_rate_gls(country, "HD", category, weight_limit, address_bundle)
    if rate_hd:
        total_czk_hd = _calc_czk_total_gls(rate_hd.price, actual_weight_kg)
        price_eur_hd = convert_czk_to_eur(total_czk_hd)  # СНАЧАЛА конверсия
        results["HD"].append(_make_option_gls("HD", "HD", price_eur_hd))

    return results
