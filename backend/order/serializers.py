from rest_framework import serializers
from django.db.models import Max

from product.models import BaseProductImage, BaseProduct
from .models import (
    Order,
    OrderProduct,
    OrderStatus,
)


class BaseProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProductImage
        fields = ['image']


class BaseProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = BaseProduct
        fields = ['image', 'name', 'product_description']

    def get_image(self, obj):
        first_image = obj.image.first()
        return first_image.image.url if first_image else None


class OrderProductDetailSerializer(serializers.ModelSerializer):
    product = BaseProductSerializer()

    class Meta:
        model = OrderProduct
        fields = ['product', 'quantity', 'product_price']


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ['name']


class OrderDetailSerializer(serializers.ModelSerializer):
    order_status = OrderStatusSerializer(read_only=True)
    order_products = OrderProductDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'order_date',
            'order_status',
            'total_amount',
            'delivery_cost',
            'order_products',
        ]


class OrderListSerializer(serializers.ModelSerializer):
    received_date = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'order_date',
            'received_date',
            'images',
            'total_amount',
        ]

    def get_received_date(self, obj):
        # Получение самой поздней даты получения из связанных OrderProduct
        order_products = OrderProduct.objects.filter(order=obj)
        latest_received_date = order_products.aggregate(latest_received=Max('received_at'))['latest_received']
        return latest_received_date

    def get_images(self, obj):
        # Получение изображения первых трех товаров
        order_products = OrderProduct.objects.filter(order=obj)[:3]
        images = []
        for order_product in order_products:
            base_product_images = order_product.product.image.all()[:1]  # Получаем одно изображение продукта
            for image in base_product_images:
                images.append(image.image.url)
        return images
