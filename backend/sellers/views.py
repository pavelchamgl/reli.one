from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiResponse
)
from rest_framework import status

from product.models import BaseProduct
from .models import SellerProfile
from .permissions import IsSellerOwner
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductUpdateSerializer,
    ProductCreateSerializer
)


@extend_schema_view(
    list=extend_schema(
        tags=["Seller"],
        description="Retrieve a list of products belonging to the authenticated seller.",
        responses={status.HTTP_200_OK: ProductListSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Seller"],
        description="Retrieve detail of a single product belonging to the seller.",
        responses={status.HTTP_200_OK: ProductDetailSerializer},
    ),
    create=extend_schema(
        tags=["Seller"],
        description="Create a new product. Only available for the seller role.",
        responses={status.HTTP_201_CREATED: ProductDetailSerializer},
    ),
    update=extend_schema(
        tags=["Seller"],
        description="Fully update (PUT) a product belonging to the seller.",
        responses={status.HTTP_200_OK: ProductDetailSerializer},
    ),
    partial_update=extend_schema(
        tags=["Seller"],
        description="Partially update (PATCH) a product belonging to the seller.",
        responses={status.HTTP_200_OK: ProductDetailSerializer},
    ),
    destroy=extend_schema(
        tags=["Seller"],
        description="Delete a product belonging to the seller.",
        responses={status.HTTP_204_NO_CONTENT: OpenApiResponse(description="Successfully deleted.")},
    )
)
class BaseProductViewSet(ModelViewSet):
    """
    A ViewSet for managing (CRUD) products that belong to a seller.
    Only the authenticated seller who owns the product can create, update, or delete it.
    """
    queryset = BaseProduct.objects.all()
    permission_classes = [IsAuthenticated, IsSellerOwner]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        elif self.action == 'create':
            return ProductCreateSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        """
        Return only the products that belong to the authenticated seller.
        If the user is not a seller, returns an empty queryset.
        """
        user = self.request.user
        if not user.is_seller():
            return BaseProduct.objects.none()
        return BaseProduct.objects.filter(seller__user=user)

    def perform_create(self, serializer):
        """
        Assign the current user's SellerProfile as the seller of the product.
        Ensures that only the seller role can create a product.
        """
        user = self.request.user
        if not user.is_seller():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only sellers can create a product.")

        try:
            seller_profile = user.seller_profile
        except SellerProfile.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No seller profile found for this user.")

        serializer.save(seller=seller_profile)
