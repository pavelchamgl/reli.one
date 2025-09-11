import logging

from py3dbp import Packer, Bin, Item
from decimal import Decimal
from django.conf import settings

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

# Коэффициент для перевода объёма в кг (см³ → кг)
VOLUME_FACTOR = getattr(settings, "SHIPMENT_VOLUME_FACTOR", 7000)
# Ставка НДС
VAT_RATE = getattr(settings, "VAT_RATE", Decimal("0.21"))

COURIER_CODE_ZASILKOVNA = "zasilkovna"

logger = logging.getLogger(__name__)


def get_toll_surcharge(weight_kg: Decimal) -> Decimal:
    """
    Возвращает надбавку за проезд (toll surcharge) по весу.
    """
    if weight_kg <= 5:
        return Decimal("2.10")
    elif weight_kg <= 30:
        return Decimal("4.80")
    else:
        return Decimal("4.80")  # запасной вариант


def get_weight_limit_tag(weight_kg: Decimal) -> str:
    """
    Определяет тег weight_limit на основе веса посылки.
    """
    if weight_kg <= 1:
        return "1"
    elif weight_kg <= 2:
        return "2"
    elif weight_kg <= 5:
        return "5"
    elif weight_kg <= 10:
        return "10"
    elif weight_kg <= 15:
        return "15"
    else:
        return "over_limit"


def calculate_shipping_options(country, items, cod, currency, variant_map=None):
    """
    Calculate available shipping options (PUDO and HD) based on items' dimensions and weight.
    """
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    total_weight_kg = Decimal("0")
    total_volume_cm3 = Decimal("0")

    for it in items:
        variant = variant_map.get(it["sku"])
        if not variant:
            raise ValueError(f"ProductVariant with sku={it['sku']} not found")

        qty = it["quantity"]
        weight_kg = Decimal(variant.weight_grams or 0) / Decimal("1000")
        volume_cm3 = (
            Decimal(variant.length_mm or 0) / 10 *
            Decimal(variant.width_mm or 0) / 10 *
            Decimal(variant.height_mm or 0) / 10
        )
        total_weight_kg += weight_kg * qty
        total_volume_cm3 += volume_cm3 * qty

    volumetric_weight = (total_volume_cm3 / VOLUME_FACTOR).quantize(Decimal("0.01"))
    chargeable_weight = max(total_weight_kg, volumetric_weight)

    logger.info(f"Calculated weights for {country}: total_weight_kg={total_weight_kg}, "
                f"volumetric_weight={volumetric_weight}, chargeable_weight={chargeable_weight}")

    packer = Packer()
    packer.add_bin(Bin("master-box", 1000, 1000, 1000, float(chargeable_weight)))

    for it in items:
        variant = variant_map[it["sku"]]
        for _ in range(it["quantity"]):
            packer.add_item(Item(
                it["sku"],
                float(Decimal(variant.length_mm or 0) / 10),
                float(Decimal(variant.width_mm or 0) / 10),
                float(Decimal(variant.height_mm or 0) / 10),
                float(Decimal(variant.weight_grams or 0) / 1000)
            ))

    packer.pack(bigger_first=True, number_of_decimals=2)
    used_bin = packer.bins[0]

    max_x = max((item.position[0] + item.width for item in used_bin.items), default=0)
    max_y = max((item.position[1] + item.height for item in used_bin.items), default=0)
    max_z = max((item.position[2] + item.depth for item in used_bin.items), default=0)

    L, W, H = Decimal(max_x), Decimal(max_y), Decimal(max_z)
    sum_sides = L + W + H
    max_side = max(L, W, H)

    logger.info(f"Package dimensions for {country}: L={L}, W={W}, H={H}, sum_sides={sum_sides}, max_side={max_side}")

    if chargeable_weight <= 5 and max_side <= 70 and sum_sides <= 120:
        category = "standard"
    elif chargeable_weight <= 15 and max_side <= 120 and sum_sides <= 150:
        category = "oversized"
    else:
        raise ValueError("Package exceeds allowed dimensions or weight")

    def get_rate(channel, category, chargeable_weight_kg):
        """
        Возвращает:
        - объект тарифа (ShippingRate)
        - базовую цену без надбавок (base)
        - cod_fee
        - total_price = base + cod + toll + fuel
        """
        tag = get_weight_limit_tag(chargeable_weight_kg)

        try:
            rate = (
                ShippingRate.objects
                .select_related("courier_service")
                .get(
                    country=country.upper(),
                    channel=channel,
                    category=category,
                    courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
                    weight_limit=tag,
                )
            )
        except ShippingRate.DoesNotExist:
            # Фолбэк: та же категория, но weight_limit="over_limit"
            try:
                rate = (
                    ShippingRate.objects
                    .select_related("courier_service")
                    .get(
                        country=country.upper(),
                        channel=channel,
                        category=category,
                        courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
                        weight_limit="over_limit",
                    )
                )
            except ShippingRate.DoesNotExist:
                raise ValueError(
                    f"No shipping rate for {channel} {country.upper()} {category} "
                    f"Zásilkovna with weight {chargeable_weight_kg} kg"
                )

        base = rate.price
        cod_fee = rate.cod_fee if cod else Decimal("0.00")

        if channel == "PUDO":
            toll_surcharge = Decimal("0.00")
            fuel_surcharge = Decimal("0.00")
        else:
            toll_surcharge = get_toll_surcharge(chargeable_weight_kg)
            fuel_surcharge = (base * Decimal("0.05")).quantize(Decimal("0.01"))

        total = (base + cod_fee + toll_surcharge + fuel_surcharge).quantize(Decimal("0.01"))

        logger.debug(
            "Zasilkovna rate picked: country=%s channel=%s category=%s tag=%s "
            "base=%s cod=%s toll=%s fuel=%s total=%s",
            country, channel, category, tag, base, cod_fee, toll_surcharge, fuel_surcharge, total
        )

        return rate, base, cod_fee, total

    def format_option(rate_obj, base_total_czk):
        price_with_vat_czk = (base_total_czk * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))
        price_eur = convert_czk_to_eur(base_total_czk)
        price_with_vat_eur = convert_czk_to_eur(price_with_vat_czk)

        logger.info(f"Formatted option for {rate_obj.channel} {rate_obj.country} {rate_obj.category}: "
                    f"Base CZK: {base_total_czk}, With VAT CZK: {price_with_vat_czk}, "
                    f"EUR: {price_eur}, EUR with VAT: {price_with_vat_eur}")

        return {
            "courier": rate_obj.courier_service.name,
            "service": "Pick-up point" if rate_obj.channel == "PUDO" else "Home Delivery",
            "channel": rate_obj.channel,
            "price": float(price_eur),
            "priceWithVat": float(price_with_vat_eur),
            "currency": "EUR",
            "estimate": rate_obj.estimate or ""
        }

    # Вызов get_rate для PUDO и HD
    pudo_rate, pudo_base, pudo_cod_fee, pudo_total = get_rate("PUDO", category, chargeable_weight)
    hd_rate, hd_base, hd_cod_fee, hd_total = get_rate("HD", category, chargeable_weight)

    return [
        format_option(pudo_rate, pudo_total),
        format_option(hd_rate, hd_total),
    ]


