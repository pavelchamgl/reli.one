import django_filters
from .models import ParameterName, ParameterValue, BaseProduct
from django_filters import rest_framework as filters
class ParameterNameFilter(django_filters.FilterSet):
    class Meta:
        model = ParameterName
        fields = {
            'name': ['exact', 'icontains'],
        }

class ParameterValueFilter(django_filters.FilterSet):
    class Meta:
        model = ParameterValue
        fields = {
            'parameter__name': ['exact', 'icontains'],
            'value': ['exact', 'icontains'],
        }

class BaseProductFilter(django_filters.FilterSet):
    class Meta:
        model = BaseProduct
        fields = {
            'name': ['exact', 'icontains'],
            'product_description': ['exact', 'icontains'],  # Corrected field name
            'parameters__parameter__name': ['exact', 'icontains'],
            'parameters__value': ['exact', 'icontains'],
            'price': ['exact', 'lt', 'lte', 'gt', 'gte'],
        }


class CombinedFilter(filters.FilterSet):
    parameter_name = ParameterNameFilter()
    parameter_value = ParameterValueFilter()
    base_product = BaseProductFilter()

    class Meta:
        model = BaseProduct
        fields = {
            'name': ['exact', 'icontains'],
            'product_description': ['exact', 'icontains'],
            'parameters__parameter__name': ['exact', 'icontains'],
            'parameters__value': ['exact', 'icontains'],
            'price': ['exact', 'lt', 'lte', 'gt', 'gte'],
        }