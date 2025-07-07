from decimal import Decimal
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, extend_schema_view
from rest_framework.permissions import IsAuthenticated
from django.db.models import Min, F, ExpressionWrapper, DecimalField

from .models import Favorite
from product.models import BaseProduct
from product.serializers import BaseProductListSerializer
from product.pagination import StandardResultsSetPagination


class ToggleFavoriteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description=(
            "Toggle a product in the current user's favorites. "
            "If the product is not in favorites, it will be added. "
            "If it is already in favorites, it will be removed. "
            "Requires authentication."
        ),
        parameters=[
            OpenApiParameter(
                name='product_id',
                description='ID of the product to toggle in favorites',
                required=True,
                type=int,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(description="Product added to favorites."),
            status.HTTP_200_OK: OpenApiResponse(description="Product removed from favorites."),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid product ID."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Product not found."),
        },
        tags=["Favorite"],
    )
    def post(self, request, product_id):
        user = request.user

        try:
            product_id = int(product_id)
            product = BaseProduct.objects.get(id=product_id)
        except ValueError:
            return Response({'error': 'Invalid product ID.'}, status=status.HTTP_400_BAD_REQUEST)
        except BaseProduct.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        favorite, created = Favorite.objects.get_or_create(user=user, product=product)

        if created:
            return Response({'message': 'Product added to favorites.'}, status=status.HTTP_201_CREATED)
        else:
            favorite.delete()
            return Response({'message': 'Product removed from favorites.'}, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(
        description=(
            "Retrieve all favorite products of the current authenticated user.\n\n"
            "Products are sorted by the selected criterion:\n"
            "- `popular`: by rating (descending)\n"
            "- `price_asc`: by ascending final price (includes acquiring fee)\n"
            "- `price_desc`: by descending final price (includes acquiring fee)\n"
            "- default: by the date they were added to favorites (most recent first)\n\n"
            "The `price` field shown in each product includes the acquiring (processing) fee."
        ),
        parameters=[
            OpenApiParameter(
                name='sort_by',
                description=(
                    "Sort products by popularity, ascending price (with acquiring fee), "
                    "descending price (with acquiring fee), or date added to favorites."
                ),
                type=str,
                enum=['popular', 'price_asc', 'price_desc'],
                required=False
            ),
        ],
        responses={200: OpenApiResponse(response=BaseProductListSerializer(many=True))},
        tags=["Favorite"],
    )
)
class FavoriteProductListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BaseProductListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        sort_by = self.request.query_params.get('sort_by', None)

        # Расчёт min цены с эквайрингом (1.04)
        products = BaseProduct.objects.filter(
            favorite__user=user
        ).annotate(
            raw_min_price=Min('variants__price'),
            annotated_min_price_with_acquiring=ExpressionWrapper(
                F('raw_min_price') * Decimal('1.04'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        ).filter(
            raw_min_price__isnull=False
        ).prefetch_related(
            'images',
            'variants',
            'product_parameters',
        ).distinct()

        if sort_by == 'popular':
            products = products.order_by('-rating')
        elif sort_by == 'price_asc':
            products = products.order_by('annotated_min_price_with_acquiring')
        elif sort_by == 'price_desc':
            products = products.order_by('-annotated_min_price_with_acquiring')
        else:
            products = products.order_by('-favorite__added_at')

        return products
