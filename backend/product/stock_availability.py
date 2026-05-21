"""
Public stock availability helpers for catalog API (Task 020).

Formula: available = max(0, quantity_in_stock - reserved_quantity) per WarehouseItem row,
aggregated per variant (sum across warehouses) and per BaseProduct (sum across variants).

``reserved_quantity`` is never exposed in API responses.
"""
from __future__ import annotations

from django.conf import settings
from django.db.models import F, OuterRef, QuerySet, Subquery, Sum
from django.db.models.functions import Coalesce, Greatest

from warehouses.models import WarehouseItem

STOCK_STATUS_IN_STOCK = "in_stock"
STOCK_STATUS_FEW_LEFT = "few_left"
STOCK_STATUS_OUT_OF_STOCK = "out_of_stock"

STOCK_FEW_LEFT_THRESHOLD: int = int(getattr(settings, "STOCK_FEW_LEFT_THRESHOLD", 5))


def compute_stock_status(available_quantity: int) -> str:
    if available_quantity <= 0:
        return STOCK_STATUS_OUT_OF_STOCK
    if available_quantity <= STOCK_FEW_LEFT_THRESHOLD:
        return STOCK_STATUS_FEW_LEFT
    return STOCK_STATUS_IN_STOCK


def compute_is_available(available_quantity: int) -> bool:
    return available_quantity > 0


def variant_available_quantity(variant) -> int:
    """Sum available units for a variant; missing WarehouseItem rows → 0."""
    annotated = getattr(variant, "available_quantity", None)
    if annotated is not None:
        return max(0, int(annotated))

    prefetched = getattr(variant, "_prefetched_objects_cache", {}).get("warehouseitem_set")
    if prefetched is not None:
        items = prefetched
    else:
        items = variant.warehouseitem_set.all()

    total = 0
    for wi in items:
        total += max(0, wi.quantity_in_stock - wi.reserved_quantity)
    return total


def annotate_variant_queryset_with_available(qs: QuerySet) -> QuerySet:
    return qs.annotate(
        available_quantity=Coalesce(
            Sum(
                Greatest(
                    F("warehouseitem__quantity_in_stock") - F("warehouseitem__reserved_quantity"),
                    0,
                )
            ),
            0,
        )
    )


def annotate_products_with_total_available(qs: QuerySet) -> QuerySet:
    """Add ``total_available_quantity`` (int) on BaseProduct queryset."""
    total_sq = (
        WarehouseItem.objects.filter(product_variant__product_id=OuterRef("pk"))
        .values("product_variant__product_id")
        .annotate(
            total=Sum(
                Greatest(
                    F("quantity_in_stock") - F("reserved_quantity"),
                    0,
                )
            )
        )
        .values("total")[:1]
    )
    return qs.annotate(
        total_available_quantity=Coalesce(Subquery(total_sq), 0),
    )
