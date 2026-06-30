"""Tests for CNB JSON rate source and refresh_cnb_rate command (task 032)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from io import StringIO
from unittest.mock import patch

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase

from delivery.services.cnb_service import (
    CnbRateNotAvailableError,
    get_czk_per_eur,
    get_czk_per_eur_for_date,
)
from delivery.services.currency_converter import CACHE_KEY, FALLBACK_CZK_PER_EUR


CNB_JSON_RESPONSE = {
    "rates": [
        {
            "validFor": "2026-06-30",
            "currencyCode": "EUR",
            "amount": 1,
            "rate": 24.26,
        }
    ]
}


class CnbJsonParsingTests(TestCase):
    @patch("delivery.services.cnb_service.requests.get")
    def test_get_czk_per_eur_parses_json_api(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = CNB_JSON_RESPONSE
        mock_get.return_value.raise_for_status = lambda: None

        rate = get_czk_per_eur()
        self.assertEqual(rate, Decimal("24.260000"))

    @patch("delivery.services.cnb_service.requests.get")
    def test_get_czk_per_eur_for_date_parses_json_api(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = CNB_JSON_RESPONSE
        mock_get.return_value.raise_for_status = lambda: None

        rate = get_czk_per_eur_for_date(date(2026, 6, 30))
        self.assertEqual(rate, Decimal("24.260000"))

    @patch("delivery.services.cnb_service.requests.get")
    def test_missing_eur_raises_not_available(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"rates": []}
        mock_get.return_value.raise_for_status = lambda: None

        with self.assertRaises(CnbRateNotAvailableError):
            get_czk_per_eur()


class CnbCachedFallbackTests(TestCase):
    def setUp(self):
        cache.delete(CACHE_KEY)

    @patch("delivery.services.currency_converter.get_czk_per_eur")
    def test_cached_fetch_uses_fallback_on_source_error(self, mock_get):
        from delivery.services.currency_converter import get_czk_to_eur_rate_cached

        mock_get.side_effect = RuntimeError("CNB down")

        rate = get_czk_to_eur_rate_cached()
        self.assertEqual(rate, FALLBACK_CZK_PER_EUR)

    @patch(
        "delivery.management.commands.refresh_cnb_rate._fetch_cnb_daily_json",
        return_value=(Decimal("24.26"), "2026-06-30"),
    )
    def test_refresh_command_writes_cache(self, _mock_fetch):
        out = StringIO()
        call_command("refresh_cnb_rate", stdout=out)

        cached = cache.get(CACHE_KEY)
        self.assertEqual(Decimal(str(cached)), Decimal("24.26"))
        self.assertIn("24.26", out.getvalue())
