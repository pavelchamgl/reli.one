import csv
from io import StringIO

from django.http import HttpResponse
from django.db.models import QuerySet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveAPIView
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
from .seller_serializers import (
    SellerOrderListSerializer,
    SellerOrderDetailSerializer,
    SellerBulkLabelsSerializer,
    SellerBulkExportSerializer,
)
from .seller_filters import SellerOrderFilter
from .seller_pagination import SellerOrdersPagination
from .permissions_seller import IsSeller, get_seller_profile_for_user
from .services.seller_orders import SellerOrderQueryService
from .services.seller_order_detail import SellerOrderDetailService
from .services.seller_order_labels import SellerOrderLabelsService
from .services.seller_order_actions import SellerOrderActionsService


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


@extend_schema(
    tags=["Seller Orders"],
    summary="Seller order detail",
    description=(
        "Returns seller-scoped order data for the order detail page.\n\n"
        "The response includes:\n"
        "- order summary (status, customer, delivery details, totals)\n"
        "- ordered items with product and variant details\n"
        "- shipment(s) with tracking, labels and grouped items\n"
        "- order timeline (events)\n"
        "- available seller actions\n\n"
        "All items, shipments and monetary values are filtered by the current seller."
    ),
    responses={
        200: OpenApiResponse(
            response=SellerOrderDetailSerializer,
            description="Seller order detail payload",
            examples=[
                OpenApiExample(
                    name="Order detail example",
                    summary="Typical seller order detail response",
                    value={
                        "summary": {
                            "id": 170,
                            "order_number": "191125140830-d9773a",
                            "order_date": "19.11.2025 14:08",
                            "status": "Processing",
                            "customer": {
                                "first_name": "Pavel",
                                "last_name": "Ivanov",
                                "email": "user666@example.com",
                                "phone": "+40712345678"
                            },
                            "delivery": {
                                "delivery_type": {"id": 1, "name": "PUDO"},
                                "courier_service": {"id": 2, "name": "Zásilkovna", "code": "zasilkovna"},
                                "pickup_point_id": "22991",
                                "delivery_address": {
                                    "full_name": "Pavel Ivanov",
                                    "email": "user666@example.com",
                                    "phone": "+40712345678",
                                    "street": "",
                                    "city": "",
                                    "zip_code": "",
                                    "country": "RO"
                                }
                            },
                            "branch": {"id": 1, "name": "Reli warehouse"},
                            "totals": {
                                "purchase_excl_vat": "240.33",
                                "sales_incl_vat": "290.80",
                                "total_incl_vat_plus_delivery": "295.89",
                                "delivery_cost": "5.09",
                                "currency": "EUR"
                            }
                        },
                        "items": [
                            {
                                "id": 175,
                                "sku": "240819709",
                                "name": "Wooden Puzzle Unidragon – Lovely Tiger",
                                "variant_name": "Size 30×28cm",
                                "quantity": 4,
                                "unit_price_gross": "72.70",
                                "vat_rate": "21.00",
                                "line_total_gross": "290.80",
                                "line_total_net": "240.33",
                                "warehouse": {"id": 1, "name": "Reli warehouse"}
                            }
                        ],
                        "shipments": [
                            {
                                "id": 149,
                                "carrier": {"id": 2, "name": "Zásilkovna"},
                                "tracking_number": "4754431376",
                                "has_tracking": True,
                                "has_label": True,
                                "label_url": "/media/zasilkovna_labels/label_4754431376.pdf",
                                "created_at": "19.11.2025 14:08",
                                "warehouse": {"id": 1, "name": "Reli warehouse"},
                                "items": [
                                    {
                                        "order_product_id": 175,
                                        "sku": "240819709",
                                        "name": "Wooden Puzzle Unidragon – Lovely Tiger Size 30×28cm",
                                        "quantity": 4
                                    }
                                ]
                            }
                        ],
                        "timeline": [
                            {"type": "order_created", "label": "Order created", "created_at": "14.01.2026 10:49", "meta": {}},
                            {"type": "payment_confirmed", "label": "Payment confirmed", "created_at": "14.01.2026 10:49", "meta": {}},
                            {"type": "order_acknowledged", "label": "Order acknowledged", "created_at": "14.01.2026 10:49", "meta": {}},
                            {"type": "shipment_created", "label": "Shipment created", "created_at": "14.01.2026 10:49", "meta": {}},
                            {"type": "tracking_uploaded", "label": "Tracking uploaded", "created_at": "14.01.2026 10:49", "meta": {}},
                            {"type": "delivered", "label": "Delivered", "created_at": "14.01.2026 10:50", "meta": {}}
                        ],
                        "actions": {
                            "can_confirm": False,
                            "can_mark_shipped": True,
                            "can_download_label": True,
                            "can_cancel": False,
                            "next_action": "Mark as shipped"
                        }
                    },
                )
            ],
        ),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="User is not a seller"),
        404: OpenApiResponse(description="Order not found (or not accessible to this seller)"),
    },
)
class SellerOrderDetailView(RetrieveAPIView):
    permission_classes = [IsSeller]
    serializer_class = SellerOrderDetailSerializer

    def get(self, request, *args, **kwargs):
        order_id = int(kwargs["pk"])
        order, seller_profile_id = SellerOrderDetailService.get_order_for_seller(
            order_id=order_id,
            user=request.user,
        )
        payload = SellerOrderDetailService.build_payload(
            order=order,
            seller_profile_id=seller_profile_id,
            user=request.user,
        )
        serializer = self.get_serializer(payload)
        return Response(serializer.data)


