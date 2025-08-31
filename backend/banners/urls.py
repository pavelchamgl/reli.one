from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import BannerViewSet

router = SimpleRouter()
router.register(r"banners", BannerViewSet, basename="banners")

urlpatterns = [
    path("", include(router.urls)),
]