from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from rest_framework.permissions import IsAuthenticated

from .models import Favorite
from product.models import BaseProduct
from product.serializers import BaseProductSerializer


class ToggleFavoriteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Toggle product in user's favorites.",
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(description="Product added to favorites."),
            status.HTTP_200_OK: OpenApiResponse(description="Product removed from favorites."),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data."),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(description="Product not found."),
        },
        tags=["Favorite"],
    )
    def post(self, request, product_id):
        user = request.user

        try:
            product = BaseProduct.objects.get(id=product_id)
        except BaseProduct.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        favorite, created = Favorite.objects.get_or_create(user=user, product=product)

        if created:
            return Response({'message': 'Product added to favorites.'}, status=status.HTTP_201_CREATED)
        else:
            favorite.delete()
            return Response({'message': 'Product removed from favorites.'}, status=status.HTTP_200_OK)


class FavoriteProductListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Retrieve all favorite products of the current authenticated user.",
        parameters=[
            OpenApiParameter(
                name='sort_by',
                description='Sort products by popularity, ascending price, or descending price.',
                type=str,
                enum=['popular', 'price_asc', 'price_desc'],
                required=False
            ),
        ],
        responses={200: BaseProductSerializer(many=True)},
        tags=["Favorite"],
    )
    def get(self, request):
        user = request.user
        sort_by = request.query_params.get('sort_by', None)
        favorite_products = BaseProduct.objects.filter(favorite__user=user)

        if sort_by == 'popular':
            favorite_products = favorite_products.order_by('-reviews__rating')
        elif sort_by == 'price_asc':
            favorite_products = favorite_products.order_by('price')
        elif sort_by == 'price_desc':
            favorite_products = favorite_products.order_by('-price')

        serializer = BaseProductSerializer(favorite_products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
