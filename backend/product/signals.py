from decimal import Decimal
from django.dispatch import receiver
from django.db.models import Avg
from django.db.models.signals import post_save

from reviews.models import Review


@receiver(post_save, sender=Review)
def update_product_rating_and_reviews(sender, instance, created, **kwargs):
    if created:
        product = instance.product_variant.product

        reviews = Review.objects.filter(product_variant__product=product)

        avg_rating = reviews.aggregate(average_rating=Avg('rating'))['average_rating'] or Decimal('0.0')

        avg_rating = Decimal(avg_rating) if isinstance(avg_rating, float) else avg_rating

        avg_rating = avg_rating.quantize(Decimal('0.0'))

        product.rating = avg_rating
        product.total_reviews = reviews.count()
        product.save()
