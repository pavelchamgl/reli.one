from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BaseProductViewSet

router = DefaultRouter()
router.register(r'products', BaseProductViewSet, basename='products')

urlpatterns = [
    path('', include(router.urls)),
]
