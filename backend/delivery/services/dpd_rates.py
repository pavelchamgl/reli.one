from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Literal, Optional

from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

VAT_RATE = Decimal("0.21")  # 21%

Channel = Literal["PUDO", "HD"]

# Привязка каналов к маркетинговым названиям услуг у DPD (пример)
DPD_SERVICE_BY_CHANNEL: Dict[Channel, str] = {
    "PUDO": "SHOP2SHOP",
    "HD": "SHOP2HOME",  # для ряда стран; для чистого экспорта может быть "CLASSIC"
}


def _select_rate_dpd(country: str, channel: Channel, weight_limit: str) -> Optional[ShippingRate]:
    return (
        ShippingRate.objects
        .filter(
            courier_service__code="dpd",
            country=country,
            channel=channel,
            weight_limit=weight_limit,
        )
        .order_by("price")
        .first()
    )


def _calc_czk_total_dpd(base_czk: Decimal) -> Decimal:
    """
    Если у DPD есть топливо/трассы — примените здесь.
    Сейчас считаем, что base_czk — уже all-in ставка в CZK.
    """
    if not isinstance(base_czk, Decimal):
        base_czk = Decimal(str(base_czk))
    return base_czk.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _make_option_dpd(channel: Channel, service: str, price_eur: Decimal) -> Dict:
    if not isinstance(price_eur, Decimal):
        price_eur = Decimal(str(price_eur))

    price_eur = price_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    price_eur_vat = (price_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "channel": channel,
        "service": service,
        "courier": "dpd",
        "price": price_eur,
        "priceWithVat": price_eur_vat,
        "currency": "EUR",
        "estimate": "",
    }


def _available_channels_for_country(country: str) -> List[Channel]:
    """
    Пример: CZ domestic — только PUDO (S2S),
    ряд стран — PUDO+HD, остальное — только HD (CLASSIC).
    Замените на вашу реальную матрицу доступности.
    """
    country = country.upper()
    if country == "CZ":
        return ["PUDO"]
    if country in {"PL", "SK", "DE", "HR"}:
        return ["PUDO", "HD"]
    return ["HD"]


def _service_name(channel: Channel, country: str) -> str:
    if channel == "HD" and country.upper() not in {"PL", "SK", "DE", "HR"}:
        return "CLASSIC"
    return DPD_SERVICE_BY_CHANNEL[channel]


def calculate_dpd_shipping_options(
    *,
    country: str,
    weight_limit: str,
) -> Dict[str, List[Dict]]:
    """
    DPD: консолидирует опции по доступным каналам. Правило расчёта:
    (base_czk [+ надбавки]) → convert_czk_to_eur → начислить VAT.
    """
    results: Dict[str, List[Dict]] = {"PUDO": [], "HD": []}
    available = _available_channels_for_country(country)

    for channel in available:
        rate = _select_rate_dpd(country, channel, weight_limit)
        if not rate:
            continue

        total_czk = _calc_czk_total_dpd(rate.price)
        price_eur = convert_czk_to_eur(total_czk)  # СНАЧАЛА конверсия
        results[channel].append(_make_option_dpd(channel, _service_name(channel, country), price_eur))

    return results
