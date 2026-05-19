"""
Print stock-reservation health metrics for staging/production monitoring.

Example:
  python manage.py report_stock_reservation_health
  python manage.py report_stock_reservation_health --json
"""
from __future__ import annotations

import json

from django.core.management.base import BaseCommand
from django.db.models import Count, F
from django.utils import timezone

from warehouses.models import StockReservation, WarehouseItem


class Command(BaseCommand):
    help = "Report StockReservation and WarehouseItem reservation health metrics."

    def add_arguments(self, parser):
        parser.add_argument(
            "--json",
            action="store_true",
            help="Output machine-readable JSON instead of human text.",
        )

    def handle(self, *args, **options):
        now = timezone.now()
        as_json = options["json"]

        by_status = dict(
            StockReservation.objects.values("status")
            .annotate(c=Count("id"))
            .values_list("status", "c")
        )
        pending = by_status.get(StockReservation.Status.PENDING, 0)
        stale_pending = StockReservation.objects.filter(
            status=StockReservation.Status.PENDING,
            expires_at__lt=now,
        ).count()

        wi_over_reserved = WarehouseItem.objects.filter(
            reserved_quantity__gt=F("quantity_in_stock")
        ).count()
        wi_with_reserved = WarehouseItem.objects.filter(
            reserved_quantity__gt=0
        ).count()

        from datetime import timedelta

        from django.conf import settings

        pending_old_1h = StockReservation.objects.filter(
            status=StockReservation.Status.PENDING,
            created_at__lt=now - timedelta(hours=1),
        ).count()

        payload = {
            "timestamp": now.isoformat(),
            "stock_reservation_enabled": getattr(
                settings, "STOCK_RESERVATION_ENABLED", None
            ),
            "reservations_by_status": by_status,
            "pending_total": pending,
            "pending_stale_expired": stale_pending,
            "pending_older_than_1h": pending_old_1h,
            "warehouse_items_with_reserved_gt_zero": wi_with_reserved,
            "warehouse_items_reserved_exceeds_in_stock": wi_over_reserved,
        }

        if as_json:
            self.stdout.write(json.dumps(payload, indent=2, default=str))
            return

        self.stdout.write(f"Stock reservation health @ {now.isoformat()}")
        self.stdout.write(
            f"  STOCK_RESERVATION_ENABLED: {payload['stock_reservation_enabled']}"
        )
        self.stdout.write("  Reservations by status:")
        for status, count in sorted(by_status.items()):
            self.stdout.write(f"    {status}: {count}")
        self.stdout.write(f"  PENDING total: {pending}")
        self.stdout.write(f"  PENDING stale (expires_at < now): {stale_pending}")
        self.stdout.write(f"  PENDING older than 1h: {pending_old_1h}")
        self.stdout.write(f"  WarehouseItem with reserved_quantity > 0: {wi_with_reserved}")
        self.stdout.write(
            f"  WarehouseItem reserved_quantity > quantity_in_stock: {wi_over_reserved}"
        )
        if stale_pending > 0:
            self.stdout.write(
                self.style.WARNING(
                    "  WARN: stale PENDING reservations exist — "
                    "verify cron release_expired_reservations is running."
                )
            )
        if wi_over_reserved > 0:
            self.stdout.write(
                self.style.ERROR(
                    "  ERROR: reserved_quantity exceeds quantity_in_stock on "
                    f"{wi_over_reserved} row(s) — investigate."
                )
            )
