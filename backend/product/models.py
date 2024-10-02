import uuid

from PIL import Image
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.template.defaultfilters import filesizeformat

from supplier.models import Supplier


class ParameterName(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}"


class ParameterValue(models.Model):
    parameter = models.ForeignKey(ParameterName, on_delete=models.CASCADE)
    value = models.TextField()

    def __str__(self):
        return f"{self.value} {self.parameter.name}"


class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f"PK: {self.pk} - {self.name}"

    def get_root_category(self):
        category = self
        while category.parent is not None:
            category = category.parent
        return category


class BaseProduct(models.Model):
    name = models.CharField(max_length=100)
    product_description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    parameters = models.ManyToManyField(ParameterValue, related_name='base_products')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        # default=Decimal('1.0'),
        validators=[MinValueValidator(Decimal('1.0')), MaxValueValidator(Decimal('5.0'))],
        blank=True,
        null=True,
    )
    total_reviews = models.IntegerField(default=0)

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


class BaseProductImage(models.Model):
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='base_product_images/')

    def __str__(self):
        return str(self.image)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        image = Image.open(self.image.path)
        target_size = (1263, 1209)
        resized_image = image.resize(target_size)
        resized_image.save(self.image.path, quality=95, optimize=True)


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
        return f"{self.product.name} - {self.name} price: {self.price}"

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
