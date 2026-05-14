"""
Тесты контракта warehouses.services.decrease_stock (Task 009 Step 2).
Runtime-код services.py здесь не меняется — фиксируем текущее поведение.
"""
from decimal import Decimal
from unittest import skip

from django.test import TestCase, TransactionTestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem
from warehouses.services import decrease_stock


class WarehouseStockServiceTest(TestCase):
    """Базовое поведение decrease_stock без изменения боевого кода."""

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
        """Текущий контракт: warning + return, без исключения (Step 3 — InsufficientStockError)."""
        item = WarehouseItem.objects.create(
            warehouse=self.warehouse,
            product_variant=self.variant,
            quantity_in_stock=2,
        )
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


class WarehouseStockConcurrencyTest(TransactionTestCase):
    """
    TransactionTestCase — заготовка под реальные блокировки после Step 3.
    Параллельный race без select_for_update в CI нестабилен → тест отключён.
    """

    reset_sequences = True

    @skip(
        "Non-deterministic without select_for_update on WarehouseItem; "
        "enable after Task 009 Step 3 implements row locking."
    )
    def test_concurrent_decrease_stock_documents_current_race_or_target_behavior(self):
        """
        Целевой сценарий (после Step 3): quantity_in_stock=10, два потока списывают по 8 —
        один успех, второй — отказ; итог не ниже 0 и не «двойное» списание.
        """
        # Placeholder body — активируется вместе со снятием @skip.
        self.fail("Implemented when concurrent test is enabled after Step 3")
