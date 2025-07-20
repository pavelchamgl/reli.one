import logging
from django.dispatch import receiver
from django.db.models.signals import post_save, post_migrate
from django.contrib.auth.models import Group

from allauth.socialaccount.models import SocialAccount

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
    Создаёт SellerProfile если пользователь (новый или обновлённый) имеет роль SELLER
    и профиль ещё не существует.
    """
    if instance.role == UserRole.SELLER:
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


@receiver(post_save, sender=CustomUser)
def assign_default_role(sender, instance, created, **kwargs):
    if created and not instance.role:
        CustomUser.objects.filter(pk=instance.pk).update(role=UserRole.CUSTOMER)
        logger.info(f"Default role CUSTOMER assigned to user {instance.pk}")


@receiver(post_save, sender=SocialAccount)
def fill_user_info_from_social(sender, instance, created, **kwargs):
    if not created:
        return

    user = instance.user
    extra = instance.extra_data or {}
    updated_fields = []

    # Email
    email = extra.get("email")
    if email and not user.email:
        # Перед установкой проверим, что такой email не занят
        if not CustomUser.objects.filter(email=email).exclude(pk=user.pk).exists():
            user.email = email
            updated_fields.append("email")
        else:
            logger.warning(f"Email {email} already exists. Skipping email update for user {user.pk}")

    # First name
    first_name = extra.get("first_name") or extra.get("name", "").split(" ")[0]
    if first_name and not user.first_name:
        user.first_name = first_name
        updated_fields.append("first_name")

    # Last name
    last_name = extra.get("last_name") or " ".join(extra.get("name", "").split(" ")[1:])
    if last_name and not user.last_name:
        user.last_name = last_name
        updated_fields.append("last_name")

    if updated_fields:
        user.save(update_fields=updated_fields)
        logger.info(f"User {user.pk} updated via social login: {updated_fields}")
