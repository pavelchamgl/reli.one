"""
Минимальные регрессионные тесты цепочки checkout → Stripe/PayPal session → webhook → order.
Внешние API (Stripe, PayPal verify, тарифы перевозчиков, DPD ZIP) мокируются.

Интеграционные классы (*WebhookFlowTests, CreateStripeSessionTests, …) требуют PostgreSQL
согласно `DATABASES` в settings (локально часто Docker-хост `postgres_db`).
"""
from __future__ import annotations

import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.files.base import ContentFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from order.models import CourierService, DeliveryType, Order, OrderStatus, OrderProduct
from payment.mixins import PayPalMixin
from payment.models import Payment, PayPalMetadata, StripeMetadata
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem


def _resolved_zip_ok():
    return SimpleNamespace(valid=True, normalized_postcode="11000", city="Praha", source="test")


class CheckoutCatalogMixin:
    """Минимальный каталог: продавец CZ, вариант, WarehouseItem (склад для webhook), справочники."""

    @classmethod
    def setUpCatalog(cls):
        cls.warehouse = Warehouse.objects.create(
            name=f"Test-WH-{cls.__name__}",
            street="Industrial 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )

        slug = cls.__name__.lower()
        cls.seller_user = CustomUser.objects.create_user(
            email=f"seller-{slug}@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Test",
            role=UserRole.SELLER,
            phone_number=f"+420710{abs(hash(slug)) % 1000000:06d}",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.warehouse
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.customer = CustomUser.objects.create_user(
            email=f"buyer-{slug}@example.com",
            password="pass12345",
            first_name="Buyer",
            last_name="Test",
            role=UserRole.CUSTOMER,
            phone_number=f"+420720{abs(hash(slug + 'c')) % 1000000:06d}",
        )

        article_num = abs(hash(cls.__name__)) % 10_000_000_000
        cls.base_product = BaseProduct.objects.create(
            name="Checkout Product",
            product_description="Test",
            seller=cls.seller_profile,
            article=f"{article_num:010d}",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.base_product,
            name="Std",
            text="x",
            price=Decimal("10.00"),
            weight_grams=500,
            length_mm=200,
            width_mm=150,
            height_mm=100,
        )
        WarehouseItem.objects.create(
            warehouse=cls.warehouse,
            product_variant=cls.variant,
            quantity_in_stock=50,
        )

        # Контракт API / payment.views.CHANNEL_MAP и GroupSerializer завязаны на
        # фиксированные значения: delivery_type 1=PUDO, 2=HD; courier_service 2/3/4.
        DeliveryType.objects.all().delete()
        cls.dt_pudo = DeliveryType.objects.create(pk=1, name="PUDO")
        cls.dt_hd = DeliveryType.objects.create(pk=2, name="Home Delivery")
        cls.order_status_pending, _ = OrderStatus.objects.get_or_create(name="Pending")

        CourierService.objects.all().delete()
        cls.cs_packeta = CourierService.objects.create(
            pk=2, code="packeta", name="Packeta", active=True
        )
        cls.cs_gls = CourierService.objects.create(pk=3, code="gls", name="GLS", active=True)
        cls.cs_dpd = CourierService.objects.create(pk=4, code="dpd", name="DPD", active=True)


class CreateStripeSessionTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.customer)

    def _packeta_hd_payload(self):
        return {
            "email": self.customer.email,
            "first_name": "Buyer",
            "last_name": "Test",
            "phone": "+420777123456",
            "delivery_address": {
                "street": "Test 9",
                "city": "Praha",
                "zip": "11000",
                "country": "CZ",
            },
            "groups": [
                {
                    "seller_id": self.seller_profile.id,
                    "delivery_type": 2,
                    "courier_service": 2,
                    "delivery_address": {
                        "street": "Test 9",
                        "city": "Praha",
                        "zip": "11000",
                        "country": "CZ",
                    },
                    "products": [{"sku": self.variant.sku, "quantity": 2}],
                }
            ],
        }

    @patch("payment.services.stripe_checkout.stripe.checkout.Session.create")
    @patch("payment.services.stripe_session.calculate_order_shipping")
    @patch("payment.services.stripe_session.validate_phone_matches_country", return_value=None)
    @patch("payment.services.stripe_session.ZipCodeValidator.validate_and_resolve", return_value=_resolved_zip_ok())
    @patch(
        "payment.serializers.normalize_and_validate_phone",
        return_value="+420777123456",
    )
    def test_create_stripe_session_success(
        self,
        _mock_norm_top_phone,
        _mock_zip,
        _mock_phone,
        mock_ship,
        mock_stripe_create,
    ):
        mock_ship.return_value = {
            "options": [
                {
                    "channel": "HD",
                    "service": "Home Delivery",
                    "price": Decimal("4.31"),
                    "priceWithVat": Decimal("5.21"),
                    "currency": "EUR",
                    "courier": "Zásilkovna",
                }
            ],
            "total_parcels": 1,
        }
        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.test/pay/cs_mock"
        mock_session.id = "cs_test_mock_session"
        mock_stripe_create.return_value = mock_session

        url = reverse("create_checkout_session")
        response = self.client.post(url, self._packeta_hd_payload(), format="json")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            msg=getattr(response, "data", None) or response.content,
        )
        self.assertIn("checkout_url", response.data)
        self.assertIn("session_key", response.data)
        self.assertEqual(response.data["checkout_url"], mock_session.url)

        mock_ship.assert_called()
        _, kwargs = mock_ship.call_args
        self.assertEqual(kwargs.get("country"), "CZ")
        self.assertEqual(
            kwargs.get("items"),
            [{"sku": self.variant.sku, "quantity": 2}],
        )

        meta = StripeMetadata.objects.get(session_key=response.data["session_key"])
        self.assertIn("groups", meta.invoice_data)
        self.assertEqual(len(meta.invoice_data["groups"]), 1)

    @patch(
        "payment.serializers.normalize_and_validate_phone",
        return_value="+420777123456",
    )
    def test_create_stripe_session_invalid_gls_pudo_without_delivery_mode(
        self,
        _mock_norm_top_phone,
    ):
        url = reverse("create_checkout_session")
        bad = self._packeta_hd_payload()
        bad["groups"] = [
            {
                "seller_id": self.seller_profile.id,
                "delivery_type": 1,
                "courier_service": 3,
                "pickup_point_id": "GLS-POINT-1",
                "products": [{"sku": self.variant.sku, "quantity": 1}],
            }
        ]
        response = self.client.post(url, bad, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        blob = json.dumps(response.data, default=str).lower()
        self.assertTrue(
            any(
                part in blob
                for part in (
                    "groups",
                    "delivery_mode",
                    "gls",
                    "shop",
                    "box",
                    "pudo",
                    "non_field",
                )
            ),
            msg=f"Ожидалась ошибка валидации группы (GLS PUDO), получено: {response.data!r}",
        )


class DpdBranchTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.customer)

    @patch("payment.services.stripe_checkout.stripe.checkout.Session.create")
    @patch("payment.services.stripe_session.calculate_order_shipping_dpd")
    @patch("payment.services.stripe_session.validate_phone_matches_country", return_value=None)
    @patch("payment.services.stripe_session.ZipCodeValidator.validate_and_resolve", return_value=_resolved_zip_ok())
    @patch(
        "payment.serializers.normalize_and_validate_phone",
        return_value="+420777123456",
    )
    def test_dpd_group_calls_dpd_calculator_not_packeta(
        self,
        _mock_norm_top_phone,
        _mock_zip,
        _mock_phone,
        mock_dpd,
        mock_stripe_create,
    ):
        mock_dpd.return_value = {
            "options": [
                {
                    "channel": "HD",
                    "service": "Home Delivery",
                    "price": Decimal("4.00"),
                    "priceWithVat": Decimal("5.00"),
                    "currency": "EUR",
                    "courier": "DPD",
                }
            ],
            "total_parcels": {"PUDO": 0, "HD": 1},
        }
        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.test/pay/cs_dpd"
        mock_session.id = "cs_test_dpd"
        mock_stripe_create.return_value = mock_session

        payload = {
            "email": self.customer.email,
            "first_name": "Buyer",
            "last_name": "Test",
            "phone": "+420777123456",
            "delivery_address": {
                "street": "Test 9",
                "city": "Praha",
                "zip": "11000",
                "country": "CZ",
            },
            "groups": [
                {
                    "seller_id": self.seller_profile.id,
                    "delivery_type": 2,
                    "courier_service": 4,
                    "delivery_address": {
                        "street": "Test 9",
                        "city": "Praha",
                        "zip": "11000",
                        "country": "CZ",
                    },
                    "products": [{"sku": self.variant.sku, "quantity": 1}],
                }
            ],
        }

        with patch("payment.services.stripe_session.calculate_order_shipping") as mock_packeta:
            url = reverse("create_checkout_session")
            response = self.client.post(url, payload, format="json")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            msg=getattr(response, "data", None) or response.content,
        )
        mock_packeta.assert_not_called()


class StripeWebhookFlowTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    def setUp(self):
        self.client = APIClient()

    def _make_checkout_event(self, session_id: str, session_key: str, amount_cents: int):
        return {
            "id": "evt_1",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": session_id,
                    "metadata": {"session_key": session_key},
                    "amount_total": amount_cents,
                    "currency": "eur",
                    "customer": None,
                    "payment_intent": "pi_mock",
                }
            },
        }

    @patch("payment.views.async_parcels_and_seller_email")
    @patch("payment.views.async_send_client_email")
    @patch("payment.views.generate_invoice_pdf", return_value=ContentFile(b"%PDF-1.4 test", name="inv.pdf"))
    @patch("payment.views.stripe.Webhook.construct_event")
    def test_webhook_idempotent_no_duplicate_orders(
        self,
        mock_construct,
        _mock_pdf,
        _mock_email_client,
        _mock_parcels,
    ):
        delivery_opt = Decimal("5.21")
        unit_acq = self.variant.price_with_acquiring
        qty = 2
        line_net = (unit_acq * qty).quantize(Decimal("0.01"))
        group_total = (line_net + delivery_opt).quantize(Decimal("0.01"))
        gross_total = group_total

        session_key = "test-session-key-uuid"
        session_id = "cs_test_webhook_1"

        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(self.customer.id),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "Test",
                "phone": "+420777123456",
                "delivery_address": {
                    "street": "Test 9",
                    "city": "Praha",
                    "zip": "11000",
                    "country": "CZ",
                },
            },
            invoice_data={
                "invoice_number": "2026000999",
                "groups": [
                    {
                        "seller_id": self.seller_profile.id,
                        "delivery_type": 2,
                        "courier_service": 2,
                        "delivery_address": {
                            "street": "Test 9",
                            "city": "Praha",
                            "zip": "11000",
                            "country": "CZ",
                        },
                        "products": [{"sku": self.variant.sku, "quantity": qty}],
                        "calculated_delivery_cost": str(delivery_opt),
                        "calculated_total_parcels": 1,
                        "calculated_group_total": str(group_total),
                    }
                ],
            },
            description_data={
                "gross_total": str(gross_total),
                "delivery_total": str(delivery_opt),
                "variable_symbol": "2026000999",
            },
        )

        event = self._make_checkout_event(
            session_id,
            session_key,
            int(gross_total * 100),
        )
        mock_construct.return_value = event

        url = reverse("stripe_webhook")
        r1 = self.client.post(
            url,
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig_mock",
        )
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        orders_after_first = Order.objects.count()
        self.assertEqual(orders_after_first, 1)
        self.assertEqual(Payment.objects.filter(session_id=session_id).count(), 1)
        wi = WarehouseItem.objects.get(product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 50)

        r2 = self.client.post(
            url,
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig_mock",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.count(), orders_after_first)
        self.assertEqual(Payment.objects.filter(session_id=session_id).count(), 1)
        wi.refresh_from_db()
        self.assertEqual(wi.quantity_in_stock, 50)

    @patch("payment.views.async_parcels_and_seller_email")
    @patch("payment.views.async_send_client_email")
    @patch("payment.views.generate_invoice_pdf", return_value=ContentFile(b"%PDF-1.4 test", name="inv.pdf"))
    @patch("payment.views.stripe.Webhook.construct_event")
    def test_webhook_order_products_and_totals(
        self,
        mock_construct,
        _mock_pdf,
        _mock_email_client,
        _mock_parcels,
    ):
        delivery_opt = Decimal("5.21")
        unit_acq = self.variant.price_with_acquiring
        qty = 3
        line_net = (unit_acq * qty).quantize(Decimal("0.01"))
        group_total = (line_net + delivery_opt).quantize(Decimal("0.01"))

        session_key = "test-session-key-totals"
        session_id = "cs_test_totals"

        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(self.customer.id),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "Test",
                "phone": "+420777123456",
                "delivery_address": {
                    "street": "Main 1",
                    "city": "Praha",
                    "zip": "12000",
                    "country": "CZ",
                },
            },
            invoice_data={
                "invoice_number": "2026000888",
                "groups": [
                    {
                        "seller_id": self.seller_profile.id,
                        "delivery_type": 2,
                        "courier_service": 2,
                        "delivery_address": {
                            "street": "Main 1",
                            "city": "Praha",
                            "zip": "12000",
                            "country": "CZ",
                        },
                        "products": [{"sku": self.variant.sku, "quantity": qty}],
                        "calculated_delivery_cost": str(delivery_opt),
                        "calculated_total_parcels": 1,
                        "calculated_group_total": str(group_total),
                    }
                ],
            },
            description_data={
                "gross_total": str(group_total),
                "delivery_total": str(delivery_opt),
                "variable_symbol": "2026000888",
            },
        )

        mock_construct.return_value = self._make_checkout_event(
            session_id,
            session_key,
            int(group_total * 100),
        )

        url = reverse("stripe_webhook")
        response = self.client.post(
            url,
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig_mock",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order = Order.objects.get()
        self.assertEqual(order.group_subtotal, group_total)
        self.assertEqual(order.delivery_cost, delivery_opt)

        op = OrderProduct.objects.get(order=order)
        self.assertEqual(op.quantity, qty)
        self.assertEqual(op.product_price, unit_acq)
        self.assertEqual(op.product_id, self.variant.id)

        pay = Payment.objects.get(session_id=session_id)
        self.assertEqual(pay.amount_total, group_total)

        wi = WarehouseItem.objects.get(product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 50)


class PayPalWebhookFlowTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    def setUp(self):
        self.client = APIClient()

    def _make_paypal_order_completed_payload(
        self, paypal_order_id: str, session_key: str, amount: Decimal
    ):
        amt = str(amount.quantize(Decimal("0.01")))
        return {
            "event_type": "CHECKOUT.ORDER.COMPLETED",
            "resource": {
                "id": paypal_order_id,
                "purchase_units": [
                    {
                        "reference_id": session_key,
                        "amount": {"value": amt, "currency_code": "EUR"},
                    }
                ],
            },
        }

    @patch("payment.views.async_parcels_and_seller_email")
    @patch("payment.views.async_send_client_email")
    @patch("payment.views.generate_invoice_pdf", return_value=ContentFile(b"%PDF-1.4 test", name="inv.pdf"))
    @patch.object(PayPalMixin, "verify_webhook", return_value=True)
    def test_paypal_webhook_idempotent_no_duplicate_orders(
        self,
        _mock_verify,
        _mock_pdf,
        _mock_email_client,
        _mock_parcels,
    ):
        delivery_opt = Decimal("5.21")
        unit_acq = self.variant.price_with_acquiring
        qty = 2
        line_net = (unit_acq * qty).quantize(Decimal("0.01"))
        group_total = (line_net + delivery_opt).quantize(Decimal("0.01"))
        gross_total = group_total

        session_key = "paypal-session-key-webhook-1"
        paypal_order_id = "PP-ORDER-WH-1"

        PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(self.customer.id),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "Test",
                "phone": "+420777123456",
                "delivery_address": {
                    "street": "Test 9",
                    "city": "Praha",
                    "zip": "11000",
                    "country": "CZ",
                },
            },
            invoice_data={
                "invoice_number": "2026001999",
                "groups": [
                    {
                        "seller_id": self.seller_profile.id,
                        "delivery_type": 2,
                        "courier_service": 2,
                        "delivery_address": {
                            "street": "Test 9",
                            "city": "Praha",
                            "zip": "11000",
                            "country": "CZ",
                        },
                        "products": [{"sku": self.variant.sku, "quantity": qty}],
                        "calculated_delivery_cost": str(delivery_opt),
                        "calculated_total_parcels": 1,
                        "calculated_group_total": str(group_total),
                    }
                ],
            },
            description_data={
                "gross_total": str(gross_total),
                "delivery_total": str(delivery_opt),
                "variable_symbol": "2026001999",
            },
        )

        payload = self._make_paypal_order_completed_payload(
            paypal_order_id, session_key, gross_total
        )
        body = json.dumps(payload).encode("utf-8")
        url = reverse("paypal_webhook")

        r1 = self.client.post(
            url,
            data=body,
            content_type="application/json",
        )
        self.assertEqual(r1.status_code, status.HTTP_200_OK, r1.data)
        self.assertEqual(Order.objects.count(), 1)
        wi = WarehouseItem.objects.get(product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 50)
        self.assertEqual(
            Payment.objects.filter(
                payment_system="paypal", session_id=paypal_order_id
            ).count(),
            1,
        )

        r2 = self.client.post(
            url,
            data=body,
            content_type="application/json",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK, r2.data)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(
            Payment.objects.filter(
                payment_system="paypal", session_id=paypal_order_id
            ).count(),
            1,
        )
        self.assertEqual(
            r2.data.get("status"),
            "0 order(s) created successfully",
        )
        wi.refresh_from_db()
        self.assertEqual(wi.quantity_in_stock, 50)

    @patch("payment.views.async_parcels_and_seller_email")
    @patch("payment.views.async_send_client_email")
    @patch("payment.views.generate_invoice_pdf", return_value=ContentFile(b"%PDF-1.4 test", name="inv.pdf"))
    @patch.object(PayPalMixin, "verify_webhook", return_value=True)
    def test_paypal_webhook_order_products_and_totals(
        self,
        _mock_verify,
        _mock_pdf,
        _mock_email_client,
        _mock_parcels,
    ):
        delivery_opt = Decimal("5.21")
        unit_acq = self.variant.price_with_acquiring
        qty = 3
        line_net = (unit_acq * qty).quantize(Decimal("0.01"))
        group_total = (line_net + delivery_opt).quantize(Decimal("0.01"))

        session_key = "paypal-session-key-totals"
        paypal_order_id = "PP-ORDER-TOTALS"

        PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(self.customer.id),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "Test",
                "phone": "+420777123456",
                "delivery_address": {
                    "street": "Main 1",
                    "city": "Praha",
                    "zip": "12000",
                    "country": "CZ",
                },
            },
            invoice_data={
                "invoice_number": "2026001888",
                "groups": [
                    {
                        "seller_id": self.seller_profile.id,
                        "delivery_type": 2,
                        "courier_service": 2,
                        "delivery_address": {
                            "street": "Main 1",
                            "city": "Praha",
                            "zip": "12000",
                            "country": "CZ",
                        },
                        "products": [{"sku": self.variant.sku, "quantity": qty}],
                        "calculated_delivery_cost": str(delivery_opt),
                        "calculated_total_parcels": 1,
                        "calculated_group_total": str(group_total),
                    }
                ],
            },
            description_data={
                "gross_total": str(group_total),
                "delivery_total": str(delivery_opt),
                "variable_symbol": "2026001888",
            },
        )

        payload = self._make_paypal_order_completed_payload(
            paypal_order_id, session_key, group_total
        )
        body = json.dumps(payload).encode("utf-8")
        url = reverse("paypal_webhook")

        response = self.client.post(
            url,
            data=body,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        order = Order.objects.get()
        self.assertEqual(order.group_subtotal, group_total)
        self.assertEqual(order.delivery_cost, delivery_opt)

        op = OrderProduct.objects.get(order=order)
        self.assertEqual(op.quantity, qty)
        self.assertEqual(op.product_price, unit_acq)
        self.assertEqual(op.product_id, self.variant.id)

        pay = Payment.objects.get(session_id=paypal_order_id, payment_system="paypal")
        self.assertEqual(pay.amount_total, group_total)
        desc = PayPalMetadata.objects.get(session_key=session_key).description_data
        self.assertEqual(Decimal(str(desc["gross_total"])), group_total)

        wi = WarehouseItem.objects.get(product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 50)
