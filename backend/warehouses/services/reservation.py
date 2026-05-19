"""
StockReservationService — lifecycle management for stock reservations.

Task 013 Phase 2.  Not integrated into payment/checkout runtime yet;
integration happens in Phase 3 (session builders) and Phase 4 (webhook handlers).
Use ``STOCK_RESERVATION_ENABLED`` setting as the runtime kill-switch (Phase 3+).

Public API
----------
StockReservationService.create_reservation(
    session_key, payment_system, groups, variant_map
) -> StockReservation

StockReservationService.confirm_reservation(session_key) -> None

StockReservationService.release_reservation(
    session_key, *, final_status="released"
) -> None

All three methods are idempotent — repeated calls for the same session_key are safe.

Concurrency
-----------
WarehouseItem rows are locked with ``select_for_update()`` in a deterministic
order (warehouse_id ASC, product_variant_id ASC) to prevent deadlocks when
multiple sessions compete for overlapping SKUs.

Note on decrease_stock()
------------------------
``confirm_reservation`` inlines the stock-decrement logic (equivalent to
``decrease_stock``) rather than calling that function directly.  This is
intentional: calling decrease_stock() inside an outer ``transaction.atomic()``
creates a savepoint; if that savepoint raises, the outer transaction is poisoned
and cannot continue.  By inlining, all mutations (quantity_in_stock,
reserved_quantity, reservation.status) happen in a single atomic block with
clean rollback semantics.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import timedelta
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from warehouses.exceptions import InsufficientStockError
from warehouses.models import StockReservation, StockReservationItem, WarehouseItem

if TYPE_CHECKING:  # pragma: no cover
    from product.models import ProductVariant

logger = logging.getLogger(__name__)

_TTL_MINUTES: int = getattr(settings, "STOCK_RESERVATION_TTL_MINUTES", 35)

# Statuses from which release is allowed (only PENDING can be released)
_RELEASABLE = frozenset({StockReservation.Status.PENDING})


class StockReservationService:
    """
    Manages the full lifecycle of a stock reservation:
      create → PENDING → (confirm → CONFIRMED) | (release → RELEASED | EXPIRED)
    """

    # ------------------------------------------------------------------
    # create_reservation
    # ------------------------------------------------------------------

    @classmethod
    def create_reservation(
        cls,
        *,
        session_key: str,
        payment_system: str,
        groups: list,
        variant_map: dict[str, "ProductVariant"],
    ) -> StockReservation:
        """
        Atomically reserve stock for a payment session.

        Parameters
        ----------
        session_key:    Internal UUID matching StripeMetadata / PayPalMetadata.
        payment_system: "stripe" or "paypal".
        groups:         List of product groups from invoice_data.  Each group has
                        a ``"products"`` list of ``{"sku": str, "quantity": int}``.
        variant_map:    Dict mapping sku → ProductVariant (pre-loaded by session builder).

        Returns
        -------
        StockReservation (PENDING).  Returns existing reservation if one already
        exists for this session_key (idempotent).

        Raises
        ------
        InsufficientStockError  if any SKU lacks sufficient available stock.
            ``.detail`` contains {"sku", "requested", "available"}.
        """
        # -- Idempotency check (outside transaction — fast path) -----------
        existing = StockReservation.objects.filter(session_key=session_key).first()
        if existing:
            logger.info(
                "create_reservation: session_key=%s already exists (status=%s), returning",
                session_key,
                existing.status,
            )
            return existing

        # -- Build consolidated sku → quantity map -------------------------
        sku_qty: dict[str, int] = {}
        for group in groups:
            for p in group.get("products", []):
                sku = str(p.get("sku", ""))
                qty = int(p.get("quantity", 0))
                if sku and qty > 0 and sku in variant_map:
                    sku_qty[sku] = sku_qty.get(sku, 0) + qty

        variant_id_to_sku: dict[int, str] = {
            variant_map[sku].id: sku for sku in sku_qty
        }

        with transaction.atomic():
            # -- Lock WarehouseItems in deterministic order ----------------
            # Locks ALL items for the relevant variants to prevent deadlocks
            # when concurrent sessions share SKUs.
            all_wh_items = list(
                WarehouseItem.objects
                .select_for_update()
                .filter(product_variant_id__in=list(variant_id_to_sku.keys()))
                .order_by("warehouse_id", "product_variant_id")
            )

            # Group by variant_id; order within each group is warehouse_id ASC
            wh_items_by_variant: dict[int, list[WarehouseItem]] = defaultdict(list)
            for wi in all_wh_items:
                wh_items_by_variant[wi.product_variant_id].append(wi)

            # -- Check availability and pick WarehouseItem per SKU ---------
            reservation_candidates: list[tuple[WarehouseItem, int]] = []

            for sku, qty in sku_qty.items():
                variant = variant_map[sku]
                candidates = wh_items_by_variant.get(variant.id, [])

                if not candidates:
                    # Soft policy: no WarehouseItem → skip (digital / dropship SKU)
                    logger.warning(
                        "create_reservation: no WarehouseItem for SKU %s — skipping stock check",
                        sku,
                    )
                    continue

                # Pick first warehouse item with sufficient availability
                chosen: WarehouseItem | None = None
                for wi in candidates:
                    if wi.available_quantity >= qty:
                        chosen = wi
                        break

                if chosen is None:
                    best_available = max(wi.available_quantity for wi in candidates)
                    logger.warning(
                        "create_reservation: insufficient stock for SKU %s: "
                        "requested=%s available=%s session_key=%s",
                        sku,
                        qty,
                        best_available,
                        session_key,
                    )
                    raise InsufficientStockError(
                        detail={
                            "sku": sku,
                            "requested": qty,
                            "available": best_available,
                        }
                    )

                reservation_candidates.append((chosen, qty))

            # -- Create reservation ----------------------------------------
            reservation = StockReservation.objects.create(
                session_key=session_key,
                payment_system=payment_system,
                status=StockReservation.Status.PENDING,
                expires_at=timezone.now() + timedelta(minutes=_TTL_MINUTES),
            )

            for wi, qty in reservation_candidates:
                StockReservationItem.objects.create(
                    reservation=reservation,
                    warehouse_item=wi,
                    quantity=qty,
                )
                wi.reserved_quantity += qty
                wi.save(update_fields=["reserved_quantity"])

            logger.info(
                "create_reservation: created reservation %s for session_key=%s "
                "(%d item(s), expires_at=%s)",
                reservation.pk,
                session_key,
                len(reservation_candidates),
                reservation.expires_at,
            )
            return reservation

    # ------------------------------------------------------------------
    # confirm_reservation
    # ------------------------------------------------------------------

    @classmethod
    def confirm_reservation(cls, session_key: str) -> None:
        """
        Confirm a pending reservation after successful payment.

        Performs the equivalent of ``decrease_stock()`` for each reserved item:
        decrements ``quantity_in_stock`` and ``reserved_quantity`` atomically.

        Idempotent: noop if the reservation does not exist or is not PENDING.

        Raises
        ------
        InsufficientStockError  if quantity_in_stock fell below reserved quantity
            between reservation creation and confirmation (should not happen under
            normal operation, but guards against direct DB edits or bugs).
        """
        with transaction.atomic():
            try:
                reservation = (
                    StockReservation.objects
                    .select_for_update()
                    .get(session_key=session_key)
                )
            except StockReservation.DoesNotExist:
                logger.warning(
                    "confirm_reservation: no reservation for session_key=%s — noop",
                    session_key,
                )
                return

            if reservation.status != StockReservation.Status.PENDING:
                logger.info(
                    "confirm_reservation: session_key=%s already in status=%s — noop",
                    session_key,
                    reservation.status,
                )
                return

            # Load items and lock WarehouseItems in deterministic order
            items = list(
                reservation.items.select_related(
                    "warehouse_item__warehouse",
                    "warehouse_item__product_variant",
                ).order_by(
                    "warehouse_item__warehouse_id",
                    "warehouse_item__product_variant_id",
                )
            )

            wi_ids = [item.warehouse_item_id for item in items]
            locked_wi: dict[int, WarehouseItem] = {
                wi.id: wi
                for wi in WarehouseItem.objects.select_for_update()
                .filter(id__in=wi_ids)
                .order_by("warehouse_id", "product_variant_id")
            }

            for item in items:
                wi = locked_wi[item.warehouse_item_id]
                if wi.quantity_in_stock < item.quantity:
                    raise InsufficientStockError(
                        detail={
                            "sku": wi.product_variant.sku,
                            "requested": item.quantity,
                            "available": wi.quantity_in_stock,
                        }
                    )
                wi.quantity_in_stock -= item.quantity
                wi.reserved_quantity = max(0, wi.reserved_quantity - item.quantity)
                wi.save(update_fields=["quantity_in_stock", "reserved_quantity"])

            now = timezone.now()
            reservation.status = StockReservation.Status.CONFIRMED
            reservation.confirmed_at = now
            reservation.save(update_fields=["status", "confirmed_at"])

            logger.info(
                "confirm_reservation: session_key=%s confirmed (%d item(s))",
                session_key,
                len(items),
            )

    # ------------------------------------------------------------------
    # release_reservation
    # ------------------------------------------------------------------

    @classmethod
    def release_reservation(
        cls,
        session_key: str,
        *,
        final_status: str = StockReservation.Status.RELEASED,
    ) -> None:
        """
        Release a pending reservation, restoring reserved_quantity on each item.

        Called on:
          - payment failure / cancellation (final_status=RELEASED)
          - TTL expiration via cleanup job (final_status=EXPIRED)

        Idempotent: noop if reservation does not exist or is not in a releasable
        state (i.e. already CONFIRMED, RELEASED, or EXPIRED).
        """
        with transaction.atomic():
            try:
                reservation = (
                    StockReservation.objects
                    .select_for_update()
                    .get(session_key=session_key)
                )
            except StockReservation.DoesNotExist:
                logger.warning(
                    "release_reservation: no reservation for session_key=%s — noop",
                    session_key,
                )
                return

            if reservation.status not in _RELEASABLE:
                logger.info(
                    "release_reservation: session_key=%s already in status=%s — noop",
                    session_key,
                    reservation.status,
                )
                return

            # Load items and lock WarehouseItems in deterministic order
            items = list(
                reservation.items.select_related("warehouse_item")
                .order_by(
                    "warehouse_item__warehouse_id",
                    "warehouse_item__product_variant_id",
                )
            )

            wi_ids = [item.warehouse_item_id for item in items]
            if wi_ids:
                locked_wi: dict[int, WarehouseItem] = {
                    wi.id: wi
                    for wi in WarehouseItem.objects.select_for_update()
                    .filter(id__in=wi_ids)
                    .order_by("warehouse_id", "product_variant_id")
                }
                for item in items:
                    wi = locked_wi[item.warehouse_item_id]
                    wi.reserved_quantity = max(0, wi.reserved_quantity - item.quantity)
                    wi.save(update_fields=["reserved_quantity"])

            now = timezone.now()
            reservation.status = final_status
            reservation.released_at = now
            reservation.save(update_fields=["status", "released_at"])

            logger.info(
                "release_reservation: session_key=%s → %s (%d item(s))",
                session_key,
                final_status,
                len(items),
            )
