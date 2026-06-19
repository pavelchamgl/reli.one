import io
import uuid

from PIL import Image
from decimal import Decimal, ROUND_HALF_UP
from django.db import models
from django.conf import settings
from mptt.models import MPTTModel, TreeForeignKey
from django.db.models import Min
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db.models.functions import Lower

from sellers.models import SellerProfile

from .constants import ACQUIRING_RATE


class ProductStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


class Brand(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True)
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.PENDING,
    )
    aliases = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_brands',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(Lower('name'), name='brand_name_ci_idx'),
            models.Index(fields=['status', 'name'], name='brand_status_name_idx'),
        ]
        constraints = [
            models.UniqueConstraint(Lower('name'), name='uniq_brand_name_ci'),
        ]

    def __str__(self):
        return self.name


class Category(MPTTModel):
    name = models.CharField(max_length=100)
    parent = TreeForeignKey(
        'self', null=True, blank=True, related_name='children', on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)
    allows_product_assignment = models.BooleanField(
        default=False,
        help_text="Разрешает создавать товары прямо в non-leaf категории.",
    )

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f"{self.name} (PK: {self.pk})"


class BaseProduct(models.Model):
    name = models.CharField(max_length=100)
    product_description = models.TextField()
    additional_details = models.TextField(null=True, blank=True)
    country_of_origin = models.CharField(max_length=100, blank=True, default="")
    warranty_months = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Warranty duration in months. Empty means not specified.",
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(
        Brand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    seller = models.ForeignKey(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='products'
    )
    barcode = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="A standardized barcode (e.g., EAN or UPC) if the product has one."
    )
    article = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Article code displayed to customers (must be exactly 10 digits).",
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message='Article must be exactly 10 digits.'
            )
        ]
    )
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=Decimal('0.0'),
        validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('5.0'))],
        blank=True,
        null=True,
    )
    total_reviews = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.PENDING
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_products',
        limit_choices_to={'role__in': ['Manager', 'Admin']}
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(null=True, blank=True)
    vat_rate = models.DecimalField(
        max_digits=4, decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("99.99"))],
        help_text="Процент НДС для товара (например: 0, 10, 21)"
    )
    is_age_restricted = models.BooleanField(
        default=False,
        help_text="Требует ли товар возрастного ограничения 18+"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Определяет, активен ли продукт (если False — не отображается на витрине)"
    )

    def __str__(self):
        return self.name

    @property
    def min_price_with_acquiring(self):
        if self.variants.exists():
            base_min = self.variants.aggregate(Min("price"))["price__min"]
            if base_min is not None:
                return (base_min * ACQUIRING_RATE).quantize(Decimal("0.01"))
        return None


from product.license_validators import (
    validate_license_file_extension as validate_file_extension,
    validate_license_file_size as validate_file_size,
)


class ProductParameter(models.Model):
    product = models.ForeignKey(
        BaseProduct,
        on_delete=models.CASCADE,
        related_name='product_parameters'
    )
    name = models.CharField(max_length=100)
    value = models.TextField()

    def __str__(self):
        return f"{self.name}: {self.value}"


class CategoryAttributeDefinition(models.Model):
    class DataType(models.TextChoices):
        TEXT = 'text', 'Text'
        NUMBER = 'number', 'Number'
        BOOLEAN = 'boolean', 'Boolean'
        ENUM = 'enum', 'Enum'

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='attribute_definitions',
    )
    code = models.SlugField(max_length=100)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    data_type = models.CharField(max_length=20, choices=DataType.choices)
    unit = models.CharField(max_length=32, blank=True)
    group = models.CharField(max_length=100, blank=True)
    is_required = models.BooleanField(default=False)
    is_filterable = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    validation_rules = models.JSONField(default=dict, blank=True)
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['category', 'is_active', 'sort_order'], name='cad_category_active_sort_idx'),
            models.Index(fields=['category', 'code'], name='cad_category_code_idx'),
            models.Index(fields=['is_filterable', 'data_type'], name='cad_filter_type_idx'),
            models.Index(fields=['data_type'], name='cad_data_type_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['category', 'code'], name='uniq_cad_category_code'),
        ]

    def __str__(self):
        return f"{self.category_id}: {self.code}"


