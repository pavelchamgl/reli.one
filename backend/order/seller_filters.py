import django_filters
from django.db.models import Q
from django.utils import timezone
from datetime import datetime

from .models import Order


class SellerOrderFilter(django_filters.FilterSet):
    """
    Query params:
      - search: строка (ищем по id / номеру заказа / треку)
      - status: статус по имени (Pending / Processing / ...)
      - courier_service: id courier
      - delivery_type: id delivery type
      - date_from / date_to: ДАТА СОЗДАНИЯ ЗАКАЗА в формате dd.mm.yyyy
    """

    search = django_filters.CharFilter(method="filter_search")
    status = django_filters.CharFilter(
        field_name="order_status__name",
        lookup_expr="iexact",
    )
    courier_service = django_filters.NumberFilter(
        field_name="courier_service_id",
    )
    delivery_type = django_filters.NumberFilter(
        field_name="delivery_type_id",
    )

    date_from = django_filters.CharFilter(method="filter_date_from")
    date_to = django_filters.CharFilter(method="filter_date_to")

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

    # SEARCH
    def filter_search(self, qs, name, value):
        value = (value or "").strip()
        if not value:
            return qs

        q = Q()

        if value.isdigit():
            q |= Q(id=int(value))

        q |= Q(deliveryparcel__tracking_number__icontains=value)
        q |= Q(order_number__icontains=value)

        return qs.filter(q).distinct()

    # DATE PARSING
    def _parse_date(self, value: str) -> datetime:
        """
        Accepts ONLY dd.mm.yyyy
        """
        try:
            return datetime.strptime(value, "%d.%m.%Y")
        except ValueError:
            raise django_filters.exceptions.ValidationError(
                "Invalid date format. Expected dd.mm.yyyy"
            )

    def filter_date_from(self, qs, name, value):
        if not value:
            return qs

        dt = self._parse_date(value)
        dt = timezone.make_aware(
            datetime.combine(dt.date(), datetime.min.time())
        )
        return qs.filter(order_date__gte=dt)

    def filter_date_to(self, qs, name, value):
        if not value:
            return qs

        dt = self._parse_date(value)
        dt = timezone.make_aware(
            datetime.combine(dt.date(), datetime.max.time())
        )
        return qs.filter(order_date__lte=dt)
