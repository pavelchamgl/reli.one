from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiResponse,
    OpenApiParameter, OpenApiExample,
)
from django.db.models import Min, Sum

from .models import SellerProfile
from .services import get_seller_sales_statistics
from .permissions import IsSellerOwner
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductUpdateSerializer,
    ProductCreateSerializer,
    ProductParameterSerializer,
    BaseProductImageSerializer,
    ProductVariantSerializer,
    LicenseFileSerializer,
)
from product.models import (
    BaseProduct,
    ProductParameter,
    BaseProductImage,
    ProductVariant,
    LicenseFile,
)
from product.filters import BaseProductFilter
from product.pagination import StandardResultsSetPagination
from product.serializers import BaseProductListSerializer


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

        1. Retrieve 'product_pk' from self.kwargs.
        2. Fetch the BaseProduct using 'get_object_or_404'.
        3. Verify that the current user is the product owner;
           if not, raise PermissionDenied.
        4. Filter and return ProductParameter objects for that product.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)

        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        return ProductParameter.objects.filter(product=product)

    def get_object(self):
        """
        Retrieves a single ProductParameter object.

        1. Use 'get_queryset()' to ensure only parameters for the current product.
        2. Extract 'pk' from self.kwargs.
        3. Use 'get_object_or_404()' to fetch the parameter within the filtered queryset.
        4. Check object-level permission via 'check_object_permissions'.
        5. Return the retrieved parameter object.
        """
        queryset = self.get_queryset()
        param_id = self.kwargs['pk']
        param = get_object_or_404(queryset, pk=param_id)
        self.check_object_permissions(self.request, param)
        return param

    def perform_create(self, serializer):
        """
        Custom creation logic for a single ProductParameter object.
        1. Retrieve 'product_pk' from self.kwargs.
        2. Check that the user owns the product.
        3. Assign 'product=product' before saving to link the new parameter.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)
        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        serializer.save(product=product)

    @extend_schema(
        operation_id="product_parameter_bulk_create",
        description=(
            "Bulk create (mass create) parameters for a specific product.\n\n"
            "**Request Body**: an **array** of JSON objects, each with `name` and `value`.\n\n"
            "Example:\n```\n[\n  {\"name\": \"Param1\", \"value\": \"Value1\"},\n  {\"name\": \"Param2\", \"value\": \"Value2\"}\n]\n```"
        ),
        request=ProductParameterSerializer(many=True),
        responses={201: ProductParameterSerializer(many=True)},
        examples=[
            OpenApiExample(
                name="Bulk create parameters example",
                description="Example of sending multiple parameters in a single request.",
                value=[
                    {"name": "Color", "value": "Red"},
                    {"name": "Weight", "value": "0.5kg"}
                ],
            ),
        ],
        tags=["Seller Product Parameters"]
    )
    @action(methods=['post'], detail=False)

    def bulk_create(self, request, product_pk=None):
        """
        Bulk create (mass create) parameters for a specific product.
        Endpoint: POST /products/{product_pk}/parameters/bulk_create/
        Body: an array of JSON objects, each with 'name' and 'value'.
        """
        product = get_object_or_404(BaseProduct, pk=product_pk)
        if product.seller.user != request.user:
            raise PermissionDenied("You do not own this product.")

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        # Prepare objects for bulk_create
        objs_to_create = []
        for valid_data in serializer.validated_data:
            objs_to_create.append(ProductParameter(product=product, **valid_data))

        created_objs = ProductParameter.objects.bulk_create(objs_to_create)

        output_data = self.get_serializer(created_objs, many=True).data
        return Response(output_data, status=status.HTTP_201_CREATED)


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


@extend_schema_view(
    list=extend_schema(
        tags=["Seller Product Variants"],
        description="List all variants for a given product."
    ),
    create=extend_schema(
        tags=["Seller Product Variants"],
        description="Create a new variant for a given product."
    ),
    retrieve=extend_schema(
        tags=["Seller Product Variants"],
        description="Retrieve detail of a single product variant."
    ),
    update=extend_schema(
        tags=["Seller Product Variants"],
        description="Fully update (PUT) a product variant."
    ),
    partial_update=extend_schema(
        tags=["Seller Product Variants"],
        description="Partially update (PATCH) a product variant."
    ),
    destroy=extend_schema(
        tags=["Seller Product Variants"],
        description="Delete a product variant."
    )
)
class ProductVariantViewSet(ModelViewSet):
    """
    ViewSet for performing CRUD operations on ProductVariant objects
    belonging to a specific product, using nested URLs:
    /products/{product_id}/variants/{variant_id}/
    """
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated, IsSellerOwner]

    def get_queryset(self):
        """
        Retrieves a list of variants associated with the product identified by 'product_pk'
        from the nested router. Also checks that the current user is the owner of that product.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)

        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        return ProductVariant.objects.filter(product=product)

    def get_object(self):
        """
        Retrieves a single ProductVariant within the filtered queryset,
        ensuring it belongs to the current product and user is the owner.
        """
        queryset = self.get_queryset()
        variant_id = self.kwargs['pk']
        variant_obj = get_object_or_404(queryset, pk=variant_id)
        self.check_object_permissions(self.request, variant_obj)
        return variant_obj

    def perform_create(self, serializer):
        """
        When creating a new variant, link it to the product from the nested URL.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)
        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        serializer.save(product=product)

    @extend_schema(
        tags=["Seller Product Variants"],
        operation_id="product_variant_bulk_create",
        description=(
                "Bulk create (mass create) ProductVariants for a given product, "
                "including Base64-encoded images. Endpoint:\n\n"
                "**Request body**: an array of objects with `name`, `text`, `price`, "
                "and optional base64-encoded `image`. Example:\n\n"
                "```\n[\n"
                "  {\n"
                "    \"name\": \"Variant\",\n"
                "    \"text\": \"Text 1\",\n"
                "    \"price\": \"99.99\",\n"
                "    \"image\": \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4...\"\n"
                "  },\n"
                "  {\n"
                "    \"name\": \"Variant\",\n"
                "    \"text\": \"Text 2\",\n"
                "    \"price\": \"129.99\",\n"
                "    \"image\": \"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4...\"\n"
                "  }\n"
                "]\n```"
        ),
        request=ProductVariantSerializer(many=True),
        responses={201: ProductVariantSerializer(many=True)},
        examples=[
            OpenApiExample(
                name="Bulk create variants with base64 images",
                description="Example of sending multiple variants (with base64 images) in a single request.",
                value=[
                    {
                        "name": "Variant",
                        "text": "Text 1",
                        "price": "99.99",
                        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4..."
                    },
                    {
                        "name": "Variant",
                        "text": "Text 2",
                        "price": "129.99",
                        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4"
                    }
                ]
            ),
        ]
    )
    @action(methods=['post'], detail=False)
    def bulk_create(self, request, product_pk=None):
        """
        Bulk create (mass create) product variants for a specific product,
        generating unique SKUs manually to avoid duplicate key errors.
        """
        product = get_object_or_404(BaseProduct, pk=product_pk)
        if product.seller.user != request.user:
            raise PermissionDenied("You do not own this product.")

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        variants_to_create = []
        for valid_data in serializer.validated_data:
            # Создаём объект "вручную"
            variant = ProductVariant(product=product, **valid_data)
            # Генерируем SKU вручную (т.к. save() не будет вызвано при bulk_create)
            variant.sku = variant.generate_unique_sku()

            # Вызываем clean() вручную, если нужна валидация text/image/названия
            # Исключаем 'sku', так как мы уже сами его задали
            variant.full_clean(exclude=['sku'])

            variants_to_create.append(variant)

        created_variants = ProductVariant.objects.bulk_create(variants_to_create)

        output_data = self.get_serializer(created_variants, many=True).data
        return Response(output_data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    list=extend_schema(
        tags=["Seller Product License"],
        description="List the license file(s) for a product. In a OneToOne setup, typically returns 0 or 1 file."
    ),
    create=extend_schema(
        tags=["Seller Product License"],
        description="Upload (create) a license file for a product, if none exists."
    ),
    retrieve=extend_schema(
        tags=["Seller Product License"],
        description="Retrieve details of a single license file."
    ),
    update=extend_schema(
        tags=["Seller Product License"],
        description="Fully update (PUT) a license file."
    ),
    partial_update=extend_schema(
        tags=["Seller Product License"],
        description="Partially update (PATCH) a license file."
    ),
    destroy=extend_schema(
        tags=["Seller Product License"],
        description="Delete a license file."
    )
)
class LicenseFileViewSet(ModelViewSet):
    """
    ViewSet for CRUD operations on LicenseFile objects in a OneToOne relationship
    with BaseProduct, using nested URLs of the form:
    /products/{product_id}/license/{pk}/

    - Typically returns 0 or 1 file for 'list()'.
    - For 'create()', we ensure a second LicenseFile is not created if one already exists.
    """
    serializer_class = LicenseFileSerializer
    permission_classes = [IsAuthenticated, IsSellerOwner]

    def get_queryset(self):
        """
        Returns the LicenseFile(s) (usually 0 or 1) associated with the given product.
        Also verifies that the current user owns the product.

        Steps:
          1. Extract 'product_id' from self.kwargs['product_pk'].
          2. Retrieve the BaseProduct using get_object_or_404.
          3. Check if product.seller.user == request.user; if not, raise PermissionDenied.
          4. Filter and return LicenseFile objects for that product.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)

        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        return LicenseFile.objects.filter(product=product)

    def get_object(self):
        """
        Retrieves a single LicenseFile from the queryset determined by get_queryset().
        Ensures it belongs to the same product and user is the owner.

        Steps:
          1. Call get_queryset() to narrow down LicenseFile objects for the current product.
          2. Extract 'license_id' from self.kwargs['pk'].
          3. Use get_object_or_404(queryset, pk=license_id) to fetch the LicenseFile.
          4. Call self.check_object_permissions(...) to trigger the IsSellerOwner check.
          5. Return the LicenseFile object.
        """
        queryset = self.get_queryset()
        license_id = self.kwargs['pk']
        license_obj = get_object_or_404(queryset, pk=license_id)
        self.check_object_permissions(self.request, license_obj)
        return license_obj

    def perform_create(self, serializer):
        """
        Assigns the new LicenseFile to the product specified by 'product_pk' in the nested URL.
        Prevents creation of a second LicenseFile under a OneToOne assumption.

        Steps:
          1. Extract 'product_id' from self.kwargs['product_pk'].
          2. Retrieve the BaseProduct with get_object_or_404.
          3. Verify product.seller.user == request.user; if not, raise PermissionDenied.
          4. Check if a LicenseFile already exists for this product; if yes, raise PermissionDenied.
          5. Save the serializer with product=product, establishing the OneToOne link.
        """
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(BaseProduct, pk=product_id)

        if product.seller.user != self.request.user:
            raise PermissionDenied("You do not own this product.")

        existing_license = LicenseFile.objects.filter(product=product).first()
        if existing_license:
            raise PermissionDenied("A license file already exists for this product.")

        serializer.save(product=product)


