from django.urls import path

from .seller_views import (
    SellerOrderListView,
    SellerOrderDetailView,
    SellerOrderConfirmView,
    SellerOrderMarkShippedView,
    SellerOrderCancelView,
)


urlpatterns = [
    path("", SellerOrderListView.as_view(), name="seller-orders-list"),
    path("<int:pk>/", SellerOrderDetailView.as_view(), name="seller-order-detail"),

    # Actions
    path("<int:pk>/confirm/", SellerOrderConfirmView.as_view(), name="seller-order-confirm"),
    path("<int:pk>/mark-shipped/", SellerOrderMarkShippedView.as_view(), name="seller-order-mark-shipped"),
    path("<int:pk>/cancel/", SellerOrderCancelView.as_view(), name="seller-order-cancel"),
]
