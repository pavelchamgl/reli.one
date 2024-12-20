from rest_framework import serializers
from django.template.defaultfilters import filesizeformat

from .models import (
    BaseProductImage,
    BaseProduct,
    ParameterName,
    ParameterValue,
    Category,
    ProductVariant,
)
from favorites.models import Favorite
from sellers.models import SellerProfile
from order.models import OrderProduct


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
    images = BaseProductImageSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    can_review = serializers.SerializerMethodField(
        help_text="List of SKU identifiers that the authenticated user can review."
    )

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
            'can_review',
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

    def get_can_review(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user

            # Используем предварительно загруженные варианты продукта
            variants = obj.variants.all()

            # Получаем список SKU вариантов продукта
            variant_skus = [variant.sku for variant in variants]

            # Получаем SKU продуктов, которые пользователь купил
            purchased_skus = set(
                OrderProduct.objects.filter(
                    order__user=user,
                    product__sku__in=variant_skus
                ).values_list('product__sku', flat=True)
            )

            # Получаем SKU продуктов, на которые пользователь уже оставил отзыв
            reviewed_skus = set()
            for variant in variants:
                # Используем обновленный related_name 'variant_reviews'
                if any(review.author_id == user.id for review in variant.variant_reviews.all()):
                    reviewed_skus.add(variant.sku)

            # Определяем SKU, на которые пользователь может оставить отзыв
            can_review_skus = purchased_skus - reviewed_skus

            return list(can_review_skus)
        return []


class BaseProductListSerializer(serializers.ModelSerializer):
    parameters = ParameterValueSerializer(many=True)
    image = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    price = serializers.DecimalField(source='min_price', max_digits=10, decimal_places=2, read_only=True)

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
        first_image = obj.images.first()
        if first_image and first_image.image:
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


class ProductVariantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['name', 'text', 'image', 'price']

    def validate(self, attrs):
        text = attrs.get('text')
        image = attrs.get('image')
        if text and image:
            raise serializers.ValidationError("Only one of 'text' or 'image' can be filled.")
        if not text and not image:
            raise serializers.ValidationError("At least one of 'text' or 'image' must be provided.")
        return attrs


class ParameterDataSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    value = serializers.CharField()


class BaseProductCreateSerializer(serializers.ModelSerializer):
    variants = ProductVariantCreateSerializer(many=True, write_only=True, required=False)
    parameters = ParameterDataSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = BaseProduct
        fields = [
            'name',
            'product_description',
            'category',
            'parameters',
            'variants'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        try:
            seller_profile = user.seller_profile
        except SellerProfile.DoesNotExist:
            raise serializers.ValidationError("Current user does not have a seller profile.")

        variants_data = validated_data.pop('variants', [])
        parameters_data = validated_data.pop('parameters', [])

        # Create product
        product = BaseProduct.objects.create(
            seller=seller_profile,
            **validated_data
        )

        # Processing parameters
        parameter_values = []
        for param in parameters_data:
            param_name_str = param['name']
            param_value_str = param['value']
            parameter_name, created = ParameterName.objects.get_or_create(name=param_name_str)
            parameter_value = ParameterValue.objects.create(parameter=parameter_name, value=param_value_str)
            parameter_values.append(parameter_value)

        if parameter_values:
            product.parameters.set(parameter_values)

        # Create variants
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)

        return product


class ProductMediaUploadSerializer(serializers.Serializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=True,
        help_text="List of image files for the product"
    )

    def validate_files(self, value):
        max_size = 10 * 1024 * 1024  # 10 MB
        allowed_image_types = ['image/png', 'image/jpeg', 'image/jpg']

        for file in value:
            # Size check
            if file.size > max_size:
                raise serializers.ValidationError(
                    f"Maximum allowable file size: {filesizeformat(max_size)}."
                )

            # Checking file type
            content_type = file.content_type.lower()
            if content_type not in allowed_image_types:
                raise serializers.ValidationError(
                    f"Allowed formats: PNG, JPEG, JPG."
                )

        return value
