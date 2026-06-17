from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from sellers.models import SellerProfile


class SellerProductVariantValidationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="Variant Validation Category")

        cls.seller_user = CustomUser.objects.create_user(
            email="variant-validation-seller@example.com",
            password="pass12345",
            first_name="Variant",
            last_name="Seller",
            role=UserRole.SELLER,
            phone_number="+420730200010",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)

        cls.product = BaseProduct.objects.create(
            name="Variant Validation Product",
            product_description="Description",
            seller=cls.seller_profile,
            category=cls.category,
            article="5000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.seller_user)

    def _variants_url(self, product_id=None):
        return f"/api/sellers/products/{product_id or self.product.id}/variants/"

    def _bulk_create_url(self, product_id=None):
        return f"{self._variants_url(product_id)}bulk_create/"

    def _valid_variant_payload(self, **overrides):
        payload = {
            "name": "Color",
            "text": "Black",
            "price": "99.99",
            "weight_grams": 450,
            "width_mm": 120,
            "height_mm": 80,
            "length_mm": 200,
        }
        payload.update(overrides)
        return payload

    def test_create_variant_with_text_without_image(self):
        response = self.client.post(
            self._variants_url(),
            self._valid_variant_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], "Black")
        self.assertFalse(response.data.get("image"))

    def test_create_variant_with_text_and_image(self):
        response = self.client.post(
            self._variants_url(),
            self._valid_variant_payload(
                text="White matte",
                image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], "White matte")
        self.assertTrue(response.data.get("image"))

    def test_reject_variant_without_text(self):
        response = self.client.post(
            self._variants_url(),
            self._valid_variant_payload(text=""),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", response.data)

    def test_reject_variant_without_dimensions(self):
        payload = self._valid_variant_payload()
        del payload["width_mm"]

        response = self.client.post(
            self._variants_url(),
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("width_mm", response.data)

    def test_model_rejects_different_variant_names(self):
        ProductVariant.objects.create(
            product=self.product,
            name="Color",
            text="Black",
            price=Decimal("99.99"),
            weight_grams=450,
            width_mm=120,
            height_mm=80,
            length_mm=200,
        )
        variant = ProductVariant(
            product=self.product,
            name="Size",
            text="Large",
            price=Decimal("109.99"),
            weight_grams=450,
            width_mm=120,
            height_mm=80,
            length_mm=200,
        )

        with self.assertRaises(ValidationError):
            variant.full_clean()

    def test_reject_variant_without_price(self):
        response = self.client.post(
            self._variants_url(),
            self._valid_variant_payload(price=None),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", response.data)

    def test_bulk_create_with_same_name(self):
        response = self.client.post(
            self._bulk_create_url(),
            [
                self._valid_variant_payload(name="Color", text="Black"),
                self._valid_variant_payload(name="Color", text="White"),
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(ProductVariant.objects.filter(product=self.product).count(), 2)
