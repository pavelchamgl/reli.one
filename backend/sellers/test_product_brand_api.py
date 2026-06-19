from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Brand, Category, ProductStatus
from sellers.brand_services import (
    BRAND_NAME_ERROR_MAX_LENGTH,
    BRAND_NAME_ERROR_MIN_LENGTH,
    normalize_brand_name,
    resolve_brand_from_text,
)
from sellers.models import SellerProfile


class SellerProductBrandApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-brand@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Brand",
            role=UserRole.SELLER,
            phone_number="+420730444002",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.category = Category.objects.create(name="Seller Brand Category")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.seller_user)

    @staticmethod
    def _seller_products_url() -> str:
        return "/api/sellers/products/"

    @staticmethod
    def _seller_product_url(product_id: int) -> str:
        return f"/api/sellers/products/{product_id}/"

    def _create_payload(self, **overrides) -> dict:
        defaults = {
            "name": "Brand Product",
            "product_description": "Created through seller API.",
            "category": self.category.id,
            "article": "8100000101",
            "vat_rate": "21",
        }
        defaults.update(overrides)
        return defaults

    def _create_product(self, **overrides) -> BaseProduct:
        defaults = {
            "name": "Existing Brand Product",
            "product_description": "Product for seller brand tests.",
            "seller": self.seller_profile,
            "category": self.category,
            "article": "8100000100",
            "vat_rate": Decimal("21.00"),
            "status": ProductStatus.APPROVED,
            "is_active": True,
        }
        defaults.update(overrides)
        return BaseProduct.objects.create(**defaults)

    def test_seller_product_create_with_new_brand(self):
        response = self.client.post(
            self._seller_products_url(),
            self._create_payload(brand_name="  New   Brand  "),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["brand_name"], "New Brand")
        self.assertEqual(response.data["brand_status"], ProductStatus.PENDING)
        self.assertIsNotNone(response.data["brand_id"])

        product = BaseProduct.objects.get(id=response.data["id"])
        self.assertEqual(product.brand.name, "New Brand")
        self.assertEqual(product.brand.status, ProductStatus.PENDING)
        self.assertEqual(product.brand.created_by_id, self.seller_user.id)

    def test_seller_product_create_reuses_existing_brand_case_insensitive(self):
        existing_brand = Brand.objects.create(
            name="Samsung",
            slug="samsung",
            status=ProductStatus.APPROVED,
        )

        response = self.client.post(
            self._seller_products_url(),
            self._create_payload(brand_name="  SAMSUNG "),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["brand_id"], existing_brand.id)
        self.assertEqual(response.data["brand_name"], "Samsung")
        self.assertEqual(response.data["brand_status"], ProductStatus.APPROVED)
        self.assertEqual(Brand.objects.filter(name__iexact="Samsung").count(), 1)

    def test_seller_product_create_without_brand_succeeds(self):
        response = self.client.post(
            self._seller_products_url(),
            self._create_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["brand_id"])
        self.assertIsNone(response.data["brand_name"])
        self.assertIsNone(response.data["brand_status"])
        product = BaseProduct.objects.get(id=response.data["id"])
        self.assertIsNone(product.brand_id)

    def test_seller_product_create_blank_brand_name_has_no_brand(self):
        response = self.client.post(
            self._seller_products_url(),
            self._create_payload(brand_name="   "),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["brand_id"])
        product = BaseProduct.objects.get(id=response.data["id"])
        self.assertIsNone(product.brand_id)

    def test_seller_product_create_rejects_short_brand_name(self):
        response = self.client.post(
            self._seller_products_url(),
            self._create_payload(brand_name="A"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("brand_name", response.data)
        self.assertEqual(response.data["brand_name"][0], BRAND_NAME_ERROR_MIN_LENGTH)

    def test_seller_product_create_rejects_long_brand_name(self):
        response = self.client.post(
            self._seller_products_url(),
            self._create_payload(brand_name="A" * 151),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("brand_name", response.data)
        self.assertEqual(response.data["brand_name"][0], BRAND_NAME_ERROR_MAX_LENGTH)

    def test_seller_product_patch_updates_brand_name(self):
        product = self._create_product()

        response = self.client.patch(
            self._seller_product_url(product.id),
            {"brand_name": "Sony"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand_name"], "Sony")
        self.assertEqual(response.data["brand_status"], ProductStatus.PENDING)
        product.refresh_from_db()
        self.assertEqual(product.brand.name, "Sony")

    def test_seller_product_patch_clears_brand_with_empty_string(self):
        brand = Brand.objects.create(
            name="Philips",
            slug="philips",
            status=ProductStatus.APPROVED,
        )
        product = self._create_product(brand=brand)

        response = self.client.patch(
            self._seller_product_url(product.id),
            {"brand_name": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["brand_id"])
        self.assertIsNone(response.data["brand_name"])
        product.refresh_from_db()
        self.assertIsNone(product.brand_id)

    def test_seller_product_patch_omits_brand_unchanged(self):
        brand = Brand.objects.create(
            name="Philips",
            slug="philips",
            status=ProductStatus.APPROVED,
        )
        product = self._create_product(brand=brand)

        response = self.client.patch(
            self._seller_product_url(product.id),
            {"name": "Renamed product"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand_id"], brand.id)
        self.assertEqual(response.data["brand_name"], "Philips")
        product.refresh_from_db()
        self.assertEqual(product.brand_id, brand.id)

    def test_seller_product_detail_returns_brand_fields(self):
        brand = Brand.objects.create(
            name="Philips",
            slug="philips",
            status=ProductStatus.PENDING,
        )
        product = self._create_product(brand=brand)

        response = self.client.get(self._seller_product_url(product.id), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand_id"], brand.id)
        self.assertEqual(response.data["brand_name"], "Philips")
        self.assertEqual(response.data["brand_status"], ProductStatus.PENDING)

    def test_resolve_brand_builds_unique_slug_on_collision(self):
        Brand.objects.create(name="Other Brand", slug="acme", status=ProductStatus.APPROVED)

        brand = resolve_brand_from_text("ACME Corp", user=self.seller_user)

        self.assertEqual(brand.name, "ACME Corp")
        self.assertNotEqual(brand.slug, "acme")
        self.assertTrue(brand.slug.startswith("acme"))

    def test_resolve_brand_retries_lookup_on_integrity_error(self):
        existing = Brand.objects.create(
            name="Race Brand",
            slug="race-brand",
            status=ProductStatus.APPROVED,
        )

        with patch(
            "sellers.brand_services.Brand.objects.create",
            side_effect=IntegrityError("uniq_brand_name_ci"),
        ):
            brand = resolve_brand_from_text("Race Brand", user=self.seller_user)

        self.assertEqual(brand.id, existing.id)

    def test_resolve_brand_reraises_integrity_error_when_brand_missing(self):
        with patch(
            "sellers.brand_services.Brand.objects.create",
            side_effect=IntegrityError("uniq_brand_name_ci"),
        ):
            with self.assertRaises(IntegrityError):
                resolve_brand_from_text("Missing Brand", user=self.seller_user)

    def test_normalize_brand_name_collapses_whitespace(self):
        self.assertEqual(normalize_brand_name("  Samsung   Galaxy  "), "Samsung Galaxy")
