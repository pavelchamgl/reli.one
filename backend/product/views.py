from decimal import Decimal
from rest_framework import status
from rest_framework import generics
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Min, F, Sum, DecimalField, ExpressionWrapper, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce

from .pagination import StandardResultsSetPagination
from .filters import BaseProductFilter
from .models import (
    BaseProduct,
    Category,
    ProductStatus,
)
from .serializers import (
    BaseProductListSerializer,
    BaseProductDetailSerializer,
    CategorySerializer,
    CategorySearchViewSerializer,
)
from order.models import OrderProduct
from accounts.choices import UserRole


ACQUIRING_MULTIPLIER = Decimal("1.04")

def build_public_products_queryset(base_qs):
    """
    Единая логика для:
    - category list
    - search
    Гарантирует одинаковое поведение и ordered_count
    """

    # 1. Минимальная цена без эквайринга
    qs = base_qs.annotate(
        base_min_price=Min("variants__price"),
    ).filter(
        base_min_price__isnull=False
    )

    # 2. Финальная цена с эквайрингом
    qs = qs.annotate(
        final_min_price=ExpressionWrapper(
            F("base_min_price") * Value(ACQUIRING_MULTIPLIER),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        )
    )

    # 3. ordered_count (без зависимости от related_name)
    ordered_total_sq = (
        OrderProduct.objects
        .filter(product__product=OuterRef("pk"))
        .values("product__product")
        .annotate(total=Sum("quantity"))
        .values("total")[:1]
    )

    qs = qs.annotate(
        ordered_quantity=Coalesce(Subquery(ordered_total_sq), 0)
    )

    return qs.prefetch_related(
        "images",
        "variants",
        "product_parameters",
    ).distinct()


class PublicVisibilityMixin:
    """
    Публичные пользователи:
    - is_active=True
    - status=APPROVED

    Staff / Admin / Manager:
    - видят всё (обратная совместимость)
    """

    def apply_public_visibility(self, qs):
        user = getattr(self.request, "user", None)
        role = getattr(user, "role", None)

        is_staff_like = (
                bool(getattr(user, "is_staff", False))
                or role in (UserRole.ADMIN, UserRole.MANAGER)
        )

        if is_staff_like:
            return qs

        return qs.filter(
            is_active=True,
            status=ProductStatus.APPROVED,
        )


