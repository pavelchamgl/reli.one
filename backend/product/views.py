from rest_framework import status
from rest_framework import generics
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Min, F

from .pagination import StandardResultsSetPagination
from .filters import BaseProductFilter
from .models import (
    BaseProduct,
    Category,
)
from .serializers import (
    BaseProductListSerializer,
    BaseProductDetailSerializer,
    CategorySerializer,
    CategorySearchViewSerializer,
)


@extend_schema(
    description="""
        Search for products and categories. Supports filtering by price range and sorting by rating or price.

        **Note:** When sorting by fields that may contain `null` values (e.g., `rating`), such values will be placed at the end of the list.

        **Example response:**

        ```json
        {
            "count": 2,
            "next": null,
            "previous": null,
            "results": {
                "products": [
                    {
                        "id": 1,
                        "name": "IPhone 14 Pro",
                        "product_description": "Latest model of iPhone with advanced features.",
                        "product_parameters": [
                            {
                                "id": 10,
                                "name": "Weight",
                                "value": "250g"
                            }
                        ],
                        "image": "http://localhost:8081/media/base_product_images/iphone14pro.jpg",
                        "price": "1000.00",
                        "rating": "4.8",
                        "total_reviews": 120,
                        "is_favorite": false
                    },
                    {
                        "id": 2,
                        "name": "Galaxy S21",
                        "product_description": "Samsung's flagship smartphone with cutting-edge technology.",
                        "product_parameters": [
                            {
                                "id": 11,
                                "name": "Weight",
                                "value": "220g"
                            }
                        ],
                        "image": "http://localhost:8081/media/base_product_images/galaxys21.jpg",
                        "price": "950.00",
                        "rating": "4.5",
                        "total_reviews": 98,
                        "is_favorite": true
                    }
                ],
                "categories": [
                    {
                        "id": 1,
                        "name": "Electronics",
                        "parent": null
                    },
                    {
                        "id": 2,
                        "name": "Smartphones",
                        "parent": 1
                    }
                ]
            }
        }
        ```
    """,
    parameters=[
        OpenApiParameter(
            name='q',
            description='Search query for products and categories',
            required=False,
            type=str
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
            name='ordering',
            description="""
                Sort products by price or rating. Use "-" prefix for descending order.

                **Note:** When sorting by fields that may contain `null` values (e.g., `rating`), such values will be placed at the end of the list.
                """,
            required=False,
            type=str,
            enum=['price', '-price', 'rating', '-rating']
        ),
    ],
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            description="A list of search results.",
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
                                        {
                                            "id": 10,
                                            "name": "Weight",
                                            "value": "250g"
                                        }
                                    ],
                                    "image": "http://localhost:8081/media/base_product_images/iphone14pro.jpg",
                                    "price": "1000.00",
                                    "rating": "4.8",
                                    "total_reviews": 120,
                                    "is_favorite": False
                                },
                                {
                                    "id": 2,
                                    "name": "Galaxy S21",
                                    "product_description": "Samsung's flagship smartphone with cutting-edge technology.",
                                    "product_parameters": [
                                        {
                                            "id": 11,
                                            "name": "Weight",
                                            "value": "220g"
                                        }
                                    ],
                                    "image": "http://localhost:8081/media/base_product_images/galaxys21.jpg",
                                    "price": "950.00",
                                    "rating": "4.5",
                                    "total_reviews": 98,
                                    "is_favorite": True
                                }
                            ],
                            "categories": [
                                {
                                    "id": 1,
                                    "name": "Electronics",
                                    "parent": None
                                },
                                {
                                    "id": 2,
                                    "name": "Smartphones",
                                    "parent": 1
                                }
                            ]
                        }
                    }
                )
            ]
        )
    },
    tags=["Search"]
)
class SearchView(generics.ListAPIView):
    serializer_class = BaseProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = [
        'name',
        'product_description',
        'product_parameters__name',
        'product_parameters__value',
        'category__name'
    ]
    filterset_class = BaseProductFilter

    ALLOWED_ORDERING_FIELDS = ['min_price', 'rating']

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query.strip():
            return BaseProduct.objects.none()

        products = BaseProduct.objects.filter(
            Q(name__icontains=query) |
            Q(product_description__icontains=query) |
            Q(product_parameters__name__icontains=query) |
            Q(product_parameters__value__icontains=query) |
            Q(category__name__icontains=query)
        ).annotate(
            min_price=Min('variants__price')
        ).filter(
            min_price__isnull=False
        ).prefetch_related(
            'images',
            'variants',
            'product_parameters',
        ).distinct()

        # Получаем параметр сортировки из запроса
        ordering = self.request.query_params.get('ordering', '-rating')

        # Проверяем, является ли поле сортировки допустимым
        if ordering.lstrip('-') in self.ALLOWED_ORDERING_FIELDS:
            # Определяем направление сортировки
            if ordering.startswith('-'):
                ordering_field = ordering[1:]
                products = products.order_by(F(ordering_field).desc(nulls_last=True))
            else:
                ordering_field = ordering
                products = products.order_by(F(ordering_field).asc(nulls_last=True))
        else:
            # Если поле недопустимо, используем сортировку по умолчанию
            products = products.order_by(F('rating').desc(nulls_last=True))

        return products

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
        Retrieve a list of products belonging to a specific category. Supports pagination, filtering by price range and rating, and sorting by rating or price.

        **Note:** When sorting by fields that may contain `null` values (e.g., `rating`), such values will be placed at the end of the list.

        **Example response:**

        ```json
        {
            "count": 4,
            "next": null,
            "previous": null,
            "results": [
                {
                    "id": 1,
                    "name": "IPhone 14 Pro",
                    "product_description": "Latest model of iPhone with advanced features.",
                    "parameters": [
                        {
                            "parameter_name": "Weight",
                            "value": "250g"
                        },
                        {
                            "parameter_name": "Height",
                            "value": "70mm"
                        }
                    ],
                    "image": "http://localhost:8081/media/base_product_images/iphone14pro.jpg",
                    "price": "1000.00",
                    "rating": "4.8",
                    "total_reviews": 120,
                    "is_favorite": false
                },
                {
                    "id": 2,
                    "name": "Galaxy S21",
                    "product_description": "Samsung's flagship smartphone with cutting-edge technology.",
                    "parameters": [
                        {
                            "parameter_name": "Weight",
                            "value": "220g"
                        }
                    ],
                    "image": "http://localhost:8081/media/base_product_images/galaxys21.jpg",
                    "price": "950.00",
                    "rating": "4.5",
                    "total_reviews": 98,
                    "is_favorite": false
                },
                {
                    "id": 3,
                    "name": "IPhone 15 Pro MAX",
                    "product_description": "Upcoming model with enhanced performance.",
                    "parameters": [
                        {
                            "parameter_name": "Weight",
                            "value": "270g"
                        }
                    ],
                    "image": "http://localhost:8081/media/base_product_images/iphone15promax.jpg",
                    "price": "1500.00",
                    "rating": "0.0",
                    "total_reviews": 0,
                    "is_favorite": false
                },
                {
                    "id": 4,
                    "name": "Nokia 3310",
                    "product_description": "Classic durable mobile phone.",
                    "parameters": [
                        {
                            "parameter_name": "Weight",
                            "value": "300g"
                        }
                    ],
                    "image": "http://localhost:8081/media/base_product_images/nokia3310.jpg",
                    "price": "50.00",
                    "rating": "4.0",
                    "total_reviews": 250,
                    "is_favorite": false
                }
            ]
        }
        ```
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
            description="""
                Sort products by price or rating. Use "-" prefix for descending order.

                **Note:** When sorting by fields that may contain `null` values (e.g., `rating`), such values will be placed at the end of the list.
                """,
            required=False,
            type=str,
            enum=['price', '-price', 'rating', '-rating']
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
    ],
    responses={
        200: OpenApiResponse(
            response=BaseProductListSerializer(many=True),
            description="A list of products."
        ),
        404: OpenApiResponse(description="Category not found.")
    },
    tags=["Product"],
    examples=[
        OpenApiExample(
            name="Product List Example",
            value={
                "count": 4,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": 1,
                        "name": "IPhone 14 Pro",
                        "product_description": "Latest model of iPhone with advanced features.",
                        "parameters": [
                            {
                                "parameter_name": "Weight",
                                "value": "250g"
                            },
                            {
                                "parameter_name": "Height",
                                "value": "70mm"
                            }
                        ],
                        "image": "http://localhost:8081/media/base_product_images/iphone14pro.jpg",
                        "price": "1000.00",
                        "rating": "4.8",
                        "total_reviews": 120,
                        "is_favorite": False
                    },
                    {
                        "id": 2,
                        "name": "Galaxy S21",
                        "product_description": "Samsung's flagship smartphone with cutting-edge technology.",
                        "parameters": [
                            {
                                "parameter_name": "Weight",
                                "value": "220g"
                            }
                        ],
                        "image": "http://localhost:8081/media/base_product_images/galaxys21.jpg",
                        "price": "950.00",
                        "rating": "4.5",
                        "total_reviews": 98,
                        "is_favorite": False
                    },
                    {
                        "id": 3,
                        "name": "IPhone 15 Pro MAX",
                        "product_description": "Upcoming model with enhanced performance.",
                        "parameters": [
                            {
                                "parameter_name": "Weight",
                                "value": "270g"
                            }
                        ],
                        "image": "http://localhost:8081/media/base_product_images/iphone15promax.jpg",
                        "price": "1500.00",
                        "rating": "0.0",
                        "total_reviews": 0,
                        "is_favorite": False
                    },
                    {
                        "id": 4,
                        "name": "Nokia 3310",
                        "product_description": "Classic durable mobile phone.",
                        "parameters": [
                            {
                                "parameter_name": "Weight",
                                "value": "300g"
                            }
                        ],
                        "image": "http://localhost:8081/media/base_product_images/nokia3310.jpg",
                        "price": "50.00",
                        "rating": "4.0",
                        "total_reviews": 250,
                        "is_favorite": False
                    }
                ]
            },
            request_only=False,
            response_only=True,
        ),
    ]
)
class CategoryBaseProductListView(generics.ListAPIView):
    serializer_class = BaseProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = BaseProductFilter

    ALLOWED_ORDERING_FIELDS = ['min_price', 'rating']

    def get_queryset(self):
        category_id = self.kwargs.get('category_id')
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return BaseProduct.objects.none()

        queryset = BaseProduct.objects.filter(category=category).annotate(
            min_price=Min('variants__price')
        ).filter(
            min_price__isnull=False
        ).prefetch_related(
            'images',
            'variants',
            'product_parameters',
        ).distinct()

        # Получаем параметр сортировки из запроса
        ordering = self.request.query_params.get('ordering', '-rating')

        # Проверяем, является ли поле сортировки допустимым
        if ordering.lstrip('-') in self.ALLOWED_ORDERING_FIELDS:
            # Определяем направление сортировки
            if ordering.startswith('-'):
                ordering_field = ordering[1:]
                queryset = queryset.order_by(F(ordering_field).desc(nulls_last=True))
            else:
                ordering_field = ordering
                queryset = queryset.order_by(F(ordering_field).asc(nulls_last=True))
        else:
            # Если поле недопустимо, используем сортировку по умолчанию
            queryset = queryset.order_by(F('rating').desc(nulls_last=True))

        return queryset


