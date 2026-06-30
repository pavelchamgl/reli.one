"""Tests for currency-aware delivery output (task 032)."""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings

from delivery.models import ShippingRate
from delivery.services.dpd_rates import calculate_dpd_shipping_options
from delivery.services.local_rates import VAT_RATE, _format_option, calculate_shipping_options
from order.models import CourierService
from product.models import BaseProduct, ProductStatus, ProductVariant
from product.services.pricing import convert_canonical_amount
from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.models import SellerProfile


@override_settings(FX_RATE_MARKUP="0.30", VAT_RATE=Decimal("0.21"))
class LocalRatesCurrencyTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.courier = CourierService.objects.create(
            name="Zásilkovna",
            code="zasilkovna",
            active=True,
        )
        ShippingRate.objects.create(
            courier_service=cls.courier,
            country="CZ",
            channel="PUDO",
            category="standard",
            weight_limit="5",
            address_bundle="one",
            price=Decimal("100.00"),
            cod_fee=Decimal("0.00"),
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="delivery-currency@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420700000020",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.product = BaseProduct.objects.create(
            name="Delivery Currency Product",
            product_description="T",
            seller=cls.seller_profile,
            article="7777777777",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            name="Std",
            text="t",
            price=Decimal("100.00"),
            weight_grams=400,
            length_mm=150,
            width_mm=100,
            height_mm=80,
        )

    def _expected_total_czk(self) -> Decimal:
        base = Decimal("100.00")
        fuel = (base * Decimal("0.05")).quantize(Decimal("0.01"))
        toll = Decimal("2.10")
        return base + fuel + toll

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_czk_request_returns_native_koruny(self, _mock_rate):
        total_czk = self._expected_total_czk()
        rate = ShippingRate.objects.first()
        option = _format_option(rate, total_czk, currency="CZK")

        self.assertEqual(option["currency"], "CZK")
        self.assertEqual(option["price"], total_czk)
        expected_gross = (total_czk * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))
        self.assertEqual(option["priceWithVat"], expected_gross)

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_eur_request_uses_pricing_service_markup(self, _mock_rate):
        total_czk = self._expected_total_czk()
        rate = ShippingRate.objects.first()
        option = _format_option(rate, total_czk, currency="EUR")

        net_eur = convert_canonical_amount(total_czk, "EUR")
        gross_eur = (net_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))

        self.assertEqual(option["currency"], "EUR")
        self.assertEqual(option["price"], net_eur)
        self.assertEqual(option["priceWithVat"], gross_eur)

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_calculate_shipping_options_default_currency_is_eur(self, _mock_rate):
        items = [{"sku": self.variant.sku, "quantity": 1}]
        options = calculate_shipping_options(
            country="CZ",
            items=items,
            cod=False,
            currency="EUR",
            variant_map={self.variant.sku: self.variant},
        )
        pudo = next(o for o in options if o["channel"] == "PUDO")
        self.assertEqual(pudo["currency"], "EUR")


