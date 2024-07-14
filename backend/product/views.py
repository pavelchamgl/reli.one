from rest_framework import status
from rest_framework import generics
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from rest_framework.filters import SearchFilter
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

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
            Q(name__icontains=query) | Q(product_description__icontains=query) |
            Q(parameters__parameter__name__icontains=query) | Q(parameters__value__icontains=query) |
            Q(category__name__icontains=query)
        ).distinct()
        categories = Category.objects.filter(name__icontains=query)

        product_serializer = BaseProductListSerializer(products, many=True, context={'request': request})
        category_serializer = CategorySearchViewSerializer(categories, many=True)

        return Response({
            'products': product_serializer.data,
            'categories': category_serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema(
    description=(
        "Retrieve a list of all products belonging to a specific category. "
        "Supports pagination, sorting by popularity (rating) in descending order, ascending/descending price, "
        "and filtering by price range. Each product includes fields: id, name, images (one image), "
        "price, rating, total_reviews, is_favorite."
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
            description='Sort products by price or rating',
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
            value=[
                {
                    "id": 1,
                    "name": "IPhone 14 Pro",
                    "images": [
                      "http://localhost:8081/media/base_product_images/Avatar_xpoy9j_Ap0sYWH.jpg"
                    ],
                    "price": "1000.00",
                    "rating": "4.4",
                    "total_reviews": 10,
                    "is_favorite": False
                },
                {
                    "id": 2,
                    "name": "Galuxy 10",
                    "images": [
                      "http://localhost:8081/media/base_product_images/Avatar_xpoy9j_Ap0sYWH.jpg"
                    ],
                    "price": "1000.00",
                    "rating": "4.2",
                    "total_reviews": 5,
                    "is_favorite": True
                }
            ],
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
    ordering_fields = ['price', 'rating']
    ordering = ['-rating']

    def get_queryset(self):
        category_id = self.kwargs.get('category_id')
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return BaseProduct.objects.none()

        return BaseProduct.objects.filter(category=category).distinct()


@extend_schema(
    description="Retrieve detailed information about a specific product by its ID. The response includes product details such as name, description, price, parameters, rating, total number of reviews, license file, images, and whether the product is in the user's favorites.",
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
                "price": "99.99",
                "parameters": [
                    {"parameter_name": "Color", "value": "Red"},
                    {"parameter_name": "Size", "value": "M"}
                ],
                "rating": "4.4",
                "total_reviews": 10,
                "license_file": "http://localhost:8081/media/license_files/sample.pdf",
                "images": [
                    {"image_url": "http://localhost:8081/media/base_product_images/sample1.jpg"},
                    {"image_url": "http://localhost:8081/media/base_product_images/sample2.jpg"}
                ],
                "is_favorite": True,
                "category_name": "Sample Category"
            },
            request_only=False,
            response_only=True,
        ),
    ]
)
class BaseProductDetailAPIView(generics.RetrieveAPIView):
    queryset = BaseProduct.objects.all()
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
