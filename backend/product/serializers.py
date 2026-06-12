from rest_framework import serializers

from .models import (
    CategoryAttributeDefinition,
    ProductAttributeValue,
    ProductParameter,
    BaseProductImage,
    BaseProduct,
    Category,
    ProductVariant,
)
from favorites.models import Favorite
from order.models import OrderProduct

from .stock_availability import (
    compute_is_available,
    compute_stock_status,
    variant_available_quantity,
)
from .compat import get_product_cover_image_url


class ProductParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductParameter
        fields = ['id', 'name', 'value']
        read_only_fields = ['id']


class CategoryAttributeOptionSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    value = serializers.CharField(read_only=True)
    label = serializers.CharField(read_only=True)
    sort_order = serializers.IntegerField(read_only=True)


class CategoryAttributeDefinitionSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='definition.id', read_only=True)
    code = serializers.CharField(source='definition.code', read_only=True)
    name = serializers.CharField(source='definition.name', read_only=True)
    description = serializers.CharField(source='definition.description', read_only=True)
    data_type = serializers.CharField(source='definition.data_type', read_only=True)
    unit = serializers.CharField(source='definition.unit', read_only=True)
    group = serializers.CharField(source='definition.group', read_only=True)
    is_required = serializers.BooleanField(source='definition.is_required', read_only=True)
    is_filterable = serializers.BooleanField(source='definition.is_filterable', read_only=True)
    is_public = serializers.BooleanField(source='definition.is_public', read_only=True)
    sort_order = serializers.IntegerField(source='definition.sort_order', read_only=True)
    source_category_id = serializers.IntegerField(source='definition.category_id', read_only=True)
    is_inherited = serializers.BooleanField(read_only=True)
    inherited_from_id = serializers.IntegerField(read_only=True, allow_null=True)
    options = serializers.SerializerMethodField()

    def get_options(self, obj):
        definition = obj.definition
        if definition.data_type != CategoryAttributeDefinition.DataType.ENUM:
            return []
        return CategoryAttributeOptionSerializer(definition.options.all(), many=True).data


class ProductAttributeValueReadSerializer(serializers.ModelSerializer):
    attribute_definition = serializers.IntegerField(source='attribute_definition_id', read_only=True)
    code = serializers.CharField(source='attribute_definition.code', read_only=True)
    data_type = serializers.CharField(source='attribute_definition.data_type', read_only=True)
    value_option = CategoryAttributeOptionSerializer(read_only=True)

    class Meta:
        model = ProductAttributeValue
        fields = [
            'id',
            'attribute_definition',
            'code',
            'data_type',
            'value_text',
            'value_number',
            'value_boolean',
            'value_option',
            'source',
        ]


class ProductAttributeValueWriteSerializer(serializers.Serializer):
    attribute_definition = serializers.IntegerField()
    value_text = serializers.CharField(required=False, allow_blank=True)
    value_number = serializers.DecimalField(required=False, max_digits=18, decimal_places=4)
    value_boolean = serializers.BooleanField(required=False)
    value_option = serializers.IntegerField(required=False)
    source = serializers.CharField(required=False, allow_blank=False, max_length=64)


class BaseProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BaseProductImage
        fields = ['image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductVariantSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(source="price_with_acquiring", max_digits=10, decimal_places=2)
    price_without_vat = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            'id',
            'sku',
            'name',
            'text',
            'image',
            'price',
            'price_without_vat',
            'available_quantity',
            'is_available',
            'stock_status',
        ]

    def get_price_without_vat(self, obj):
        return obj.price_without_vat

    def get_available_quantity(self, obj):
        return variant_available_quantity(obj)

    def get_is_available(self, obj):
        return compute_is_available(variant_available_quantity(obj))

    def get_stock_status(self, obj):
        return compute_stock_status(variant_available_quantity(obj))

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class BaseProductDetailSerializer(serializers.ModelSerializer):
    product_parameters = ProductParameterSerializer(many=True, read_only=True)
    license_file = serializers.SerializerMethodField()
    images = BaseProductImageSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    can_review = serializers.SerializerMethodField(
        help_text="List of SKU identifiers that the authenticated user can review."
    )
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    is_age_restricted = serializers.BooleanField(read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'country_of_origin',
            'warranty_months',
            'category_name',
            'product_parameters',
            'rating',
            'total_reviews',
            'license_file',
            'images',
            'is_favorite',
            'variants',
            'can_review',
            'seller_id',
            'is_age_restricted',
        ]

    def get_license_file(self, obj):
        request = self.context.get("request")
        try:
            lf = obj.license_files
        except BaseProduct.license_files.RelatedObjectDoesNotExist:
            return None

        if lf and lf.file and request:
            return request.build_absolute_uri(lf.file.url)
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
    product_parameters = ProductParameterSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    price = serializers.DecimalField(source='final_min_price', max_digits=10, decimal_places=2, read_only=True)
    ordered_count = serializers.IntegerField(source='ordered_quantity', read_only=True)
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    is_age_restricted = serializers.BooleanField(read_only=True)
    total_available_quantity = serializers.IntegerField(read_only=True)
    is_available = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'product_parameters',
            'image',
            'price',
            'rating',
            'total_reviews',
            'is_favorite',
            'ordered_count',
            'seller_id',
            'is_age_restricted',
            'total_available_quantity',
            'is_available',
            'stock_status',
        ]

    def _total_available(self, obj) -> int:
        return int(getattr(obj, "total_available_quantity", 0) or 0)

    def get_is_available(self, obj):
        return compute_is_available(self._total_available(obj))

    def get_stock_status(self, obj):
        return compute_stock_status(self._total_available(obj))

    def get_image(self, obj):
        request = self.context.get('request')
        return get_product_cover_image_url(obj, request=request, absolute=True) if request else None

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
