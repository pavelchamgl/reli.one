from rest_framework import serializers

from .models import (
    BaseProductImage,
    BaseProduct,
    ParameterValue,
    Category,
    ProductVariant,
)
from favorites.models import Favorite


class ParameterValueSerializer(serializers.ModelSerializer):
    parameter_name = serializers.CharField(source='parameter.name')

    class Meta:
        model = ParameterValue
        fields = ['parameter_name', 'value']


class BaseProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BaseProductImage
        fields = ['image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            'id',
            'sku',
            'name',
            'text',
            'image',
            'price',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class BaseProductDetailSerializer(serializers.ModelSerializer):
    parameters = ParameterValueSerializer(many=True)
    license_file = serializers.SerializerMethodField()
    images = BaseProductImageSerializer(source='image', many=True)
    is_favorite = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'category_name',
            'parameters',
            'rating',
            'total_reviews',
            'license_file',
            'images',
            'is_favorite',
            'variants',
        ]

    def get_license_file(self, obj):
        request = self.context.get('request')
        license_file = obj.license_files.file if hasattr(obj, 'license_files') else None
        if license_file:
            return request.build_absolute_uri(license_file.url)
        return None

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False


class BaseProductListSerializer(serializers.ModelSerializer):
    parameters = ParameterValueSerializer(many=True)
    image = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'parameters',
            'image',
            'price',
            'rating',
            'total_reviews',
            'is_favorite',
        ]

    def get_price(self, obj):
        return obj.min_price

    def get_image(self, obj):
        request = self.context.get('request')
        first_image = obj.image.first()
        if first_image:
            return request.build_absolute_uri(first_image.image.url)
        return None

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False


class CategorySearchViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent']


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'image_url', 'children']

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.all(), many=True, context=self.context).data
        return None

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
