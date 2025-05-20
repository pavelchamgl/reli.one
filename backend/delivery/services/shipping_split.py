import logging

from decimal import Decimal

from .local_rates import calculate_shipping_options
from product.models import ProductVariant

logger = logging.getLogger(__name__)

MAX_WEIGHT_KG = Decimal("15.00")
MAX_SIDE_CM = Decimal("120.00")
MAX_SUM_SIDES_CM = Decimal("150.00")


def get_variant_map(skus):
    variants = ProductVariant.objects.filter(sku__in=skus)
    return {v.sku: v for v in variants}


def get_item_dimensions_and_weight(variant):
    length_cm = Decimal(variant.length_mm or 0) / Decimal("10")
    width_cm = Decimal(variant.width_mm or 0) / Decimal("10")
    height_cm = Decimal(variant.height_mm or 0) / Decimal("10")
    weight_kg = Decimal(variant.weight_grams or 0) / Decimal("1000")
    return length_cm, width_cm, height_cm, weight_kg


def check_limits(dimensions, weight):
    length_cm, width_cm, height_cm = dimensions
    sum_sides = length_cm + width_cm + height_cm
    max_side = max(length_cm, width_cm, height_cm)
    return weight <= MAX_WEIGHT_KG and max_side <= MAX_SIDE_CM and sum_sides <= MAX_SUM_SIDES_CM


def split_items_into_parcels(country, items, cod, currency):
    skus = [it["sku"] for it in items]
    variant_map = get_variant_map(skus)

    unit_items = []
    for it in items:
        unit_items.extend([{"sku": it["sku"], "quantity": 1}] * it["quantity"])

    parcels = []
    current_parcel = []
    current_weight = Decimal("0")
    current_dimensions = [Decimal("0"), Decimal("0"), Decimal("0")]

    for unit in unit_items:
        variant = variant_map[unit["sku"]]
        length, width, height, weight = get_item_dimensions_and_weight(variant)

        new_weight = current_weight + weight
        new_dimensions = [
            max(current_dimensions[0], length),
            max(current_dimensions[1], width),
            current_dimensions[2] + height  # Stacking by height
        ]

        if not check_limits(new_dimensions, new_weight):
            if not current_parcel:
                parcels.append([unit])
            else:
                parcels.append(current_parcel)
                current_parcel = [unit]
                current_weight = weight
                current_dimensions = [length, width, height]
            continue

        current_parcel.append(unit)
        current_weight = new_weight
        current_dimensions = new_dimensions

    if current_parcel:
        parcels.append(current_parcel)

    return parcels


def combine_parcel_options(per_parcel_opts):
    """
    Суммирует цены, объединяет estimate и возвращает также общее количество посылок.
    """
    agg = {}
    for opts in per_parcel_opts:
        for opt in opts:
            ch = opt["channel"]
            entry = agg.setdefault(ch, {
                "courier": opt.get("courier", "Zásilkovna"),
                "service": opt["service"],
                "channel": ch,
                "price": Decimal("0"),
                "priceWithVat": Decimal("0"),
                "currency": opt["currency"],
                "estimates": set(),
            })
            entry["price"] += Decimal(str(opt["price"]))
            entry["priceWithVat"] += Decimal(str(opt["priceWithVat"]))
            if opt["estimate"]:
                entry["estimates"].add(opt["estimate"])

    result = []
    for ch, data in agg.items():
        result.append({
            "courier": data["courier"],
            "service": data["service"],
            "channel": ch,
            "price": float(data["price"].quantize(Decimal("0.01"))),
            "priceWithVat": float(data["priceWithVat"].quantize(Decimal("0.01"))),
            "currency": data["currency"],
            "estimate": ", ".join(sorted(data["estimates"])),
        })

    return {
        "total_parcels": len(per_parcel_opts),
        "options": result
    }


def calculate_order_shipping(country, items, cod, currency):
    """
    Теперь сплитим по весу+габаритам и считаем опции для каждой «маленькой» посылки.
    """
    parcels = split_items_into_parcels(country, items, cod, currency)
    per_parcel_opts = []

    for parcel in parcels:
        parcel_opts = calculate_shipping_options(country, parcel, cod, currency)
        per_parcel_opts.append(parcel_opts)

    return combine_parcel_options(per_parcel_opts)
