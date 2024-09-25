from rest_framework import status
from rest_framework import generics
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from rest_framework.filters import SearchFilter
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Min

from .pagination import StandardResultsSetPagination
from .filters import BaseProductFilter
from .models import (
    BaseProduct,
    Category
)
from .serializers import (
    BaseProductListSerializer,
    BaseProductDetailSerializer,
    CategorySerializer,
    CategorySearchViewSerializer,
)


@extend_schema(
    description="""
        Search for products, categories, and subcategories. Supports filtering by price range and sorting by rating or price.

        Example response:
        ```json
        {
            "products": [
                {
                    "id": 1,
                    "name": "IPhone 14 Pro",
                    "image": "http://localhost:8081/media/base_product_images/Avatar_xpoy9j_Ap0sYWH.jpg"
                    "price": "1000.00",
                    "rating": "4.4",
                    "total_reviews": 10,
                    "is_favorite": false,
                },
                {
                    "id": 2,
                    "name": "Galaxy S21",
                    "image": "http://localhost:8081/media/base_product_images/Avatar_xpoy9j_Ap0sYWH.jpg"
                    "price": "900.00",
                    "rating": "4.2",
                    "total_reviews": 5,
                    "is_favorite": true,
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
            description='Sort products by price or rating',
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
                        "products": [
                            {
                                "id": 1,
                                "name": "IPhone 14 Pro",
                                "image": "http://localhost:8081/media/base_product_images/Avatar_xpoy9j_Ap0sYWH.jpg",
                                "price": "1000.00",
                                "rating": "4.4",
                                "total_reviews": 10,
                                "is_favorite": False,
                            },
                            {
                                "id": 2,
                                "name": "Galaxy S21",
                                "image": "http://localhost:8081/media/base_product_images/Avatar_xpoy9j_Ap0sYWH.jpg",
                                "price": "900.00",
                                "rating": "4.2",
                                "total_reviews": 5,
                                "is_favorite": True,
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
                )
            ]
        )
    },
    tags=["Search"]
)
class SearchView(generics.ListAPIView):
    serializer_class = BaseProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [
        'name',
        'product_description',
        'parameters__parameter__name',
        'parameters__value',
        'category__name'
    ]
    filterset_class = BaseProductFilter
    ordering_fields = ['price', 'rating']
    ordering = ['-rating']

    def list(self, request):
        query = request.query_params.get('q', '')

        products = BaseProduct.objects.filter(
            Q(name__icontains=query) |
            Q(product_description__icontains=query) |
            Q(parameters__parameter__name__icontains=query) |
            Q(parameters__value__icontains=query) |
            Q(category__name__icontains=query)
        ).distinct()
        categories = Category.objects.filter(name__icontains=query)

        paginator = self.pagination_class()
        paginated_products = paginator.paginate_queryset(products, request)

        product_serializer = BaseProductListSerializer(paginated_products, many=True, context={'request': request})
        category_serializer = CategorySearchViewSerializer(categories, many=True)

        return paginator.get_paginated_response({
            'products': product_serializer.data,
            'categories': category_serializer.data
        })


@extend_schema(
    description=(
        "Retrieve a list of products belonging to a specific category. "
        "Supports pagination, sorting by rating (popularity) in descending order, and ascending/descending price. "
        "Allows filtering by price range (minimum and maximum price) and rating. "
        "Each product includes fields: id, name, product_description, parameters, image (one image), "
        "price (minimum price from variants), rating, total_reviews, and is_favorite."
    ),
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
            description='Sort products by price or rating. Use "-" prefix for descending order.',
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
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = BaseProductFilter
    ordering_fields = {
        'price': 'min_price',
        'rating': 'rating',
    }
    ordering = ['-rating']

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
            'image',
            'variants',
            'variants__image',
            'parameters',
            'parameters__parameter',
        )

        return queryset.distinct()


@extend_schema(
    description="Retrieve detailed information about a specific product by its ID. The response includes product details such as name, description, parameters, rating, total number of reviews, license file, images, variants with prices, and whether the product is in the user's favorites.",
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
                "parameters": [
                    {"parameter": "Power", "value": "120W"},
                    {"parameter": "Value", "value": "1m"}
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
                        "text": "null",
                        "image": "http://localhost:8081/media/base_product_images/variant/image1.jpg",
                        "price": "99.99"
                    },
                    {
                        "id": 2,
                        "sku": "987654321",
                        "name": "Color",
                        "text": "null",
                        "image": "http://localhost:8081/media/base_product_images/variant/image2.jpg",
                        "price": "109.99"
                    }
                ]
            },
            request_only=False,
            response_only=True,
        ),
    ]
)
class BaseProductDetailAPIView(generics.RetrieveAPIView):
    queryset = BaseProduct.objects.select_related('category', 'license_files').prefetch_related(
        'parameters',
        'parameters__parameter',
        'image',
        'variants',
    )
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
