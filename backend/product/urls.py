from django.urls import path
from .views import (
    SearchView,
    CategoryBaseProductListView,
    BaseProductDetailAPIView,
    CategoryListView,
)

urlpatterns = [
    path('categories/<int:category_id>/', CategoryBaseProductListView.as_view(), name='category-products'),
    path('<int:id>/', BaseProductDetailAPIView.as_view(), name='product-detail'),
    path('search/', SearchView.as_view(), name='search'),
    path('category/', CategoryListView.as_view(), name='category-list')
]
