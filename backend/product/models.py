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

    def __str__(self):
        return f"PK: {self.pk} - {self.name}"

    def get_root_category(self):
        category = self
        while category.parent is not None:
            category = category.parent
        return category


class BaseProductImage(models.Model):
    image = models.ImageField(upload_to='base_product_images/')

    def __str__(self):
        return str(self.image)

    def save(self, *args, **kwargs):
        instance = super(BaseProductImage, self).save(*args, **kwargs)
        print(instance)
        image = Image.open(self.image.path)
        target_size = (1263,1209)
        resized_image = image.resize(target_size)
        resized_image.save(self.image.path, quality=200, optimize=True)
        return resized_image


class BaseProduct(models.Model):
    image = models.ManyToManyField(BaseProductImage, related_name='base_products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    product_description = models.TextField()
    parameters = models.ManyToManyField(ParameterValue, related_name='base_products')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=Decimal('0.0'),
        validators=[MinValueValidator(Decimal('1.0')), MaxValueValidator(Decimal('5.0'))]
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


class LicenseFile(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    file = models.FileField(upload_to='license_files/', validators=[validate_file_extension, validate_file_size])
    product = models.OneToOneField('BaseProduct', on_delete=models.CASCADE, related_name='license_files')

    def __str__(self):
        return f"License file id:{self.pk} - name:{self.name}"
