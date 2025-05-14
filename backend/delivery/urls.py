from django.urls import path

from .views import (
    EstimateDeliveryView,
    CreateShipmentView,
    PacketaCalculateView,
    SellerShippingOptionsView
)

urlpatterns = [
    # path("estimate/", EstimateDeliveryView.as_view(), name="delivery-estimate"),
    # path("create-shipment/", CreateShipmentView.as_view(), name="create-shipment"),
    # path('packeta/calculate-delivery/', PacketaCalculateView.as_view(), name='packeta-calculate'),
    path('seller-shipping-options/', SellerShippingOptionsView.as_view(), name='seller-shipping-options'),
]
