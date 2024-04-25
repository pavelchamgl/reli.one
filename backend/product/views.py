from rest_framework import generics
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny

from .filters import CombinedFilter
from .models import ParameterName, BaseProduct, ParameterValue, Category
from .serializers import ParameterStorageSerializer, BaseProductSerializer, ValueStorageSerializer, CategorySerializer


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


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(parent=None)
    serializer_class = CategorySerializer

    @extend_schema(
        description="Список корневых категорий с возможностью рекурсивного отображения дочерних категорий.",
        responses={200: CategorySerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
