"""Tests for EUR→CZK price migration command and CNB date helper (task 031)."""
from __future__ import annotations

import json
import tempfile
from datetime import date
from decimal import Decimal
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings

from accounts.choices import UserRole
from accounts.models import CustomUser
from delivery.services.cnb_service import CnbRateNotAvailableError, get_czk_per_eur_for_date
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse


CNB_EUR_RESPONSE = {
    "rates": [
        {
            "validFor": "2026-06-27",
            "order": 122,
            "country": "EMU",
            "currency": "euro",
            "amount": 1,
            "currencyCode": "EUR",
            "rate": 25.05,
        }
    ]
}


class GetCzkPerEurForDateTests(TestCase):
    @patch("delivery.services.cnb_service.requests.get")
    def test_returns_decimal_from_cnb_json(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = CNB_EUR_RESPONSE
        mock_get.return_value.raise_for_status = lambda: None

        rate = get_czk_per_eur_for_date(date(2026, 6, 27))
        self.assertEqual(rate, Decimal("25.05"))

    @patch("delivery.services.cnb_service.requests.get")
    def test_raises_when_eur_missing(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"rates": []}
        mock_get.return_value.raise_for_status = lambda: None

        with self.assertRaises(CnbRateNotAvailableError):
            get_czk_per_eur_for_date(date(2026, 6, 27))


@override_settings(DEBUG=True)
class MigratePricesEurToCzkCommandTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wh = Warehouse.objects.create(
            name="WH-Migration-Test",
            street="S",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-migration@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420730000088",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.wh
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.category = Category.objects.create(name="MigrationCat")
        cls.product = BaseProduct.objects.create(
            name="Migration Product",
            product_description="Migration test.",
            seller=cls.seller_profile,
            category=cls.category,
            article="8000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            name="V",
            text="t",
            price=Decimal("10.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.migration_date = "2026-06-27"
        self.backup_path = str(Path(self.tmpdir) / "backup.json")
        self.report_path = str(Path(self.tmpdir) / "report.json")

    @patch(
        "product.management.commands.migrate_prices_eur_to_czk.get_czk_per_eur_for_date",
        return_value=Decimal("25.05"),
    )
    def test_dry_run_does_not_update_db(self, _mock_rate):
        out = StringIO()
        call_command(
            "migrate_prices_eur_to_czk",
            "--dry-run",
            f"--date={self.migration_date}",
            f"--backup-path={self.backup_path}",
            f"--report-path={self.report_path}",
            stdout=out,
        )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.price, Decimal("10.00"))
        self.assertNotIn("updated=", out.getvalue().lower() + out.getvalue())

    @patch(
        "product.management.commands.migrate_prices_eur_to_czk.get_czk_per_eur_for_date",
        return_value=Decimal("25.05"),
    )
    def test_run_converts_price_creates_backup_and_report(self, _mock_rate):
        call_command(
            "migrate_prices_eur_to_czk",
            f"--date={self.migration_date}",
            f"--backup-path={self.backup_path}",
            f"--report-path={self.report_path}",
        )
        self.variant.refresh_from_db()
        # 10.00 × 25.05 = 250.50 → ceil = 251
        self.assertEqual(self.variant.price, Decimal("251"))

        self.assertTrue(Path(self.backup_path).is_file())
        backup = json.loads(Path(self.backup_path).read_text(encoding="utf-8"))
        self.assertIn("rows", backup)

        self.assertTrue(Path(self.report_path).is_file())
        report = json.loads(Path(self.report_path).read_text(encoding="utf-8"))
        self.assertEqual(report["rate"]["source"], "cnb_json_api")
        self.assertEqual(report["rate"]["cnb_valid_for"], self.migration_date)
        self.assertIn("summary", report)
        self.assertEqual(report["summary"]["variants_updated"], 1)

    @patch(
        "product.management.commands.migrate_prices_eur_to_czk.get_czk_per_eur_for_date",
        return_value=Decimal("25.05"),
    )
    def test_idempotency_requires_allow_rerun(self, _mock_rate):
        call_command(
            "migrate_prices_eur_to_czk",
            f"--date={self.migration_date}",
            f"--backup-path={self.backup_path}",
            f"--report-path={self.report_path}",
        )
        with self.assertRaises(CommandError):
            call_command(
                "migrate_prices_eur_to_czk",
                f"--date={self.migration_date}",
                f"--backup-path={self.backup_path}",
                f"--report-path={self.report_path}",
            )

    @patch(
        "product.management.commands.migrate_prices_eur_to_czk.get_czk_per_eur_for_date",
        return_value=Decimal("25.05"),
    )
    def test_reverse_restores_eur_prices_from_backup(self, _mock_rate):
        call_command(
            "migrate_prices_eur_to_czk",
            f"--date={self.migration_date}",
            f"--backup-path={self.backup_path}",
            f"--report-path={self.report_path}",
        )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.price, Decimal("251"))

        call_command(
            "migrate_prices_eur_to_czk",
            "--reverse",
            f"--backup-path={self.backup_path}",
        )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.price, Decimal("10.00"))

    @patch(
        "product.management.commands.migrate_prices_eur_to_czk.get_czk_per_eur_for_date",
        return_value=Decimal("25.05"),
    )
    def test_manual_rate_override_in_report(self, _mock_rate):
        call_command(
            "migrate_prices_eur_to_czk",
            f"--date={self.migration_date}",
            f"--backup-path={self.backup_path}",
            f"--report-path={self.report_path}",
            "--rate=26.00",
            "--force-manual-rate",
        )
        report = json.loads(Path(self.report_path).read_text(encoding="utf-8"))
        self.assertEqual(report["rate"]["source"], "manual_override")
        self.assertEqual(report["rate"]["czk_per_eur"], "26.00")

    @override_settings(DEBUG=False)
    def test_date_flag_rejected_on_prod(self):
        with self.assertRaises(CommandError):
            call_command(
                "migrate_prices_eur_to_czk",
                f"--date={self.migration_date}",
                "--dry-run",
            )
