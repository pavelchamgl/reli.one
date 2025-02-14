import uuid

from PIL import Image
from decimal import Decimal
from django.db import models
from django.conf import settings
from mptt.models import MPTTModel, TreeForeignKey
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.template.defaultfilters import filesizeformat

from sellers.models import SellerProfile


class ProductStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


class Category(MPTTModel):
    name = models.CharField(max_length=100)
    parent = TreeForeignKey(
        'self', null=True, blank=True, related_name='children', on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)

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
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
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
        validators=[MinValueValidator(Decimal('1.0')), MaxValueValidator(Decimal('5.0'))],
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

    def __str__(self):
        return self.name


def validate_file_extension(value):
    import os
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.docx']
    if not ext.lower() in valid_extensions:
        raise ValidationError(
            'Invalid file format. Valid formats: .pdf, .docx'
        )


def validate_file_size(value):
    filesize = value.size
    if filesize > settings.MAX_UPLOAD_SIZE:
        raise ValidationError(
            f'File size exceeds the maximum allowable file size: {filesizeformat(settings.MAX_UPLOAD_SIZE)}.'
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


class BaseProductImage(models.Model):
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='base_product_images/')

    def __str__(self):
        return str(self.image)

    # def save(self, *args, **kwargs):
    #     super().save(*args, **kwargs)
    #     image = Image.open(self.image.path)
    #     target_size = (1263, 1209)
    #     resized_image = image.resize(target_size)
    #     resized_image.save(self.image.path, quality=95, optimize=True)


class ProductVariant(models.Model):
    sku = models.CharField(max_length=9, unique=True, editable=False)
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=50)
    text = models.CharField(max_length=150, blank=True, null=True)
    image = models.ImageField(upload_to='base_product_images/variant/', blank=True, null=True)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))]
    )

    def __str__(self):
        return f"sku: {self.sku} {self.product.name} - {self.name}: {self.text} price: {self.price}"

    def clean(self):
        # Убедитесь, что только одно из полей 'text' или 'image' заполнено
        if self.text and self.image:
            raise ValidationError("Поля 'text' и 'image' не могут быть заполнены одновременно. Пожалуйста, заполните только одно из них.")
        if not self.text and not self.image:
            raise ValidationError("Одно из полей 'text' или 'image' должно быть заполнено.")

        # Проверяем, есть ли 'product' и имеет ли он 'pk'
        if self.product_id:
            # Убедитесь, что все варианты продукта имеют одинаковое 'name'
            existing_variants = ProductVariant.objects.filter(product=self.product).exclude(pk=self.pk)
            if existing_variants.exists():
                first_variant = existing_variants.first()
                if first_variant.name != self.name:
                    raise ValidationError("Все варианты продукта должны иметь одинаковое значение поля 'name'.")

                # Предотвращаем смешивание вариантов с 'text' и 'image'
                if (first_variant.text and self.image) or (first_variant.image and self.text):
                    raise ValidationError(
                        "Нельзя добавить вариант с 'text', если уже существует вариант с 'image', и наоборот."
                    )
        else:
            # Пропускаем проверки, требующие сохранённого 'product'
            pass

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
