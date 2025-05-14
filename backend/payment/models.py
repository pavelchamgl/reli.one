from django.db import models

from order.models import Order


class Payment(models.Model):
    PAYMENT_SYSTEM_CHOICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    payment_system = models.CharField(max_length=10, choices=PAYMENT_SYSTEM_CHOICES)
    session_id = models.CharField(max_length=100)
    customer_id = models.CharField(max_length=100, blank=True, null=True)
    payment_intent_id = models.CharField(max_length=100)
    payment_method = models.CharField(max_length=50)
    amount_total = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10)
    customer_email = models.EmailField()

    def __str__(self):
        return f"Payment {self.session_id} for Order {self.order.order_number}"


class PayPalMetadata(models.Model):
    session_key = models.CharField(max_length=50, unique=True)
    custom_data = models.JSONField()
    invoice_data = models.JSONField()
    description_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PayPalMetadata {self.session_key}"


class StripeMetadata(models.Model):
    session_key = models.CharField(max_length=255, unique=True)
    custom_data = models.JSONField(null=True, blank=True)
    invoice_data = models.JSONField(null=True, blank=True)
    description_data = models.JSONField(null=True, blank=True)
    products = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"StripeMetadata {self.session_key}"
