from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiResponse
)
from rest_framework import status

from .models import SellerProfile
from .permissions import IsSellerOwner
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductUpdateSerializer,
    ProductCreateSerializer,
    ProductParameterSerializer,
    BaseProductImageSerializer,
)
from product.models import (
    BaseProduct,
    ProductParameter,
    BaseProductImage,
)

@extend_schema_view(
    list=extend_schema(
        tags=["Seller Product"],
        description="Retrieve a list of products belonging to the authenticated seller.",
        responses={status.HTTP_200_OK: ProductListSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Seller Product"],
        description="Retrieve detail of a single product belonging to the seller.",
        responses={status.HTTP_200_OK: ProductDetailSerializer},
    ),
    create=extend_schema(
        tags=["Seller Product"],
        description="Create a new product. Only available for the seller role.",
        responses={status.HTTP_201_CREATED: ProductDetailSerializer},
    ),
    update=extend_schema(
        tags=["Seller Product"],
        description="Fully update (PUT) a product belonging to the seller.",
        responses={status.HTTP_200_OK: ProductDetailSerializer},
    ),
    partial_update=extend_schema(
        tags=["Seller Product"],
        description="Partially update (PATCH) a product belonging to the seller.",
        responses={status.HTTP_200_OK: ProductDetailSerializer},
    ),
    destroy=extend_schema(
        tags=["Seller Product"],
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


@extend_schema_view(
    list=extend_schema(
        tags=["Seller Product Parameters"],
        description="List all parameters for a given product."
    ),
    create=extend_schema(
        tags=["Seller Product Parameters"],
        description="Create a parameter for a given product."
    ),
    retrieve=extend_schema(
        tags=["Seller Product Parameters"],
        description="Retrieve detail of one parameter."
    ),
    update=extend_schema(
        tags=["Seller Product Parameters"],
        description="Fully update a parameter (PUT)."
    ),
    partial_update=extend_schema(
        tags=["Seller Product Parameters"],
        description="Partially update a parameter (PATCH)."
    ),
    destroy=extend_schema(
        tags=["Seller Product Parameters"],
        description="Delete a parameter."
    )
)
class ProductParameterViewSet(ModelViewSet):
    """
    A ViewSet for performing CRUD operations on ProductParameter objects
    that belong to a specific product. Uses nested URLs of the form:
    /products/{product_id}/parameters/{param_id}/
    """
    serializer_class = ProductParameterSerializer
    permission_classes = [IsAuthenticated, IsSellerOwner]

    def get_queryset(self):
        """
        Returns a queryset of ProductParameter objects related to
        the specific product identified by 'product_pk' in the nested URL.

        1. Retrieve the 'product_id' from self.kwargs.
        2. Fetch the BaseProduct using 'get_object_or_404'.
        3. Verify that the current user is the product owner;
           if not, raise PermissionDenied.
        4. Filter and return ProductParameter objects for that product.
        """
        product_id = self.kwargs.get('product_pk')  # Nested router lookup field
        product = get_object_or_404(BaseProduct, pk=product_id)

        # Verify ownership: the seller of the product should be the current user
        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        return ProductParameter.objects.filter(product=product)

    def get_object(self):
        """
        Overrides the default method to retrieve a single ProductParameter object.

        1. Use 'get_queryset()' to ensure only parameters from the current product
           are considered.
        2. Extract the parameter's primary key ('pk') from self.kwargs.
        3. Use 'get_object_or_404()' to fetch the parameter within the filtered queryset.
        4. Call 'check_object_permissions' with the parameter to enforce object-level
           permission checks via 'IsSellerOwner'.
        5. Return the retrieved parameter object.
        """
        queryset = self.get_queryset()
        param_id = self.kwargs['pk']
        param = get_object_or_404(queryset, pk=param_id)
        self.check_object_permissions(self.request, param)
        return param

    def perform_create(self, serializer):
        """
        Custom creation logic for a ProductParameter object.

        1. Retrieve the product_id ('product_pk') from self.kwargs.
        2. Fetch the BaseProduct. If not found, raise an error.
        3. Verify that the product owner matches the current user.
        4. Assign 'product=product' to the serializer before saving
           to link the new parameter to the correct product.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)
        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        serializer.save(product=product)


@extend_schema_view(
    list=extend_schema(
        tags=["Seller Product Images"],
        description="List all images for a given product."
    ),
    create=extend_schema(
        tags=["Seller Product Images"],
        description="Upload a new image for a given product."
    ),
    retrieve=extend_schema(
        tags=["Seller Product Images"],
        description="Retrieve detail of a single product image."
    ),
    update=extend_schema(
        tags=["Seller Product Images"],
        description="Fully update (PUT) a product image."
    ),
    partial_update=extend_schema(
        tags=["Seller Product Images"],
        description="Partially update (PATCH) a product image."
    ),
    destroy=extend_schema(
        tags=["Seller Product Images"],
        description="Delete a product image."
    )
)
class BaseProductImageViewSet(ModelViewSet):
    """
    ViewSet for performing CRUD operations on BaseProductImage objects
    belonging to a specific product, using nested URLs:
    /products/{product_id}/images/{image_id}/
    """
    serializer_class = BaseProductImageSerializer
    permission_classes = [IsAuthenticated, IsSellerOwner]

    def get_queryset(self):
        """
        Returns a list of images associated with the product identified by 'product_pk'
        from the nested router. It also verifies that the current user is indeed the
        owner of that product.

        Steps:
          1. Extract 'product_id' from self.kwargs['product_pk'].
          2. Retrieve the BaseProduct using get_object_or_404.
          3. Check if the product's seller.user is the current request.user.
             If not, raise PermissionDenied.
          4. Return BaseProductImage objects filtered by the retrieved product.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)

        # Verify product ownership
        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        return BaseProductImage.objects.filter(product=product)

    def get_object(self):
        """
        Retrieves a single BaseProductImage object, ensuring it belongs to
        the product specified by 'product_pk', and that the user is the owner.

        Steps:
          1. Use get_queryset() to limit results to the current product's images.
          2. Extract 'image_id' from self.kwargs['pk'].
          3. Fetch the image within that filtered queryset (or 404).
          4. Call self.check_object_permissions(...) to trigger IsSellerOwner checks.
          5. Return the retrieved image object if all checks pass.
        """
        queryset = self.get_queryset()
        image_id = self.kwargs['pk']
        image_obj = get_object_or_404(queryset, pk=image_id)
        self.check_object_permissions(self.request, image_obj)
        return image_obj

    def perform_create(self, serializer):
        """
        When creating a new image, link it to the specified product from the nested URL.

        Steps:
          1. Get 'product_id' from self.kwargs['product_pk'].
          2. Retrieve the BaseProduct. Raise 404 if it doesn't exist.
          3. Confirm the product's seller.user matches request.user; otherwise, raise PermissionDenied.
          4. Save the serializer with product=product, thereby associating the new image
             with that particular BaseProduct.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)
        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        serializer.save(product=product)
