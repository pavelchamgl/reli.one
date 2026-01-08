import django_filters
from django.db.models import Q

from .models import Order


class SellerOrderFilter(django_filters.FilterSet):
    """
    Query params:
      - search: строка (ищем по id/номеру/треку)
      - status: статус по имени (Pending/Processing/...)
      - courier_service: id courier
      - delivery_type: id delivery type
      - date_from/date_to: по order_date
    """

    search = django_filters.CharFilter(method="filter_search")
    status = django_filters.CharFilter(field_name="order_status__name", lookup_expr="iexact")
    courier_service = django_filters.NumberFilter(field_name="courier_service_id")
    delivery_type = django_filters.NumberFilter(field_name="delivery_type_id")

    date_from = django_filters.DateTimeFilter(field_name="order_date", lookup_expr="gte")
    date_to = django_filters.DateTimeFilter(field_name="order_date", lookup_expr="lte")

    class Meta:
        model = Order
        fields = [
            "search",
            "status",
            "courier_service",
            "delivery_type",
            "date_from",
            "date_to",
        ]

    def filter_search(self, qs, name, value):
        value = (value or "").strip()
        if not value:
            return qs

        q = Q()

        if value.isdigit():
            q |= Q(id=int(value))

        q |= Q(deliveryparcel__tracking_number__icontains=value)

        return qs.filter(q).distinct()
