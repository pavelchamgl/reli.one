from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from product.models import BaseProduct
from product.models import ProductVariant
from accounts.models import CustomUser


class Review(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product_id = models.ForeignKey(BaseProduct, on_delete=models.CASCADE, related_name='baseproduct_reviews')
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='variant_reviews')
    content = models.TextField()
    date_created = models.DateTimeField(auto_now_add=True)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.author.email} {self.product_variant.name} {self.rating}"


class ReviewMedia(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(upload_to='review_media/')
    media_type = models.CharField(max_length=10, choices=[('image', 'Image'), ('video', 'Video')])

    def __str__(self):
        return f"Media for review {self.review.id}"
