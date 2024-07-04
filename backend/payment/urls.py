from django.urls import path

from .views import (
    create_checkout_session,
    stripe_webhook,
    CreatePayPalPaymentView,
    PayPalWebhookView,

)

urlpatterns = [
    path('create-checkout-session/', create_checkout_session, name='create_checkout_session'),
    path('stripe-webhook/', stripe_webhook, name='stripe_webhook'),
    path('create-paypal-payment/', CreatePayPalPaymentView.as_view(), name='create_paypal_payment'),
    path('paypal-webhook/', PayPalWebhookView.as_view(), name='paypal_webhook'),
]
