import uuid
import magic

from django.conf import settings
from rest_framework import serializers
from django.shortcuts import get_object_or_404

from product.license_validators import (
    LICENSE_ALLOWED_MIMES,
    LICENSE_EMPTY_FILE_MESSAGE,
    LICENSE_SIZE_EXCEEDED_MESSAGE,
    LICENSE_UNSUPPORTED_TYPE_MESSAGE,
)

from .fields import CustomBase64FileField, RestrictedBase64ImageField
from product.models import (
    BaseProduct,
    BaseProductImage,
    ProductVariant,
    ProductParameter,
    LicenseFile,
)
from product.compat import get_product_cover_image_url
from warehouses.models import Warehouse, WarehouseItem

from .brand_services import normalize_brand_name, resolve_brand_from_text, validate_brand_name_length
from .models import SellerProfile


def _get_seller_default_warehouse_id(user) -> int | None:
    if not user.is_authenticated:
        return None
    return (
        SellerProfile.objects.filter(user_id=user.pk)
        .values_list('default_warehouse_id', flat=True)
        .first()
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
        return get_product_cover_image_url(obj, request=request, absolute=True) if request else None


class BaseProductImageSerializer(serializers.ModelSerializer):
    image = RestrictedBase64ImageField(required=True)
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
    image = RestrictedBase64ImageField(required=False, allow_null=True)
    quantity_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            'id',
            'sku',
            'name',
            'text',
            'image',
            'price',
            'weight_grams',
            'width_mm',
            'height_mm',
            'length_mm',
            'quantity_in_stock',
        ]
        read_only_fields = ['id', 'sku', 'quantity_in_stock']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'text': {'required': True, 'allow_null': False, 'allow_blank': False},
            'price': {'required': True},
            'weight_grams': {'required': True},
            'width_mm': {'required': True},
            'height_mm': {'required': True},
            'length_mm': {'required': True},
        }

    def validate(self, attrs):
        """
        Business rules:
        1. Variant text is required.
        2. Variant image is optional.
        3. Weight and all dimensions are required.
        4. Weight and dimensions must be > 0.
        Works correctly for create, update and partial_update.
        """
        instance = getattr(self, 'instance', None)

        text = attrs.get('text', getattr(instance, 'text', None))
        weight_grams = attrs.get('weight_grams', getattr(instance, 'weight_grams', None))
        width_mm = attrs.get('width_mm', getattr(instance, 'width_mm', None))
        height_mm = attrs.get('height_mm', getattr(instance, 'height_mm', None))
        length_mm = attrs.get('length_mm', getattr(instance, 'length_mm', None))

        errors = {}

        if text is None or str(text).strip() == '':
            errors['text'] = 'This field is required.'

        required_numeric_fields = {
            'weight_grams': weight_grams,
            'width_mm': width_mm,
            'height_mm': height_mm,
            'length_mm': length_mm,
        }

        for field_name, value in required_numeric_fields.items():
            if value is None:
                errors[field_name] = 'This field is required.'
                continue

            try:
                if value <= 0:
                    errors[field_name] = 'Value must be greater than 0.'
            except TypeError:
                errors[field_name] = 'A valid number is required.'

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    def get_quantity_in_stock(self, obj):
        stock_by_variant_id = self.context.get('variant_stock_by_id')
        if stock_by_variant_id is not None:
            return stock_by_variant_id.get(obj.id, 0)

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        warehouse_id = _get_seller_default_warehouse_id(request.user)
        if not warehouse_id:
            return 0

        quantity = (
            WarehouseItem.objects.filter(
                warehouse_id=warehouse_id,
                product_variant_id=obj.id,
            )
            .values_list('quantity_in_stock', flat=True)
            .first()
        )
        return quantity if quantity is not None else 0

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class ProductVariantStockWriteSerializer(serializers.Serializer):
    quantity_in_stock = serializers.IntegerField(min_value=0)
    warehouse_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        seller_profile = self.context["seller_profile"]
        warehouse_id = attrs.get("warehouse_id")

        if warehouse_id is None:
            warehouse = seller_profile.default_warehouse
            if warehouse is None:
                raise serializers.ValidationError({
                    "warehouse_id": ["Seller has no default warehouse. Provide an allowed warehouse_id."]
                })
        else:
            warehouse = get_object_or_404(Warehouse, pk=warehouse_id)
            default_warehouse_id = seller_profile.default_warehouse_id
            is_default = default_warehouse_id is not None and warehouse.id == default_warehouse_id
            is_allowed = seller_profile.warehouses.filter(pk=warehouse.id).exists()
            if not (is_default or is_allowed):
                raise serializers.ValidationError({
                    "warehouse_id": ["Warehouse is not available for this seller."]
                })

        attrs["warehouse"] = warehouse
        return attrs