class CategoryAttributeOption(models.Model):
    attribute_definition = models.ForeignKey(
        CategoryAttributeDefinition,
        on_delete=models.CASCADE,
        related_name='options',
    )
    value = models.SlugField(max_length=100)
    label = models.CharField(max_length=150)
    sort_order = models.PositiveIntegerField(default=0)
    aliases = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['attribute_definition', 'is_active', 'sort_order'], name='cao_attr_active_sort_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['attribute_definition', 'value'], name='uniq_cao_attr_value'),
        ]

    def __str__(self):
        return f"{self.attribute_definition_id}: {self.value}"


class ProductAttributeValue(models.Model):
    product = models.ForeignKey(
        BaseProduct,
        on_delete=models.CASCADE,
        related_name='attribute_values',
    )
    attribute_definition = models.ForeignKey(
        CategoryAttributeDefinition,
        on_delete=models.CASCADE,
        related_name='product_values',
    )
    value_text = models.TextField(blank=True)
    value_number = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_option = models.ForeignKey(
        CategoryAttributeOption,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='product_values',
    )
    source = models.CharField(max_length=64, default='manual')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['product', 'attribute_definition'], name='pav_product_attr_idx'),
            models.Index(fields=['attribute_definition', 'value_number'], name='pav_attr_number_idx'),
            models.Index(fields=['attribute_definition', 'value_boolean'], name='pav_attr_boolean_idx'),
            models.Index(fields=['attribute_definition', 'value_option'], name='pav_attr_option_idx'),
            models.Index(fields=['source'], name='pav_source_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['product', 'attribute_definition'], name='uniq_pav_product_attr'),
        ]

    def __str__(self):
        return f"{self.product_id}: {self.attribute_definition_id}"

    def clean(self):
        errors = {}
        if not self.attribute_definition_id:
            errors['attribute_definition'] = ['Attribute definition is required.']
            raise ValidationError(errors)

        try:
            definition = self.attribute_definition
        except CategoryAttributeDefinition.DoesNotExist:
            errors['attribute_definition'] = ['Attribute definition does not exist.']
            raise ValidationError(errors)

        has_text = bool((self.value_text or '').strip())
        has_number = self.value_number is not None
        has_boolean = self.value_boolean is not None
        has_option = self.value_option_id is not None

        def reject_unexpected(fields):
            for field in fields:
                errors[field] = ['This field must be empty for this attribute data type.']

        if definition.data_type == CategoryAttributeDefinition.DataType.TEXT:
            if not has_text:
                errors['value_text'] = ['This field is required for text attributes.']
            unexpected = []
            if has_number:
                unexpected.append('value_number')
            if has_boolean:
                unexpected.append('value_boolean')
            if has_option:
                unexpected.append('value_option')
            reject_unexpected(unexpected)

        elif definition.data_type == CategoryAttributeDefinition.DataType.NUMBER:
            if not has_number:
                errors['value_number'] = ['This field is required for number attributes.']
            unexpected = []
            if has_text:
                unexpected.append('value_text')
            if has_boolean:
                unexpected.append('value_boolean')
            if has_option:
                unexpected.append('value_option')
            reject_unexpected(unexpected)

        elif definition.data_type == CategoryAttributeDefinition.DataType.BOOLEAN:
            if not has_boolean:
                errors['value_boolean'] = ['This field is required for boolean attributes.']
            unexpected = []
            if has_text:
                unexpected.append('value_text')
            if has_number:
                unexpected.append('value_number')
            if has_option:
                unexpected.append('value_option')
            reject_unexpected(unexpected)

        elif definition.data_type == CategoryAttributeDefinition.DataType.ENUM:
            if not has_option:
                errors['value_option'] = ['This field is required for enum attributes.']
            else:
                try:
                    option = self.value_option
                except CategoryAttributeOption.DoesNotExist:
                    option = None
                if option is None:
                    errors['value_option'] = ['Option does not exist.']
                elif option.attribute_definition_id != definition.id:
                    errors['value_option'] = ['Option is not valid for this attribute definition.']
                elif not option.is_active:
                    errors['value_option'] = ['Option must be active.']

            unexpected = []
            if has_text:
                unexpected.append('value_text')
            if has_number:
                unexpected.append('value_number')
            if has_boolean:
                unexpected.append('value_boolean')
            reject_unexpected(unexpected)

        else:
            errors['attribute_definition'] = ['Unsupported attribute data type.']

        if errors:
            raise ValidationError(errors)


