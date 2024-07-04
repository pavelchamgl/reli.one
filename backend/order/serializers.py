from rest_framework import serializers

from .models import Order, DeliveryType, OrderStatus, SelfPickupStatus


class DeliveryTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryType
        fields = (
            'id',
            'name',
        )


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = (
            'id',
            'name',
        )


class SelfPickupStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelfPickupStatus
        fields = (
            'id',
            'name',
        )


class OrderItemSerializer(serializers.ModelSerializer):
    delivery_type = DeliveryTypeSerializer()
    order_status = OrderStatusSerializer()
    self_pickup_status = SelfPickupStatusSerializer()

    class Meta:
        model = Order
        fields = '__all__'
        depth = 2
