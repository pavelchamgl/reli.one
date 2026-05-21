"""
Task 020 — Product Stock Availability API tests.
"""
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from product.stock_availability import (
    STOCK_STATUS_FEW_LEFT,
    STOCK_STATUS_IN_STOCK,
    STOCK_STATUS_OUT_OF_STOCK,
)
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem


class StockAvailabilityApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wh = Warehouse.objects.create(
            name="WH-Stock-API",
            street="S",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-stock-api@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420730000099",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.wh
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.category = Category.objects.create(name="StockApiCat")

        cls.product_single = BaseProduct.objects.create(
            name="SingleVariant InStock",
            product_description="One variant with plenty of stock.",
            seller=cls.seller_profile,
            category=cls.category,
            article="2000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant_single = ProductVariant.objects.create(
            product=cls.product_single,
            name="Default",
            text="t",
            price=Decimal("20.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        WarehouseItem.objects.create(
            warehouse=cls.wh,
            product_variant=cls.variant_single,
            quantity_in_stock=10,
            reserved_quantity=0,
        )

        cls.product_multi = BaseProduct.objects.create(
            name="MultiVariant Mix",
            product_description="Two variants aggregated on list.",
            seller=cls.seller_profile,
            category=cls.category,
            article="2000000002",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant_multi_a = ProductVariant.objects.create(
            product=cls.product_multi,
            name="Size",
            text="A",
            price=Decimal("15.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        cls.variant_multi_b = ProductVariant.objects.create(
            product=cls.product_multi,
            name="Size",
            text="B",
            price=Decimal("25.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        WarehouseItem.objects.create(
            warehouse=cls.wh,
            product_variant=cls.variant_multi_a,
            quantity_in_stock=3,
            reserved_quantity=0,
        )
        WarehouseItem.objects.create(
            warehouse=cls.wh,
            product_variant=cls.variant_multi_b,
            quantity_in_stock=7,
            reserved_quantity=0,
        )

        cls.product_reserved = BaseProduct.objects.create(
            name="ReservedStock Product",
            product_description="Reservation reduces available count.",
            seller=cls.seller_profile,
            category=cls.category,
            article="2000000003",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant_reserved = ProductVariant.objects.create(
            product=cls.product_reserved,
            name="R",
            text="t",
            price=Decimal("30.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        WarehouseItem.objects.create(
            warehouse=cls.wh,
            product_variant=cls.variant_reserved,
            quantity_in_stock=8,
            reserved_quantity=5,
        )

        cls.product_no_wh = BaseProduct.objects.create(
            name="NoWarehouseItem Product",
            product_description="Variant without warehouse row.",
            seller=cls.seller_profile,
            category=cls.category,
            article="2000000004",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        ProductVariant.objects.create(
            product=cls.product_no_wh,
            name="Ghost",
            text="t",
            price=Decimal("12.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )

        cls.product_few = BaseProduct.objects.create(
            name="FewLeft Product",
            product_description="Low stock few_left status.",
            seller=cls.seller_profile,
            category=cls.category,
            article="2000000005",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant_few = ProductVariant.objects.create(
            product=cls.product_few,
            name="Low",
            text="t",
            price=Decimal("18.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        WarehouseItem.objects.create(
            warehouse=cls.wh,
            product_variant=cls.variant_few,
            quantity_in_stock=3,
            reserved_quantity=0,
        )

    def setUp(self):
        self.client = APIClient()

    def _product_from_category(self, product_id: int) -> dict:
        url = reverse("category-products", kwargs={"category_id": self.category.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for row in response.data["results"]:
            if row["id"] == product_id:
                return row
        self.fail(f"product {product_id} not in category list")

    def _product_from_search(self, query: str, product_id: int) -> dict:
        url = reverse("search")
        response = self.client.get(url, {"q": query}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for row in response.data["results"]["products"]:
            if row["id"] == product_id:
                return row
        self.fail(f"product {product_id} not in search results")

    def test_single_variant_product_list_availability(self):
        row = self._product_from_category(self.product_single.id)
        self.assertEqual(row["total_available_quantity"], 10)
        self.assertTrue(row["is_available"])
        self.assertEqual(row["stock_status"], STOCK_STATUS_IN_STOCK)
        self.assertNotIn("reserved_quantity", row)

    def test_multi_variant_aggregated_on_list(self):
        row = self._product_from_category(self.product_multi.id)
        self.assertEqual(row["total_available_quantity"], 10)
        self.assertTrue(row["is_available"])
        self.assertEqual(row["stock_status"], STOCK_STATUS_IN_STOCK)

    def test_reserved_stock_reduces_list_availability(self):
        row = self._product_from_category(self.product_reserved.id)
        self.assertEqual(row["total_available_quantity"], 3)
        self.assertTrue(row["is_available"])
        self.assertEqual(row["stock_status"], STOCK_STATUS_FEW_LEFT)

    def test_missing_warehouse_item_means_out_of_stock_on_list(self):
        row = self._product_from_category(self.product_no_wh.id)
        self.assertEqual(row["total_available_quantity"], 0)
        self.assertFalse(row["is_available"])
        self.assertEqual(row["stock_status"], STOCK_STATUS_OUT_OF_STOCK)

    def test_search_endpoint_includes_stock_fields(self):
        row = self._product_from_search("SingleVariant", self.product_single.id)
        self.assertEqual(row["total_available_quantity"], 10)
        self.assertTrue(row["is_available"])
        self.assertEqual(row["stock_status"], STOCK_STATUS_IN_STOCK)

    def test_category_endpoint_includes_stock_fields(self):
        row = self._product_from_category(self.product_few.id)
        self.assertEqual(row["total_available_quantity"], 3)
        self.assertEqual(row["stock_status"], STOCK_STATUS_FEW_LEFT)

    def test_detail_variant_availability_fields(self):
        url = reverse("product-detail", kwargs={"id": self.product_multi.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        variants_by_sku = {v["sku"]: v for v in response.data["variants"]}
        va = variants_by_sku[self.variant_multi_a.sku]
        vb = variants_by_sku[self.variant_multi_b.sku]

        self.assertEqual(va["available_quantity"], 3)
        self.assertTrue(va["is_available"])
        self.assertEqual(va["stock_status"], STOCK_STATUS_FEW_LEFT)
        self.assertNotIn("reserved_quantity", va)

        self.assertEqual(vb["available_quantity"], 7)
        self.assertTrue(vb["is_available"])
        self.assertEqual(vb["stock_status"], STOCK_STATUS_IN_STOCK)

    def test_detail_reserved_variant_availability(self):
        url = reverse("product-detail", kwargs={"id": self.product_reserved.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        variant = response.data["variants"][0]
        self.assertEqual(variant["available_quantity"], 3)
        self.assertTrue(variant["is_available"])
        self.assertEqual(variant["stock_status"], STOCK_STATUS_FEW_LEFT)

    def test_detail_variant_without_warehouse_item_is_out_of_stock(self):
        url = reverse("product-detail", kwargs={"id": self.product_no_wh.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        variant = response.data["variants"][0]
        self.assertEqual(variant["available_quantity"], 0)
        self.assertFalse(variant["is_available"])
        self.assertEqual(variant["stock_status"], STOCK_STATUS_OUT_OF_STOCK)

    def test_existing_list_fields_remain(self):
        row = self._product_from_category(self.product_single.id)
        for field in (
            "id",
            "name",
            "product_description",
            "price",
            "rating",
            "total_reviews",
            "seller_id",
            "is_age_restricted",
        ):
            self.assertIn(field, row)
