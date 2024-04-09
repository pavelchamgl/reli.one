from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
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
        }
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
        responses={200: BaseProductSerializer(many=True)}
    )
    def get(self, request):
        """
        Retrieve all favorite products of the current authenticated user.
        """
        user = request.user
        favorite_products = BaseProduct.objects.filter(favorite__user=user)
        serializer = BaseProductSerializer(favorite_products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