STATUS_MAP = {
    'active': 'approved',
    'on_moderation': 'pending',
    'not_moderated': 'rejected',
}


@extend_schema(
    description="""
        Retrieve a list of products for the authenticated seller.
        Supports search, filtering (price, rating, status), and sorting.
        Status param:
          - active → status='approved'
          - on_moderation → status='pending'
          - not_moderated → status='rejected'
    """,
    parameters=[
        OpenApiParameter(
            name='search',
            description='Search query for name, description, or parameters',
            required=False,
            type=str
        ),
        OpenApiParameter(
            name='status',
            description="""
                Filter products by human-readable status:
                  - active → DB status='approved'
                  - on_moderation → DB status='pending'
                  - not_moderated → DB status='rejected'
            """,
            required=False,
            type=str,
            enum=['active','on_moderation','not_moderated']
        ),
        OpenApiParameter(
            name='min_price',
            description='Minimum price to filter products',
            required=False,
            type=float
        ),
        OpenApiParameter(
            name='max_price',
            description='Maximum price to filter products',
            required=False,
            type=float
        ),
        OpenApiParameter(
            name='rating',
            description='Minimum rating to filter products',
            required=False,
            type=float
        ),
        OpenApiParameter(
            name='ordering',
            description="""
                Fields to sort by. Use "-" prefix for descending.
                Possible: min_price, -min_price, rating, -rating, ordered_quantity, -ordered_quantity
            """,
            required=False,
            type=str
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=BaseProductListSerializer(many=True),
            description="A paginated list of seller products."
        )
    },
    tags=["Seller Products"]
)
class SellerProductListView(ListAPIView):
    """
    A ListAPIView for products belonging to the authenticated seller,
    with support for search, filter, and ordering.
    """
    serializer_class = BaseProductListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter
    ]
    filterset_class = BaseProductFilter
    search_fields = [
        'name',
        'product_description',
        'product_parameters__name',
        'product_parameters__value'
    ]
    ordering_fields = ['min_price', 'rating', 'ordered_quantity']

    def get_queryset(self):
        user = self.request.user
        seller_profile = getattr(user, 'seller_profile', None)
        if not seller_profile:
            return BaseProduct.objects.none()

        qs = BaseProduct.objects.filter(seller=seller_profile)

        status_param = self.request.query_params.get('status')
        if status_param in STATUS_MAP:
            db_status = STATUS_MAP[status_param]
            qs = qs.filter(status=db_status)

        qs = qs.annotate(
            min_price=Min('variants__price'),
            ordered_quantity=Sum('variants__orderproduct__quantity')
        ).filter(min_price__isnull=False).distinct()

        return qs


