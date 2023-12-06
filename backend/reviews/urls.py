from django.urls import path
from .views import ReviewListCreateView, ReviewDetailView, ProductReviewsView, CreateReviewView

urlpatterns = [
    path('reviews/', ReviewListCreateView.as_view(), name='review-list'),
    path('createReview/', CreateReviewView.as_view(), name='create-review'),
    path('reviews/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
    path('products/<int:product_id>/reviews/', ProductReviewsView.as_view(), name='product-reviews'),
]
