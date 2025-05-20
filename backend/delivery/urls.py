from django.urls import path

from .views import (
    SellerShippingOptionsView
)

urlpatterns = [
    path('seller-shipping-options/', SellerShippingOptionsView.as_view(), name='seller-shipping-options'),
]
