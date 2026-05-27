"""
Run Task 013 stock-reservation rollout smoke (service layer, no PSP).

Example (local Docker test DB):
  docker compose -f docker-compose.test.yml run --rm backend_test \\
    env STOCK_RESERVATION_ENABLED=True python manage.py smoke_stock_reservation

Equivalent pytest:
  docker compose -f docker-compose.test.yml run --rm backend_test \\
    pytest warehouses/tests_stock_reservation_smoke.py -v
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from warehouses.smoke_reservation_rollout import run_rollout_smoke


class Command(BaseCommand):
    help = (
        "Run stock-reservation rollout smoke checks (no Stripe/PayPal calls). "
        "Requires STOCK_RESERVATION_ENABLED=True."
    )

    def handle(self, *args, **options):
        if not settings.STOCK_RESERVATION_ENABLED:
            raise CommandError(
                "STOCK_RESERVATION_ENABLED is False. "
                "Set STOCK_RESERVATION_ENABLED=True in the environment for this smoke run."
            )

        def _log(msg: str) -> None:
            self.stdout.write(msg)

        try:
            run_rollout_smoke(log=_log)
        except AssertionError as exc:
            raise CommandError(f"Smoke check failed: {exc}") from exc

        self.stdout.write(
            self.style.SUCCESS("Stock reservation rollout smoke: all checks passed.")
        )
