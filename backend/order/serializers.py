from rest_framework import serializers
from django.db.models import Max

from product.models import (
    BaseProductImage,
    BaseProduct,
    ProductVariant
)
from .models import (
    Order,
    OrderProduct,
    OrderStatus,
    DeliveryStatus,
)


class BaseProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = BaseProduct
        fields = ['id', 'image', 'name', 'product_description']

    def get_image(self, obj):
        first_image = obj.images.first()
        return first_image.image.url if first_image else None


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'name', 'text', 'image', 'price']


class OrderProductDetailSerializer(serializers.ModelSerializer):
    product_variant = ProductVariantSerializer(source='product')
    product = BaseProductSerializer(source='product.product')

    class Meta:
        model = OrderProduct
        fields = ['product_variant', 'product', 'quantity', 'product_price']


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ['name']


class DeliveryStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryStatus
        fields = ['name']


class OrderDetailSerializer(serializers.ModelSerializer):
    delivery_status = DeliveryStatusSerializer(read_only=True)
    order_status = OrderStatusSerializer(read_only=True)
    order_products = OrderProductDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'order_date',
            'delivery_status',
            'order_status',
            'total_amount',
            'delivery_cost',
            'order_products',
        ]


class OrderListSerializer(serializers.ModelSerializer):
    received_date = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    order_status = serializers.CharField(source='order_status.name')

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'order_date',
            'received_date',
            'images',
            'total_amount',
            'order_status',
        ]

    def get_received_date(self, obj):
        order_products = OrderProduct.objects.filter(order=obj)
        latest_received_date = order_products.aggregate(latest_received=Max('received_at'))['latest_received']
        return latest_received_date

    def get_images(self, obj):
        order_products = OrderProduct.objects.filter(order=obj)[:3]
        images = []
        for order_product in order_products:
            base_product_images = order_product.product.product.images.all()[:1]
            for image in base_product_images:
                images.append(image.image.url)
        return images
