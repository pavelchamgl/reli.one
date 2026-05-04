"""
Unit-тесты для payment.services.paypal_checkout.

Все внешние зависимости (HTTP, кеш, settings) мокируются.
"""
from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch, patch as mock_patch

from django.test import SimpleTestCase

from payment.services.paypal_checkout import (
    create_paypal_checkout_session,
    get_paypal_access_token,
)

# Подставляем только атрибуты модульного объекта settings — без запуска
# Django-сигнала setting_changed, который ломает pre-existing signal handler.
_SETTINGS_TARGET = "payment.services.paypal_checkout.settings"
_FAKE = dict(
    PAYPAL_CLIENT_ID="test-client-id",
    PAYPAL_CLIENT_SECRET="test-client-secret",
    PAYPAL_API_URL="https://api.sandbox.paypal.com",
    REDIRECT_DOMAIN="https://reli.one/",
)

LINE_ITEMS = [
    {
        "name": "SKU-001",
        "sku": "SKU-001",
        "unit_amount": {"currency_code": "EUR", "value": "50.00"},
        "quantity": "2",
    }
]


def _make_token_response(token="test-access-token", expires_in=32400):
    m = MagicMock()
    m.json.return_value = {"access_token": token, "expires_in": expires_in}
    m.raise_for_status.return_value = None
    return m


def _make_order_response(
    order_id="PP-ORDER-123",
    approval_href="https://sandbox.paypal.com/approve?token=ABC",
):
    m = MagicMock()
    m.json.return_value = {
        "id": order_id,
        "links": [{"rel": "approve", "href": approval_href}],
    }
    m.raise_for_status.return_value = None
    return m


class TestGetPayPalAccessToken(SimpleTestCase):
    """get_paypal_access_token() — получение и кеширование токена."""

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.cache")
    @patch("payment.services.paypal_checkout.requests.post")
    def test_returns_token_from_api(self, mock_post, mock_cache, **_):
        mock_cache.get.return_value = None
        mock_post.return_value = _make_token_response("fresh-token")

        token = get_paypal_access_token()

        self.assertEqual(token, "fresh-token")
        mock_cache.set.assert_called_once_with("paypal_access_token", "fresh-token", 32340)

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.cache")
    @patch("payment.services.paypal_checkout.requests.post")
    def test_returns_cached_token_without_api_call(self, mock_post, mock_cache, **_):
        mock_cache.get.return_value = "cached-token"

        token = get_paypal_access_token()

        self.assertEqual(token, "cached-token")
        mock_post.assert_not_called()

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.cache")
    @patch("payment.services.paypal_checkout.requests.post")
    def test_returns_none_on_http_error(self, mock_post, mock_cache, **_):
        from requests.exceptions import RequestException
        mock_cache.get.return_value = None
        mock_post.side_effect = RequestException("connection refused")

        self.assertIsNone(get_paypal_access_token())

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.cache")
    @patch("payment.services.paypal_checkout.requests.post")
    def test_returns_none_when_token_absent_in_response(self, mock_post, mock_cache, **_):
        mock_cache.get.return_value = None
        m = MagicMock()
        m.json.return_value = {}
        m.raise_for_status.return_value = None
        mock_post.return_value = m

        self.assertIsNone(get_paypal_access_token())
        mock_cache.set.assert_not_called()