class ProductVariantStockReadSerializer(serializers.ModelSerializer):
    warehouse_id = serializers.IntegerField(source="warehouse.id", read_only=True)
    variant_id = serializers.IntegerField(source="product_variant.id", read_only=True)
    sku = serializers.CharField(source="product_variant.sku", read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = WarehouseItem
        fields = [
            "warehouse_id",
            "variant_id",
            "sku",
            "quantity_in_stock",
            "reserved_quantity",
            "available_quantity",
        ]


class ProductVariantSwaggerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    sku = serializers.CharField(read_only=True)

    name = serializers.CharField(required=True)
    text = serializers.CharField(required=True, allow_blank=False)
    image = serializers.CharField(required=False, allow_null=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)

    weight_grams = serializers.IntegerField(required=True, min_value=1)
    width_mm = serializers.IntegerField(required=True, min_value=1)
    height_mm = serializers.IntegerField(required=True, min_value=1)
    length_mm = serializers.IntegerField(required=True, min_value=1)


class ProductVariantPatchSwaggerSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    image = serializers.CharField(required=False, allow_null=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    weight_grams = serializers.IntegerField(required=False, min_value=1)
    width_mm = serializers.IntegerField(required=False, min_value=1)
    height_mm = serializers.IntegerField(required=False, min_value=1)
    length_mm = serializers.IntegerField(required=False, min_value=1)


class LicenseFileWriteSerializer(serializers.ModelSerializer):
    file = CustomBase64FileField(required=True)

    class Meta:
        model = LicenseFile
        fields = ["id", "name", "file"]
        read_only_fields = ["id"]

    def validate_file(self, file_obj):
        if not file_obj.size:
            raise serializers.ValidationError(LICENSE_EMPTY_FILE_MESSAGE)

        if file_obj.size > settings.MAX_UPLOAD_SIZE:
            raise serializers.ValidationError(LICENSE_SIZE_EXCEEDED_MESSAGE)

        chunk = file_obj.read(2048)
        file_obj.seek(0)
        real_mime = magic.from_buffer(chunk, mime=True)

        if real_mime not in LICENSE_ALLOWED_MIMES:
            raise serializers.ValidationError(LICENSE_UNSUPPORTED_TYPE_MESSAGE)

        extension = LICENSE_ALLOWED_MIMES[real_mime]
        unique_basename = str(uuid.uuid4())
        file_obj.name = f"{unique_basename}.{extension}"

        return file_obj


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


class ProductBrandWriteMixin(metaclass=serializers.SerializerMetaclass):
    brand_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate_brand_name(self, value):
        normalized = normalize_brand_name(value)
        if not normalized:
            return ""
        validation_error = validate_brand_name_length(normalized)
        if validation_error:
            raise serializers.ValidationError(validation_error)
        return normalized

    def _apply_brand_name(self, validated_data):
        if 'brand_name' not in validated_data:
            return validated_data

        brand_name = validated_data.pop('brand_name')
        if not brand_name:
            validated_data['brand'] = None
            return validated_data

        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        validated_data['brand'] = resolve_brand_from_text(brand_name, user=user)
        return validated_data

    def create(self, validated_data):
        validated_data = self._apply_brand_name(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_brand_name(validated_data)
        return super().update(instance, validated_data)


class ProductDetailSerializer(serializers.ModelSerializer):
    product_parameters = ProductParameterSerializer(many=True, read_only=True)
    license_file = LicenseFileReadSerializer(
        source='license_files',
        read_only=True
    )
    images = BaseProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    brand_id = serializers.IntegerField(source='brand.id', read_only=True, allow_null=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True, allow_null=True)
    brand_status = serializers.CharField(source='brand.status', read_only=True, allow_null=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'country_of_origin',
            'warranty_months',
            'category',
            'category_name',
            'brand_id',
            'brand_name',
            'brand_status',
            'barcode',
            'article',
            'product_parameters',
            'rating',
            'total_reviews',
            'vat_rate',
            'is_age_restricted',
            'license_file',
            'images',
            'variants',
            'status',
            'rejected_reason',
        ]

    def _build_variant_stock_by_id(self, product: BaseProduct) -> dict[int, int] | None:
        if self.context.get('variant_stock_by_id') is not None:
            return self.context['variant_stock_by_id']

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        warehouse_id = _get_seller_default_warehouse_id(request.user)
        if not warehouse_id:
            return {}

        variant_ids = list(product.variants.values_list('id', flat=True))
        if not variant_ids:
            return {}

        stock_rows = WarehouseItem.objects.filter(
            warehouse_id=warehouse_id,
            product_variant_id__in=variant_ids,
        ).values_list('product_variant_id', 'quantity_in_stock')

        return dict(stock_rows)

    def to_representation(self, instance):
        stock_by_variant_id = self._build_variant_stock_by_id(instance)
        if stock_by_variant_id is not None:
            self.context['variant_stock_by_id'] = stock_by_variant_id
        return super().to_representation(instance)


class ProductUpdateSerializer(ProductBrandWriteMixin, serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'country_of_origin',
            'warranty_months',
            'category',
            'brand_name',
            'barcode',
            'article',
            'vat_rate',
            'is_age_restricted',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'name': {'required': True},
            'product_description': {'required': True},
            'additional_details': {'required': False, 'allow_null': True, 'allow_blank': True},
            'country_of_origin': {'required': False, 'allow_blank': True},
            'warranty_months': {'required': False, 'allow_null': True, 'min_value': 1},
            'category': {'required': True},
            'barcode': {'required': False, 'allow_null': True, 'allow_blank': True},
            'article': {'required': True, 'allow_blank': False},
            'vat_rate': {'required': True},
            'is_age_restricted': {'required': False},
        }


class ProductPatchSerializer(ProductBrandWriteMixin, serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'name',
            'product_description',
            'additional_details',
            'country_of_origin',
            'warranty_months',
            'category',
            'brand_name',
            'barcode',
            'article',
            'vat_rate',
            'is_age_restricted',
        ]
        extra_kwargs = {
            'name': {'required': False},
            'product_description': {'required': False},
            'additional_details': {'required': False, 'allow_null': True, 'allow_blank': True},
            'country_of_origin': {'required': False, 'allow_blank': True},
            'warranty_months': {'required': False, 'allow_null': True, 'min_value': 1},
            'category': {'required': False},
            'barcode': {'required': False, 'allow_null': True, 'allow_blank': True},
            'article': {'required': False, 'allow_blank': False},
            'vat_rate': {'required': False},
            'is_age_restricted': {'required': False},
        }


class ProductCreateSerializer(ProductBrandWriteMixin, serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'country_of_origin',
            'warranty_months',
            'category',
            'brand_name',
            'barcode',
            'article',
            'vat_rate',
            'is_age_restricted',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'name': {'required': True},
            'product_description': {'required': True},
            'additional_details': {'required': False, 'allow_null': True, 'allow_blank': True},
            'country_of_origin': {'required': False, 'allow_blank': True},
            'warranty_months': {'required': False, 'allow_null': True, 'min_value': 1},
            'category': {'required': True},
            'barcode': {'required': False, 'allow_null': True, 'allow_blank': True},
            'article': {'required': True, 'allow_blank': False},
            'vat_rate': {'required': True},
            'is_age_restricted': {'required': False},
        }
