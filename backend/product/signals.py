from decimal import Decimal
from django.dispatch import receiver
from django.db.models.signals import post_save

from reviews.models import Review


@receiver(post_save, sender=Review)
def update_product_rating_and_reviews(sender, instance, created, **kwargs):
    if created:
        product = instance.product
        reviews = Review.objects.filter(product=product)
        total_reviews = reviews.count()
        total_rating = sum(review.rating for review in reviews)
        product.rating = round(Decimal(total_rating) / Decimal(total_reviews), 1) if total_reviews > 0 else Decimal('0.0')
        product.total_reviews = total_reviews
        product.save()