@override_settings(FX_RATE_MARKUP="0.30", VAT_RATE=Decimal("0.21"))
class DpdRatesCurrencyTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.courier = CourierService.objects.create(
            name="DPD",
            code="dpd",
            active=True,
        )
        ShippingRate.objects.create(
            courier_service=cls.courier,
            country="CZ",
            channel="HD",
            category="standard",
            weight_limit="1",
            address_bundle="one",
            price=Decimal("80.00"),
            cod_fee=Decimal("0.00"),
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="delivery-dpd@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420700000021",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.product = BaseProduct.objects.create(
            name="DPD Currency Product",
            product_description="T",
            seller=cls.seller_profile,
            article="8888888888",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            name="Std",
            text="t",
            price=Decimal("50.00"),
            weight_grams=300,
            length_mm=100,
            width_mm=80,
            height_mm=60,
        )

    @patch("delivery.services.dpd_rates.split_items_into_parcels_dpd")
    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_dpd_czk_output(self, _mock_rate, mock_split):
        items = [{"sku": self.variant.sku, "quantity": 1}]
        mock_split.return_value = [items]

        options = calculate_dpd_shipping_options(
            country="CZ",
            items=items,
            currency="CZK",
            cod=False,
            variant_map={self.variant.sku: self.variant},
        )
        hd = next(o for o in options if o["channel"] == "HD")
        self.assertEqual(hd["currency"], "CZK")
        self.assertGreater(hd["price"], Decimal("0"))

    @patch("delivery.services.dpd_rates.split_items_into_parcels_dpd")
    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_dpd_eur_output_with_markup(self, _mock_rate, mock_split):
        items = [{"sku": self.variant.sku, "quantity": 1}]
        mock_split.return_value = [items]

        options = calculate_dpd_shipping_options(
            country="CZ",
            items=items,
            currency="EUR",
            cod=False,
            variant_map={self.variant.sku: self.variant},
        )
        hd = next(o for o in options if o["channel"] == "HD")
        self.assertEqual(hd["currency"], "EUR")
        self.assertEqual(hd["price"], convert_canonical_amount(Decimal("80.00"), "EUR"))


@override_settings(FX_RATE_MARKUP="0.30", VAT_RATE=Decimal("0.21"), GLS_FUEL_PCT="0.011")
class GlsRatesCurrencyTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.courier = CourierService.objects.create(
            name="GLS",
            code="gls",
            active=True,
        )
        ShippingRate.objects.create(
            courier_service=cls.courier,
            country="CZ",
            channel="HD",
            category="standard",
            weight_limit="5",
            address_bundle="one",
            price=Decimal("120.00"),
            cod_fee=Decimal("0.00"),
        )

    def _sample_parcel(self) -> dict:
        return {
            "weight_kg": Decimal("2.0"),
            "length_cm": Decimal("30"),
            "width_cm": Decimal("20"),
            "height_cm": Decimal("10"),
            "sum_sides": Decimal("60"),
        }

    def _expected_total_czk(self) -> Decimal:
        base = Decimal("120.00")
        fuel = (base * Decimal("0.011")).quantize(Decimal("0.01"))
        toll = Decimal("2.94")  # ceil(2kg) * 1.47
        return base + fuel + toll

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_gls_hd_czk_returns_native_koruny(self, _mock_rate):
        from delivery.services.gls_rates import _calc_hd_for_parcel

        total_czk = self._expected_total_czk()
        option = _calc_hd_for_parcel(
            country="CZ",
            parcel=self._sample_parcel(),
            cod=False,
            currency="CZK",
            address_bundle="one",
        )
        self.assertEqual(option["currency"], "CZK")
        self.assertEqual(option["price"], total_czk)
        expected_gross = (total_czk * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))
        self.assertEqual(option["priceWithVat"], expected_gross)

    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_gls_hd_eur_uses_pricing_service_markup(self, _mock_rate):
        from delivery.services.gls_rates import _calc_hd_for_parcel

        total_czk = self._expected_total_czk()
        option = _calc_hd_for_parcel(
            country="CZ",
            parcel=self._sample_parcel(),
            cod=False,
            currency="EUR",
            address_bundle="one",
        )
        net_eur = convert_canonical_amount(total_czk, "EUR")
        gross_eur = (net_eur * (Decimal("1") + VAT_RATE)).quantize(Decimal("0.01"))
        self.assertEqual(option["currency"], "EUR")
        self.assertEqual(option["price"], net_eur)
        self.assertEqual(option["priceWithVat"], gross_eur)

    @patch("delivery.services.gls_rates.split_items_into_parcels_gls")
    @patch("product.services.pricing.get_czk_to_eur_rate_cached", return_value=Decimal("25.00"))
    def test_gls_aggregate_eur_matches_canonical_amount(self, _mock_rate, mock_split):
        from delivery.services.gls_rates import calculate_gls_shipping_options

        parcel = self._sample_parcel()
        mock_split.side_effect = lambda items, variant_map=None, service="HD", country="CZ": (
            [parcel] if service == "HD" else []
        )

        result = calculate_gls_shipping_options(
            country="CZ",
            items=[{"sku": "000000001", "quantity": 1}],
            currency="EUR",
            variant_map={},
        )
        hd = next(o for o in result["options"] if o["channel"] == "HD")
        self.assertEqual(hd["currency"], "EUR")
        self.assertEqual(hd["price"], convert_canonical_amount(self._expected_total_czk(), "EUR"))