@extend_schema(
    tags=["Seller Orders"],
    summary="Confirm order",
    description=(
        "Seller action.\n\n"
        "Transition: **Pending → Processing**\n\n"
        "Side effects:\n"
        "- Creates OrderEvent.ORDER_ACKNOWLEDGED\n"
        "- Updates available actions"
    ),
    request=None,
    responses={
        200: OpenApiResponse(response=SellerOrderDetailSerializer, description="Updated seller order detail payload"),
        400: OpenApiResponse(description="Invalid status transition"),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="Order not found"),
    },
)
class SellerOrderConfirmView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk: int):
        payload = SellerOrderActionsService.confirm_order(
            order_id=int(pk),
            user=request.user,
        )
        serializer = SellerOrderDetailSerializer(payload, context={"request": request})
        return Response(serializer.data, status=200)


@extend_schema(
    tags=["Seller Orders"],
    summary="Mark order as shipped",
    description=(
        "Seller action.\n\n"
        "Transition: **Processing → Shipped**\n\n"
        "Side effects:\n"
        "- Creates OrderEvent.SHIPMENT_CREATED\n"
        "- Creates OrderEvent.TRACKING_UPLOADED if tracking number exists\n"
        "- Updates available actions"
    ),
    request=None,
    responses={
        200: OpenApiResponse(response=SellerOrderDetailSerializer, description="Updated seller order detail payload"),
        400: OpenApiResponse(description="Invalid status transition"),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="Order not found"),
    },
)
class SellerOrderMarkShippedView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk: int):
        payload = SellerOrderActionsService.mark_as_shipped(
            order_id=int(pk),
            user=request.user,
        )
        serializer = SellerOrderDetailSerializer(payload, context={"request": request})
        return Response(serializer.data, status=200)


@extend_schema(
    tags=["Seller Orders"],
    summary="Cancel order",
    description=(
        "Admin-only action.\n\n"
        "Transition: any → Cancelled\n\n"
        "Side effects:\n"
        "- Updates order status to Cancelled\n"
        "- Cancels all order products\n"
        "- Creates OrderEvent.CANCELLED"
    ),
    request=None,
    responses={
        200: OpenApiResponse(response=SellerOrderDetailSerializer, description="Updated order detail payload"),
        400: OpenApiResponse(description="Invalid status transition"),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Only admin can cancel orders"),
        404: OpenApiResponse(description="Order not found"),
    },
)
class SellerOrderCancelView(APIView):
    def post(self, request, pk: int):
        payload = SellerOrderActionsService.cancel_order(
            order_id=int(pk),
            user=request.user,
        )
        return Response(payload, status=200)


