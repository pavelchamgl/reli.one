from rest_framework import serializers
from .models import OrderItem, OrderStatus

class OrderStatusSerializer(serializers.Serializer):
    value = serializers.CharField(max_length=50)
    display_name = serializers.CharField(max_length=50)

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'
        depth = 2