class ProductExternalIdentifier(models.Model):
    class IdentifierType(models.TextChoices):
        GTIN = 'gtin', 'GTIN'
        EAN = 'ean', 'EAN'
        UPC = 'upc', 'UPC'
        MPN = 'mpn', 'MPN'
        SELLER_SKU = 'seller_sku', 'Seller SKU'
        MARKETPLACE_ITEM_ID = 'marketplace_item_id', 'Marketplace item ID'
        OTHER = 'other', 'Other'

    product = models.ForeignKey(
        BaseProduct,
        on_delete=models.CASCADE,
        related_name='external_identifiers',
    )
    identifier_type = models.CharField(max_length=32, choices=IdentifierType.choices)
    value = models.CharField(max_length=255)
    source = models.CharField(max_length=64, default='manual')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['product', 'identifier_type'], name='pei_product_type_idx'),
            models.Index(fields=['product', 'is_primary'], name='pei_product_primary_idx'),
            models.Index(fields=['identifier_type', 'value'], name='pei_type_value_idx'),
            models.Index(fields=['source'], name='pei_source_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                Lower('value'),
                'identifier_type',
                name='uniq_pei_type_value_ci',
            ),
            models.UniqueConstraint(
                fields=['product', 'identifier_type'],
                condition=models.Q(is_primary=True),
                name='uniq_pei_primary_type',
            ),
        ]

    def __str__(self):
        return f"{self.identifier_type}: {self.value}"


