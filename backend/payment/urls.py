from django.urls import path

from .views import (
    CreateStripePaymentView,
    StripeWebhookHandler,
    CreatePayPalPaymentView,
    PayPalWebhookView,
)

urlpatterns = [
    path('create-stripe-payment/', CreateStripePaymentView.as_view(), name='create_checkout_session'),
    path('stripe-webhook/', StripeWebhookHandler.as_view(), name='stripe_webhook'),
    path('create-paypal-payment/', CreatePayPalPaymentView.as_view(), name='create_paypal_payment'),
    path('paypal-webhook/', PayPalWebhookView.as_view(), name='paypal_webhook'),
]
