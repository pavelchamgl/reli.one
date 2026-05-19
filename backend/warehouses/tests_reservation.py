"""
Regression tests for StockReservationService (Task 013 Phase 2).

Covers:
  - create_reservation: happy path, idempotency, insufficient stock, missing WarehouseItem
  - confirm_reservation: stock decrement, status update, idempotency, unknown session
  - release_reservation: reserved_quantity restore, status update, idempotency, EXPIRED status
  - Concurrency (PostgreSQL only):
      - two sessions competing for the last item → exactly one succeeds
      - duplicate confirm calls → stock decremented only once

See docs/tasks/013-stock-reservation/task.md for design details.
"""
from __future__ import annotations

import threading
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import connection
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from unittest import skipUnless

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.exceptions import InsufficientStockError
from warehouses.models import StockReservation, StockReservationItem, Warehouse, WarehouseItem
from warehouses.services.reservation import StockReservationService


def _is_postgresql():
    return "postgresql" in settings.DATABASES["default"]["ENGINE"]


# ---------------------------------------------------------------------------
# Shared fixture mixin
# ---------------------------------------------------------------------------

class ReservationTestMixin:
    """
    Creates one seller, warehouse, product variant and warehouse item.
    Each test may adjust quantity_in_stock / reserved_quantity as needed.
    """

    @classmethod
    def setUpTestData(cls):
        cls.seller_user = CustomUser.objects.create_user(
            email=f"res-seller-{cls.__name__}@example.com",
            password="x",
            first_name="S",
            last_name="T",
            role=UserRole.SELLER,
            phone_number="+420730000020",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.warehouse = Warehouse.objects.create(
            name=f"WH-Res-{cls.__name__}",
            street="Res 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.base_product = BaseProduct.objects.create(
            name=f"Res Product {cls.__name__}",
            product_description="D",
            seller=cls.seller_profile,
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.base_product,
            name="V",
            text="opt",
            price=Decimal("10.00"),
            weight_grams=100,
        )
        cls.variant_map = {cls.variant.sku: cls.variant}

    def _make_wh_item(self, in_stock: int, reserved: int = 0) -> WarehouseItem:
        """Create (or replace) a WarehouseItem with given quantities."""
        WarehouseItem.objects.filter(
            warehouse=self.warehouse, product_variant=self.variant
        ).delete()
        return WarehouseItem.objects.create(
            warehouse=self.warehouse,
            product_variant=self.variant,
            quantity_in_stock=in_stock,
            reserved_quantity=reserved,
        )

    def _groups(self, qty: int = 1) -> list:
        return [{"products": [{"sku": self.variant.sku, "quantity": qty}]}]

    def _session_key(self) -> str:
        return f"sk-{uuid.uuid4().hex}"

    def _create_pending(self, qty: int = 1, in_stock: int = 10) -> tuple[StockReservation, str]:
        self._make_wh_item(in_stock)
        sk = self._session_key()
        reservation = StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(qty),
            variant_map=self.variant_map,
        )
        return reservation, sk


# ---------------------------------------------------------------------------
# create_reservation
# ---------------------------------------------------------------------------

