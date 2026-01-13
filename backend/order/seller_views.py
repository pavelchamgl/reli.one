from django.db.models import QuerySet
from rest_framework.generics import ListAPIView
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
)

from .models import Order
from .seller_serializers import SellerOrderListSerializer
from .seller_filters import SellerOrderFilter
from .seller_pagination import SellerOrdersPagination
from .permissions_seller import IsSeller, get_seller_profile_for_user
from .services.seller_orders import SellerOrderQueryService


@extend_schema(
    tags=["Seller Orders"],
    summary="Seller order list",
    description=(
        "Returns a paginated list of orders belonging to the authenticated seller.\n\n"
        "The list is strictly seller-scoped and contains only order items "
        "associated with the current seller.\n\n"
        "Each order includes:\n"
        "- seller-scoped financial totals (VAT-aware, per-item VAT supported)\n"
        "- order status\n"
        "- warehouse (branch) information\n"
        "- shipment flags (tracking / label)\n"
        "- available UI actions\n\n"
        "!️ Date filters accept **ONLY** the format **dd.mm.yyyy**, "
        "exactly as specified in the design.\n\n"
        "Example:\n"
        "- date_from=21.02.2025\n"
        "- date_to=28.02.2025"
    ),
    parameters=[

        # Pagination
        OpenApiParameter(
            name="page",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Page number (pagination)",
            examples=[
                OpenApiExample("First page", value=1),
                OpenApiExample("Second page", value=2),
            ],
        ),
        OpenApiParameter(
            name="page_size",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Number of orders per page",
            examples=[
                OpenApiExample("Default", value=20),
                OpenApiExample("Large page", value=50),
            ],
        ),

        # Ordering
        OpenApiParameter(
            name="ordering",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description=(
                "Sorting field. Prefix with '-' for descending order.\n\n"
                "Allowed values:\n"
                "- id\n"
                "- order_date\n"
                "- products_count\n"
                "- sales_incl_vat\n"
                "- total_incl_vat_plus_delivery\n"
            ),
            examples=[
                OpenApiExample("Newest first", value="-order_date"),
                OpenApiExample("Oldest first", value="order_date"),
                OpenApiExample("By total amount", value="-total_incl_vat_plus_delivery"),
            ],
        ),

        # Search
        OpenApiParameter(
            name="search",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description=(
                "Free text search.\n\n"
                "Searches by:\n"
                "- internal order ID\n"
                "- order number\n"
                "- delivery tracking number"
            ),
            examples=[
                OpenApiExample("By order number", value="ORD-2025-001"),
                OpenApiExample("By tracking number", value="DPD123456789"),
                OpenApiExample("By internal ID", value="176"),
            ],
        ),

        # Status filter (ENUM)
        OpenApiParameter(
            name="status",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by order status",
            enum=[
                "Pending",
                "Processing",
                "Shipped",
                "Cancelled",
                "Completed",
            ],
            examples=[
                OpenApiExample("Pending orders", value="Pending"),
                OpenApiExample("Shipped orders", value="Shipped"),
            ],
        ),

        # Delivery / Courier
        OpenApiParameter(
            name="delivery_type",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Filter by delivery type ID",
            examples=[
                OpenApiExample("Home delivery", value=2),
                OpenApiExample("Pickup point", value=1),
            ],
        ),
        OpenApiParameter(
            name="courier_service",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Filter by courier service ID",
            examples=[
                OpenApiExample("DPD", value=1),
                OpenApiExample("GLS", value=2),
            ],
        ),

        # Date filters
        OpenApiParameter(
            name="date_from",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description=(
                "Filter orders created from this date (inclusive).\n\n"
                "Required format:\n"
                "- dd.mm.yyyy"
            ),
            examples=[
                OpenApiExample("From date", value="21.02.2025"),
            ],
        ),
        OpenApiParameter(
            name="date_to",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description=(
                "Filter orders created until this date (inclusive).\n\n"
                "Required format:\n"
                "- dd.mm.yyyy"
            ),
            examples=[
                OpenApiExample("To date", value="28.02.2025"),
            ],
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=SellerOrderListSerializer,
            description="Paginated list of seller orders",
        ),
        401: OpenApiResponse(
            description="Authentication credentials were not provided",
        ),
        403: OpenApiResponse(
            description="Authenticated user is not a seller",
        ),
    },
)
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

        seller_profile_id = seller_profile.id if seller_profile else None
        qs = SellerOrderQueryService.annotate_for_list(
            qs,
            seller_profile_id=seller_profile_id,
        )

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = self.request.user
        ctx["can_cancel"] = bool(
            getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
        return ctx