class BaseProductImage(models.Model):
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='base_product_images/')

    def __str__(self):
        return str(self.image)

    def save(self, *args, **kwargs):
        self.image = self.process_image(self.image)
        super().save(*args, **kwargs)

    def process_image(self, image_file):
        img = Image.open(image_file)
        img = self.resize_and_pad(img)
        img_io = io.BytesIO()
        img.save(img_io, format="WebP", quality=95)
        return ContentFile(img_io.getvalue(), name=image_file.name.split('.')[0] + ".webp")

    def resize_and_pad(self, img, size=1000):
        """Приводим изображение к 1:1 с белым фоном, включая PNG с прозрачностью"""
        # Преобразуем изображение в RGBA, если у него есть альфа-канал
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
            background = Image.new("RGBA", img.size, (255, 255, 255, 255))
            img = Image.alpha_composite(background, img)
            img = img.convert("RGB")  # после наложения переводим в RGB
        else:
            img = img.convert("RGB")

        old_size = img.size
        ratio = float(size) / max(old_size)
        new_size = tuple([int(x * ratio) for x in old_size])
        img = img.resize(new_size, Image.LANCZOS)

        new_img = Image.new("RGB", (size, size), (255, 255, 255))  # Белый фон
        new_img.paste(img, ((size - new_size[0]) // 2, (size - new_size[1]) // 2))
        return new_img

    # def save(self, *args, **kwargs):
    #     super().save(*args, **kwargs)
    #     image = Image.open(self.image.path)
    #     target_size = (1263, 1209)
    #     resized_image = image.resize(target_size)
    #     resized_image.save(self.image.path, quality=95, optimize=True)


class ProductMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'

    product = models.ForeignKey(
        BaseProduct,
        on_delete=models.CASCADE,
        related_name='media',
    )
    file = models.FileField(upload_to='product_media/')
    legacy_image = models.OneToOneField(
        BaseProductImage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_media',
    )
    media_type = models.CharField(
        max_length=20,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_main = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['product', 'sort_order'], name='pm_product_sort_idx'),
            models.Index(fields=['product', 'status', 'sort_order'], name='pm_product_status_sort_idx'),
            models.Index(fields=['product', 'media_type'], name='pm_product_type_idx'),
            models.Index(fields=['status'], name='pm_status_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['product'],
                condition=models.Q(is_main=True),
                name='uniq_main_media_per_product',
            ),
        ]

    def __str__(self):
        return f"{self.product_id}: {self.media_type} {self.file}"


class ProductVariant(models.Model):
    sku = models.CharField(max_length=9, unique=True, editable=False)
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=50)
    text = models.CharField(max_length=150, blank=True, null=True)
    image = models.ImageField(upload_to='base_product_images/variant/', blank=True, null=True)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))]
    )
    weight_grams = models.PositiveIntegerField(
        default=0,
        help_text="Вес товара в граммах"
    )
    width_mm = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Ширина упаковки в миллиметрах"
    )
    height_mm = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Высота упаковки в миллиметрах"
    )
    length_mm = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Длина упаковки в миллиметрах"
    )

    @property
    def price_without_vat(self):
        """
        Возвращает цену без НДС, но с учётом эквайринга.
        """
        price = self.price or Decimal("0.00")
        vat = self.product.vat_rate or Decimal("0.00")

        if vat > 0:
            base_price_wo_vat = price / (1 + vat / 100)
        else:
            base_price_wo_vat = price

        return (base_price_wo_vat * ACQUIRING_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def price_with_acquiring(self):
        price = self.price or Decimal("0.00")
        return (price * ACQUIRING_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def __str__(self):
        return f"sku: {self.sku} {self.product.name} - {self.name}: {self.text} price: {self.price}"

    def clean(self):
        if not self.text or not str(self.text).strip():
            raise ValidationError("Поле 'text' обязательно для заполнения.")

        if self.product_id:
            existing_variants = ProductVariant.objects.filter(product=self.product).exclude(pk=self.pk)
            if existing_variants.exists():
                first_variant = existing_variants.first()
                if first_variant.name != self.name:
                    raise ValidationError("Все варианты продукта должны иметь одинаковое значение поля 'name'.")

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = self.generate_unique_sku()
        self.full_clean(exclude=['sku'])
        super().save(*args, **kwargs)

    def generate_unique_sku(self):
        while True:
            sku = str(uuid.uuid4().int)[:9]
            if not ProductVariant.objects.filter(sku=sku).exists():
                return sku


class LicenseFile(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    file = models.FileField(upload_to='license_files/', validators=[validate_file_extension, validate_file_size])
    product = models.OneToOneField('BaseProduct', on_delete=models.CASCADE, related_name='license_files')

    def __str__(self):
        return f"License file id:{self.pk} - name:{self.name}"


class ProductDocument(models.Model):
    class DocumentType(models.TextChoices):
        LICENSE = 'license', 'License'
        CERTIFICATE = 'certificate', 'Certificate'
        INSTRUCTION = 'instruction', 'Instruction'
        OTHER = 'other', 'Other'

    product = models.ForeignKey(
        BaseProduct,
        on_delete=models.CASCADE,
        related_name='documents',
    )
    file = models.FileField(upload_to='product_documents/')
    name = models.CharField(max_length=150, blank=True)
    document_type = models.CharField(
        max_length=32,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.PENDING,
    )
    sort_order = models.PositiveIntegerField(default=0)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['product', 'status', 'sort_order'], name='pd_product_status_sort_idx'),
            models.Index(fields=['product', 'document_type'], name='pd_product_type_idx'),
            models.Index(fields=['status'], name='pd_status_idx'),
        ]

    def __str__(self):
        return f"{self.product_id}: {self.document_type} {self.name or self.file}"