@extend_schema(
    tags=["Seller Orders"],
    summary="Download shipment label",
    description="Downloads PDF shipping label for a specific shipment.",
    parameters=[
        OpenApiParameter(
            name="shipment_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="Shipment ID",
        ),
    ],
    responses={
        200: OpenApiResponse(description="PDF shipping label", response=OpenApiTypes.BINARY),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="Shipment not found"),
    },
)
class SellerShipmentLabelView(APIView):
    permission_classes = [IsSeller]

    def get(self, request, shipment_id: int):
        return SellerOrderLabelsService.get_shipment_label(
            shipment_id=shipment_id,
            user=request.user,
        )


@extend_schema(
    tags=["Seller Orders"],
    summary="Download shipment label",
    description="Downloads PDF shipping label for a specific shipment.",
    responses={
        200: OpenApiResponse(description="PDF shipping label", response=OpenApiTypes.BINARY),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="Shipment not found"),
    },
)
class SellerOrderLabelsView(APIView):
    permission_classes = [IsSeller]

    def get(self, request, order_id: int):
        return SellerOrderLabelsService.get_order_labels_zip(
            order_id=order_id,
            user=request.user,
        )


@extend_schema(
    tags=["Seller Orders"],
    summary="Download labels for multiple orders",
    description=(
        "Downloads ZIP archive containing shipment labels for multiple orders. "
        "Each order is placed into a separate folder named by order number."
    ),
    request=SellerBulkLabelsSerializer,
    responses={
        200: OpenApiResponse(description="ZIP archive with labels grouped by order", response=OpenApiTypes.BINARY),
        400: OpenApiResponse(description="Invalid input"),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="One or more orders not found"),
    },
)
class SellerBulkOrderLabelsView(APIView):
    permission_classes = [IsSeller]

    def post(self, request):
        serializer = SellerBulkLabelsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return SellerOrderLabelsService.get_bulk_orders_labels_zip(
            order_ids=serializer.validated_data["order_ids"],
            user=request.user,
        )


