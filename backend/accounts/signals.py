from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='accounts.CustomUser')
def send_email_confirmation_otp(sender, instance, created, **kwargs):
    if created and not instance.email_confirmed:
        from .utils import create_and_send_otp
        create_and_send_otp(instance, otp_title="EmailConfirmation")
