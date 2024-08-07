from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import PromoCode  # Замените на вашу модель
import stripe



@receiver(post_save, sender=PromoCode)
def create_stripe_promo_code(sender, instance, created, **kwargs):
    stripe.api_key = settings.STRIPE_SECRET_KEY_TEST
    if created:
        promo_code_data = {
            "code": instance.code,  # Код промокода
            "discount_percentage": instance.discount_percentage,
            "max_usage": instance.max_usage,
            "duration_in_months": instance.duration_in_months,
        }
        coupon = stripe.Coupon.create(
            id=instance.code,
            percent_off=instance.discount_percentage,
            max_redemptions=instance.max_usage,
            redeem_by=instance.valid_until,
            duration="repeating",
            duration_in_months=instance.duration_in_months,
        )
        stripe.PromotionCode.create(
            code=instance.code,
            coupon=coupon
        )

@receiver(post_save, sender=PromoCode)
def create_paypal_promo_code(sender, instance, created, **kwargs):
    pass
