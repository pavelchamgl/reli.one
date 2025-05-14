from decimal import Decimal

from .local_rates import calculate_shipping_options


def split_items_into_parcels(country, items, cod, currency):
    """
    Жадно набираем посылки, но каждый раз проверяем:
    'влезут ли все текущие товары + ещё один в calculate_shipping_options?'
    Если нет — стартуем новую посылку.
    """
    # развернём по единицам
    unit_items = []
    for it in items:
        for _ in range(it["quantity"]):
            unit_items.append({"sku": it["sku"], "quantity": 1})

    parcels = []
    current = []

    for unit in unit_items:
        if not current:
            # первая единица всегда идёт в новую посылку
            current = [unit]
            continue

        # проверяем, влезет ли этот блок в одну посылку
        try:
            calculate_shipping_options(country, current + [unit], cod, currency)
        except ValueError as e:
            if "exceeds allowed dimensions or weight" in str(e):
                # заканчиваем старую посылку
                parcels.append(current)
                # и начинаем новую с этого юнита
                current = [unit]
            else:
                # какой-то другой ValueError (например, SKU не найден) пробрасываем дальше
                raise
        else:
            # всё влезло — аккумулируем этот юнит
            current.append(unit)

    # не забываем последнюю
    if current:
        parcels.append(current)

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
    per_parcel = [
        calculate_shipping_options(country, parcel, cod, currency)
        for parcel in parcels
    ]
    return combine_parcel_options(per_parcel)