@extend_schema(
    description="""
        Search for products and categories. Supports filtering by price range and sorting by rating or price.

        The `price` value includes the acquiring (processing) fee.

        Filtering with `min_price` and `max_price` and sorting by `price` is based on this final price.

        Each product in the result includes `seller_id` and `is_age_restricted` fields.
    """,
    parameters=[
        OpenApiParameter(name='q', description='Search query', required=False, type=OpenApiTypes.STR),
        OpenApiParameter(
            name='min_price',
            description='Minimum price (includes acquiring fee)',
            required=False,
            type=OpenApiTypes.NUMBER
        ),
        OpenApiParameter(
            name='max_price',
            description='Maximum price (includes acquiring fee)',
            required=False,
            type=OpenApiTypes.NUMBER
        ),
        OpenApiParameter(
            name='ordering',
            description='Sort by price or rating (price includes acquiring fee). Use "-" prefix for descending order.',
            required=False,
            type=OpenApiTypes.STR,
            enum=['price', '-price', 'rating', '-rating']
        ),
    ],
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=BaseProductListSerializer,
            description="A list of search results including products and categories. Price values include acquiring fee.",
            examples=[
                OpenApiExample(
                    name="SearchExample",
                    value={
                        "count": 2,
                        "next": None,
                        "previous": None,
                        "results": {
                            "products": [
                                {
                                    "id": 1,
                                    "name": "IPhone 14 Pro",
                                    "product_description": "Latest model of iPhone with advanced features.",
                                    "product_parameters": [
                                        {"id": 10, "name": "Weight", "value": "250g"}
                                    ],
                                    "image": "http://localhost:8081/media/base_product_images/iphone14pro.jpg",
                                    "price": "1000.00",  # includes acquiring fee
                                    "rating": "4.8",
                                    "total_reviews": 120,
                                    "is_favorite": False,
                                    "ordered_count": 153521,
                                    "seller_id": 3,
                                    "is_age_restricted": False
                                },
                                {
                                    "id": 2,
                                    "name": "Galaxy S21",
                                    "product_description": "Samsung's flagship smartphone with cutting-edge technology.",
                                    "product_parameters": [
                                        {"id": 11, "name": "Weight", "value": "220g"}
                                    ],
                                    "image": "http://localhost:8081/media/base_product_images/galaxys21.jpg",
                                    "price": "950.00",  # includes acquiring fee
                                    "rating": "4.5",
                                    "total_reviews": 98,
                                    "is_favorite": True,
                                    "ordered_count": 1,
                                    "seller_id": 2,
                                    "is_age_restricted": True
                                }
                            ],
                            "categories": [
                                {"id": 1, "name": "Electronics", "parent": None},
                                {"id": 2, "name": "Smartphones", "parent": 1}
                            ]
                        }
                    },
                    response_only=True
                )
            ]
        )
    },
    tags=["Search"]
)
class SearchView(PublicVisibilityMixin, generics.ListAPIView):
    serializer_class = BaseProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = BaseProductFilter

    ALLOWED_ORDERING_FIELDS = ["price", "rating", "min_price"]

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        if not query:
            return BaseProduct.objects.none()

        qs = BaseProduct.objects.filter(
            Q(name__icontains=query) |
            Q(product_description__icontains=query) |
            Q(product_parameters__name__icontains=query) |
            Q(product_parameters__value__icontains=query) |
            Q(category__name__icontains=query)
        )

        qs = self.apply_public_visibility(qs)
        qs = build_public_products_queryset(qs)

        ordering = self.request.query_params.get("ordering", "-rating")
        return self.apply_ordering(qs, ordering)

    def apply_ordering(self, qs, ordering):
        field = ordering.lstrip("-")
        desc = ordering.startswith("-")

        if field not in self.ALLOWED_ORDERING_FIELDS:
            field = "rating"
            desc = True

        if field == "price":
            db_field = "final_min_price"
        elif field == "min_price":
            db_field = "base_min_price"
        else:
            db_field = field

        return qs.order_by(
            F(db_field).desc(nulls_last=True)
            if desc
            else F(db_field).asc(nulls_last=True)
        )

    def list(self, request, *args, **kwargs):
        products_queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(products_queryset)
        if page is not None:
            product_serializer = self.get_serializer(page, many=True)
        else:
            product_serializer = self.get_serializer(products_queryset, many=True)

        query = request.query_params.get('q', '')
        if not query.strip():
            categories = Category.objects.none()
        else:
            categories = Category.objects.filter(name__icontains=query)
        category_serializer = CategorySearchViewSerializer(categories, many=True, context={'request': request})

        return self.get_paginated_response({
            'products': product_serializer.data,
            'categories': category_serializer.data
        })


@extend_schema(
    description="""
        Retrieve a list of products belonging to a specific category.

        Supports pagination, filtering by price range and rating, and sorting by rating or price.

        The `price` value includes the acquiring (processing) fee.

        Filtering with `min_price` and `max_price` and sorting by `price` is based on this final price.

        Each product in the result includes `seller_id` and `is_age_restricted` fields.

        **Note:** When sorting by fields that may contain `null` values (e.g., `rating`), such values will be placed at the end of the list.
    """,
    parameters=[
        OpenApiParameter(
            name='category_id',
            description='ID of the category to retrieve products for',
            required=True,
            type=int,
            location=OpenApiParameter.PATH
        ),
        OpenApiParameter(
            name='ordering',
            description='Sort products by price (including acquiring fee) or rating. Use "-" prefix for descending order.',
            required=False,
            type=str,
            enum=['price', '-price', 'rating', '-rating']
        ),
        OpenApiParameter(name='min_price', description='Minimum price (includes acquiring fee)', required=False, type=float),
        OpenApiParameter(name='max_price', description='Maximum price (includes acquiring fee)', required=False, type=float),
        OpenApiParameter(name='rating', description='Minimum rating to filter products', required=False, type=float),
    ],
    responses={
        200: OpenApiResponse(
            response=BaseProductListSerializer(many=True),
            description="A list of products in the specified category. Price values include acquiring fee.",
        ),
        404: OpenApiResponse(description="Category not found.")
    },
    tags=["Product"]
)
class CategoryBaseProductListView(PublicVisibilityMixin, generics.ListAPIView):
    serializer_class = BaseProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = BaseProductFilter

    ALLOWED_ORDERING_FIELDS = ["price", "rating", "min_price"]

    def get_queryset(self):
        category = get_object_or_404(Category, id=self.kwargs["category_id"])

        qs = BaseProduct.objects.filter(category=category)
        qs = self.apply_public_visibility(qs)
        qs = build_public_products_queryset(qs)

        ordering = self.request.query_params.get("ordering", "-rating")
        return self.apply_ordering(qs, ordering)

    def apply_ordering(self, qs, ordering):
        field = ordering.lstrip("-")
        desc = ordering.startswith("-")

        if field not in self.ALLOWED_ORDERING_FIELDS:
            field = "rating"
            desc = True

        if field == "price":
            db_field = "final_min_price"
        elif field == "min_price":
            db_field = "base_min_price"
        else:
            db_field = field

        return qs.order_by(
            F(db_field).desc(nulls_last=True)
            if desc
            else F(db_field).asc(nulls_last=True)
        )


