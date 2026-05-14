"""
Сервисные тесты analytics (Task 009 Step 2): хрупкость get_stats_for_two_warehouses к именам складов.
analytics/services.py на этом шаге не меняется.
"""
from unittest import skip

from django.test import TestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from analytics.services import get_stats_for_two_warehouses
from sellers.models import SellerProfile
from warehouses.models import Warehouse


class AnalyticsWarehouseStatsServiceTest(TestCase):
    def setUp(self):
        self.seller_user = CustomUser.objects.create_user(
            email="analytics-wh-stats@example.com",
            password="pass12345",
            first_name="A",
            last_name="N",
            role=UserRole.SELLER,
            phone_number="+420730000013",
        )
        self.seller_profile = SellerProfile.objects.get(user=self.seller_user)

    def test_get_stats_for_two_warehouses_raises_when_canonical_warehouse_names_missing(self):
        """
        Baseline: при отсутствии складов с именами «Vendor warehouse» / «Reli warehouse»
        сервис падает Warehouse.DoesNotExist (в HTTP-слое это уходит в 500).
        """
        with self.assertRaises(Warehouse.DoesNotExist):
            get_stats_for_two_warehouses(self.seller_profile)

    def test_get_stats_for_two_warehouses_raises_when_vendor_warehouse_renamed(self):
        """Переименование vendor-склада ломает поиск по жёсткой строке — тот же класс ошибки."""
        Warehouse.objects.create(
            name="Vendor warehouse (renamed in admin)",
            street="S",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        Warehouse.objects.create(
            name="Reli warehouse",
            street="S",
            city="Praha",
            zip_code="10001",
            country="CZ",
        )
        with self.assertRaises(Warehouse.DoesNotExist):
            get_stats_for_two_warehouses(self.seller_profile)

    @skip("Enable after Task 009 Step 4 analytics fallback (empty/default instead of 500).")
    def test_future_expected_behavior_analytics_empty_when_warehouses_missing(self):
        stats = get_stats_for_two_warehouses(self.seller_profile)
        self.assertIn("vendor_warehouse", stats)
        self.assertIn("reli_warehouse", stats)
