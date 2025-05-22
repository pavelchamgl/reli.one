from rest_framework import serializers


class DeliveryAddressSerializer(serializers.Serializer):
    street = serializers.CharField()
    city = serializers.CharField()
    zip = serializers.CharField()
    country = serializers.CharField(
        help_text="ISO 3166-1 alpha-2 code (e.g., 'SK', 'CZ')"
    )


class ProductItemSerializer(serializers.Serializer):
    sku = serializers.CharField()
    quantity = serializers.IntegerField()


class GroupSerializer(serializers.Serializer):
    seller_id = serializers.IntegerField()
    delivery_type = serializers.IntegerField()
    courier_service = serializers.IntegerField()
    delivery_address = DeliveryAddressSerializer(required=False)
    pickup_point_id = serializers.IntegerField(required=False)
    products = ProductItemSerializer(many=True)


class SessionInputSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()
    groups = GroupSerializer(many=True)


class StripeSessionOutputSerializer(serializers.Serializer):
    checkout_url = serializers.CharField()
    session_id = serializers.CharField()
    session_key = serializers.CharField()


class PayPalSessionOutputSerializer(serializers.Serializer):
    approval_url = serializers.CharField()
    order_id = serializers.CharField()
    session_key = serializers.CharField()
