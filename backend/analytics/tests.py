"""Тесты analytics: fallback складской статистики (Task 009 Step 4)."""
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status as http_status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from analytics import services as analytics_services
from analytics.services import get_stats_for_two_warehouses, zero_warehouse_order_stats
from sellers.models import SellerProfile
from warehouses.models import Warehouse


_EXPECTED_KEYS = frozenset(
    {
        "awaiting_assembly",
        "awaiting_shipment",
        "controversial",
        "awaiting_assembly_and_shipment",
        "deliverable",
        "delivered",
        "canceled",
        "all",
    }
)


class AnalyticsWarehouseStatsServiceTest(TestCase):
    """Сервис get_stats_for_two_warehouses после Step 4: без DoesNotExist, нули при отсутствии канона."""

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

    def assert_zero_bucket(self, bucket):
        self.assertEqual(_EXPECTED_KEYS, frozenset(bucket.keys()))
        for k in bucket:
            self.assertEqual(bucket[k], 0, msg=k)

    def test_returns_zeros_when_canonical_warehouses_missing(self):
        stats = get_stats_for_two_warehouses(self.seller_profile)
        self.assertIn("vendor_warehouse", stats)
        self.assertIn("reli_warehouse", stats)
        self.assert_zero_bucket(stats["vendor_warehouse"])
        self.assert_zero_bucket(stats["reli_warehouse"])

        tracked = []

        def recording(warehouse, seller_profile, days=15):
            tracked.append((warehouse.pk, warehouse.name))
            return analytics_services.get_warehouse_orders_stats(
                warehouse, seller_profile, days=days
            )

        with patch.object(
            analytics_services,
            "get_warehouse_orders_stats",
            side_effect=recording,
        ):
            get_stats_for_two_warehouses(self.seller_profile)
        self.assertEqual(tracked, [])

    def test_vendor_renamed_reli_bucket_uses_orders_stats(self):
        Warehouse.objects.create(
            name="Vendor warehouse (renamed in admin)",
            street="S",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        reli = Warehouse.objects.create(
            name="Reli warehouse",
            street="S",
            city="Praha",
            zip_code="10001",
            country="CZ",
        )

        stats = get_stats_for_two_warehouses(self.seller_profile)
        self.assert_zero_bucket(stats["vendor_warehouse"])

        tracked = []

        real = analytics_services.get_warehouse_orders_stats

        def recording(warehouse, seller_profile, days=15):
            tracked.append((warehouse.pk, warehouse.name))
            return real(warehouse, seller_profile, days=days)

        with patch.object(
            analytics_services,
            "get_warehouse_orders_stats",
            side_effect=recording,
        ):
            out = get_stats_for_two_warehouses(self.seller_profile)

        self.assertEqual(tracked, [(reli.pk, "Reli warehouse")])
        self.assert_zero_bucket(out["vendor_warehouse"])
        self.assertEqual(set(out["reli_warehouse"].keys()), _EXPECTED_KEYS)

    def test_zero_warehouse_order_stats_matches_service_shape(self):
        z = zero_warehouse_order_stats()
        self.assertEqual(_EXPECTED_KEYS, frozenset(z.keys()))
        self.assertEqual(sum(z.values()), 0)


class WarehouseOrdersStatsHttpTest(TestCase):
    """Складская статистика не отдаёт 500 при отсутствии канонических складов."""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="analytics-wh-http@example.com",
            password="pass12345",
            role=UserRole.SELLER,
            phone_number="+420730000099",
            first_name="H",
            last_name="T",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_warehouse_stats_endpoint_200_when_no_canonical_warehouses(self):
        url = reverse("warehouse-orders-statistics")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, http_status.HTTP_200_OK)
        self.assertIn("vendor_warehouse", resp.data)
        self.assertIn("reli_warehouse", resp.data)
