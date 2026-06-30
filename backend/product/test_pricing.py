"""Unit and API tests for multi-currency pricing (task 031)."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.constants import ACQUIRING_RATE
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from product.serializers import BaseProductListSerializer, ProductVariantSerializer
from product.services.pricing import convert_canonical_amount, get_display_currency
from sellers.models import SellerProfile
from warehouses.models import Warehouse


@override_settings(
    DEFAULT_DISPLAY_CURRENCY="CZK",
    SUPPORTED_DISPLAY_CURRENCIES=["CZK", "EUR"],
    FX_RATE_MARKUP="0.30",
)
class ConvertCanonicalAmountTests(TestCase):
    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_czk_whole_amount_unchanged(self, _mock_rate):
        self.assertEqual(convert_canonical_amount(Decimal("599"), "CZK"), Decimal("599"))

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_czk_fraction_ceiled_to_whole_koruna(self, _mock_rate):
        self.assertEqual(convert_canonical_amount(Decimal("598.10"), "CZK"), Decimal("599"))

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_eur_exact_conversion(self, _mock_rate):
        # 2470 / (25 - 0.30) = 2470 / 24.70 = 100.00
        self.assertEqual(convert_canonical_amount(Decimal("2470"), "EUR"), Decimal("100.00"))

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_eur_fraction_ceiled_to_cent(self, _mock_rate):
        # 2471 / 24.70 = 100.0405 → ceil 0.01 = 100.05
        self.assertEqual(convert_canonical_amount(Decimal("2471"), "EUR"), Decimal("100.05"))


@override_settings(
    DEFAULT_DISPLAY_CURRENCY="CZK",
    SUPPORTED_DISPLAY_CURRENCIES=["CZK", "EUR"],
    FX_RATE_MARKUP="0.30",
)
class GetDisplayCurrencyTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_query_param_eur(self):
        request = self.factory.get("/products/", {"currency": "eur"})
        self.assertEqual(get_display_currency(request), "EUR")

    def test_header_eur(self):
        request = self.factory.get("/products/", HTTP_X_DISPLAY_CURRENCY="EUR")
        self.assertEqual(get_display_currency(request), "EUR")

    def test_default_czk_when_missing(self):
        request = self.factory.get("/products/")
        self.assertEqual(get_display_currency(request), "CZK")

    def test_invalid_currency_falls_back_to_default(self):
        request = self.factory.get("/products/", {"currency": "XXX"})
        self.assertEqual(get_display_currency(request), "CZK")

    def test_none_request_returns_default(self):
        self.assertEqual(get_display_currency(None), "CZK")


@override_settings(
    DEFAULT_DISPLAY_CURRENCY="CZK",
    SUPPORTED_DISPLAY_CURRENCIES=["CZK", "EUR"],
    FX_RATE_MARKUP="0.30",
)
class PricingSerializerApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wh = Warehouse.objects.create(
            name="WH-Pricing-Test",
            street="S",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-pricing@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420730000099",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.wh
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.category = Category.objects.create(name="PricingCat")
        cls.product = BaseProduct.objects.create(
            name="Pricing Product",
            product_description="Pricing test product.",
            seller=cls.seller_profile,
            category=cls.category,
            article="9000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            name="V",
            text="t",
            price=Decimal("2470.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )

    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_variant_serializer_default_czk(self, _mock_rate):
        request = self.factory.get("/products/1/")
        data = ProductVariantSerializer(
            self.variant, context={"request": request}
        ).data
        acq = (Decimal("2470.00") * ACQUIRING_RATE).quantize(Decimal("0.01"))
        expected = str(convert_canonical_amount(acq, "CZK"))
        self.assertEqual(data["currency"], "CZK")
        self.assertEqual(data["price"], expected)

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_variant_serializer_eur_query_param(self, _mock_rate):
        request = self.factory.get("/products/1/", {"currency": "EUR"})
        data = ProductVariantSerializer(
            self.variant, context={"request": request}
        ).data
        acq = (Decimal("2470.00") * ACQUIRING_RATE).quantize(Decimal("0.01"))
        expected = str(convert_canonical_amount(acq, "EUR"))
        self.assertEqual(data["currency"], "EUR")
        self.assertEqual(data["price"], expected)

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_list_serializer_currency_and_price(self, _mock_rate):
        self.product.final_min_price = (
            Decimal("2470.00") * ACQUIRING_RATE
        ).quantize(Decimal("0.01"))
        request = self.factory.get("/products/", {"currency": "EUR"})
        request.user = AnonymousUser()
        data = BaseProductListSerializer(
            self.product, context={"request": request}
        ).data
        expected = str(
            convert_canonical_amount(self.product.final_min_price, "EUR")
        )
        self.assertEqual(data["currency"], "EUR")
        self.assertEqual(data["price"], expected)