class StockReservationCreateTests(ReservationTestMixin, TestCase):

    def test_create_returns_pending_reservation(self):
        reservation, _ = self._create_pending()
        self.assertEqual(reservation.status, StockReservation.Status.PENDING)

    def test_create_sets_expiry_in_future(self):
        reservation, _ = self._create_pending()
        self.assertGreater(reservation.expires_at, timezone.now())

    def test_create_increments_reserved_quantity(self):
        wi = self._make_wh_item(in_stock=10)
        sk = self._session_key()
        StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(3),
            variant_map=self.variant_map,
        )
        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 3)

    def test_create_does_not_decrement_quantity_in_stock(self):
        wi = self._make_wh_item(in_stock=10)
        sk = self._session_key()
        StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(3),
            variant_map=self.variant_map,
        )
        wi.refresh_from_db()
        self.assertEqual(wi.quantity_in_stock, 10)

    def test_create_creates_reservation_item(self):
        reservation, _ = self._create_pending(qty=2)
        item = StockReservationItem.objects.get(reservation=reservation)
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.warehouse_item.product_variant, self.variant)

    def test_create_idempotent_same_session_key(self):
        reservation, sk = self._create_pending()
        reservation2 = StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(1),
            variant_map=self.variant_map,
        )
        self.assertEqual(reservation.pk, reservation2.pk)
        # reserved_quantity not incremented again
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.reserved_quantity, 1)

    def test_create_raises_insufficient_stock(self):
        self._make_wh_item(in_stock=1)
        with self.assertRaises(InsufficientStockError):
            StockReservationService.create_reservation(
                session_key=self._session_key(),
                payment_system="stripe",
                groups=self._groups(qty=5),
                variant_map=self.variant_map,
            )

    def test_create_insufficient_error_contains_detail(self):
        self._make_wh_item(in_stock=2)
        try:
            StockReservationService.create_reservation(
                session_key=self._session_key(),
                payment_system="stripe",
                groups=self._groups(qty=5),
                variant_map=self.variant_map,
            )
            self.fail("Expected InsufficientStockError")
        except InsufficientStockError as exc:
            self.assertEqual(exc.detail["sku"], self.variant.sku)
            self.assertEqual(exc.detail["requested"], 5)
            self.assertEqual(exc.detail["available"], 2)

    def test_create_raises_when_reserved_makes_available_zero(self):
        """available = in_stock - reserved; if 0, InsufficientStockError raised."""
        self._make_wh_item(in_stock=3, reserved=3)
        with self.assertRaises(InsufficientStockError):
            StockReservationService.create_reservation(
                session_key=self._session_key(),
                payment_system="stripe",
                groups=self._groups(qty=1),
                variant_map=self.variant_map,
            )

    def test_create_skips_missing_warehouse_item(self):
        """SKU without WarehouseItem → soft policy: reservation created, no item row."""
        WarehouseItem.objects.filter(
            warehouse=self.warehouse, product_variant=self.variant
        ).delete()
        sk = self._session_key()
        reservation = StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(qty=1),
            variant_map=self.variant_map,
        )
        self.assertEqual(reservation.status, StockReservation.Status.PENDING)
        self.assertEqual(reservation.items.count(), 0)

    def test_create_does_not_raise_for_no_groups(self):
        """Empty groups → reservation with zero items, no error."""
        self._make_wh_item(in_stock=5)
        reservation = StockReservationService.create_reservation(
            session_key=self._session_key(),
            payment_system="paypal",
            groups=[],
            variant_map=self.variant_map,
        )
        self.assertEqual(reservation.status, StockReservation.Status.PENDING)
        self.assertEqual(reservation.items.count(), 0)

    def test_create_aborts_and_leaves_no_reservation_on_insufficient(self):
        """If InsufficientStockError raised, no StockReservation row is left."""
        self._make_wh_item(in_stock=0)
        sk = self._session_key()
        with self.assertRaises(InsufficientStockError):
            StockReservationService.create_reservation(
                session_key=sk,
                payment_system="stripe",
                groups=self._groups(qty=1),
                variant_map=self.variant_map,
            )
        self.assertFalse(StockReservation.objects.filter(session_key=sk).exists())


# ---------------------------------------------------------------------------
# confirm_reservation
# ---------------------------------------------------------------------------

class StockReservationConfirmTests(ReservationTestMixin, TestCase):

    def test_confirm_decrements_quantity_in_stock(self):
        reservation, sk = self._create_pending(qty=3, in_stock=10)
        StockReservationService.confirm_reservation(sk)
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 7)

    def test_confirm_clears_reserved_quantity(self):
        reservation, sk = self._create_pending(qty=3, in_stock=10)
        StockReservationService.confirm_reservation(sk)
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.reserved_quantity, 0)

    def test_confirm_sets_status_confirmed(self):
        reservation, sk = self._create_pending()
        StockReservationService.confirm_reservation(sk)
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.CONFIRMED)

    def test_confirm_sets_confirmed_at(self):
        before = timezone.now()
        reservation, sk = self._create_pending()
        StockReservationService.confirm_reservation(sk)
        reservation.refresh_from_db()
        self.assertIsNotNone(reservation.confirmed_at)
        self.assertGreaterEqual(reservation.confirmed_at, before)

    def test_confirm_idempotent_when_already_confirmed(self):
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        StockReservationService.confirm_reservation(sk)
        StockReservationService.confirm_reservation(sk)  # second call
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 8)  # decremented only once

    def test_confirm_noop_for_unknown_session_key(self):
        # Should not raise
        StockReservationService.confirm_reservation("nonexistent-session-key")

    def test_confirm_noop_when_released(self):
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        StockReservationService.release_reservation(sk)
        # Now confirm should be noop
        StockReservationService.confirm_reservation(sk)
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.RELEASED)
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 10)  # untouched


# ---------------------------------------------------------------------------
# release_reservation
# ---------------------------------------------------------------------------

class StockReservationReleaseTests(ReservationTestMixin, TestCase):

    def test_release_restores_reserved_quantity(self):
        self._make_wh_item(in_stock=10)
        sk = self._session_key()
        StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(4),
            variant_map=self.variant_map,
        )
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.reserved_quantity, 4)

        StockReservationService.release_reservation(sk)
        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 0)

    def test_release_does_not_touch_quantity_in_stock(self):
        reservation, sk = self._create_pending(qty=3, in_stock=10)
        StockReservationService.release_reservation(sk)
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 10)

    def test_release_sets_status_released(self):
        reservation, sk = self._create_pending()
        StockReservationService.release_reservation(sk)
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.RELEASED)

    def test_release_sets_released_at(self):
        before = timezone.now()
        reservation, sk = self._create_pending()
        StockReservationService.release_reservation(sk)
        reservation.refresh_from_db()
        self.assertIsNotNone(reservation.released_at)
        self.assertGreaterEqual(reservation.released_at, before)

    def test_release_with_expired_final_status(self):
        """Cleanup job passes final_status=EXPIRED."""
        reservation, sk = self._create_pending()
        StockReservationService.release_reservation(
            sk, final_status=StockReservation.Status.EXPIRED
        )
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.EXPIRED)

    def test_release_idempotent_when_already_released(self):
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        StockReservationService.release_reservation(sk)
        StockReservationService.release_reservation(sk)  # second call — noop
        wi = WarehouseItem.objects.get(warehouse=self.warehouse, product_variant=self.variant)
        self.assertEqual(wi.reserved_quantity, 0)  # not negative

    def test_release_noop_when_confirmed(self):
        """Confirmed reservations cannot be released."""
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        StockReservationService.confirm_reservation(sk)
        StockReservationService.release_reservation(sk)  # noop
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.CONFIRMED)

    def test_release_noop_for_unknown_session_key(self):
        # Should not raise
        StockReservationService.release_reservation("nonexistent-key")


