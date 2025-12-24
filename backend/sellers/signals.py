import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import SellerProfile, SellerOnboardingApplication

logger = logging.getLogger(__name__)


@receiver(post_save, sender=SellerProfile)
def ensure_onboarding_application(sender, instance: SellerProfile, created: bool, **kwargs):
    """
    Гарантируем, что у каждого SellerProfile есть draft onboarding application.
    Это не ломает текущие флоу: просто создаём связанную сущность.
    """
    if not SellerOnboardingApplication.objects.filter(seller_profile=instance).exists():
        SellerOnboardingApplication.objects.create(seller_profile=instance)
        logger.info("Created onboarding application for seller_profile=%s", instance.pk)
