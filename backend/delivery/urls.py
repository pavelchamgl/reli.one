from django.urls import path

from .views import (
    EstimateDeliveryView,
    CreateShipmentView,
    PacketaCalculateView,
    ShippingOptionsView
)

urlpatterns = [
    path("estimate/", EstimateDeliveryView.as_view(), name="delivery-estimate"),
    path("create-shipment/", CreateShipmentView.as_view(), name="create-shipment"),
    path('packeta/calculate-delivery/', PacketaCalculateView.as_view(), name='packeta-calculate'),
    path("shipping-options/", ShippingOptionsView.as_view(), name="shipping-options"),
]
