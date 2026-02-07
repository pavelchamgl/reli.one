from django_filters import rest_framework as filters

from .models import BaseProduct


class BaseProductFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="final_min_price", lookup_expr='gte', label='Minimum Price')
    max_price = filters.NumberFilter(field_name="final_min_price", lookup_expr='lte', label='Maximum Price')
    rating = filters.NumberFilter(field_name='rating', lookup_expr='gte')

    class Meta:
        model = BaseProduct
        fields = ['min_price', 'max_price', 'rating']
