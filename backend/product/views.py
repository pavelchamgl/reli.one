from rest_framework import status
from rest_framework import generics
from django_filters import rest_framework as filters
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny

from .filters import CombinedFilter
from .models import (
    ParameterName,
    BaseProduct,
    ParameterValue,
    Category
)
from .serializers import (
    ParameterStorageSerializer,
    BaseProductSerializer,
    ValueStorageSerializer,
    CategorySerializer
)


class ParameterStorageListCreateView(generics.ListAPIView):
    queryset = ParameterName.objects.all()
    serializer_class = ParameterStorageSerializer


class BaseProductListCreateView(generics.ListAPIView):
    queryset = BaseProduct.objects.all()
    serializer_class = BaseProductSerializer


class ValueStorageListCreateView(generics.ListAPIView):
    queryset = ParameterValue.objects.all()
    serializer_class = ValueStorageSerializer



@permission_classes([AllowAny])
class BaseProductListView(generics.ListAPIView):
    queryset = BaseProduct.objects.all()
    serializer_class = BaseProductSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = CombinedFilter


class BaseProductRetrieveView(generics.RetrieveAPIView):
    queryset = BaseProduct.objects.all()
    serializer_class = BaseProductSerializer


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
