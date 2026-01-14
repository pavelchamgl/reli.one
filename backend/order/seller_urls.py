from django.urls import path

from .seller_views import SellerOrderListView, SellerOrderDetailView


urlpatterns = [
    path("", SellerOrderListView.as_view(), name="seller-orders-list"),
    path("<int:pk>/", SellerOrderDetailView.as_view(), name="seller-order-detail"),
]
