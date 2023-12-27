from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from .filters import CombinedFilter
from django_filters import rest_framework as filters
from rest_framework import generics
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
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
