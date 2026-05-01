"""
Регрессия: seller shipping estimate вызывает Packeta pipeline (split + calc), не ходит в реальные API.
"""
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem


class SellerShippingOptionsPacketaTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.warehouse = Warehouse.objects.create(
            name="Test Warehouse CZ Shipping",
            street="Industrial 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-ship@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420700000010",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.warehouse
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.base_product = BaseProduct.objects.create(
            name="Ship Product",
            product_description="T",
            seller=cls.seller_profile,
            article="9876543210",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.base_product,
            name="Std",
            text="t",
            price=Decimal("10.00"),
            weight_grams=400,
            length_mm=150,
            width_mm=100,
            height_mm=80,
        )
        WarehouseItem.objects.create(
            warehouse=cls.warehouse,
            product_variant=cls.variant,
            quantity_in_stock=20,
        )

    def setUp(self):
        self.client = APIClient()

    @patch("delivery.views.calculate_gls_shipping_options")
    @patch("delivery.views.calc_dpd_wrap")
    @patch("delivery.views.calc_packeta")
    @patch("delivery.views.split_packeta")
    def test_invokes_packeta_split_and_rate_for_zasilkovna_block(
        self,
        mock_split,
        mock_calc_packeta,
        mock_dpd,
        mock_gls,
    ):
        items = [{"sku": self.variant.sku, "quantity": 1}]
        mock_split.return_value = [items]
        mock_calc_packeta.return_value = [
            {
                "channel": "PUDO",
                "service": "Pick-up point",
                "price": Decimal("4.31"),
                "priceWithVat": Decimal("5.21"),
                "currency": "EUR",
                "courier": "Zásilkovna",
                "estimate": "",
            },
            {
                "channel": "HD",
                "service": "Home Delivery",
                "price": Decimal("5.90"),
                "priceWithVat": Decimal("7.14"),
                "currency": "EUR",
                "courier": "Zásilkovna",
                "estimate": "",
            },
        ]
        mock_dpd.return_value = {
            "total_parcels": {"PUDO": 1, "HD": 1},
            "options": [
                {
                    "channel": "PUDO",
                    "service": "Pick-up point",
                    "price": Decimal("1"),
                    "priceWithVat": Decimal("1"),
                    "currency": "EUR",
                    "courier": "DPD",
                },
            ],
        }
        mock_gls.return_value = {
            "total_parcels": 1,
            "options": [
                {
                    "channel": "HD",
                    "service": "Home Delivery",
                    "price": Decimal("1"),
                    "priceWithVat": Decimal("1"),
                    "currency": "EUR",
                    "courier": "GLS",
                },
            ],
        }

        url = reverse("seller-shipping-options")
        response = self.client.post(
            url,
            {
                "seller_id": self.seller_profile.id,
                "destination_country": "CZ",
                "items": items,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_split.assert_called_once()
        _, split_kw = mock_split.call_args
        self.assertEqual(split_kw["country"], "CZ")
        self.assertEqual(split_kw["items"], items)

        mock_calc_packeta.assert_called_once()
        _, calc_kw = mock_calc_packeta.call_args
        self.assertEqual(calc_kw["country"], "CZ")
        self.assertEqual(calc_kw["items"], items)
        self.assertEqual(calc_kw["currency"], "EUR")
        self.assertFalse(calc_kw["cod"])

        self.assertIn("couriers", response.data)
        self.assertIn("zasilkovna", response.data["couriers"])
