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

# В этих странах Pickup недоступен (по прайсу)
PICKUP_BLOCKED = {"BA", "DK", "FI", "IE", "NO", "GR", "RS", "GB"}

# Карта "тег веса -> правый порог (кг)" в логике экспортных прайсов DPD
TAG_THRESH = {
    "1":    Decimal("1"),     # 0–1
    "3":    Decimal("3"),     # 1–3
    "10":   Decimal("10"),    # 3–10
    "20":   Decimal("20"),    # 10–20
    "31_5": Decimal("31.5"),  # 20–31.5
}


def _needed_threshold(chargeable_kg: Decimal) -> Decimal:
    """Возвращает правый порог, которому должен соответствовать бакет для данного веса."""
    for _, thr in sorted(TAG_THRESH.items(), key=lambda x: x[1]):
        if chargeable_kg <= thr:
            return thr
    return TAG_THRESH["31_5"]  # over-limit fallback


def _resolve_weight_tag_for_country(
    *, country: str, channel: str, chargeable_kg: Decimal
) -> Optional[str]:
    """Возвращает ближайший доступный тег веса для страны/канала."""
    needed = _needed_threshold(chargeable_kg)

    existing = list(
        ShippingRate.objects.filter(
            courier_service__code__iexact=COURIER_CODE_DPD,
            country=country.upper(),
            channel=channel,
            weight_limit__in=list(TAG_THRESH.keys()),
        ).values_list("weight_limit", flat=True)
    )

    existing_sorted = sorted(existing, key=lambda t: TAG_THRESH[t])

    for t in existing_sorted:
        if TAG_THRESH[t] >= needed:
            return t
    return existing_sorted[-1] if existing_sorted else None


def _calc_parcel_chargeable(items: List[Dict[str, Any]], variant_map: Dict[str, ProductVariant]):
    """Вычисляет общий вес, объёмный вес и chargeable вес посылки."""
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
    qs = ShippingRate.objects.select_related("courier_service").filter(
        courier_service__code__iexact=COURIER_CODE_DPD,
        country=country.upper(),
        channel=channel,
        weight_limit=weight_tag,
    )
    if category:
        qs = qs.filter(category=category)
    rate = qs.order_by("price").first()
    if rate:
        return rate
    # fallback: over_limit
    rate = (
        ShippingRate.objects.select_related("courier_service")
        .filter(
            courier_service__code__iexact=COURIER_CODE_DPD,
            country=country.upper(),
            channel=channel,
            weight_limit="over_limit",
        )
        .order_by("price")
        .first()
    )
    if not rate:
        raise ValueError(f"No DPD rate for {channel} {country.upper()} tag={weight_tag} (category={category or '-'})")
    return rate


def _format_option(*, rate: ShippingRate, total_czk: Decimal) -> Dict[str, Any]:
    """Форматирует объект тарифа для ответа API."""
    total_czk = total_czk.quantize(Decimal("0.01"))
    price_eur = convert_czk_to_eur(total_czk).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    price_eur_vat = (price_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return {
        "courier": rate.courier_service.name,
        "service": "Pick-up point" if rate.channel == "PUDO" else "Home Delivery",
        "channel": rate.channel,
        "price": price_eur,
        "priceWithVat": price_eur_vat,
        "currency": "EUR",
        "estimate": rate.estimate or "",
    }


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

    results: List[Dict[str, Any]] = []
    channel_errors: List[str] = []

    def process_channel(channel: str):
        if channel == "PUDO" and country.upper() in PICKUP_BLOCKED:
            logger.info("DPD PUDO not available for %s", country)
            return
        try:
            svc = "PUDO" if channel == "PUDO" else "HD"
            parcels = split_items_into_parcels_dpd(items, variant_map, service=svc)
            total_eur = total_eur_vat = Decimal("0.00")
            last_rate: Optional[ShippingRate] = None

            for parcel in parcels:
                _, _, chargeable = _calc_parcel_chargeable(parcel, variant_map)
                tag = _resolve_weight_tag_for_country(country=country, channel=channel, chargeable_kg=chargeable)
                if not tag:
                    raise ValueError(f"No suitable DPD tier for {country}/{channel} at {chargeable} kg")

                rate = _pick_rate_dpd(country=country, channel=channel, weight_tag=tag, category=category)
                cod_fee = rate.cod_fee if cod else Decimal("0.00")
                base_czk = rate.price + cod_fee
                opt = _format_option(rate=rate, total_czk=base_czk)
                total_eur += opt["price"]
                total_eur_vat += opt["priceWithVat"]
                last_rate = rate

            if last_rate:
                results.append({
                    "courier": last_rate.courier_service.name,
                    "service": "Pick-up point" if channel == "PUDO" else "Home Delivery",
                    "channel": channel,
                    "price": total_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                    "priceWithVat": total_eur_vat.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                    "currency": "EUR",
                    "estimate": last_rate.estimate or "",
                })
        except Exception as e:
            msg = f"{channel}: {e}"
            channel_errors.append(msg)
            logger.info("DPD %s skipped: %s", channel, e)

    process_channel("PUDO")
    process_channel("HD")
    if not results:
        reason = "; ".join(channel_errors) or "no rates matched"
        raise ValueError(f"DPD: no available options for {country.upper()} ({reason})")
    return results


def calculate_order_shipping_dpd(
    *,
    country: str,
    items: List[Dict[str, Any]],
    cod: bool,
    currency: str,
    variant_map: Optional[Dict[str, ProductVariant]] = None,
) -> Dict[str, Any]:
    """API-обёртка: возвращает тарифы и количество посылок по каналам."""
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

    return {"options": options, "total_parcels": totals}