@extend_schema(
    description="""
        Retrieve detailed information about a specific product by its ID.

        Each product includes:
        - product parameters
        - rating and total number of reviews
        - list of variants, each showing:
            - `price` (includes acquiring fee)
            - `price_without_vat`
            - `image`, `sku`, etc.
        - list of SKUs that the authenticated user can review
        - seller ID and whether the product is age-restricted

        The `price` field for each variant represents the final price **with acquiring fee**.
    """,
    responses={
        200: OpenApiResponse(
            response=BaseProductDetailSerializer,
            description="A detailed view of the product. Variant prices include acquiring fee."
        ),
        404: OpenApiResponse(description="Product not found.")
    },
    examples=[
        OpenApiExample(
            name="Product Detail Example",
            value={
                "id": 1,
                "name": "Sample Product",
                "product_description": "This is a sample product description.",
                "additional_details": "This is a sample product additional details.",
                "product_parameters": [
                    {"id": 10, "name": "Power", "value": "120W"},
                    {"id": 11, "name": "Length", "value": "1m"}
                ],
                "rating": "4.4",
                "total_reviews": 10,
                "license_file": "http://localhost:8081/media/license_files/sample.pdf",
                "images": [
                    {"image_url": "http://localhost:8081/media/base_product_images/sample1.jpg"},
                    {"image_url": "http://localhost:8081/media/base_product_images/sample2.jpg"}
                ],
                "is_favorite": True,
                "category_name": "Sample Category",
                "seller_id": 2,
                "is_age_restricted": False,
                "variants": [
                    {
                        "id": 1,
                        "sku": "123456789",
                        "name": "Color",
                        "text": None,
                        "image": "http://localhost:8081/media/base_product_images/variant/image1.jpg",
                        "price": "99.99",
                        "price_without_vat": "82.64"
                    },
                    {
                        "id": 2,
                        "sku": "987654321",
                        "name": "Color",
                        "text": None,
                        "image": "http://localhost:8081/media/base_product_images/variant/image2.jpg",
                        "price": "109.99",
                        "price_without_vat": "91.74"
                    }
                ],
                "can_review": ["123456789", "987654321"]
            },
            request_only=False,
            response_only=True,
        ),
    ],
    tags=["Product"],
)
class BaseProductDetailAPIView(PublicVisibilityMixin, generics.RetrieveAPIView):
    serializer_class = BaseProductDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        qs = (
            BaseProduct.objects
            .select_related("category")
            .prefetch_related(
                "license_files",
                "product_parameters",
                "images",
                "variants",
                "variants__variant_reviews",
            )
            .distinct()
        )

        return self.apply_public_visibility(qs)


class CategoryListView(APIView):
    @extend_schema(
        summary="Retrieve all categories with their subcategories",
        description=(
            "This endpoint retrieves all root categories along with their "
            "subcategories. A root category is defined as a category that "
            "does not have a parent. Each category may contain nested "
            "subcategories, and this relationship is recursively represented."
        ),
        responses={200: CategorySerializer(many=True)},
        tags=["Category"],
    )
    def get(self, request, *args, **kwargs):
        """
        Retrieves all root categories and their nested subcategories.
        """
        categories = Category.objects.filter(parent__isnull=True).prefetch_related("children__children__children")
        serializer = CategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
