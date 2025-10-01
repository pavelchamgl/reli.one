from django.urls import path

from .views import (
    CreateStripePaymentView,
    StripeWebhookView,
    CreatePayPalPaymentView,
    PayPalWebhookView,
    ConversionPayloadView,
)

urlpatterns = [
    path('create-stripe-payment/', CreateStripePaymentView.as_view(), name='create_checkout_session'),
    path('stripe-webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    path('create-paypal-payment/', CreatePayPalPaymentView.as_view(), name='create_paypal_payment'),
    path('paypal-webhook/', PayPalWebhookView.as_view(), name='paypal_webhook'),
    path('conversion-payload/', ConversionPayloadView.as_view(), name='conversion_payload'),  # NEW
]
