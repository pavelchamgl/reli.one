from django.db import models


class ParameterName(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}"


class ParameterValue(models.Model):
    parameter = models.ForeignKey(ParameterName, on_delete=models.CASCADE)
    value = models.TextField()

    def __str__(self):
        return f"{self.value} {self.parameter.name}"


class BaseProductImage(models.Model):
    image = models.ImageField(upload_to='base_product_images/')

    def __str__(self):
        return str(self.image)

class BaseProduct(models.Model):
    image = models.ManyToManyField(BaseProductImage, related_name='base_products')
    name = models.CharField(max_length=100)
    product_description = models.TextField()
    parameters = models.ManyToManyField(ParameterValue, related_name='base_products')
    price = models.IntegerField()

    def __str__(self):
        return self.name
