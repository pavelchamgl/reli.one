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


def get_weight_limit_tag(channel: str, weight_kg: Decimal) -> str:
    """
    Возвращает тег weight_limit в зависимости от канала:
    - PUDO: 5 / 10 / 15
    - HD:   1 / 2 / 5 / 10 / 15 / 30
    """
    if channel == "PUDO":
        if weight_kg <= 5:
            return "5"
        elif weight_kg <= 10:
            return "10"
        elif weight_kg <= 15:
            return "15"
        else:
            return "over_limit"
    # HD
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
    elif weight_kg <= 30:
        return "30"
    else:
        return "over_limit"


def calculate_shipping_options(country, items, cod, currency, variant_map=None):
    """
    Returns available shipping options for Zásilkovna (PUDO & HD) in EUR.

    Weight tags we use:
      - PUDO: 5 / 10 / 15
      - HD  : 1 / 2 / 5 / 10 / 15 / 30

    Category rules (close to Packeta sheet):
      - PUDO standard  : ≤5 kg  & max_side ≤70  & sum_sides ≤120
      - PUDO oversized : ≤15 kg & max_side ≤120 & sum_sides ≤150
      - HD   standard  : ≤5 kg  & max_side ≤70  & sum_sides ≤120
      - HD   oversized : ≤30 kg & max_side ≤120 & sum_sides ≤999

    Surcharges:
      - PUDO: toll=0, fuel=0
      - HD  : toll by weight (get_toll_surcharge), fuel = 5% of base
    """
    if variant_map is None:
        skus = [it["sku"] for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    # aggregate physicals
    total_weight_kg = Decimal("0")
    total_volume_cm3 = Decimal("0")
    for it in items:
        v = variant_map.get(it["sku"])
        if not v:
            raise ValueError(f"ProductVariant with sku={it['sku']} not found")
        qty = it["quantity"]
        w_kg = Decimal(v.weight_grams or 0) / Decimal("1000")
        vol = (Decimal(v.length_mm or 0) / 10) * (Decimal(v.width_mm or 0) / 10) * (Decimal(v.height_mm or 0) / 10)
        total_weight_kg += w_kg * qty
        total_volume_cm3 += vol * qty

    volumetric_weight = (total_volume_cm3 / VOLUME_FACTOR).quantize(Decimal("0.01"))
    chargeable_weight = max(total_weight_kg, volumetric_weight)
    logger.info(
        "Zasilkovna weights %s: total=%s kg volumetric=%s kg chargeable=%s kg",
        country, total_weight_kg, volumetric_weight, chargeable_weight
    )

    # crude packing to estimate L/W/H
    packer = Packer()
    packer.add_bin(Bin("master-box", 1000, 1000, 1000, float(chargeable_weight)))
    for it in items:
        v = variant_map[it["sku"]]
        for _ in range(it["quantity"]):
            packer.add_item(Item(
                it["sku"],
                float(Decimal(v.length_mm or 0) / 10),
                float(Decimal(v.width_mm  or 0) / 10),
                float(Decimal(v.height_mm or 0) / 10),
                float(Decimal(v.weight_grams or 0) / 1000),
            ))
    packer.pack(bigger_first=True, number_of_decimals=2)
    used_bin = packer.bins[0]
    max_x = max((x.position[0] + x.width for x in used_bin.items), default=0)
    max_y = max((x.position[1] + x.height for x in used_bin.items), default=0)
    max_z = max((x.position[2] + x.depth for x in used_bin.items), default=0)
    L, W, H = Decimal(max_x), Decimal(max_y), Decimal(max_z)
    sum_sides = L + W + H
    max_side = max(L, W, H)
    logger.info("Zasilkovna dims %s: L=%s W=%s H=%s sum=%s max_side=%s", country, L, W, H, sum_sides, max_side)

    # channel-specific categories
    def _category_pudo(weight_kg: Decimal, max_side: Decimal, sum_sides: Decimal):
        if weight_kg <= 5 and max_side <= 70 and sum_sides <= 120:
            return "standard"
        if weight_kg <= 15 and max_side <= 120 and sum_sides <= 150:
            return "oversized"
        return None

    def _category_hd(weight_kg: Decimal, max_side: Decimal, sum_sides: Decimal):
        if weight_kg <= 5 and max_side <= 70 and sum_sides <= 120:
            return "standard"
        if weight_kg <= 30 and max_side <= 120 and sum_sides <= 999:
            return "oversized"
        return None

    def _pick_rate(channel: str, category: str, weight_kg: Decimal) -> ShippingRate:
        tag = get_weight_limit_tag(channel, weight_kg)
        try:
            return (ShippingRate.objects
                .select_related("courier_service")
                .get(
                    courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
                    country=country.upper(),
                    channel=channel,
                    category=category,
                    weight_limit=tag,
                ))
        except ShippingRate.DoesNotExist:
            # fallback to over_limit within the same channel/category
            try:
                return (ShippingRate.objects
                    .select_related("courier_service")
                    .get(
                        courier_service__code__iexact=COURIER_CODE_ZASILKOVNA,
                        country=country.upper(),
                        channel=channel,
                        category=category,
                        weight_limit="over_limit",
                    ))
            except ShippingRate.DoesNotExist:
                raise ValueError(
                    f"No shipping rate for {channel} {country.upper()} {category} "
                    f"Zásilkovna with weight {weight_kg} kg"
                )

    def _format(rate_obj: ShippingRate, total_czk: Decimal):
        total_czk_vat = (total_czk * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))
        return {
            "courier": rate_obj.courier_service.name,
            "service": "Pick-up point" if rate_obj.channel == "PUDO" else "Home Delivery",
            "channel": rate_obj.channel,
            "price": float(convert_czk_to_eur(total_czk)),
            "priceWithVat": float(convert_czk_to_eur(total_czk_vat)),
            "currency": "EUR",
            "estimate": rate_obj.estimate or "",
        }

    options = []

    # --- PUDO
    pudo_category = _category_pudo(chargeable_weight, max_side, sum_sides)
    if pudo_category:
        try:
            rate = _pick_rate("PUDO", pudo_category, chargeable_weight)
            base = rate.price
            cod_fee = rate.cod_fee if cod else Decimal("0.00")
            toll = Decimal("0.00")
            fuel = Decimal("0.00")
            total = (base + cod_fee + toll + fuel).quantize(Decimal("0.01"))
            logger.debug("Zasilkovna PUDO: base=%s cod=%s total=%s", base, cod_fee, total)
            options.append(_format(rate, total))
        except Exception as e:
            logger.info("Zásilkovna PUDO skipped: %s", e)
    else:
        logger.info("Zásilkovna PUDO not available for %s (w=%s; sum=%s; max=%s)",
                    country, chargeable_weight, sum_sides, max_side)

    # --- HD
    hd_category = _category_hd(chargeable_weight, max_side, sum_sides)
    if hd_category:
        try:
            rate = _pick_rate("HD", hd_category, chargeable_weight)
            base = rate.price
            cod_fee = rate.cod_fee if cod else Decimal("0.00")
            toll = get_toll_surcharge(chargeable_weight)
            fuel = (base * Decimal("0.05")).quantize(Decimal("0.01"))
            total = (base + cod_fee + toll + fuel).quantize(Decimal("0.01"))
            logger.debug("Zasilkovna HD: base=%s cod=%s toll=%s fuel=%s total=%s",
                         base, cod_fee, toll, fuel, total)
            options.append(_format(rate, total))
        except Exception as e:
            logger.info("Zásilkovna HD skipped: %s", e)
    else:
        logger.info("Zásilkovna HD not available for %s (w=%s; sum=%s; max=%s)",
                    country, chargeable_weight, sum_sides, max_side)

    if not options:
        raise ValueError("Zásilkovna: no available options for given items/limits")
    
    # keep PUDO first
    options.sort(key=lambda o: 0 if o["channel"] == "PUDO" else 1)
    return options



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
