import csv
import io
from typing import Iterable

from django.http import HttpResponse
from django.utils import timezone

from ..models import Order
from .seller_orders import SellerOrderQueryService


class SellerOrderExportService:
    """
    CSV export for seller orders.

    IMPORTANT:
    - Always uses seller-scoped queryset via SellerOrderQueryService.base_queryset_for_user()
    - Supports single order export and bulk export.
    """

    CSV_HEADERS = [
        "order_id",
        "order_number",
        "order_date",
        "status",
        "products_count",
        "purchase_excl_vat",
        "sales_incl_vat",
        "delivery_cost",
        "total_incl_vat_plus_delivery",
        "currency",
        "branch_id",
        "branch_name",
        "dispatch_before",
        "has_tracking",
        "has_label",
        "delivery_type",
        "courier_service",
    ]

    @classmethod
    def export_single_order_csv(cls, *, order_id: int, user) -> HttpResponse:
        qs = cls._seller_orders_qs(user=user).filter(id=order_id)
        order = qs.first()
        if not order:
            # let views raise 404 if needed; here return empty but consistent
            raise Order.DoesNotExist()

        return cls._build_csv_response(
            orders=[order],
            filename=f"order_{order.order_number or order.id}.csv",
        )

    @classmethod
    def export_bulk_orders_csv(cls, *, order_ids: list[int], user) -> HttpResponse:
        qs = cls._seller_orders_qs(user=user).filter(id__in=order_ids).order_by("-order_date", "-id")
        orders = list(qs)

        # If frontend sends ids that aren't seller's — they will be silently excluded.
        # If you want strict behavior, compare len(orders) vs len(set(order_ids)) and raise 404/400.
        return cls._build_csv_response(
            orders=orders,
            filename="orders_export.csv",
        )

    # ----------------------------
    # Internals
    # ----------------------------

    @classmethod
    def _seller_orders_qs(cls, *, user):
        """
        Builds the same annotated queryset as list endpoint (so totals, counts, flags match UI).
        """
        base = SellerOrderQueryService.base_queryset_for_user(user=user)

        # Try to reuse the same seller_profile_id logic (like list view)
        seller_profile = getattr(user, "seller_profile", None)
        seller_profile_id = getattr(seller_profile, "id", None)

        qs = SellerOrderQueryService.annotate_for_list(base, seller_profile_id=seller_profile_id)

        # Keep joins minimal but useful
        return qs.select_related(
            "order_status",
            "delivery_type",
            "courier_service",
        )

    @classmethod
    def _build_csv_response(cls, *, orders: Iterable[Order], filename: str) -> HttpResponse:
        # Excel-friendly UTF-8 with BOM
        output = io.StringIO(newline="")
        writer = csv.writer(output)
        writer.writerow(cls.CSV_HEADERS)

        for o in orders:
            writer.writerow(cls._row(o))

        content = output.getvalue().encode("utf-8-sig")
        resp = HttpResponse(content, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp

    @classmethod
    def _row(cls, o: Order) -> list:
        order_date = getattr(o, "order_date", None)
        if order_date:
            order_date = timezone.localtime(order_date).isoformat()

        dispatch_before = getattr(o, "dispatch_before", None)
        if dispatch_before:
            dispatch_before = dispatch_before.isoformat()

        return [
            o.id,
            getattr(o, "order_number", None),
            order_date,
            getattr(getattr(o, "order_status", None), "name", None),
            getattr(o, "products_count", None),
            getattr(o, "purchase_excl_vat", None),
            getattr(o, "sales_incl_vat", None),
            getattr(o, "delivery_cost", None),
            getattr(o, "total_incl_vat_plus_delivery", None),
            getattr(o, "currency", None),
            getattr(o, "branch_id", None),
            getattr(o, "branch_name", None),
            dispatch_before,
            getattr(o, "has_tracking", None),
            getattr(o, "has_label", None),
            getattr(getattr(o, "delivery_type", None), "name", None),
            getattr(getattr(o, "courier_service", None), "name", None),
        ]
