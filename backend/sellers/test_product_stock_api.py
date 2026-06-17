from __future__ import annotations

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem
from warehouses.services.reservation import StockReservationService


class SellerProductStockApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="SellerStockCat")
        cls.default_wh = Warehouse.objects.create(
            name="Seller Stock Default WH",
            street="Default",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.allowed_wh = Warehouse.objects.create(
            name="Seller Stock Allowed WH",
            street="Allowed",
            city="Praha",
            zip_code="10001",
            country="CZ",
        )
        cls.foreign_wh = Warehouse.objects.create(
            name="Seller Stock Foreign WH",
            street="Foreign",
            city="Praha",
            zip_code="10002",
            country="CZ",
        )

        cls.seller_user = CustomUser.objects.create_user(
            email="seller-stock-endpoint@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Stock",
            role=UserRole.SELLER,
            phone_number="+420730200001",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.default_wh
        cls.seller_profile.save(update_fields=["default_warehouse"])
        cls.seller_profile.warehouses.add(cls.allowed_wh)

        cls.other_seller_user = CustomUser.objects.create_user(
            email="other-seller-stock-endpoint@example.com",
            password="pass12345",
            first_name="Other",
            last_name="Seller",
            role=UserRole.SELLER,
            phone_number="+420730200002",
        )
        cls.other_seller_profile = SellerProfile.objects.get(user=cls.other_seller_user)
        cls.other_seller_profile.default_warehouse = cls.foreign_wh
        cls.other_seller_profile.save(update_fields=["default_warehouse"])

        cls.product = cls._create_product(
            seller=cls.seller_profile,
            name="Seller Stock Product",
            article="4000000001",
        )
        cls.variant = cls._create_variant(cls.product, text="Main")

        cls.second_product = cls._create_product(
            seller=cls.seller_profile,
            name="Seller Stock Second Product",
            article="4000000002",
        )
        cls.second_variant = cls._create_variant(cls.second_product, text="Second")

        cls.foreign_product = cls._create_product(
            seller=cls.other_seller_profile,
            name="Foreign Seller Product",
            article="4000000003",
        )
        cls.foreign_variant = cls._create_variant(cls.foreign_product, text="Foreign")

        cls.no_stock_product = cls._create_product(
            seller=cls.seller_profile,
            name="Seller Stock Missing WarehouseItem",
            article="4000000004",
        )
        cls._create_variant(cls.no_stock_product, text="NoStock")

    @classmethod
    def _create_product(cls, *, seller, name: str, article: str) -> BaseProduct:
        return BaseProduct.objects.create(
            name=name,
            product_description=f"{name} description",
            seller=seller,
            category=cls.category,
            article=article,
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )

    @staticmethod
    def _create_variant(product: BaseProduct, *, text: str) -> ProductVariant:
        return ProductVariant.objects.create(
            product=product,
            name="Size",
            text=text,
            price=Decimal("20.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.seller_user)

    def _stock_url(self, product_id: int | None = None, variant_id: int | None = None) -> str:
        return (
            f"/api/sellers/products/{product_id or self.product.id}/"
            f"variants/{variant_id or self.variant.id}/stock/"
        )

    def test_create_stock_on_default_warehouse(self):
        response = self.client.put(self._stock_url(), {"quantity_in_stock": 9}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["warehouse_id"], self.default_wh.id)
        self.assertEqual(response.data["quantity_in_stock"], 9)
        self.assertEqual(response.data["reserved_quantity"], 0)
        item = WarehouseItem.objects.get(warehouse=self.default_wh, product_variant=self.variant)
        self.assertEqual(item.quantity_in_stock, 9)

    def test_update_stock_preserves_reserved_quantity(self):
        WarehouseItem.objects.create(
            warehouse=self.default_wh,
            product_variant=self.variant,
            quantity_in_stock=5,
            reserved_quantity=3,
        )

        response = self.client.put(self._stock_url(), {"quantity_in_stock": 12}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity_in_stock"], 12)
        self.assertEqual(response.data["reserved_quantity"], 3)
        item = WarehouseItem.objects.get(warehouse=self.default_wh, product_variant=self.variant)
        self.assertEqual(item.quantity_in_stock, 12)
        self.assertEqual(item.reserved_quantity, 3)

    def test_create_stock_on_allowed_warehouse(self):
        response = self.client.put(
            self._stock_url(),
            {"quantity_in_stock": 7, "warehouse_id": self.allowed_wh.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["warehouse_id"], self.allowed_wh.id)
        self.assertTrue(
            WarehouseItem.objects.filter(
                warehouse=self.allowed_wh,
                product_variant=self.variant,
                quantity_in_stock=7,
            ).exists()
        )

    def test_default_warehouse_is_allowed_even_when_not_in_seller_warehouses(self):
        self.assertFalse(self.seller_profile.warehouses.filter(pk=self.default_wh.id).exists())

        response = self.client.put(
            self._stock_url(),
            {"quantity_in_stock": 4, "warehouse_id": self.default_wh.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["warehouse_id"], self.default_wh.id)

    def test_reject_foreign_warehouse(self):
        response = self.client.put(
            self._stock_url(),
            {"quantity_in_stock": 7, "warehouse_id": self.foreign_wh.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            WarehouseItem.objects.filter(
                warehouse=self.foreign_wh,
                product_variant=self.variant,
            ).exists()
        )

    def test_reject_foreign_product(self):
        response = self.client.put(
            self._stock_url(product_id=self.foreign_product.id, variant_id=self.foreign_variant.id),
            {"quantity_in_stock": 7},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reject_variant_from_another_product(self):
        response = self.client.put(
            self._stock_url(product_id=self.product.id, variant_id=self.second_variant.id),
            {"quantity_in_stock": 7},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_default_warehouse_without_warehouse_id_returns_400(self):
        self.seller_profile.default_warehouse = None
        self.seller_profile.save(update_fields=["default_warehouse"])

        response = self.client.put(self._stock_url(), {"quantity_in_stock": 7}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("warehouse_id", response.data)

    def test_public_stock_fields_reflect_seller_stock_and_hide_reserved_quantity(self):
        WarehouseItem.objects.create(
            warehouse=self.default_wh,
            product_variant=self.variant,
            quantity_in_stock=9,
            reserved_quantity=2,
        )

        url = reverse("category-products", kwargs={"category_id": self.category.id})
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = next(item for item in response.data["results"] if item["id"] == self.product.id)
        self.assertEqual(row["total_available_quantity"], 7)
        self.assertTrue(row["is_available"])
        self.assertNotIn("reserved_quantity", row)

    def test_missing_warehouse_item_remains_out_of_stock_publicly(self):
        url = reverse("category-products", kwargs={"category_id": self.category.id})
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = next(item for item in response.data["results"] if item["id"] == self.no_stock_product.id)
        self.assertEqual(row["total_available_quantity"], 0)
        self.assertFalse(row["is_available"])
        self.assertNotIn("reserved_quantity", row)

    def test_reservation_uses_seller_created_warehouse_item(self):
        self.client.put(self._stock_url(), {"quantity_in_stock": 9}, format="json")

        StockReservationService.create_reservation(
            session_key="seller-stock-reservation-test",
            payment_system="stripe",
            groups=[{"products": [{"sku": self.variant.sku, "quantity": 4}]}],
            variant_map={self.variant.sku: self.variant},
        )

        item = WarehouseItem.objects.get(warehouse=self.default_wh, product_variant=self.variant)
        self.assertEqual(item.quantity_in_stock, 9)
        self.assertEqual(item.reserved_quantity, 4)

    def test_product_detail_includes_variant_quantity_in_stock(self):
        WarehouseItem.objects.create(
            warehouse=self.default_wh,
            product_variant=self.variant,
            quantity_in_stock=14,
        )

        response = self.client.get(f"/api/sellers/products/{self.product.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        variant_row = next(item for item in response.data["variants"] if item["id"] == self.variant.id)
        self.assertEqual(variant_row["quantity_in_stock"], 14)

    def test_product_detail_returns_zero_stock_when_warehouse_item_missing(self):
        response = self.client.get(f"/api/sellers/products/{self.product.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        variant_row = next(item for item in response.data["variants"] if item["id"] == self.variant.id)
        self.assertEqual(variant_row["quantity_in_stock"], 0)

    def test_get_variant_stock_returns_current_quantity(self):
        WarehouseItem.objects.create(
            warehouse=self.default_wh,
            product_variant=self.variant,
            quantity_in_stock=14,
        )

        response = self.client.get(self._stock_url())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity_in_stock"], 14)
