from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, inline_serializer, OpenApiExample
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Review
from .pagination import ReviewResultsSetPagination
from .permissions import CanCreateReview
from .serializers import ReviewSerializer, ReviewCreateSerializer


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
        status.HTTP_200_OK: OpenApiResponse(
            response=ReviewSerializer(many=True),
            description="A list of reviews."
        ),
        status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Product not found."),
    },
    tags=["Review"],
)
class ProductReviewListAPIView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    pagination_class = ReviewResultsSetPagination
    pagination_class.page_size = 5

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return Review.objects.filter(product_id=product_id).select_related('author', 'product_variant').order_by('-date_created')


@extend_schema(
    description=(
        "Create a review for a product variant identified by SKU. The rating must be between 1 and 5. "
        "Only users who have purchased this product variant in an order with status 'Closed' can create a review."
    ),
    request=inline_serializer(
        name='ReviewCreateExample',
        fields={
            'sku': serializers.CharField(),
            'content': serializers.CharField(),
            'rating': serializers.IntegerField(min_value=1, max_value=5)
        }
    ),
    responses={
        status.HTTP_201_CREATED: OpenApiResponse(
            description="Review created successfully.",
            response=inline_serializer(
                name='SuccessResponse',
                fields={'message': serializers.CharField()}
            )
        ),
        status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data."),
        status.HTTP_403_FORBIDDEN: OpenApiResponse(description="Permission denied."),
    },
    examples=[
        OpenApiExample(
            name="Example Request",
            value={
                'sku': '123456789',
                'content': 'Great product!',
                'rating': 5,
            },
            request_only=True,
            response_only=False,
        ),
        OpenApiExample(
            name="Example Response",
            value={'message': 'Review created successfully.'},
            request_only=False,
            response_only=True,
            status_codes=[201],
        ),
    ],
    tags=["Review"],
)
class CreateReviewAPIView(APIView):
    permission_classes = [IsAuthenticated, CanCreateReview]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Review created successfully.'}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
