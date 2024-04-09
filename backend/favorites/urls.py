from django.urls import path
from .views import ToggleFavoriteAPIView


urlpatterns = [
    path('toggle-favorite/<int:product_id>/', ToggleFavoriteAPIView.as_view(), name='toggle-favorite'),
]
