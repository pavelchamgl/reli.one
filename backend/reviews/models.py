from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from product.models import BaseProduct
from accounts.models import CustomUser


class Review(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='reviews')
    content = models.TextField()
    date_created = models.DateTimeField(auto_now_add=True)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.author.email} {self.product.name} {self.rating}"
