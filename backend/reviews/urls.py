from django.urls import path

from .views import ProductReviewListAPIView, CreateReviewAPIView

urlpatterns = [
    path('<int:product_id>/product/', ProductReviewListAPIView.as_view(), name='product-reviews'),
    path('<int:product_id>/create/', CreateReviewAPIView.as_view(), name='create-review'),
]
