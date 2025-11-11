from __future__ import annotations

import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from django.conf import settings

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur
from delivery.services.dpd_split import split_items_into_parcels_dpd


logger = logging.getLogger(__name__)

COURIER_CODE_DPD = "dpd"
VAT_RATE = getattr(settings, "VAT_RATE", Decimal("0.21"))
VOLUME_FACTOR = Decimal(str(getattr(settings, "SHIPMENT_VOLUME_FACTOR", 7000)))

# Маршрутизация (hand-in логика)
HANDIN_S2S_COUNTRIES = {"CZ", "DE", "PL", "SK", "HR"}  # Shop2Shop
HANDIN_S2H_COUNTRIES = {"CZ", "PL", "SK", "HR"}        # Shop2Home
PICKUP_BLOCKED = {"BA", "IE", "NO", "GR", "RS", "GB"}  # только classic

MAX_HANDIN_WEIGHT = Decimal("20.0")

TAG_THRESH = {
    "1": Decimal("1"),
    "3": Decimal("3"),
    "10": Decimal("10"),
    "20": Decimal("20"),
    "31_5": Decimal("31.5"),
}


def _needed_threshold(chargeable_kg: Decimal) -> Decimal:
    for _, thr in sorted(TAG_THRESH.items(), key=lambda x: x[1]):
        if chargeable_kg <= thr:
            return thr
    return TAG_THRESH["31_5"]


def _resolve_channel_for(country: str, delivery_type: str) -> str:
    c = country.upper()
    if delivery_type == "PUDO" and c in HANDIN_S2S_COUNTRIES:
        return "S2S"
    if delivery_type == "HD" and c in HANDIN_S2H_COUNTRIES:
        return "S2H"
    return "HD"  # Classic export door-to-door


def _resolve_weight_tag_for_country(*, country: str, channel: str, chargeable_kg: Decimal) -> Optional[str]:
    needed = _needed_threshold(chargeable_kg)
    existing = list(
        ShippingRate.objects.filter(
            courier_service__code__iexact=COURIER_CODE_DPD,
            country=country.upper(),
            channel__in=["PUDO", "HD"],
            weight_limit__in=list(TAG_THRESH.keys()),
        ).values_list("weight_limit", flat=True)
    )
    existing_sorted = sorted(existing, key=lambda t: TAG_THRESH[t])
    for t in existing_sorted:
        if TAG_THRESH[t] >= needed:
            return t
    return existing_sorted[-1] if existing_sorted else None


def _calc_parcel_chargeable(items: List[Dict[str, Any]], variant_map: Dict[str, ProductVariant]):
    total_weight_kg = Decimal("0")
    total_volume_cm3 = Decimal("0")
    for it in items:
        v = variant_map[it["sku"]]
        qty = int(it["quantity"])
        w_kg = Decimal(v.weight_grams or 0) / Decimal("1000")
        vol_cm3 = (
            (Decimal(v.length_mm or 0) / 10)
            * (Decimal(v.width_mm or 0) / 10)
            * (Decimal(v.height_mm or 0) / 10)
        )
        total_weight_kg += w_kg * qty
        total_volume_cm3 += vol_cm3 * qty
    volumetric = (total_volume_cm3 / VOLUME_FACTOR).quantize(Decimal("0.01"))
    chargeable = max(total_weight_kg, volumetric).quantize(Decimal("0.01"))
    return total_weight_kg.quantize(Decimal("0.01")), volumetric, chargeable


def _pick_rate_dpd(*, country: str, channel: str, weight_tag: str, category: Optional[str] = None) -> ShippingRate:
    channel_db = "PUDO" if channel == "S2S" else "HD"

    qs = ShippingRate.objects.select_related("courier_service").filter(
        courier_service__code__iexact=COURIER_CODE_DPD,
        country=country.upper(),
        channel=channel_db,
        weight_limit=weight_tag,
    )
    if category:
        qs = qs.filter(category=category)

    rate = qs.order_by("price").first()
    if rate:
        return rate

    rate = (
        ShippingRate.objects.select_related("courier_service")
        .filter(
            courier_service__code__iexact=COURIER_CODE_DPD,
            country=country.upper(),
            channel=channel_db,
            weight_limit="over_limit",
        )
        .order_by("price")
        .first()
    )
    if not rate:
        raise ValueError(f"No DPD rate for {channel_db} {country.upper()} tag={weight_tag}")
    return rate


