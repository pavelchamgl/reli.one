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
    sku = serializers.CharField(
        help_text="Product variant SKU (ProductVariant.sku)"
    )
    quantity = serializers.IntegerField(
        min_value=1,
        help_text="Quantity of this SKU"
    )


class ShippingOptionsSerializer(serializers.Serializer):
    """
    Input for POST /api/shipping-options/
    """
    destination_country = serializers.CharField(
        min_length=2, max_length=2,
        help_text="Destination country ISO code (2 letters, e.g. 'CZ', 'SK')"
    )
    cod = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        min_value=Decimal('0.00'),
        help_text="Cash-on-delivery amount (0.00 if not used)"
    )
    currency = serializers.ChoiceField(
        choices=[("CZK", "CZK"), ("EUR", "EUR")],
        help_text="Calculation currency"
    )
    items = ShippingItemSerializer(
        many=True,
        help_text="List of items: [{ 'sku': str, 'quantity': int }, …]"
    )

    def validate(self, attrs):
        """
        Cross-field validation: ensure all SKUs exist.
        """
        skus = [item["sku"] for item in attrs["items"]]
        variants = ProductVariant.objects.filter(sku__in=skus)
        if variants.count() != len(skus):
            missing = set(skus) - set(v.sku for v in variants)
            raise serializers.ValidationError({
                "items": f"Invalid SKUs: {sorted(missing)}"
            })
        return attrs
