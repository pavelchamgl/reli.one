from django.urls import path, include
from rest_framework_nested import routers

from .views import BaseProductViewSet, ProductParameterViewSet

router = routers.SimpleRouter()
router.register(r'products', BaseProductViewSet, basename='products')


products_router = routers.NestedSimpleRouter(router, r'products', lookup='product')
products_router.register(
    r'parameters',
    ProductParameterViewSet,
    basename='product-parameters'
)

urlpatterns = [
    path('', include(router.urls)),
    path('', include(products_router.urls)),
]
