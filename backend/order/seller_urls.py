from django.urls import path

from .seller_views import SellerOrderListView


urlpatterns = [
    path("", SellerOrderListView.as_view(), name="seller-orders-list"),
]
