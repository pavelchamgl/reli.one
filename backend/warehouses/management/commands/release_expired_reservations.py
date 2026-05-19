"""
Release PENDING stock reservations whose TTL has elapsed.

Recommended cron (every 5 minutes):
    */5 * * * * python manage.py release_expired_reservations
"""
from __future__ import annotations

import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from warehouses.models import StockReservation
from warehouses.services.reservation import StockReservationService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Release stock reservations past their TTL "
        "(status=PENDING and expires_at < now)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List candidates without updating the database.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            metavar="N",
            help="Maximum number of reservations to process in this run.",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        limit: int | None = options["limit"]
        cutoff = timezone.now()

        base_qs = (
            StockReservation.objects.filter(
                status=StockReservation.Status.PENDING,
                expires_at__lt=cutoff,
            )
            .order_by("expires_at")
        )

        if dry_run:
            qs = base_qs[:limit] if limit is not None else base_qs
            candidates = list(qs.only("session_key", "expires_at"))
            for reservation in candidates:
                self.stdout.write(
                    f"Would expire: {reservation.session_key} "
                    f"(expires_at={reservation.expires_at.isoformat()})"
                )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry-run: {len(candidates)} expired PENDING reservation(s) "
                    "would be released."
                )
            )
            return

        with transaction.atomic():
            lock_qs = base_qs.select_for_update(skip_locked=True)
            if limit is not None:
                lock_qs = lock_qs[:limit]
            reservations = list(lock_qs)

        released = 0
        for reservation in reservations:
            StockReservationService.release_reservation(
                reservation.session_key,
                final_status=StockReservation.Status.EXPIRED,
            )
            released += 1
            logger.info(
                "release_expired_reservations: expired session_key=%s",
                reservation.session_key,
            )

        self.stdout.write(
            self.style.SUCCESS(f"Released {released} expired reservation(s).")
        )
