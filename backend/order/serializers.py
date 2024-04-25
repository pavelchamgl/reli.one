from rest_framework import serializers

from .models import OrderItem, DeliveryType, OrderStatus, SelfPickupStatus


class EnumSerializer(serializers.ModelSerializer):
    value = serializers.CharField(source='value')
    display_name = serializers.CharField(source='name')

    class Meta:
        fields = ('value', 'display_name')
        read_only_fields = ('value', 'display_name')


class DeliveryTypeSerializer(EnumSerializer):
    class Meta(EnumSerializer.Meta):
        model = DeliveryType


class OrderStatusSerializer(EnumSerializer):
    class Meta(EnumSerializer.Meta):
        model = OrderStatus


class SelfPickupStatusSerializer(EnumSerializer):
    class Meta(EnumSerializer.Meta):
        model = SelfPickupStatus


class OrderItemSerializer(serializers.ModelSerializer):
    delivery_type = DeliveryTypeSerializer()
    order_status = OrderStatusSerializer()
    self_pickup_status = SelfPickupStatusSerializer()

    class Meta:
        model = OrderItem
        fields = '__all__'
        depth = 2