# ---------------------------------------------------------------------------
# Concurrency — PostgreSQL only
# ---------------------------------------------------------------------------

@skipUnless(
    _is_postgresql(),
    "select_for_update concurrency requires PostgreSQL-backed test DB; "
    "validated in Docker backend_test.",
)
class StockReservationConcurrencyTests(TransactionTestCase):
    """
    Verifies that select_for_update prevents overselling when two sessions
    compete concurrently.
    """

    reset_sequences = True

    def setUp(self):
        self.seller_user = CustomUser.objects.create_user(
            email="res-concurrent-seller@example.com",
            password="x",
            first_name="C",
            last_name="C",
            role=UserRole.SELLER,
            phone_number="+420730000021",
        )
        self.seller_profile = SellerProfile.objects.get(user=self.seller_user)
        self.warehouse = Warehouse.objects.create(
            name="WH-ResConcurrent",
            street="C",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        self.base_product = BaseProduct.objects.create(
            name="Concurrent Res Product",
            product_description="D",
            seller=self.seller_profile,
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.base_product,
            name="V",
            text="t",
            price=Decimal("10.00"),
            weight_grams=100,
        )
        self.wh_item = WarehouseItem.objects.create(
            warehouse=self.warehouse,
            product_variant=self.variant,
            quantity_in_stock=1,  # only ONE unit
            reserved_quantity=0,
        )
        self.variant_map = {self.variant.sku: self.variant}

    def _groups(self, qty=1):
        return [{"products": [{"sku": self.variant.sku, "quantity": qty}]}]

    def test_concurrent_last_item_one_succeeds_one_fails(self):
        """
        Two sessions try to reserve the last unit simultaneously.
        Exactly one should succeed (PENDING), the other should get InsufficientStockError.
        """
        barrier = threading.Barrier(2)
        outcomes = []
        lock = threading.Lock()

        def worker():
            try:
                barrier.wait()
                StockReservationService.create_reservation(
                    session_key=f"sk-concurrent-{uuid.uuid4().hex}",
                    payment_system="stripe",
                    groups=self._groups(1),
                    variant_map=self.variant_map,
                )
                with lock:
                    outcomes.append("ok")
            except InsufficientStockError:
                with lock:
                    outcomes.append("insufficient")
            finally:
                connection.close()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)
            self.assertFalse(t.is_alive(), "worker thread timed out")

        self.assertEqual(outcomes.count("ok"), 1, f"outcomes={outcomes}")
        self.assertEqual(outcomes.count("insufficient"), 1, f"outcomes={outcomes}")

        self.wh_item.refresh_from_db()
        # reserved_quantity == 1; quantity_in_stock untouched
        self.assertEqual(self.wh_item.quantity_in_stock, 1)
        self.assertEqual(self.wh_item.reserved_quantity, 1)
        self.assertEqual(self.wh_item.available_quantity, 0)

    def test_concurrent_confirm_no_double_deduction(self):
        """
        Two concurrent calls to confirm_reservation for the same session_key
        must decrement quantity_in_stock exactly once.
        """
        # Create a reservation first
        sk = f"sk-confirm-concurrent-{uuid.uuid4().hex}"
        StockReservationService.create_reservation(
            session_key=sk,
            payment_system="stripe",
            groups=self._groups(1),
            variant_map=self.variant_map,
        )
        self.wh_item.refresh_from_db()
        self.assertEqual(self.wh_item.reserved_quantity, 1)

        barrier = threading.Barrier(2)
        outcomes = []
        lock = threading.Lock()

        def worker():
            try:
                barrier.wait()
                StockReservationService.confirm_reservation(sk)
                with lock:
                    outcomes.append("ok")
            except Exception as exc:
                with lock:
                    outcomes.append(f"err:{exc}")
            finally:
                connection.close()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)
            self.assertFalse(t.is_alive(), "worker thread timed out")

        # Both calls should complete without error (second is idempotent noop)
        self.assertTrue(all(o == "ok" for o in outcomes), f"outcomes={outcomes}")

        self.wh_item.refresh_from_db()
        # Decremented exactly once: 1 - 1 = 0
        self.assertEqual(self.wh_item.quantity_in_stock, 0)
        self.assertEqual(self.wh_item.reserved_quantity, 0)