@extend_schema(
    description=(
        "Retrieve detailed information about a specific product by its ID. "
        "The response includes product details such as name, description, **product_parameters**, rating, total number of reviews, "
        "license file, images, variants with prices, whether the product is in the user's favorites, "
        "and a list of SKUs the authenticated user can review."
    ),
    parameters=[
        OpenApiParameter(
            name='id',
            description='ID of the product to retrieve',
            required=True,
            type=int
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=BaseProductDetailSerializer,
            description="A detailed view of the product."
        ),
        404: OpenApiResponse(description="Product not found.")
    },
    tags=["Product"],
    examples=[
        OpenApiExample(
            name="Product Detail Example",
            value={
                "id": 1,
                "name": "Sample Product",
                "product_description": "This is a sample product description.",
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
                "variants": [
                    {
                        "id": 1,
                        "sku": "123456789",
                        "name": "Color",
                        "text": None,
                        "image": "http://localhost:8081/media/base_product_images/variant/image1.jpg",
                        "price": "99.99"
                    },
                    {
                        "id": 2,
                        "sku": "987654321",
                        "name": "Color",
                        "text": None,
                        "image": "http://localhost:8081/media/base_product_images/variant/image2.jpg",
                        "price": "109.99"
                    }
                ],
                "can_review": ["123456789", "987654321"]
            },
            request_only=False,
            response_only=True,
        ),
    ]
)
class BaseProductDetailAPIView(generics.RetrieveAPIView):
    queryset = BaseProduct.objects.select_related('category', 'license_files').prefetch_related(
        'product_parameters',
        'images',
        'variants',
        'variants__variant_reviews',
    ).distinct()
    serializer_class = BaseProductDetailSerializer
    lookup_field = 'id'


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
        categories = Category.objects.filter(parent__isnull=True)
        serializer = CategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