@extend_schema(
    tags=["Seller Orders"],
    summary="Export single order to CSV",
    description=(
        "Each order item is exported as a separate row.\n\n"
        "Order-level fields are duplicated for every item row.\n\n"
        "This is used by the **Export Invoice** / **Export** action in UI.\n"
        "Response is an attachment with content-type text/csv."
    ),
    parameters=[
        OpenApiParameter(
            name="order_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="Order ID",
        )
    ],
    responses={
        200: OpenApiResponse(description="CSV file", response=OpenApiTypes.BINARY),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="Order not found (or not accessible to this seller)"),
    },
)
class SellerOrderExportCSVView(APIView):
    permission_classes = [IsSeller]

    def get(self, request, order_id: int):
        order, seller_profile_id = SellerOrderDetailService.get_order_for_seller(
            order_id=int(order_id),
            user=request.user,
        )
        payload = SellerOrderDetailService.build_payload(
            order=order,
            seller_profile_id=seller_profile_id,
            user=request.user,
        )

        # Minimal & safe: export order items as rows + summary columns duplicated per row.
        summary = payload.get("summary") or {}
        items = payload.get("items") or []

        buf = StringIO()
        writer = csv.writer(buf)

        writer.writerow([
            "order_id",
            "order_number",
            "order_date",
            "status",
            "customer_email",
            "delivery_country",
            "currency",
            "purchase_excl_vat",
            "sales_incl_vat",
            "total_incl_vat_plus_delivery",
            "item_id",
            "sku",
            "name",
            "variant_name",
            "quantity",
            "unit_price_gross",
            "vat_rate",
            "line_total_gross",
            "line_total_net",
        ])

        totals = (summary.get("totals") or {})
        delivery = (summary.get("delivery") or {})
        delivery_address = (delivery.get("delivery_address") or {})

        for it in items:
            writer.writerow([
                summary.get("id"),
                summary.get("order_number"),
                summary.get("order_date"),
                summary.get("status"),
                (summary.get("customer") or {}).get("email"),
                delivery_address.get("country"),
                totals.get("currency"),
                totals.get("purchase_excl_vat"),
                totals.get("sales_incl_vat"),
                totals.get("total_incl_vat_plus_delivery"),
                it.get("id"),
                it.get("sku"),
                it.get("name"),
                it.get("variant_name"),
                it.get("quantity"),
                it.get("unit_price_gross"),
                it.get("vat_rate"),
                it.get("line_total_gross"),
                it.get("line_total_net"),
            ])

        filename = f"order_{summary.get('order_number') or summary.get('id')}.csv"
        resp = HttpResponse(buf.getvalue(), content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp


@extend_schema(
    tags=["Seller Orders"],
    summary="Export multiple orders to CSV",
    description=(
        "Exports multiple seller-scoped orders to a single CSV file.\n\n"
        "Used by the bulk **Export** action in UI list page.\n"
        "Input: order_ids[]"
    ),
    request=SellerBulkExportSerializer,
    responses={
        200: OpenApiResponse(description="CSV file", response=OpenApiTypes.BINARY),
        400: OpenApiResponse(description="Invalid input"),
        401: OpenApiResponse(description="Authentication credentials were not provided"),
        403: OpenApiResponse(description="Forbidden"),
        404: OpenApiResponse(description="One or more orders not found (or not accessible)"),
    },
)
class SellerBulkOrdersExportCSVView(APIView):
    permission_classes = [IsSeller]

    def post(self, request):
        serializer = SellerBulkExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order_ids = serializer.validated_data["order_ids"]

        buf = StringIO()
        writer = csv.writer(buf)

        writer.writerow([
            "order_id",
            "order_number",
            "order_date",
            "status",
            "customer_email",
            "delivery_country",
            "currency",
            "purchase_excl_vat",
            "sales_incl_vat",
            "total_incl_vat_plus_delivery",
            "item_id",
            "sku",
            "name",
            "variant_name",
            "quantity",
            "unit_price_gross",
            "vat_rate",
            "line_total_gross",
            "line_total_net",
        ])

        for oid in order_ids:
            order, seller_profile_id = SellerOrderDetailService.get_order_for_seller(
                order_id=int(oid),
                user=request.user,
            )
            payload = SellerOrderDetailService.build_payload(
                order=order,
                seller_profile_id=seller_profile_id,
                user=request.user,
            )

            summary = payload.get("summary") or {}
            items = payload.get("items") or []
            totals = (summary.get("totals") or {})
            delivery = (summary.get("delivery") or {})
            delivery_address = (delivery.get("delivery_address") or {})

            for it in items:
                writer.writerow([
                    summary.get("id"),
                    summary.get("order_number"),
                    summary.get("order_date"),
                    summary.get("status"),
                    (summary.get("customer") or {}).get("email"),
                    delivery_address.get("country"),
                    totals.get("currency"),
                    totals.get("purchase_excl_vat"),
                    totals.get("sales_incl_vat"),
                    totals.get("total_incl_vat_plus_delivery"),
                    it.get("id"),
                    it.get("sku"),
                    it.get("name"),
                    it.get("variant_name"),
                    it.get("quantity"),
                    it.get("unit_price_gross"),
                    it.get("vat_rate"),
                    it.get("line_total_gross"),
                    it.get("line_total_net"),
                ])

        resp = HttpResponse(buf.getvalue(), content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="orders_export.csv"'
        return resp
