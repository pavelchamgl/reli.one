from django.db import models

from product.models import BaseProduct
from accounts.models import CustomUser


class Review(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    rating = models.PositiveIntegerField(blank=True, null=True)
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f"{self.author.email} {self.product.name} {self.rating}"