def _format_option_totals(*, rate: ShippingRate, net_total_eur: Decimal, parcels_count: int, label: str) -> Dict[str, Any]:
    """
    Формирует опцию по ИТОГО суммам (EUR net), VAT считается ОДИН раз от total.
    """
    net_total_eur = net_total_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    vat_total_eur = (net_total_eur * VAT_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gross_total_eur = (net_total_eur + vat_total_eur).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    logger.info(
        "DPD final %s: parcels=%d, net_eur=%s, vat_eur=%s, gross_eur=%s",
        rate.channel, parcels_count, net_total_eur, vat_total_eur, gross_total_eur
    )

    return {
        "courier": rate.courier_service.name,
        "service": label,
        "channel": rate.channel,  # "PUDO" | "HD"
        "price": net_total_eur,
        "priceWithVat": gross_total_eur,
        "currency": "EUR",
        "estimate": rate.estimate or "",
    }


def resolve_channel_for(country: str, delivery_type: str) -> str:
    return _resolve_channel_for(country, delivery_type)


def channel_to_service(resolved: str) -> str:
    # наш внутренний -> код API DPD
    return "SHOP2SHOP" if resolved == "S2S" else "CLASSIC"


def calculate_dpd_shipping_options(
    *,
    country: str,
    items: List[Dict[str, Any]],
    currency: str,
    cod: bool = False,
    category: Optional[str] = "standard",
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> List[Dict[str, Any]]:
    """Вычисляет тарифы DPD для HD и PUDO с учётом веса и группировки посылок."""
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    logger.info("DPD rates start: country=%s items=%s", country, items)

    results: List[Dict[str, Any]] = []
    errors: List[str] = []
    produced_channels: set[str] = set()

    def process_channel(delivery_type: str):
        c = country.upper()
        if delivery_type == "PUDO" and c in PICKUP_BLOCKED:
            logger.info("DPD PUDO not available for %s", c)
            return

        try:
            channel = _resolve_channel_for(c, delivery_type)
            logger.info("DPD channel resolved: req=%s -> channel=%s", delivery_type, channel)

            if channel in produced_channels:
                logger.info("DPD skip %s: resolved channel %s already produced", delivery_type, channel)
                return
            produced_channels.add(channel)

            parcels = split_items_into_parcels_dpd(items, variant_map, service=delivery_type)
            logger.info("DPD parcels count for %s/%s: %d", c, channel, len(parcels))

            net_total_eur = Decimal("0.00")
            last_rate: Optional[ShippingRate] = None
            label = ""

            for idx, parcel in enumerate(parcels, start=1):
                gross_kg, vol_kg, chargeable = _calc_parcel_chargeable(parcel, variant_map)

                if channel in ("S2S", "S2H") and chargeable > MAX_HANDIN_WEIGHT:
                    logger.warning("DPD parcel #%d chargeable %.2f kg exceeds 20 kg -> capped", idx, chargeable)
                    chargeable = MAX_HANDIN_WEIGHT

                tag = _resolve_weight_tag_for_country(country=c, channel=channel, chargeable_kg=chargeable)
                if not tag:
                    raise ValueError(f"No tier for {c}/{channel} at {chargeable} kg")

                rate = _pick_rate_dpd(country=c, channel=channel, weight_tag=tag, category=category)
                cod_fee = rate.cod_fee if cod else Decimal("0.00")
                base_czk = rate.price + cod_fee

                label = {"S2S": "Shop2Shop (Pickup point)",
                         "S2H": "Shop2Home (Home delivery)",
                         "HD":  "Home Delivery (Classic export)"}[channel]

                # Конвертируем И СУММИРУЕМ только net (EUR) по всем посылкам
                net_eur = convert_czk_to_eur(base_czk).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                net_total_eur += net_eur
                last_rate = rate

                logger.info(
                    "DPD parcel #%d: gross=%.2f kg, volumetric=%.2f kg, chargeable=%.2f kg, tag=%s, czk=%s -> net_eur=%s",
                    idx, gross_kg, vol_kg, chargeable, tag, base_czk, net_eur
                )

            if last_rate:
                # Итог по опции: VAT считаем ОДИН раз от общей net суммы
                results.append(
                    _format_option_totals(
                        rate=last_rate,
                        net_total_eur=net_total_eur,
                        parcels_count=len(parcels),
                        label=label,
                    )
                )

        except Exception as e:
            errors.append(f"{delivery_type}: {e}")
            logger.exception("DPD %s failed for %s: %s", delivery_type, country, e)

    process_channel("PUDO")
    process_channel("HD")

    if not results:
        raise ValueError(f"DPD: no available options for {country.upper()} ({'; '.join(errors)})")

    logger.info("DPD rates done: %s", results)
    return results


def calculate_order_shipping_dpd(
    *,
    country: str,
    items: List[Dict[str, Any]],
    cod: bool,
    currency: str,
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> Dict[str, Any]:
    options = calculate_dpd_shipping_options(
        country=country, items=items, currency=currency, cod=cod, variant_map=variant_map
    )

    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    totals = {
        "HD": len(split_items_into_parcels_dpd(items, variant_map, service="HD")),
        "PUDO": 0 if country.upper() in PICKUP_BLOCKED else len(split_items_into_parcels_dpd(items, variant_map, service="PUDO")),
    }
    logger.info("DPD totals: %s", totals)

    return {"options": options, "total_parcels": totals}