class TestCreatePayPalCheckoutSession(SimpleTestCase):
    """create_paypal_checkout_session() — создание PayPal Order."""

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.requests.post")
    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value="tok")
    def test_returns_approval_url_and_order_id(self, _mock_token, mock_post, **_):
        mock_post.return_value = _make_order_response("ORDER-1", "https://paypal.com/approve?t=XYZ")

        approval_url, order_id = create_paypal_checkout_session(
            line_items=LINE_ITEMS,
            total_price=Decimal("100.00"),
            session_key="sess-uuid-001",
            invoice_number="INV-2026-001",
        )

        self.assertEqual(order_id, "ORDER-1")
        self.assertEqual(approval_url, "https://paypal.com/approve?t=XYZ")

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.requests.post")
    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value="tok")
    def test_payload_contains_session_key_and_invoice(self, _mock_token, mock_post, **_):
        mock_post.return_value = _make_order_response()

        create_paypal_checkout_session(
            line_items=LINE_ITEMS,
            total_price=Decimal("100.00"),
            session_key="sess-abc",
            invoice_number="INV-999",
        )

        _, kwargs = mock_post.call_args
        body = kwargs["json"]
        unit = body["purchase_units"][0]
        self.assertEqual(unit["reference_id"], "sess-abc")
        self.assertEqual(unit["invoice_id"], "INV-999")
        self.assertIn("sess-abc", body["application_context"]["return_url"])

    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value=None)
    def test_raises_if_no_access_token(self, _):
        with self.assertRaises(RuntimeError) as ctx:
            create_paypal_checkout_session(
                line_items=LINE_ITEMS,
                total_price=Decimal("50.00"),
                session_key="s",
                invoice_number="i",
            )
        self.assertIn("access token", str(ctx.exception).lower())

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.requests.post")
    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value="tok")
    def test_raises_on_api_http_error(self, _mock_token, mock_post, **_):
        from requests.exceptions import RequestException
        mock_post.side_effect = RequestException("timeout")

        with self.assertRaises(RuntimeError) as ctx:
            create_paypal_checkout_session(
                line_items=LINE_ITEMS,
                total_price=Decimal("50.00"),
                session_key="s",
                invoice_number="i",
            )
        self.assertIn("PayPal order", str(ctx.exception))

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.requests.post")
    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value="tok")
    def test_raises_when_approval_url_missing(self, _mock_token, mock_post, **_):
        m = MagicMock()
        m.json.return_value = {"id": "ORDER-X", "links": []}
        m.raise_for_status.return_value = None
        mock_post.return_value = m

        with self.assertRaises(RuntimeError) as ctx:
            create_paypal_checkout_session(
                line_items=LINE_ITEMS,
                total_price=Decimal("50.00"),
                session_key="s",
                invoice_number="i",
            )
        self.assertIn("approval URL", str(ctx.exception))

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.requests.post")
    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value="tok")
    def test_item_total_computed_from_line_items(self, _mock_token, mock_post, **_):
        """item_total в payload соответствует сумме позиций (10*3 + 5.5*2 = 41.00)."""
        mock_post.return_value = _make_order_response()

        items = [
            {"name": "A", "sku": "A", "unit_amount": {"currency_code": "EUR", "value": "10.00"}, "quantity": "3"},
            {"name": "B", "sku": "B", "unit_amount": {"currency_code": "EUR", "value": "5.50"}, "quantity": "2"},
        ]

        create_paypal_checkout_session(
            line_items=items,
            total_price=Decimal("41.00"),
            session_key="s",
            invoice_number="i",
        )

        _, kwargs = mock_post.call_args
        breakdown = kwargs["json"]["purchase_units"][0]["amount"]["breakdown"]
        self.assertEqual(breakdown["item_total"]["value"], "41.00")

    @patch.multiple(_SETTINGS_TARGET, **_FAKE)
    @patch("payment.services.paypal_checkout.requests.post")
    @patch("payment.services.paypal_checkout.get_paypal_access_token", return_value="tok")
    def test_currency_is_eur(self, _mock_token, mock_post, **_):
        mock_post.return_value = _make_order_response()

        create_paypal_checkout_session(
            line_items=LINE_ITEMS,
            total_price=Decimal("100.00"),
            session_key="s",
            invoice_number="i",
        )

        _, kwargs = mock_post.call_args
        amount = kwargs["json"]["purchase_units"][0]["amount"]
        self.assertEqual(amount["currency_code"], "EUR")
