from django.db import models
from PIL import Image

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

    def __str__(self):
        return self.name


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
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    product_description = models.TextField()
    parameters = models.ManyToManyField(ParameterValue, related_name='base_products')
    price = models.IntegerField()

    def __str__(self):
        return self.name