# def calculate_shipping_for_group(group, cod=Decimal("0.00"), currency="EUR"):
#     country_code = group.get("delivery_address", {}).get("country") if group.get("delivery_type") == 2 \
#         else resolve_country_from_local_pickup_point(group.get("pickup_point_id"))
#
#     if not country_code:
#         raise ValueError("Country code could not be determined.")
#
#     items = [{'sku': p['sku'], 'quantity': p['quantity']} for p in group['products']]
#
#     parcels = split_items_into_parcels(
#         country=country_code,
#         items=items,
#         cod=cod,
#         currency=currency
#     )
#
#     delivery_cost = Decimal("0.00")
#
#     for parcel in parcels:
#         options = calculate_shipping_options(country=country_code, items=parcel, cod=cod, currency=currency)
#         channel = {1: 'PUDO', 2: 'HD'}.get(group['delivery_type'])
#         selected_option = next(o for o in options if o['channel'] == channel)
#         delivery_cost += Decimal(str(selected_option['priceWithVat']))
#
#     return delivery_cost.quantize(Decimal('0.01'))
#
#
# def calculate_shipping_for_groups(groups):
#     results = []
#     for idx, group in enumerate(groups, start=1):
#         cost = calculate_shipping_for_group(group)
#         group['calculated_delivery_cost'] = str(cost)
#         results.append(group)
#     return results
