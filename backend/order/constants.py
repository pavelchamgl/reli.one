"""
Canonical status constants for the order domain.

Three groups:
  - OrderStatusName    – FK lookup values for ``order_orderstatus`` table
  - DeliveryStatusName – FK lookup values for ``order_deliverystatus`` table
  - OrderProductStatus – TextChoices for ``OrderProduct.status`` field

``OrderStatusName`` is re-exported from ``order.order_status_names`` so both
import paths remain valid. Do not duplicate or override the string values here
without a matching data migration in ``order_orderstatus`` / ``order_deliverystatus``.

``OrderProductStatus`` is the same object as ``order.models.ProductStatus``
(TextChoices). Re-exported here so callers can import everything from one place.

Usage:
    from order.constants import OrderStatusName, DeliveryStatusName, OrderProductStatus
"""
from __future__ import annotations

from order.order_status_names import OrderStatusName  # noqa: F401

# ---------------------------------------------------------------------------
# Delivery status
# ---------------------------------------------------------------------------

class DeliveryStatusName:
    """Canonical values for DeliveryStatus.name (lookup table)."""

    PENDING = "Pending"
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"
    FAILED = "Failed"


# ---------------------------------------------------------------------------
# Order-product (item) status — re-export of order.models.ProductStatus
# ---------------------------------------------------------------------------
# Imported lazily via a module-level assignment to avoid requiring Django
# app registry during import of this module in non-Django contexts (e.g. tests
# that import constants before setup).  In practice the registry is always
# ready when this module is used at runtime.

from order.models import ProductStatus as OrderProductStatus  # noqa: F401, E402

__all__ = [
    "OrderStatusName",
    "DeliveryStatusName",
    "OrderProductStatus",
]
