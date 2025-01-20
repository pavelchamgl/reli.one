import logging
from django.dispatch import receiver
from django.db.models.signals import post_save, post_migrate
from django.contrib.auth.models import Group

from .choices import UserRole
from sellers.models import SellerProfile
from .models import CustomUser

logger = logging.getLogger('otp')


@receiver(post_save, sender=CustomUser)
def send_email_confirmation_otp(sender, instance, created, **kwargs):
    """
    Отправка OTP для подтверждения email при создании пользователя.
    """
    if created and not instance.email_confirmed:
        try:
            from .utils import create_and_send_otp
            create_and_send_otp(instance, otp_title="EmailConfirmation")
            logger.info(f"OTP for email confirmation sent to user {instance.email}.")
        except Exception as e:
            logger.error(f"Error sending OTP for email confirmation to user {instance.email}: {e}")


@receiver(post_save, sender=CustomUser)
def create_seller_profile(sender, instance, created, **kwargs):
    """
    Создание профиля продавца при регистрации пользователя с ролью 'seller'.
    """
    if created and instance.role == UserRole.SELLER:
        # Проверяем, если профиль продавца ещё не существует
        if not SellerProfile.objects.filter(user=instance).exists():
            SellerProfile.objects.create(user=instance)
            logger.info(f"Seller profile created for user {instance.email}")


@receiver(post_migrate)
def create_user_roles(sender, **kwargs):
    """
    Создание групп ролей пользователя после миграции.
    """
    if sender.name == 'accounts':
        roles = [role.value for role in UserRole]
        for role in roles:
            Group.objects.get_or_create(name=role)
