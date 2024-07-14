from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, inline_serializer, OpenApiExample
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from .models import Review
from .permissions import CanCreateReview
from .serializers import ReviewSerializer, ReviewCreateSerializer
from product.models import BaseProduct


@extend_schema(
    description="Retrieve a list of reviews for a given product by its ID. The reviews are sorted by date created in descending order.",
    parameters=[
        OpenApiParameter(
            name='product_id',
            description='ID of the product to retrieve reviews for',
            required=True,
            type=int
        ),
    ],
    responses={
        status.HTTP_200_OK: OpenApiResponse(description="A list of reviews."),
        status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Product not found."),
    },
    tags=["Review"],
)
class ProductReviewListAPIView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    pagination_class.page_size = 5

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return Review.objects.filter(product_id=product_id).order_by('-date_created')


@extend_schema(
    description=(
        "Create a review for a product. The rating must be between 1 and 5. "
        "Only users who have purchased this product and received."
    ),
    request=inline_serializer(
        name='ReviewCreateExample',
        fields={
            'content': serializers.CharField(),
            'rating': serializers.IntegerField(min_value=1, max_value=5)
        }
    ),
    responses={
        status.HTTP_201_CREATED: OpenApiResponse(description="Review created successfully."),
        status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data."),
        status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Product not found."),
        status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Authentication credentials were not provided or are invalid."),
    },
    examples=[
        OpenApiExample(
            name="Example",
            value={
                'content': 'string',
                'rating': 5,
            },
            request_only=True,
            response_only=False,
        ),
    ],
    tags=["Review"],
)
class CreateReviewAPIView(APIView):
    permission_classes = [IsAuthenticated, CanCreateReview]

    def post(self, request, product_id):
        user = request.user

        try:
            product = BaseProduct.objects.get(id=product_id)
        except BaseProduct.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        data['author'] = user.id
        data['product'] = product.id

        serializer = ReviewCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(author=user, product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
