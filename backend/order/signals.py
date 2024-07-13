from django.conf import settings
from django.dispatch import receiver
from django.core.mail import send_mail
from django.db.models.signals import post_save

from .models import Order


@receiver(post_save, sender=Order)
def send_order_confirmation_email(sender, instance, created, **kwargs):
    if created:
        order = instance
        subject = f"Order #{order.order_number} Confirmation"
        message = (f"Your order '{order.order_number}' for the amount of {order.total_amount} "
                   f"has been successfully paid and is being processed.")
        recipient_list = [order.customer_email]

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
