from django.db.models import QuerySet
from rest_framework.generics import ListAPIView
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Order
from .seller_serializers import SellerOrderListSerializer
from .seller_filters import SellerOrderFilter
from .seller_pagination import SellerOrdersPagination
from .permissions_seller import IsSeller, get_seller_profile_for_user
from .services.seller_orders import SellerOrderQueryService


class SellerOrderListView(ListAPIView):
    permission_classes = [IsSeller]
    serializer_class = SellerOrderListSerializer
    pagination_class = SellerOrdersPagination

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = SellerOrderFilter

    ordering = ["-order_date"]
    ordering_fields = [
        "id",
        "order_date",
        "group_subtotal",
        "delivery_cost",
        "products_count",
        "sales_incl_vat",
        "total_incl_vat_plus_delivery",
    ]

    def get_queryset(self) -> QuerySet[Order]:
        user = self.request.user
        seller_profile = get_seller_profile_for_user(user)

        qs = SellerOrderQueryService.base_queryset_for_user(user)

        qs = qs.select_related(
            "order_status",
            "courier_service",
            "delivery_type",
            "delivery_address",
        )

        # Важно: аннотации считаем seller-scoped (на случай, если когда-то order станет multi-seller)
        seller_profile_id = seller_profile.id if seller_profile else None
        qs = SellerOrderQueryService.annotate_for_list(qs, seller_profile_id=seller_profile_id)

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = self.request.user
        ctx["can_cancel"] = bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))
        return ctx
