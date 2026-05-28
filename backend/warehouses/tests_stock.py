"""
Тесты контракта warehouses.services.decrease_stock (Task 009).
"""
from decimal import Decimal
import threading

from django.conf import settings
from django.db import connection
from django.test import TestCase, TransactionTestCase
from unittest import skipUnless

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.exceptions import InsufficientStockError
from warehouses.models import Warehouse, WarehouseItem
from warehouses.services import decrease_stock


def _is_postgresql():
    engine = settings.DATABASES["default"]["ENGINE"]
    return "postgresql" in engine


class WarehouseStockServiceTest(TestCase):
    """Поведение decrease_stock после Step 3: atomic row lock и InsufficientStockError."""

    @classmethod
    def setUpTestData(cls):
        cls.warehouse = Warehouse.objects.create(
            name="WH-Stock-Service-Test",
            street="Test",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="stock-test-seller@example.com",
            password="pass12345",
            first_name="S",
            last_name="T",
            role=UserRole.SELLER,
            phone_number="+420730000012",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.base_product = BaseProduct.objects.create(
            name="Stock Test Product",
            product_description="Desc",
            seller=cls.seller_profile,
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.base_product,
            name="V",
            text="opt",
            price=Decimal("10.00"),
            weight_grams=100,
        )

    def test_decrease_stock_reduces_quantity(self):
        item = WarehouseItem.objects.create(
            warehouse=self.warehouse,
            product_variant=self.variant,
            quantity_in_stock=10,
        )
        decrease_stock(self.warehouse, self.variant, 3)
        item.refresh_from_db()
        self.assertEqual(item.quantity_in_stock, 7)

    def test_decrease_stock_insufficient_stock_does_not_change_quantity(self):
        item = WarehouseItem.objects.create(
            warehouse=self.warehouse,
            product_variant=self.variant,
            quantity_in_stock=2,
        )
        with self.assertRaises(InsufficientStockError):
            decrease_stock(self.warehouse, self.variant, 5)
        item.refresh_from_db()
        self.assertEqual(item.quantity_in_stock, 2)

    def test_decrease_stock_missing_item_is_noop(self):
        self.assertFalse(
            WarehouseItem.objects.filter(
                warehouse=self.warehouse,
                product_variant=self.variant,
            ).exists()
        )
        decrease_stock(self.warehouse, self.variant, 1)
        self.assertFalse(
            WarehouseItem.objects.filter(
                warehouse=self.warehouse,
                product_variant=self.variant,
            ).exists()
        )


@skipUnless(
    _is_postgresql(),
    "select_for_update concurrency requires PostgreSQL-backed test DB; "
    "validated in Docker backend_test.",
)
class WarehouseStockConcurrencyTest(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name="WH-Concurrent-Stock-Test",
            street="C",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        self.seller_user = CustomUser.objects.create_user(
            email="stock-concurrent-seller@example.com",
            password="pass12345",
            first_name="C",
            last_name="C",
            role=UserRole.SELLER,
            phone_number="+420730000099",
        )
        self.seller_profile = SellerProfile.objects.get(user=self.seller_user)
        self.base_product = BaseProduct.objects.create(
            name="Concurrent Stock Product",
            product_description="D",
            seller=self.seller_profile,
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.base_product,
            name="V",
            text="t",
            price=Decimal("11.00"),
            weight_grams=50,
        )
        self.item = WarehouseItem.objects.create(
            warehouse=self.warehouse,
            product_variant=self.variant,
            quantity_in_stock=10,
        )

    def test_concurrent_decrease_stock_documents_current_race_or_target_behavior(self):
        barrier = threading.Barrier(2)
        outcomes = []
        outcome_lock = threading.Lock()
        warehouse = self.warehouse
        variant = self.variant

        def worker():
            try:
                barrier.wait()
                decrease_stock(warehouse, variant, 8)
                with outcome_lock:
                    outcomes.append("ok")
            except InsufficientStockError:
                with outcome_lock:
                    outcomes.append("insufficient")
            finally:
                connection.close()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=60)
            self.assertFalse(t.is_alive(), "worker thread timed out")

        self.assertEqual(outcomes.count("ok"), 1)
        self.assertEqual(outcomes.count("insufficient"), 1)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity_in_stock, 2)
