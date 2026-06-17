from __future__ import annotations

from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from sellers.models import SellerProfile


class SellerProductAdditionalDetailsApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-additional-details@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Details",
            role=UserRole.SELLER,
            phone_number="+420730444001",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.category = Category.objects.create(name="Seller Additional Details Category")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.seller_user)

    @staticmethod
    def _seller_products_url() -> str:
        return "/api/sellers/products/"

    @staticmethod
    def _seller_product_url(product_id: int) -> str:
        return f"/api/sellers/products/{product_id}/"

    def _create_product(self, **overrides) -> BaseProduct:
        defaults = {
            "name": "Additional Details Product",
            "product_description": "Product for seller additional details tests.",
            "seller": self.seller_profile,
            "category": self.category,
            "article": "8100000001",
            "vat_rate": Decimal("21.00"),
            "status": ProductStatus.APPROVED,
            "is_active": True,
        }
        defaults.update(overrides)
        return BaseProduct.objects.create(**defaults)

    def test_seller_product_create_accepts_country_and_warranty(self):
        response = self.client.post(
            self._seller_products_url(),
            {
                "name": "Warranty Product",
                "product_description": "Created through seller API.",
                "category": self.category.id,
                "article": "8100000002",
                "vat_rate": "21",
                "country_of_origin": "Czech Republic",
                "warranty_months": 24,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["country_of_origin"], "Czech Republic")
        self.assertEqual(response.data["warranty_months"], 24)
        product = BaseProduct.objects.get(id=response.data["id"])
        self.assertEqual(product.country_of_origin, "Czech Republic")
        self.assertEqual(product.warranty_months, 24)

    def test_seller_product_patch_updates_country_and_warranty(self):
        product = self._create_product(country_of_origin="Poland", warranty_months=12)

        response = self.client.patch(
            self._seller_product_url(product.id),
            {
                "country_of_origin": "Germany",
                "warranty_months": 36,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["country_of_origin"], "Germany")
        self.assertEqual(response.data["warranty_months"], 36)
        product.refresh_from_db()
        self.assertEqual(product.country_of_origin, "Germany")
        self.assertEqual(product.warranty_months, 36)

    def test_seller_product_rejects_invalid_warranty_months(self):
        response = self.client.post(
            self._seller_products_url(),
            {
                "name": "Invalid Warranty Product",
                "product_description": "Created through seller API.",
                "category": self.category.id,
                "article": "8100000003",
                "vat_rate": "21",
                "warranty_months": 0,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("warranty_months", response.data)

    def test_seller_product_detail_returns_country_and_warranty(self):
        product = self._create_product(country_of_origin="Slovakia", warranty_months=18)

        response = self.client.get(self._seller_product_url(product.id), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["country_of_origin"], "Slovakia")
        self.assertEqual(response.data["warranty_months"], 18)

    def test_public_product_detail_returns_country_and_warranty(self):
        product = self._create_product(country_of_origin="Austria", warranty_months=30)
        ProductVariant.objects.create(
            product=product,
            name="Style",
            text="Default",
            price=Decimal("50.00"),
        )

        response = APIClient().get(reverse("product-detail", kwargs={"id": product.id}), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["country_of_origin"], "Austria")
        self.assertEqual(response.data["warranty_months"], 30)
