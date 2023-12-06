from rest_framework import generics
from rest_framework.generics import ListAPIView

from .models import Review
from .serializers import ReviewSerializer



class CreateReviewView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ReviewListCreateView(generics.ListAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class ProductReviewsView(ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        # Получите `id` продукта из параметров URL
        product_id = self.kwargs['product_id']
        # Фильтруйте комментарии по `product_id`
        return Review.objects.filter(product_id=product_id)