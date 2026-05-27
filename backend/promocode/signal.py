import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import PromoCode

logger = logging.getLogger(__name__)


@receiver(post_save, sender=PromoCode)
def create_stripe_promo_code(sender, instance, created, **kwargs):
    # TODO (task-003): Stripe-синхронизация промокодов сломана:
    #   - settings.STRIPE_SECRET_KEY_TEST не существует (используется STRIPE_API_SECRET_KEY)
    #   - instance.duration_in_months нет в модели PromoCode
    # Временная мера: логируем ошибку, не падаем с 500.
    # Долгосрочно: вынести синхронизацию в сервис через task-003.
    if not created:
        return
    try:
        from django.conf import settings
        import stripe

        stripe.api_key = settings.STRIPE_API_SECRET_KEY
        coupon = stripe.Coupon.create(
            id=instance.code,
            percent_off=instance.discount_percentage,
            max_redemptions=instance.max_usage,
            redeem_by=instance.valid_until,
            duration="once",
        )
        stripe.PromotionCode.create(
            code=instance.code,
            coupon=coupon,
        )
    except Exception:
        logger.exception(
            "Failed to sync PromoCode '%s' to Stripe. "
            "Promocode saved locally, Stripe sync skipped.",
            instance.code,
        )


@receiver(post_save, sender=PromoCode)
def create_paypal_promo_code(sender, instance, created, **kwargs):
    pass
