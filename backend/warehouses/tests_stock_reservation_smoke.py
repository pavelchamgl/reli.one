"""
Task 013 Phase 6 — automated local rollout smoke (no Stripe/PayPal).

Run in Docker test contour:
  docker compose -f docker-compose.test.yml run --rm backend_test \\
    pytest warehouses/tests_stock_reservation_smoke.py -v

Full regression before staging:
  docker compose -f docker-compose.test.yml run --rm backend_test \\
    pytest payment/ order/ warehouses/ -q
"""
from __future__ import annotations

import pytest
from django.conf import settings
from django.test import TestCase, override_settings

from warehouses.smoke_reservation_rollout import run_rollout_smoke


@pytest.mark.stock_reservation_smoke
@override_settings(STOCK_RESERVATION_ENABLED=True)
class StockReservationRolloutSmokeTests(TestCase):
    """End-to-end service-layer smoke with reservation flag enabled."""

    def test_rollout_smoke_end_to_end(self):
        if not settings.STOCK_RESERVATION_ENABLED:
            self.fail("STOCK_RESERVATION_ENABLED must be True for this smoke test")
        run_rollout_smoke()