@extend_schema(
    description="""
        Returns aggregated sales statistics (ordered vs delivered) 
        for the authenticated seller over the last N days (default=15).
    """,
    parameters=[
        OpenApiParameter(
            name='days',
            description='Number of days to look back (default=15)',
            required=False,
            type=int
        )
    ],
    responses={
        200: OpenApiResponse(
            description="Sales statistics including daily data and totals.",
            examples=[
                OpenApiExample(
                    name="SalesStatisticsExample",
                    value={
                        "chartData": [
                            {
                                "date": "2024-11-24",
                                "ordered_amount": "120.00",
                                "ordered_count": 12,
                                "delivered_amount": "40.00",
                                "delivered_count": 4
                            },
                            {
                                "date": "2024-11-25",
                                "ordered_amount": "200.00",
                                "ordered_count": 18,
                                "delivered_amount": "150.00",
                                "delivered_count": 12
                            }
                        ],
                        "ordered_period": {
                            "amount": "320.00",
                            "count": 30
                        },
                        "delivered_period": {
                            "amount": "190.00",
                            "count": 16
                        },
                        "today": "2024-12-08"
                    }
                )
            ]
        )
    },
    tags=["Seller Statistics"]
)
class SellerSalesStatisticsView(APIView):
    """
    Returns the sales statistics (ordered vs delivered) for the authenticated seller,
    grouping by day. By default for the last 15 days, but `days` can be passed in query.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        seller_profile = getattr(user, 'seller_profile', None)
        if not seller_profile:
            return Response({"error": "No seller profile found."}, status=400)

        days = int(request.query_params.get('days', 15))
        stats = get_seller_sales_statistics(seller_profile, days=days)
        return Response(stats, status=200)
