from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, inline_serializer, OpenApiExample
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Review
from .pagination import ReviewResultsSetPagination
from .permissions import CanCreateReview
from .serializers import ReviewSerializer, ReviewCreateSerializer


@extend_schema(
    description="Retrieve a list of reviews for a given product by its ID, including reviews for all product variants. The reviews are sorted by date created in descending order.",
    parameters=[
        OpenApiParameter(
            name='product_id',
            description='ID of the product to retrieve reviews for, including all its variants',
            required=True,
            type=int
        ),
    ],
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=ReviewSerializer(many=True),
            description="A list of reviews for the product and all its variants."
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

        # Получаем все отзывы для всех вариантов конкретного продукта
        queryset = Review.objects.filter(
            product_variant__product_id=product_id
        ).select_related('author', 'product_variant').order_by('-date_created')

        return queryset


@extend_schema(
    description=(
        "Create a review for a product variant identified by SKU. The rating must be between 1 and 5. "
        "Users can attach images or short videos to the review. Only users who have purchased this product "
        "variant in an order with status 'Closed' can create a review."
    ),
    request=inline_serializer(
        name='ReviewCreateExample',
        fields={
            'sku': serializers.CharField(),
            'content': serializers.CharField(),
            'rating': serializers.IntegerField(min_value=1, max_value=5),
            'media': serializers.ListField(
                child=serializers.FileField(),
                required=False,
                help_text='List of image or video files.'
            ),
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
                'media': ['image1.jpg', 'video1.mp4'],
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
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Review created successfully.'}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
