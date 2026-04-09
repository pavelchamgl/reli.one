import uuid
import magic

from rest_framework import serializers

from .fields import CustomBase64FileField, RestrictedBase64ImageField
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
        ]
        read_only_fields = ['id', 'sku']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'text': {'required': False, 'allow_null': True, 'allow_blank': True},
            'price': {'required': True},
            'weight_grams': {'required': True},
            'width_mm': {'required': True},
            'height_mm': {'required': True},
            'length_mm': {'required': True},
        }

    def validate(self, attrs):
        """
        Business rules:
        1. Variant must contain exactly one of: text or image.
        2. Weight and all dimensions are required.
        3. Weight and dimensions must be > 0.
        Works correctly for create, update and partial_update.
        """
        instance = getattr(self, 'instance', None)

        text = attrs.get('text', getattr(instance, 'text', None))
        image = attrs.get('image', getattr(instance, 'image', None))
        weight_grams = attrs.get('weight_grams', getattr(instance, 'weight_grams', None))
        width_mm = attrs.get('width_mm', getattr(instance, 'width_mm', None))
        height_mm = attrs.get('height_mm', getattr(instance, 'height_mm', None))
        length_mm = attrs.get('length_mm', getattr(instance, 'length_mm', None))

        has_text = text is not None and str(text).strip() != ''
        has_image = bool(image)

        if has_text and has_image:
            raise serializers.ValidationError({
                'non_field_errors': ['Variant must contain either text or image, not both.']
            })

        if not has_text and not has_image:
            raise serializers.ValidationError({
                'non_field_errors': ['Variant must contain either text or image.']
            })

        required_numeric_fields = {
            'weight_grams': weight_grams,
            'width_mm': width_mm,
            'height_mm': height_mm,
            'length_mm': length_mm,
        }

        errors = {}

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

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class ProductVariantSwaggerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    sku = serializers.CharField(read_only=True)

    name = serializers.CharField(required=True)
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
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
        chunk = file_obj.read(2048)
        file_obj.seek(0)
        real_mime = magic.from_buffer(chunk, mime=True)

        allowed_mimes = {
            "application/pdf": "pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        }
        if real_mime not in allowed_mimes:
            raise serializers.ValidationError("Требуется PDF или DOCX.")

        extension = allowed_mimes[real_mime]
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
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'category',
            'category_name',
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


class ProductUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'category',
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
            'category': {'required': True},
            'barcode': {'required': False, 'allow_null': True, 'allow_blank': True},
            'article': {'required': True, 'allow_blank': False},
            'vat_rate': {'required': True},
            'is_age_restricted': {'required': False},
        }


class ProductPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'name',
            'product_description',
            'additional_details',
            'category',
            'barcode',
            'article',
            'vat_rate',
            'is_age_restricted',
        ]
        extra_kwargs = {
            'name': {'required': False},
            'product_description': {'required': False},
            'additional_details': {'required': False, 'allow_null': True, 'allow_blank': True},
            'category': {'required': False},
            'barcode': {'required': False, 'allow_null': True, 'allow_blank': True},
            'article': {'required': False, 'allow_blank': False},
            'vat_rate': {'required': False},
            'is_age_restricted': {'required': False},
        }


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = [
            'id',
            'name',
            'product_description',
            'additional_details',
            'category',
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
            'category': {'required': True},
            'barcode': {'required': False, 'allow_null': True, 'allow_blank': True},
            'article': {'required': True, 'allow_blank': False},
            'vat_rate': {'required': True},
            'is_age_restricted': {'required': False},
        }
