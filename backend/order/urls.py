from django.urls import path
from .views import (
    OrderItemListCreateView
)

urlpatterns = [
    path('order-items/', OrderItemListCreateView.as_view())
]

