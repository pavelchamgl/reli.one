"""
Tests for release_expired_reservations management command (Task 013 Phase 5).
"""
from __future__ import annotations

from datetime import timedelta
from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from warehouses.models import StockReservation, WarehouseItem
from warehouses.services.reservation import StockReservationService
from warehouses.tests_reservation import ReservationTestMixin


class ReleaseExpiredReservationsCommandTests(ReservationTestMixin, TestCase):
    """release_expired_reservations — TTL cleanup."""

    def _expire(self, reservation: StockReservation) -> None:
        reservation.expires_at = timezone.now() - timedelta(minutes=5)
        reservation.save(update_fields=["expires_at"])

    def test_expired_pending_becomes_expired(self):
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )
        self.assertEqual(wi.reserved_quantity, 2)
        self._expire(reservation)

        call_command("release_expired_reservations")

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.EXPIRED)
        self.assertIsNotNone(reservation.released_at)
        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 0)
        self.assertEqual(wi.quantity_in_stock, 10)

    def test_expired_pending_restores_reserved_quantity(self):
        reservation, _ = self._create_pending(qty=5, in_stock=20)
        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )
        self.assertEqual(wi.reserved_quantity, 5)
        self._expire(reservation)

        call_command("release_expired_reservations")

        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 0)

    def test_non_expired_pending_not_touched(self):
        reservation, _ = self._create_pending(qty=1, in_stock=10)
        self.assertGreater(reservation.expires_at, timezone.now())

        call_command("release_expired_reservations")

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.PENDING)
        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )
        self.assertEqual(wi.reserved_quantity, 1)

    def test_confirmed_reservation_not_touched(self):
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        self._expire(reservation)
        StockReservationService.confirm_reservation(sk)

        call_command("release_expired_reservations")

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.CONFIRMED)
        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )
        self.assertEqual(wi.quantity_in_stock, 8)
        self.assertEqual(wi.reserved_quantity, 0)

    def test_released_reservation_not_touched(self):
        reservation, sk = self._create_pending(qty=3, in_stock=10)
        self._expire(reservation)
        StockReservationService.release_reservation(sk)

        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )
        self.assertEqual(wi.reserved_quantity, 0)

        call_command("release_expired_reservations")

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.RELEASED)
        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 0)

    def test_already_expired_status_not_double_processed(self):
        """EXPIRED rows are outside the PENDING filter — command is a noop."""
        reservation, sk = self._create_pending(qty=2, in_stock=10)
        self._expire(reservation)
        StockReservationService.release_reservation(
            sk, final_status=StockReservation.Status.EXPIRED
        )
        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )
        self.assertEqual(wi.reserved_quantity, 0)

        call_command("release_expired_reservations")

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.EXPIRED)
        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 0)

    def test_dry_run_does_not_mutate_db(self):
        reservation, _ = self._create_pending(qty=4, in_stock=10)
        self._expire(reservation)
        wi = WarehouseItem.objects.get(
            warehouse=self.warehouse, product_variant=self.variant
        )

        out = StringIO()
        call_command("release_expired_reservations", "--dry-run", stdout=out)

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.PENDING)
        wi.refresh_from_db()
        self.assertEqual(wi.reserved_quantity, 4)
        self.assertIn("Dry-run", out.getvalue())
        self.assertIn("Would expire", out.getvalue())

    def test_limit_caps_processed_rows(self):
        r1, _ = self._create_pending(qty=1, in_stock=20)
        self._expire(r1)
        r2, _ = self._create_pending(qty=1, in_stock=20)
        self._expire(r2)

        call_command("release_expired_reservations", "--limit", "1")

        expired_count = StockReservation.objects.filter(
            status=StockReservation.Status.EXPIRED
        ).count()
        pending_expired = StockReservation.objects.filter(
            status=StockReservation.Status.PENDING,
            expires_at__lt=timezone.now(),
        ).count()
        self.assertEqual(expired_count, 1)
        self.assertEqual(pending_expired, 1)
