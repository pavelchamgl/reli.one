from django.urls import path
from .views import (
    ToggleFavoriteAPIView,
    FavoriteProductListAPIView,
)


urlpatterns = [
    path('toggle-favorite/<int:product_id>/', ToggleFavoriteAPIView.as_view(), name='toggle-favorite'),
    path('products/', FavoriteProductListAPIView.as_view(), name='favorite-products'),
]
