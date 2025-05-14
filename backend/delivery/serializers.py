from decimal import Decimal

from rest_framework import serializers

from sellers.models import SellerProfile
from product.models import ProductVariant


class DeliveryEstimateSerializer(serializers.Serializer):
    country = serializers.CharField()
    weight_grams = serializers.IntegerField()
    delivery_type = serializers.ChoiceField(choices=["home", "pickup"])


class CreateShipmentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()


class PacketaCalculateSerializer(serializers.Serializer):
    weight = serializers.IntegerField(help_text="Вес посылки в граммах")
    cod = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Сумма наложенного платежа", default=0)
    value = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Оценочная стоимость посылки")
    currency = serializers.CharField(max_length=3, help_text="Валюта", default="CZK")
    address_id = serializers.IntegerField(help_text="ID пункта выдачи Packeta")


class ShippingItemSerializer(serializers.Serializer):
    """
    One order line item for shipping cost calculation.
    """
    sku = serializers.CharField(help_text="Product variant SKU (ProductVariant.sku)")
    quantity = serializers.IntegerField(min_value=1, help_text="Quantity of this SKU")


class SellerShippingRequestSerializer(serializers.Serializer):
    """
    Input data for seller shipping cost calculation.
    """
    seller_id = serializers.IntegerField(help_text="Seller ID")
    destination_country = serializers.CharField(
        min_length=2,
        max_length=2,
        help_text="Destination country ISO code (e.g. 'CZ', 'SK')"
    )
    items = ShippingItemSerializer(many=True, help_text="List of items with SKU and quantity")

    def validate(self, attrs):
        skus = [item["sku"] for item in attrs["items"]]
        variants = ProductVariant.objects.filter(sku__in=skus)

        invalid_skus = []
        for sku in skus:
            variant = next((v for v in variants if v.sku == sku), None)
            if not variant or variant.product.seller.id != attrs["seller_id"]:
                invalid_skus.append(sku)

        if invalid_skus:
            raise serializers.ValidationError({
                "items": f"Invalid SKUs for seller {attrs['seller_id']}: {invalid_skus}"
            })

        return attrs


class ShippingOptionSerializer(serializers.Serializer):
    """
    One shipping option including delivery method, price, VAT, and courier information.
    """
    service = serializers.CharField(help_text="Service name, e.g., 'Pick-up point' or 'Home Delivery'")
    channel = serializers.ChoiceField(
        choices=[("PUDO", "Pick-up point"), ("HD", "Home Delivery")],
        help_text="Delivery channel"
    )
    price = serializers.FloatField(help_text="Base cost in EUR (excluding VAT)")
    priceWithVat = serializers.FloatField(help_text="Cost in EUR including VAT")
    currency = serializers.CharField(help_text="Currency code, e.g., 'EUR'")
    estimate = serializers.CharField(help_text="Delivery estimate, e.g. '1–2 days'", allow_blank=True)
    courier = serializers.CharField(help_text="Courier service name, e.g., 'Zásilkovna'")


class ShippingOptionsResponseSerializer(serializers.Serializer):
    """
    Response containing available shipping options.
    """
    total_parcels = serializers.IntegerField(help_text="Total number of split parcels")
    options = ShippingOptionSerializer(many=True, help_text="List of available shipping options")
