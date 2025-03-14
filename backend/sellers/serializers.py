from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField, Base64FileField

from .fields import CustomBase64FileField
from product.models import (
    BaseProduct,
    BaseProductImage,
    ProductVariant,
    ProductParameter,
    LicenseFile,
)


class ProductParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductParameter
        fields = ['id', 'name', 'value']
        read_only_fields = ['id']


class ProductListSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    price = serializers.DecimalField(source='min_price', max_digits=10, decimal_places=2, read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'image',
            'price',
            'rating',
            'total_reviews',
            'status',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        first_image = obj.images.first()
        if first_image and first_image.image:
            return request.build_absolute_uri(first_image.image.url)
        return None


class BaseProductImageSerializer(serializers.ModelSerializer):
    image = Base64ImageField(required=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BaseProductImage
        fields = ['id', 'image', 'image_url']
        read_only_fields = ['id']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class BulkBaseProductImageSerializer(serializers.Serializer):
    images = BaseProductImageSerializer(many=True)


class ProductVariantSerializer(serializers.ModelSerializer):
    image = Base64ImageField(required=False, allow_null=True)

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


class ProductDetailSerializer(serializers.ModelSerializer):
    product_parameters = ProductParameterSerializer(many=True, read_only=True)
    license_file = serializers.SerializerMethodField()
    images = BaseProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'category_name',
            'product_parameters',
            'rating',
            'license_file',
            'images',
            'variants',
        ]

    def get_license_file(self, obj):
        request = self.context.get('request')
        license_file = obj.license_files.file if hasattr(obj, 'license_files') else None
        if license_file:
            return request.build_absolute_uri(license_file.url)
        return None


class ProductUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'category',
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'category',
        ]


class LicenseFileReadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = LicenseFile
        fields = ['id', 'name', 'file_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request is not None:
            return request.build_absolute_uri(obj.file.url)
        return None


class LicenseFileWriteSerializer(serializers.ModelSerializer):
    file = CustomBase64FileField(required=True)

    class Meta:
        model = LicenseFile
        fields = ['id', 'name', 'file']
        read_only_fields = ['id']
