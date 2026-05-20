"""
Task 013 follow-up — payment session TTL aligned with stock reservation.
"""
from __future__ import annotations

import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from order.models import Order
from payment.mixins import PayPalMixin
from payment.models import PayPalMetadata, StripeMetadata
from payment.services.reservation_payment import stripe_checkout_expires_at_unix
from payment.test_checkout_flow import (
    CheckoutCatalogMixin,
    _resolved_zip_ok,
)
from warehouses.models import StockReservation, WarehouseItem
from warehouses.services.reservation import StockReservationService


class StripeCheckoutExpiresAtTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.customer)

    def _payload(self, quantity=1):
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
                    "products": [{"sku": self.variant.sku, "quantity": quantity}],
                }
            ],
        }

    @override_settings(STOCK_RESERVATION_ENABLED=True)
    @patch("payment.services.stripe_checkout.stripe.checkout.Session.create")
    @patch("payment.services.stripe_session.calculate_order_shipping")
    @patch("payment.services.stripe_session.validate_phone_matches_country", return_value=None)
    @patch("payment.services.stripe_session.ZipCodeValidator.validate_and_resolve", return_value=_resolved_zip_ok())
    @patch(
        "payment.serializers.normalize_and_validate_phone",
        return_value="+420777123456",
    )
    def test_stripe_session_created_with_expires_at_aligned_to_reservation(
        self,
        _mock_phone_norm,
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
        mock_session.url = "https://checkout.stripe.test/pay/cs_ttl"
        mock_session.id = "cs_ttl_align"
        mock_stripe_create.return_value = mock_session

        response = self.client.post(
            reverse("create_checkout_session"),
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        reservation = StockReservation.objects.get(session_key=response.data["session_key"])
        self.assertEqual(reservation.provider_checkout_id, "cs_ttl_align")

        mock_stripe_create.assert_called_once()
        call_kwargs = mock_stripe_create.call_args.kwargs
        self.assertIn("expires_at", call_kwargs)
        self.assertEqual(
            call_kwargs["expires_at"],
            stripe_checkout_expires_at_unix(reservation.expires_at),
        )


class LatePaymentWebhookBlockTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    def setUp(self):
        self.client = APIClient()

    def _stripe_group_meta(self, qty: int, delivery_opt: Decimal, group_total: Decimal):
        return {
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

    @override_settings(STOCK_RESERVATION_ENABLED=True)
    @patch("payment.services.webhook_processing.async_parcels_and_seller_email")
    @patch("payment.services.webhook_processing.async_send_client_email")
    @patch(
        "payment.services.webhook_processing.generate_invoice_pdf",
        return_value=ContentFile(b"%PDF-1.4 test", name="inv.pdf"),
    )
    @patch("payment.views.stripe.Webhook.construct_event")
    def test_stripe_success_after_expired_reservation_does_not_create_order(
        self,
        mock_construct,
        _mock_pdf,
        _mock_email,
        _mock_parcels,
    ):
        qty = 1
        delivery_opt = Decimal("5.21")
        group_total = (self.variant.price_with_acquiring * qty + delivery_opt).quantize(
            Decimal("0.01")
        )
        session_key = "stripe-late-expired-key"
        session_id = "cs_late_expired"

        StockReservationService.create_reservation(
            session_key=session_key,
            payment_system="stripe",
            groups=[{"products": [{"sku": self.variant.sku, "quantity": qty}]}],
            variant_map={self.variant.sku: self.variant},
        )
        reservation = StockReservation.objects.get(session_key=session_key)
        reservation.expires_at = timezone.now() - timedelta(minutes=5)
        reservation.provider_checkout_id = session_id
        reservation.save(update_fields=["expires_at", "provider_checkout_id"])
        StockReservationService.release_reservation(
            session_key,
            final_status=StockReservation.Status.EXPIRED,
        )

        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(self.customer.id),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "Test",
                "phone": "+420777123456",
                "delivery_address": {"country": "CZ"},
            },
            invoice_data={
                "invoice_number": "2026003101",
                "groups": [self._stripe_group_meta(qty, delivery_opt, group_total)],
            },
            description_data={
                "gross_total": str(group_total),
                "delivery_total": str(delivery_opt),
                "variable_symbol": "2026003101",
            },
        )

        mock_construct.return_value = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": session_id,
                    "metadata": {"session_key": session_key},
                    "amount_total": int(group_total * 100),
                    "currency": "eur",
                    "payment_intent": "pi_late",
                }
            },
        }

        response = self.client.post(
            reverse("stripe_webhook"),
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data.get("status"),
            "payment_received_reservation_expired_manual_review",
        )
        self.assertEqual(Order.objects.count(), 0)

        wi = WarehouseItem.objects.get(product_variant=self.variant)
        self.assertEqual(wi.quantity_in_stock, 50)
        self.assertEqual(wi.reserved_quantity, 0)

    @override_settings(STOCK_RESERVATION_ENABLED=True)
    @patch("payment.services.webhook_processing.async_parcels_and_seller_email")
    @patch("payment.services.webhook_processing.async_send_client_email")
    @patch(
        "payment.services.webhook_processing.generate_invoice_pdf",
        return_value=ContentFile(b"%PDF-1.4 test", name="inv.pdf"),
    )
    @patch.object(PayPalMixin, "verify_webhook", return_value=True)
    def test_paypal_success_after_expired_reservation_does_not_create_order(
        self,
        _mock_verify,
        _mock_pdf,
        _mock_email,
        _mock_parcels,
    ):
        qty = 2
        delivery_opt = Decimal("5.21")
        group_total = (self.variant.price_with_acquiring * qty + delivery_opt).quantize(
            Decimal("0.01")
        )
        session_key = "paypal-late-expired-key"
        paypal_order_id = "PP-LATE-EXPIRED"

        StockReservationService.create_reservation(
            session_key=session_key,
            payment_system="paypal",
            groups=[{"products": [{"sku": self.variant.sku, "quantity": qty}]}],
            variant_map={self.variant.sku: self.variant},
        )
        reservation = StockReservation.objects.get(session_key=session_key)
        reservation.provider_checkout_id = paypal_order_id
        reservation.save(update_fields=["provider_checkout_id"])
        StockReservationService.release_reservation(
            session_key,
            final_status=StockReservation.Status.EXPIRED,
        )

        PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(self.customer.id),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "Test",
                "phone": "+420777123456",
                "delivery_address": {"country": "CZ"},
            },
            invoice_data={
                "invoice_number": "2026003102",
                "groups": [self._stripe_group_meta(qty, delivery_opt, group_total)],
            },
            description_data={
                "gross_total": str(group_total),
                "delivery_total": str(delivery_opt),
                "variable_symbol": "2026003102",
            },
        )

        payload = {
            "event_type": "CHECKOUT.ORDER.COMPLETED",
            "resource": {
                "id": paypal_order_id,
                "purchase_units": [
                    {
                        "reference_id": session_key,
                        "amount": {"value": str(group_total), "currency_code": "EUR"},
                    }
                ],
            },
        }
        response = self.client.post(
            reverse("paypal_webhook"),
            data=json.dumps(payload).encode("utf-8"),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data.get("status"),
            "payment_received_reservation_expired_manual_review",
        )
        self.assertEqual(Order.objects.count(), 0)


class ExpiredCleanupStripeExpireTests(CheckoutCatalogMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.setUpCatalog()

    @override_settings(STOCK_RESERVATION_ENABLED=True)
    @patch("payment.services.reservation_payment.stripe.checkout.Session.expire")
    def test_release_expired_command_expires_stripe_checkout_session(
        self,
        mock_stripe_expire,
    ):
        session_key = "cleanup-stripe-expire-key"
        StockReservationService.create_reservation(
            session_key=session_key,
            payment_system="stripe",
            groups=[{"products": [{"sku": self.variant.sku, "quantity": 1}]}],
            variant_map={self.variant.sku: self.variant},
        )
        reservation = StockReservation.objects.get(session_key=session_key)
        reservation.expires_at = timezone.now() - timedelta(minutes=10)
        reservation.provider_checkout_id = "cs_cleanup_expire"
        reservation.save(update_fields=["expires_at", "provider_checkout_id"])

        call_command("release_expired_reservations")

        reservation.refresh_from_db()
        self.assertEqual(reservation.status, StockReservation.Status.EXPIRED)
        mock_stripe_expire.assert_called_once_with("cs_cleanup_expire")
