from django_filters import rest_framework as filters

from .models import BaseProduct, Category


class BaseProductFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = filters.NumberFilter(field_name="price", lookup_expr='lte')

    class Meta:
        model = BaseProduct
        fields = ['min_price', 'max_price']
