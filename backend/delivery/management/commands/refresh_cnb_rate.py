from __future__ import annotations

from django.core.cache import cache
from django.core.management.base import BaseCommand

from delivery.services.cnb_service import _fetch_cnb_daily_json
from delivery.services.currency_converter import CACHE_KEY, CACHE_TIMEOUT_SECONDS


class Command(BaseCommand):
    help = "Fetch CNB EUR/CZK rate and refresh the operational cache."

    def handle(self, *args, **options):
        rate, valid_for = _fetch_cnb_daily_json()
        cache.set(CACHE_KEY, str(rate), timeout=CACHE_TIMEOUT_SECONDS)
        self.stdout.write(
            f"[CNB-REFRESH] validFor={valid_for or 'unknown'} rate={rate} cache_key={CACHE_KEY}"
        )
