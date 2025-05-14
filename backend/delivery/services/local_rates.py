from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur

# Коэффициент для перевода объёма в кг (см³ → кг)
VOLUME_FACTOR = getattr(settings, "SHIPMENT_VOLUME_FACTOR", 5000)
# Ставка НДС
VAT_RATE = getattr(settings, "VAT_RATE", Decimal("0.21"))

# Импортируем 3D-пакер
from py3dbp import Packer, Bin, Item


def calculate_shipping_options(country, items, cod, currency):
    """
    Рассчитывает варианты доставки (PUDO и HD) для заданной страны и списка товаров.
    Теперь с учётом реальных габаритов, посчитанных через py3dbp.
    """
    # 1) Суммируем общий вес (в кг) и объём (в см³)
    total_weight = Decimal("0")
    total_volume = Decimal("0")
    for it in items:
        sku = it["sku"]
        qty = it["quantity"]
        try:
            variant = ProductVariant.objects.get(sku=sku)
        except ProductVariant.DoesNotExist:
            raise ValueError(f"ProductVariant with sku={sku} not found")

        w_kg = Decimal(variant.weight_grams or 0) / Decimal("1000")
        total_weight += w_kg * qty

        L = Decimal(variant.length_mm or 0) / 10  # см
        W = Decimal(variant.width_mm  or 0) / 10
        H = Decimal(variant.height_mm or 0) / 10
        total_volume += (L * W * H) * qty

    # 2) Вычисляем объёмный вес и итоговый биллинговый вес
    volumetric_weight = (total_volume / VOLUME_FACTOR).quantize(Decimal("0.01"))
    chargeable_weight = max(total_weight.quantize(Decimal("0.01")), volumetric_weight)

    # 3) Подготовка 3D-пакера для точного расчёта габаритов
    #    Заводим «коробку» очень большого размера (возьмём просто суммарные габариты как предел).
    #    Packer разложит все items и мы измерим реальный бокс.
    packer = Packer()
    # Гипотетический бокс «неограниченных» габаритов
    max_L = sum(Decimal(ProductVariant.objects.get(sku=it["sku"]).length_mm or 0) for it in items) / 10
    max_W = sum(Decimal(ProductVariant.objects.get(sku=it["sku"]).width_mm  or 0) for it in items) / 10
    max_H = sum(Decimal(ProductVariant.objects.get(sku=it["sku"]).height_mm or 0) for it in items) / 10
    bin_name = "master-box"
    packer.add_bin(Bin(bin_name, float(max_L), float(max_W), float(max_H), max_weight=float(chargeable_weight)))

    # Добавляем каждый unit-ш¬туку
    for it in items:
        variant = ProductVariant.objects.get(sku=it["sku"])
        sku = it["sku"]
        L = float(Decimal(variant.length_mm or 0) / 10)
        W = float(Decimal(variant.width_mm or 0) / 10)
        H = float(Decimal(variant.height_mm or 0) / 10)
        w_kg = float(Decimal(variant.weight_grams or 0) / 1000)
        for _ in range(it["quantity"]):
            packer.add_item(Item(sku, L, W, H, w_kg))

    # Делаем pack
    packer.pack(
        bigger_first=True,
        number_of_decimals=2
    )

    # 4) Извлекаем реальные габариты заполненного бокса
    used_bin = packer.bins[0]
    max_x = max(item.position[0] + item.width  for item in used_bin.items)  # длина
    max_y = max(item.position[1] + item.height for item in used_bin.items)  # ширина
    max_z = max(item.position[2] + item.depth  for item in used_bin.items)  # высота

    # 5) Переводим в integer см и считаем sum_sides
    L_pack = Decimal(str(max_x)).quantize(Decimal("0.01"))
    W_pack = Decimal(str(max_y)).quantize(Decimal("0.01"))
    H_pack = Decimal(str(max_z)).quantize(Decimal("0.01"))
    max_side = max(L_pack, W_pack, H_pack)
    sum_sides = L_pack + W_pack + H_pack

    # 6) Определяем категорию по прайсу
    if chargeable_weight <= 5 and max_side <= 70 and sum_sides <= 120:
        category = "standard"
    elif chargeable_weight <= 15 and max_side <= 120 and sum_sides <= 150:
        category = "oversized"
    else:
        raise ValueError("Package exceeds allowed dimensions or weight")

    # 7) Достаём тарифы из базы и считаем итоговые цены
    def get_rate(channel):
        normalized_country = country.upper()  # ✅ Приводим к верхнему регистру
        try:
            rate = ShippingRate.objects.get(
                country=normalized_country,
                channel=channel,
                category=category,
                courier_service__name__iexact="Zásilkovna"  # Ограничение только на Zásilkovna
            )
        except ObjectDoesNotExist:
            raise ValueError(f"No rate for {channel}, {normalized_country}, {category} for Zásilkovna")
        base = rate.price
        cod_fee = rate.cod_fee if cod > 0 else Decimal("0")
        return rate, base, cod_fee, base + cod_fee

    pudo_rate, base_pudo, fee_pudo, total_pudo = get_rate("PUDO")
    hd_rate,   base_hd,   fee_hd,   total_hd   = get_rate("HD")

    options = []
    for channel, base, fee, total, rate_obj in [
        ("PUDO", base_pudo, fee_pudo, total_pudo, pudo_rate),
        ("HD",   base_hd,   fee_hd,   total_hd,   hd_rate),
    ]:
        # Итоговая цена без НДС в CZK
        base_total_czk = total

        # Итоговая цена с НДС в CZK
        price_with_vat_czk = (base_total_czk * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))

        # Переводим обе цены в EUR
        base_total_eur = convert_czk_to_eur(base_total_czk)
        price_with_vat_eur = convert_czk_to_eur(price_with_vat_czk)

        options.append({
            "courier": rate_obj.courier_service.name,
            "service": "Pick-up point" if channel == "PUDO" else "Home Delivery",
            "channel": channel,
            "price": float(base_total_eur),
            "priceWithVat": float(price_with_vat_eur),
            "currency": "EUR",
            "estimate": rate_obj.estimate or ""
        })

    return options
