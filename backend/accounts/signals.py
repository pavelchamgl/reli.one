import logging
from django.apps import apps
from django.dispatch import receiver
from django.db.models.signals import post_save, post_migrate
from django.contrib.auth.models import Group

from .choices import UserRole

logger = logging.getLogger('otp')


@receiver(post_save)
def send_email_confirmation_otp(sender, instance, created, **kwargs):
    CustomUser = apps.get_model('accounts', 'CustomUser')

    if sender != CustomUser:
        return

    if created and not instance.email_confirmed:
        try:
            from .utils import create_and_send_otp
            create_and_send_otp(instance, otp_title="EmailConfirmation")
            logger.info(f"OTP for email confirmation sent to user {instance.email}.")
        except Exception as e:
            logger.error(f"Error sending OTP for email confirmation to user {instance.email}: {e}")


@receiver(post_migrate)
def create_user_roles(sender, **kwargs):
    if sender.name == 'accounts':
        roles = [role.value for role in UserRole]
        for role in roles:
            Group.objects.get_or_create(name=role)
