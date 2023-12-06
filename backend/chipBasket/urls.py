from django.urls import path
from .views import (
    ChipsBasketListCreateView,
    BasketItemListCreateView,
    BasketItemCreateView,
)

urlpatterns = [
    path('chips-baskets/', ChipsBasketListCreateView.as_view()),
    path('basket-items/', BasketItemListCreateView.as_view()),
    path('basket-items/create/', BasketItemCreateView.as_view())
]
