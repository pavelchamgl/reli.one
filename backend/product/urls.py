from django.urls import path
from .views import (
    ParameterStorageListCreateView,
    BaseProductListCreateView,
    ValueStorageListCreateView,
    BaseProductListView,
    BaseProductRetrieveView
)

urlpatterns = [
    path('parameter-storages/', ParameterStorageListCreateView.as_view()),
    path('products/<int:pk>/', BaseProductRetrieveView.as_view(), name='baseproduct-detail'),
    path('base-products/', BaseProductListCreateView.as_view()),
    path('value-storages/', ValueStorageListCreateView.as_view()),
    path('BaseProductListView/', BaseProductListView.as_view(), name='product-list')
]
