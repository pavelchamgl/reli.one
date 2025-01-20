from django.urls import path, include
from rest_framework_nested import routers

from .views import (
    BaseProductViewSet,
    ProductParameterViewSet,
    BaseProductImageViewSet,
    ProductVariantViewSet,
    LicenseFileViewSet,
)

router = routers.SimpleRouter()
router.register(r'products', BaseProductViewSet, basename='products')


products_router = routers.NestedSimpleRouter(router, r'products', lookup='product')
products_router.register(
    r'parameters',
    ProductParameterViewSet,
    basename='product-parameters'
)
products_router.register(
    r'images',
    BaseProductImageViewSet,
    basename='product-images'
)

products_router.register(
    r'variants',
    ProductVariantViewSet,
    basename='product-variants'
)

products_router.register(
    r'license',
    LicenseFileViewSet,
    basename='product-license'
)

urlpatterns = [
    path('', include(router.urls)),
    path('', include(products_router.urls)),
]
