"""
Unit-тесты для:
  - payment.services.paypal_checkout
  - payment.services.webhook_processing
"""
from __future__ import annotations

import copy
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch, call

import requests
from django.core.files.base import ContentFile
from django.test import SimpleTestCase, TestCase

from order.models import Order
from payment.models import PayPalMetadata, Payment, StripeMetadata
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


# ===========================================================================
# payment.services.webhook_processing
# ===========================================================================

from payment.services.webhook_processing import (
    WebhookPaymentData,
    WebhookProcessingResult,
    create_orders_and_payment,
    set_conv_cache_after_commit,
)


def _make_webhook_data(**overrides) -> WebhookPaymentData:
    """Минимально валидный WebhookPaymentData для тестов."""
    base = dict(
        payment_system="stripe",
        payment_method="stripe",
        session_id="cs_test_123",
        session_key="uuid-abc",
        conv_cache_id="cs_test_123",
        amount=Decimal("100.00"),
        currency="EUR",
        customer_id="cus_123",
        payment_intent_id="pi_123",
        custom_data={
            "user_id": "42",
            "email": "test@example.com",
            "first_name": "Jan",
            "last_name": "Novak",
            "phone": "+420123456789",
            "delivery_address": {"country": "CZ"},
        },
        invoice_data={
            "groups": [
                {
                    "delivery_type": 1,
                    "courier_service": 1,
                    "calculated_delivery_cost": "5.00",
                    "calculated_group_total": "105.00",
                    "products": [{"sku": "SKU-001", "quantity": 2}],
                }
            ],
            "invoice_number": "INV-2026-001",
        },
        description_data={"variable_symbol": "2026001"},
    )
    base.update(overrides)
    return WebhookPaymentData(**base)


class TestSetConvCacheAfterCommit(SimpleTestCase):
    """set_conv_cache_after_commit — формат payload и запись через on_commit."""

    @patch("payment.services.webhook_processing.transaction.on_commit")
    @patch("payment.services.webhook_processing._conv_cache")
    def test_payload_structure(self, mock_cache, mock_on_commit):
        set_conv_cache_after_commit("sess-001", Decimal("99.50"), "EUR", source="Test")

        # on_commit должен быть поставлен в очередь
        mock_on_commit.assert_called_once()

        # Вызываем колбэк вручную
        callback = mock_on_commit.call_args[0][0]
        callback()

        mock_cache.set.assert_called_once()
        args = mock_cache.set.call_args
        key = args[0][0]
        payload = args[0][1]

        self.assertEqual(key, "conv:sess-001")
        self.assertTrue(payload["ready"])
        self.assertEqual(payload["transaction_id"], "sess-001")
        self.assertAlmostEqual(payload["value"], 99.5)
        self.assertEqual(payload["currency"], "EUR")

    @patch("payment.services.webhook_processing.transaction.on_commit")
    @patch("payment.services.webhook_processing._conv_cache")
    def test_currency_uppercased(self, mock_cache, mock_on_commit):
        set_conv_cache_after_commit("s", Decimal("1"), "eur")
        callback = mock_on_commit.call_args[0][0]
        callback()
        payload = mock_cache.set.call_args[0][1]
        self.assertEqual(payload["currency"], "EUR")


class TestCreateOrdersIdempotency(SimpleTestCase):
    """create_orders_and_payment — idempotent replay."""

    @patch("payment.services.webhook_processing.confirm_checkout_stock_reservation_if_enabled")
    @patch("payment.services.webhook_processing.set_conv_cache_after_commit")
    @patch("payment.services.webhook_processing.Payment")
    def test_returns_replay_result_when_payment_exists(
        self, mock_payment_cls, mock_cache_fn, mock_confirm,
    ):
        existing = MagicMock()
        existing.amount_total = Decimal("100.00")
        existing.currency = "EUR"
        mock_payment_cls.objects.filter.return_value.only.return_value.first.return_value = existing

        result = create_orders_and_payment(_make_webhook_data())

        self.assertIsNotNone(result)
        self.assertTrue(result.is_replay)
        self.assertEqual(result.orders, [])
        mock_confirm.assert_not_called()
        mock_cache_fn.assert_called_once_with(
            "cs_test_123",  # conv_cache_id
            Decimal("100.00"),
            "EUR",
            source="StripeWebhook",
        )

    @patch("payment.services.webhook_processing.confirm_checkout_stock_reservation_if_enabled")
    @patch("payment.services.webhook_processing.set_conv_cache_after_commit")
    @patch("payment.services.webhook_processing.Payment")
    def test_paypal_replay_uses_conv_cache_id(
        self, mock_payment_cls, mock_cache_fn, mock_confirm,
    ):
        existing = MagicMock()
        existing.amount_total = Decimal("50.00")
        existing.currency = "EUR"
        mock_payment_cls.objects.filter.return_value.only.return_value.first.return_value = existing

        data = _make_webhook_data(
            payment_system="paypal",
            payment_method="paypal",
            session_id="PP-ORDER-999",
            conv_cache_id="my-uuid-key",
        )
        result = create_orders_and_payment(data)

        self.assertTrue(result.is_replay)
        mock_confirm.assert_not_called()
        mock_cache_fn.assert_called_once()
        call_args = mock_cache_fn.call_args[0]
        self.assertEqual(call_args[0], "my-uuid-key")  # conv_cache_id, не session_id


class TestCreateOrdersEarlyExits(SimpleTestCase):
    """create_orders_and_payment — ранние выходы при отсутствии данных."""

    def _no_existing_payment(self):
        m = MagicMock()
        m.objects.filter.return_value.only.return_value.first.return_value = None
        return m

    @patch("payment.services.webhook_processing.CustomUser")
    @patch("payment.services.webhook_processing.Payment")
    def test_returns_none_when_user_not_found(self, mock_payment_cls, mock_user_cls):
        mock_payment_cls.objects.filter.return_value.only.return_value.first.return_value = None
        # Создаём реальный подкласс Exception для DoesNotExist, чтобы except-клауза его поймала
        mock_user_cls.DoesNotExist = type("DoesNotExist", (Exception,), {})
        mock_user_cls.objects.get.side_effect = mock_user_cls.DoesNotExist("not found")

        result = create_orders_and_payment(_make_webhook_data())
        self.assertIsNone(result)

    @patch("payment.services.webhook_processing.CustomUser")
    @patch("payment.services.webhook_processing.Payment")
    def test_returns_none_when_no_groups(self, mock_payment_cls, mock_user_cls):
        mock_payment_cls.objects.filter.return_value.only.return_value.first.return_value = None
        mock_user_cls.objects.get.return_value = MagicMock()

        data = _make_webhook_data(invoice_data={"groups": [], "invoice_number": "INV-X"})
        result = create_orders_and_payment(data)
        self.assertIsNone(result)

    @patch("payment.services.webhook_processing.OrderStatus")
    @patch("payment.services.webhook_processing.ProductVariant")
    @patch("payment.services.webhook_processing.CustomUser")
    @patch("payment.services.webhook_processing.Payment")
    def test_returns_none_when_pending_status_missing(
        self, mock_payment_cls, mock_user_cls, mock_variant_cls, mock_status_cls
    ):
        mock_payment_cls.objects.filter.return_value.only.return_value.first.return_value = None
        mock_user_cls.objects.get.return_value = MagicMock()
        mock_variant_cls.objects.filter.return_value.select_related.return_value = []
        mock_status_cls.objects.get.side_effect = mock_status_cls.DoesNotExist

        result = create_orders_and_payment(_make_webhook_data())
        self.assertIsNone(result)


class TestCreateOrdersIntegrityReplayCheckout(TestCase):
    """
    При дубликате (payment_system, session_id) insert бросает IntegrityError:
    после отката транзакции — replay + conv cache как при обычном replay (без side-effects).
    """

    SESSION_ID = "cs_integrity_race_01"

    @classmethod
    def setUpTestData(cls):
        from accounts.choices import UserRole
        from accounts.models import CustomUser
        from order.models import CourierService, DeliveryType, OrderStatus
        from order.order_status_names import OrderStatusName
        from product.models import BaseProduct, ProductStatus, ProductVariant
        from sellers.models import SellerProfile
        from warehouses.models import Warehouse, WarehouseItem

        slug = cls.__name__
        h = abs(hash(slug))

        cls.warehouse = Warehouse.objects.create(
            name=f"WH-{slug}",
            street="I 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email=f"s{h}@integ-pay.example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number=f"+420811{h % 1000000:06d}",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.warehouse
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.customer = CustomUser.objects.create_user(
            email=f"c{h}@integ-pay.example.com",
            password="pass12345",
            first_name="Buyer",
            last_name="T",
            role=UserRole.CUSTOMER,
            phone_number=f"+420822{h % 1000000:06d}",
        )

        OrderStatus.objects.get_or_create(name=OrderStatusName.PENDING)
        cls.dt = DeliveryType.objects.create(name=f"DTL-{slug}")
        cls.cs = CourierService.objects.create(
            code=f"cs{h % 10_000_000:07d}",
            name=f"CSL-{slug}"[:100],
            active=True,
        )

        cls.base_product = BaseProduct.objects.create(
            name="Integrity Product",
            product_description="T",
            seller=cls.seller_profile,
            article=str(h)[:10],
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.base_product,
            name="V",
            text="x",
            price=Decimal("100.00"),
            weight_grams=500,
            length_mm=200,
            width_mm=150,
            height_mm=100,
            sku="SKU-001",
        )
        WarehouseItem.objects.create(
            warehouse=cls.warehouse,
            product_variant=cls.variant,
            quantity_in_stock=50,
        )

    @patch("payment.services.webhook_processing.async_parcels_and_seller_email")
    @patch("payment.services.webhook_processing.async_send_client_email")
    @patch("payment.services.webhook_processing.set_conv_cache_after_commit")
    @patch("payment.services.webhook_processing._replay_if_payment_exists", return_value=None)
    @patch("payment.services.webhook_processing.generate_invoice_pdf")
    @patch("payment.services.webhook_processing.prepare_invoice_data")
    def test_duplicate_payment_integrity_returns_replay_and_no_orders(
        self,
        mock_prep,
        mock_pdf,
        mock_skip_replay_precheck,
        mock_conv_cache,
        mock_async_email,
        mock_async_parcels,
    ):
        """Simulate TOCTOU: строка Payment уже есть, _replay короткий путь выключен патчем."""
        mock_prep.return_value = {}
        mock_pdf.return_value = ContentFile(b"%PDF-test", name="stub.pdf")

        Payment.objects.create(
            payment_system="stripe",
            session_id=self.SESSION_ID,
            session_key="pre",
            customer_id="cus_pre",
            payment_intent_id="pi_pre",
            payment_method="stripe",
            amount_total=Decimal("100.00"),
            currency="EUR",
            customer_email=self.customer.email,
        )

        data = _make_webhook_data(
            session_id=self.SESSION_ID,
            conv_cache_id=self.SESSION_ID,
            session_key="new-key",
            custom_data={
                "user_id": str(self.customer.pk),
                "email": self.customer.email,
                "first_name": "Jan",
                "last_name": "Novak",
                "phone": "+420123456789",
                "delivery_address": {"country": "CZ"},
            },
            invoice_data={
                "groups": [
                    {
                        "delivery_type": self.dt.id,
                        "courier_service": self.cs.id,
                        "calculated_delivery_cost": "5.00",
                        "calculated_group_total": "105.00",
                        "products": [{"sku": "SKU-001", "quantity": 2}],
                    },
                ],
                "invoice_number": "INV-I-001",
            },
        )

        result = create_orders_and_payment(data)

        self.assertIsNotNone(result)
        self.assertTrue(result.is_replay)
        self.assertEqual(result.orders, [])
        self.assertEqual(Payment.objects.filter(session_id=self.SESSION_ID).count(), 1)
        self.assertEqual(Order.objects.count(), 0)

        mock_conv_cache.assert_called_once_with(
            self.SESSION_ID,
            Decimal("100.00"),
            "EUR",
            source="StripeWebhook",
        )
        mock_async_parcels.assert_not_called()
        mock_async_email.assert_not_called()


# ===========================================================================
# payment.services.paypal_session — build_paypal_checkout_context
# ===========================================================================

from payment.services.paypal_session import (
    PayPalSessionBuildError,
    build_paypal_checkout_context,
)

_PP_SESSION_MOD = "payment.services.paypal_session"
_CHECKOUT_META_MOD = "payment.services.checkout_metadata"
_ST_SESSION_MOD = "payment.services.stripe_session"


def _make_variant_mock(
    sku="SKU-001",
    price=Decimal("50.00"),
    seller_id=1,
    warehouse_country="CZ",
    weight_grams=500,
    length_mm=200,
    width_mm=150,
    height_mm=100,
):
    v = MagicMock()
    v.sku = sku
    v.price = price
    v.price_with_acquiring = price
    v.weight_grams = weight_grams
    v.length_mm = length_mm
    v.width_mm = width_mm
    v.height_mm = height_mm
    v.product.seller.id = seller_id
    dw = MagicMock()
    dw.country = warehouse_country
    v.product.seller.default_warehouse = dw
    return v


def _base_groups_pp(
    sku="SKU-001",
    seller_id=1,
    delivery_type=1,
    courier_code=None,
):
    return [
        {
            "seller_id": seller_id,
            "delivery_type": delivery_type,
            "courier_code": courier_code,
            "products": [{"sku": sku, "quantity": 2}],
        }
    ]


def _make_shipping_result_pp(price="5.00", channel="PUDO"):
    return {
        "options": [{"channel": channel, "service": "STD", "priceWithVat": price}],
        "total_parcels": 1,
    }


def _patch_variants_pp(mock_pv, variants):
    qs = MagicMock()
    qs.select_related.return_value.only.return_value = variants
    mock_pv.objects.filter.return_value = qs


def _patch_atomic_pp(mock_tx):
    cm = MagicMock()
    cm.__enter__ = MagicMock(return_value=None)
    cm.__exit__ = MagicMock(return_value=False)
    mock_tx.atomic.return_value = cm


def _happy_paypal_ctx():
    """Возвращает PayPalCheckoutContext из вспомогательного запуска с патчами."""
    variant = _make_variant_mock()
    user = MagicMock()
    user.id = 42

    with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
         patch(f"{_CHECKOUT_META_MOD}.PayPalMetadata"), \
         patch(f"{_CHECKOUT_META_MOD}.transaction") as tx_mock, \
         patch(f"{_PP_SESSION_MOD}.next_invoice_identifiers", return_value=("INV-2026-001", "2026001")), \
         patch(f"{_PP_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
         patch(f"{_PP_SESSION_MOD}.validate_phone_matches_country", return_value=None), \
         patch(f"{_PP_SESSION_MOD}.ZipCodeValidator"), \
         patch(f"{_PP_SESSION_MOD}.calculate_order_shipping",
               return_value=_make_shipping_result_pp()):
        _patch_variants_pp(pv_mock, [variant])
        _patch_atomic_pp(tx_mock)
        ctx = build_paypal_checkout_context(
            user=user,
            email="test@example.com",
            first_name="Jan",
            last_name="Novak",
            phone="+420123456789",
            delivery_address={"country": "CZ"},
            groups=_base_groups_pp(),
            root_country="CZ",
        )
    return ctx


class TestBuildPayPalCheckoutContext(SimpleTestCase):
    """build_paypal_checkout_context() — unit-тесты без БД."""

    def test_returns_context_with_expected_fields(self):
        ctx = _happy_paypal_ctx()
        self.assertEqual(ctx.invoice_number, "INV-2026-001")
        self.assertEqual(ctx.variable_symbol, "2026001")
        self.assertIsInstance(ctx.gross_total, Decimal)

    def test_line_items_paypal_format(self):
        """unit_amount.value — строка EUR, quantity — строка."""
        ctx = _happy_paypal_ctx()
        product_items = [i for i in ctx.line_items if i.get("sku") != "delivery"]
        self.assertTrue(len(product_items) > 0)
        for item in product_items:
            self.assertIn("unit_amount", item)
            self.assertIsInstance(item["unit_amount"]["value"], str)
            self.assertIsInstance(item["quantity"], str)
            self.assertEqual(item["unit_amount"]["currency_code"], "EUR")

    def test_delivery_appended_to_line_items(self):
        """При total_delivery > 0 delivery-позиция добавлена в line_items."""
        ctx = _happy_paypal_ctx()
        delivery_items = [i for i in ctx.line_items if i.get("sku") == "delivery"]
        self.assertEqual(len(delivery_items), 1)
        self.assertEqual(delivery_items[0]["quantity"], "1")
        self.assertEqual(delivery_items[0]["unit_amount"]["currency_code"], "EUR")

    def test_gross_total_equals_item_total(self):
        """sum(line_items) == gross_total (инвариант PayPal item_total)."""
        ctx = _happy_paypal_ctx()
        item_total = sum(
            Decimal(i["unit_amount"]["value"]) * Decimal(str(i["quantity"]))
            for i in ctx.line_items
        )
        self.assertEqual(item_total, ctx.gross_total)

    def test_metadata_saved_with_correct_keys(self):
        variant = _make_variant_mock()
        user = MagicMock()
        user.id = 42

        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.PayPalMetadata") as meta_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction") as tx_mock, \
             patch(f"{_PP_SESSION_MOD}.next_invoice_identifiers", return_value=("INV-X", "VS-X")), \
             patch(f"{_PP_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
             patch(f"{_PP_SESSION_MOD}.validate_phone_matches_country", return_value=None), \
             patch(f"{_PP_SESSION_MOD}.ZipCodeValidator"), \
             patch(f"{_PP_SESSION_MOD}.calculate_order_shipping",
                   return_value=_make_shipping_result_pp()):
            _patch_variants_pp(pv_mock, [variant])
            _patch_atomic_pp(tx_mock)
            build_paypal_checkout_context(
                user=user,
                email="e@e.com",
                first_name="A", last_name="B",
                phone="+420111222333",
                delivery_address={"country": "CZ"},
                groups=_base_groups_pp(),
                root_country="CZ",
            )

        meta_mock.objects.create.assert_called_once()
        kw = meta_mock.objects.create.call_args[1]
        for key in (
            "user_id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "delivery_address",
        ):
            self.assertIn(key, kw["custom_data"], f"custom_data missing '{key}'")
        for key in ("groups", "invoice_number"):
            self.assertIn(key, kw["invoice_data"], f"invoice_data missing '{key}'")
        for key in ("gross_total", "delivery_total", "variable_symbol"):
            self.assertIn(key, kw["description_data"], f"description_data missing '{key}'")

    def test_missing_sku_raises(self):
        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"):
            qs = MagicMock()
            qs.select_related.return_value.only.return_value = []
            pv_mock.objects.filter.return_value = qs

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=_base_groups_pp(),
                    root_country="CZ",
                )
        self.assertIn("ProductVariant not found", str(ctx.exception.detail))
        self.assertEqual(ctx.exception.http_status, 400)

    def test_dpd_missing_dims_raises(self):
        variant = _make_variant_mock(weight_grams=0)
        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"):
            _patch_variants_pp(pv_mock, [variant])

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=_base_groups_pp(courier_code="dpd"),
                    root_country="CZ",
                )
        self.assertIn("weight/dimensions", str(ctx.exception.detail))

    def test_cz_origin_not_cz_raises(self):
        variant = _make_variant_mock(warehouse_country="DE")
        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"):
            _patch_variants_pp(pv_mock, [variant])

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=_base_groups_pp(),
                    root_country="CZ",
                )
        self.assertIn("origin", ctx.exception.detail)

    def test_dpd_pudo_missing_zip_raises(self):
        variant = _make_variant_mock()
        groups = _base_groups_pp(courier_code="dpd", delivery_type=1)

        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"):
            _patch_variants_pp(pv_mock, [variant])

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=groups,
                    root_country="CZ",
                )
        self.assertIn("DPD PUDO", str(ctx.exception.detail))

    def test_seller_ownership_raises(self):
        variant = _make_variant_mock(seller_id=99)
        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"), \
             patch(f"{_PP_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"):
            _patch_variants_pp(pv_mock, [variant])

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=_base_groups_pp(seller_id=1),
                    root_country="CZ",
                )
        self.assertIn("does not belong to seller", str(ctx.exception.detail))

    def test_unknown_delivery_type_raises(self):
        variant = _make_variant_mock()
        groups = _base_groups_pp(delivery_type=99)

        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"), \
             patch(f"{_PP_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
             patch(f"{_PP_SESSION_MOD}.calculate_order_shipping",
                   return_value=_make_shipping_result_pp()):
            _patch_variants_pp(pv_mock, [variant])

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=groups,
                    root_country="CZ",
                )
        self.assertIn("Unknown delivery_type", str(ctx.exception.detail))

    def test_hd_invalid_zip_raises(self):
        variant = _make_variant_mock()
        groups = _base_groups_pp(delivery_type=2)
        groups[0]["delivery_address"] = {"zip": "00000", "country": "CZ"}

        bad_zip = MagicMock()
        bad_zip.valid = False
        bad_zip.normalized_postcode = None

        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction"), \
             patch(f"{_PP_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
             patch(f"{_PP_SESSION_MOD}.ZipCodeValidator") as zip_mock, \
             patch(f"{_PP_SESSION_MOD}.calculate_order_shipping",
                   return_value=_make_shipping_result_pp(channel="HD")):
            _patch_variants_pp(pv_mock, [variant])
            zip_mock.validate_and_resolve.return_value = bad_zip

            with self.assertRaises(PayPalSessionBuildError) as ctx:
                build_paypal_checkout_context(
                    user=MagicMock(id=1),
                    email="e@e.com",
                    first_name="A", last_name="B", phone="+420111222333",
                    delivery_address={"country": "CZ"},
                    groups=groups,
                    root_country="CZ",
                )
        self.assertIn("Invalid ZIP", str(ctx.exception.detail))


# ===========================================================================
# payment.services.checkout_metadata — builders
# ===========================================================================

from payment.services.checkout_metadata import (
    build_checkout_custom_data,
    build_checkout_description_data,
    build_checkout_invoice_data,
)


class TestCheckoutMetadataBuilders(SimpleTestCase):
    """Чистые функции сборки JSON (общие для Stripe и PayPal)."""

    def test_description_data_stringifies_decimals(self):
        d = build_checkout_description_data(
            gross_total=Decimal("10.00"),
            delivery_total=Decimal("0"),
            variable_symbol="VS9",
        )
        self.assertEqual(d["gross_total"], "10.00")
        self.assertEqual(d["delivery_total"], "0")
        self.assertEqual(d["variable_symbol"], "VS9")

    def test_custom_and_invoice_shape(self):
        user = MagicMock()
        user.id = 7
        c = build_checkout_custom_data(
            user=user,
            email="e@e.com",
            first_name="A",
            last_name="B",
            phone="+1",
            delivery_address={"country": "CZ"},
        )
        self.assertEqual(c["user_id"], "7")
        inv = build_checkout_invoice_data(groups=[{"x": 1}], invoice_number="N1")
        self.assertEqual(inv["invoice_number"], "N1")
        self.assertEqual(inv["groups"], [{"x": 1}])


# ===========================================================================
# payment.services.stripe_session — build_stripe_checkout_context
# ===========================================================================

from payment.services.checkout_shared import create_checkout_stock_reservation_if_enabled
from payment.services.stripe_session import StripeSessionBuildError, build_stripe_checkout_context


class TestCreateCheckoutStockReservationIfEnabled(SimpleTestCase):
    """Shared reservation hook used by Stripe and PayPal session builders."""

    @patch("warehouses.services.reservation.StockReservationService")
    def test_noop_when_flag_disabled(self, mock_svc):
        from django.test import override_settings

        with override_settings(STOCK_RESERVATION_ENABLED=False):
            create_checkout_stock_reservation_if_enabled(
                session_key="sk-1",
                payment_system="stripe",
                groups=[],
                variant_map={},
                error_cls=StripeSessionBuildError,
            )
        mock_svc.create_reservation.assert_not_called()

    @patch("warehouses.services.reservation.StockReservationService")
    def test_calls_service_when_flag_enabled(self, mock_svc):
        from django.test import override_settings

        with override_settings(STOCK_RESERVATION_ENABLED=True):
            create_checkout_stock_reservation_if_enabled(
                session_key="sk-2",
                payment_system="paypal",
                groups=[{"products": []}],
                variant_map={},
                error_cls=StripeSessionBuildError,
            )
        mock_svc.create_reservation.assert_called_once_with(
            session_key="sk-2",
            payment_system="paypal",
            groups=[{"products": []}],
            variant_map={},
        )

    @patch("warehouses.services.reservation.StockReservationService")
    def test_maps_insufficient_stock_to_409(self, mock_svc):
        from django.test import override_settings
        from warehouses.exceptions import InsufficientStockError

        mock_svc.create_reservation.side_effect = InsufficientStockError(
            detail={"sku": "X", "requested": 2, "available": 0}
        )
        with override_settings(STOCK_RESERVATION_ENABLED=True):
            with self.assertRaises(StripeSessionBuildError) as ctx:
                create_checkout_stock_reservation_if_enabled(
                    session_key="sk-3",
                    payment_system="stripe",
                    groups=[],
                    variant_map={},
                    error_cls=StripeSessionBuildError,
                )
        self.assertEqual(ctx.exception.http_status, 409)
        self.assertEqual(ctx.exception.detail, {"stock": {"sku": "X", "requested": 2, "available": 0}})


class TestBuildStripeCheckoutContext(SimpleTestCase):
    """build_stripe_checkout_context() — metadata keys (симметрия с PayPal)."""

    def test_metadata_saved_with_correct_keys(self):
        variant = _make_variant_mock()
        user = MagicMock()
        user.id = 42

        with patch(f"{_ST_SESSION_MOD}.ProductVariant") as pv_mock, \
             patch(f"{_CHECKOUT_META_MOD}.StripeMetadata") as meta_mock, \
             patch(f"{_CHECKOUT_META_MOD}.transaction") as tx_mock, \
             patch(f"{_ST_SESSION_MOD}.next_invoice_identifiers", return_value=("INV-X", "VS-X")), \
             patch(f"{_ST_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
             patch(f"{_ST_SESSION_MOD}.validate_phone_matches_country", return_value=None), \
             patch(f"{_ST_SESSION_MOD}.ZipCodeValidator"), \
             patch(f"{_ST_SESSION_MOD}.calculate_order_shipping",
                   return_value=_make_shipping_result_pp()):
            _patch_variants_pp(pv_mock, [variant])
            _patch_atomic_pp(tx_mock)
            build_stripe_checkout_context(
                user=user,
                email="e@e.com",
                first_name="A", last_name="B",
                phone="+420111222333",
                delivery_address={"country": "CZ"},
                groups=_base_groups_pp(),
                root_country="CZ",
            )

        meta_mock.objects.create.assert_called_once()
        kw = meta_mock.objects.create.call_args[1]
        for key in (
            "user_id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "delivery_address",
        ):
            self.assertIn(key, kw["custom_data"], f"custom_data missing '{key}'")
        for key in ("groups", "invoice_number"):
            self.assertIn(key, kw["invoice_data"], f"invoice_data missing '{key}'")
        for key in ("gross_total", "delivery_total", "variable_symbol"):
            self.assertIn(key, kw["description_data"], f"description_data missing '{key}'")

    def test_stripe_paypal_metadata_payload_symmetric(self):
        """Одинаковые входные данные и моки — одинаковый JSON metadata (кроме session_key)."""
        variant_st = _make_variant_mock()
        variant_pp = _make_variant_mock()
        user = MagicMock()
        user.id = 42
        groups_st = copy.deepcopy(_base_groups_pp())
        groups_pp = copy.deepcopy(_base_groups_pp())

        with patch(f"{_ST_SESSION_MOD}.ProductVariant") as pv_st, \
             patch(f"{_CHECKOUT_META_MOD}.StripeMetadata") as meta_st, \
             patch(f"{_CHECKOUT_META_MOD}.transaction") as tx_st, \
             patch(f"{_ST_SESSION_MOD}.next_invoice_identifiers", return_value=("INV-X", "VS-X")), \
             patch(f"{_ST_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
             patch(f"{_ST_SESSION_MOD}.validate_phone_matches_country", return_value=None), \
             patch(f"{_ST_SESSION_MOD}.ZipCodeValidator"), \
             patch(f"{_ST_SESSION_MOD}.calculate_order_shipping",
                   return_value=_make_shipping_result_pp()):
            _patch_variants_pp(pv_st, [variant_st])
            _patch_atomic_pp(tx_st)
            build_stripe_checkout_context(
                user=user,
                email="e@e.com",
                first_name="A", last_name="B",
                phone="+420111222333",
                delivery_address={"country": "CZ"},
                groups=groups_st,
                root_country="CZ",
            )
            stripe_kw = meta_st.objects.create.call_args[1]

        with patch(f"{_PP_SESSION_MOD}.ProductVariant") as pv_pp, \
             patch(f"{_CHECKOUT_META_MOD}.PayPalMetadata") as meta_pp, \
             patch(f"{_CHECKOUT_META_MOD}.transaction") as tx_pp, \
             patch(f"{_PP_SESSION_MOD}.next_invoice_identifiers", return_value=("INV-X", "VS-X")), \
             patch(f"{_PP_SESSION_MOD}.resolve_country_code_from_group", return_value="CZ"), \
             patch(f"{_PP_SESSION_MOD}.validate_phone_matches_country", return_value=None), \
             patch(f"{_PP_SESSION_MOD}.ZipCodeValidator"), \
             patch(f"{_PP_SESSION_MOD}.calculate_order_shipping",
                   return_value=_make_shipping_result_pp()):
            _patch_variants_pp(pv_pp, [variant_pp])
            _patch_atomic_pp(tx_pp)
            build_paypal_checkout_context(
                user=user,
                email="e@e.com",
                first_name="A", last_name="B",
                phone="+420111222333",
                delivery_address={"country": "CZ"},
                groups=groups_pp,
                root_country="CZ",
            )
            paypal_kw = meta_pp.objects.create.call_args[1]

        self.assertEqual(stripe_kw["custom_data"], paypal_kw["custom_data"])
        self.assertEqual(
            stripe_kw["invoice_data"]["invoice_number"],
            paypal_kw["invoice_data"]["invoice_number"],
        )
        self.assertEqual(stripe_kw["description_data"], paypal_kw["description_data"])
        self.assertEqual(stripe_kw["invoice_data"]["groups"], paypal_kw["invoice_data"]["groups"])


# ===========================================================================
# CreatePayPalPaymentView — интеграционные тесты
# ===========================================================================

from rest_framework.test import APIClient


class TestCreatePayPalPaymentView(SimpleTestCase):
    """CreatePayPalPaymentView.post — тонкий HTTP-слой поверх сервиса."""

    _VIEW_MOD = "payment.views"

    def setUp(self):
        self.user = MagicMock()
        self.user.id = 42
        self.user.is_authenticated = True
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/create-paypal-payment/"

        self._valid_payload = {
            "email": "pp@test.com",
            "first_name": "Jan",
            "last_name": "Novak",
            "phone": "+420123456789",
            "delivery_address": {
                "country": "CZ", "city": "Praha",
                "street": "Main 1", "zip": "11000",
            },
            "groups": [
                {
                    "seller_id": 1,
                    "delivery_type": 1,
                    "products": [{"sku": "SKU-001", "quantity": 1}],
                }
            ],
        }

    def _make_ctx(self):
        from payment.services.paypal_session import PayPalCheckoutContext
        return PayPalCheckoutContext(
            line_items=[],
            session_key="test-session-uuid",
            invoice_number="INV-2026-001",
            variable_symbol="2026001",
            gross_total=Decimal("55.00"),
        )

    def _mock_serializer(self, validated_override=None):
        """Возвращает мок SessionInputSerializer с valid данными."""
        validated = {
            "email": "pp@test.com",
            "first_name": "Jan",
            "last_name": "Novak",
            "phone": "+420123456789",
            "delivery_address": {"country": "CZ", "city": "Praha", "street": "Main 1", "zip": "11000"},
            "groups": [{"seller_id": 1, "delivery_type": 1, "products": [{"sku": "SKU-001", "quantity": 1}]}],
        }
        if validated_override:
            validated.update(validated_override)
        m = MagicMock()
        m.return_value.is_valid.return_value = True
        m.return_value.validated_data = validated
        return m

    def test_post_returns_approval_url(self):
        ctx = self._make_ctx()
        serializer_mock = self._mock_serializer()
        with patch(f"{self._VIEW_MOD}.SessionInputSerializer", serializer_mock), \
             patch(f"{self._VIEW_MOD}.build_paypal_checkout_context", return_value=ctx), \
             patch(f"{self._VIEW_MOD}.create_paypal_checkout_session",
                   return_value=("https://paypal.com/approve?t=XYZ", "PP-ORDER-001")):
            resp = self.client.post(self.url, self._valid_payload, format="json")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["approval_url"], "https://paypal.com/approve?t=XYZ")
        self.assertEqual(resp.data["order_id"], "PP-ORDER-001")
        self.assertEqual(resp.data["session_key"], "test-session-uuid")
        self.assertEqual(resp.data["session_id"], "test-session-uuid")

    def test_post_400_on_missing_sku(self):
        serializer_mock = self._mock_serializer()
        with patch(f"{self._VIEW_MOD}.SessionInputSerializer", serializer_mock), \
             patch(
                 f"{self._VIEW_MOD}.build_paypal_checkout_context",
                 side_effect=PayPalSessionBuildError(
                     {"error": "ProductVariant not found: SKU-UNKNOWN"}
                 ),
             ):
            resp = self.client.post(self.url, self._valid_payload, format="json")

        self.assertEqual(resp.status_code, 400)
        self.assertIn("ProductVariant not found", resp.data["error"])

    def test_post_500_on_paypal_api_failure(self):
        ctx = self._make_ctx()
        serializer_mock = self._mock_serializer()
        with patch(f"{self._VIEW_MOD}.SessionInputSerializer", serializer_mock), \
             patch(f"{self._VIEW_MOD}.build_paypal_checkout_context", return_value=ctx), \
             patch(f"{self._VIEW_MOD}.create_paypal_checkout_session",
                   side_effect=RuntimeError("PayPal API unreachable")):
            resp = self.client.post(self.url, self._valid_payload, format="json")

        self.assertEqual(resp.status_code, 500)
        self.assertIn("error", resp.data)

    def test_unauthenticated_returns_401(self):
        unauth_client = APIClient()
        resp = unauth_client.post(self.url, self._valid_payload, format="json")
        self.assertIn(resp.status_code, [401, 403])


# ===========================================================================
# payment.services.stripe_webhook
# ===========================================================================

import stripe as stripe_sdk

from payment.services.stripe_webhook import (
    stripe_checkout_session_to_webhook_payment_data,
    verify_and_resolve_stripe_checkout_event,
)


class TestStripeWebhookService(SimpleTestCase):
    @patch("payment.services.stripe_webhook.stripe.Webhook.construct_event")
    def test_verify_signature_failure_returns_400_empty(self, mock_construct):
        mock_construct.side_effect = stripe_sdk.error.SignatureVerificationError("msg", "hdr")
        r = verify_and_resolve_stripe_checkout_event("{}", "sig", secret="whsec_test")
        self.assertEqual(r.early_status, 400)
        self.assertTrue(r.early_no_body)
        self.assertIsNone(r.event)

    @patch("payment.services.stripe_webhook.stripe.Webhook.construct_event")
    def test_verify_value_error_returns_400_empty(self, mock_construct):
        mock_construct.side_effect = ValueError("invalid payload")
        r = verify_and_resolve_stripe_checkout_event("not-json", "sig", secret="whsec_test")
        self.assertEqual(r.early_status, 400)
        self.assertTrue(r.early_no_body)
        self.assertIsNone(r.event)

    @patch("payment.services.stripe_webhook.stripe.Webhook.construct_event")
    def test_verify_ignored_event_returns_200_empty(self, mock_construct):
        mock_construct.return_value = {"type": "charge.succeeded", "data": {}}
        r = verify_and_resolve_stripe_checkout_event("{}", "sig", secret="whsec_test")
        self.assertEqual(r.early_status, 200)
        self.assertTrue(r.early_no_body)

    @patch("payment.services.stripe_webhook.stripe.Webhook.construct_event")
    def test_verify_checkout_completed_returns_event(self, mock_construct):
        ev = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_x",
                    "amount_total": 1050,
                    "currency": "eur",
                    "metadata": {"session_key": "sk-1"},
                    "customer": "cus_1",
                    "payment_intent": "pi_1",
                }
            },
        }
        mock_construct.return_value = ev
        r = verify_and_resolve_stripe_checkout_event("{}", "sig", secret="whsec_test")
        self.assertIsNone(r.early_status)
        self.assertEqual(r.event, ev)

    def test_session_to_webhook_payment_data_fields(self):
        meta = MagicMock()
        meta.custom_data = {"user_id": "1"}
        meta.invoice_data = {"groups": []}
        meta.description_data = {"gross_total": "10.50"}
        session = {
            "id": "cs_test",
            "amount_total": 1050,
            "currency": "eur",
            "customer": "cus_x",
            "payment_intent": "pi_x",
        }
        data = stripe_checkout_session_to_webhook_payment_data(
            session=session,
            meta=meta,
            session_key="uuid-here",
        )
        self.assertEqual(data.payment_system, "stripe")
        self.assertEqual(data.session_id, "cs_test")
        self.assertEqual(data.session_key, "uuid-here")
        self.assertEqual(data.amount, Decimal("10.50"))
        self.assertEqual(data.currency, "EUR")
        self.assertEqual(data.conv_cache_id, "cs_test")
        self.assertEqual(data.payment_intent_id, "pi_x")


# ===========================================================================
# payment.services.paypal_webhook
# ===========================================================================

from payment.services.paypal_webhook import (
    parse_paypal_webhook_body,
    paypal_payload_to_webhook_payment_data,
)


class TestPayPalWebhookService(SimpleTestCase):
    def test_parse_invalid_json_returns_400(self):
        r = parse_paypal_webhook_body("not-json")
        self.assertEqual(r.early_status, 400)
        self.assertEqual(r.early_body, {"error": "Invalid JSON"})

    def test_parse_unknown_event_returns_ignored(self):
        r = parse_paypal_webhook_body('{"event_type": "OTHER"}')
        self.assertEqual(r.early_status, 200)
        self.assertEqual(r.early_body, {"status": "ignored"})

    def test_parse_handled_event_returns_payload(self):
        r = parse_paypal_webhook_body(
            '{"event_type": "CHECKOUT.ORDER.COMPLETED", "resource": {}}'
        )
        self.assertIsNone(r.early_status)
        self.assertEqual(r.payload["event_type"], "CHECKOUT.ORDER.COMPLETED")

    def test_build_capture_completed_happy_path(self):
        def api_get(path):
            self.assertIn("ORD-1", path)
            return {"purchase_units": [{"reference_id": "sk-uuid"}]}

        payload = {
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {
                "supplementary_data": {"related_ids": {"order_id": "ORD-1"}},
                "amount": {"value": "12.30", "currency_code": "EUR"},
            },
        }
        meta = MagicMock()
        meta.custom_data = {"user_id": 42}
        meta.invoice_data = {}
        meta.description_data = {}
        with patch(
            "payment.services.paypal_webhook.PayPalMetadata.objects.get",
            return_value=meta,
        ):
            br = paypal_payload_to_webhook_payment_data(payload, api_get=api_get)

        self.assertIsNone(br.early_status)
        self.assertEqual(br.data.session_id, "ORD-1")
        self.assertEqual(br.data.session_key, "sk-uuid")
        self.assertEqual(br.data.amount, Decimal("12.30"))
        self.assertEqual(br.data.conv_cache_id, "sk-uuid")

    def test_build_metadata_missing_returns_400(self):
        payload = {
            "event_type": "CHECKOUT.ORDER.COMPLETED",
            "resource": {
                "id": "ORD-X",
                "purchase_units": [
                    {"reference_id": "sk-miss", "amount": {"value": "1", "currency_code": "EUR"}}
                ],
            },
        }
        with patch(
            "payment.services.paypal_webhook.PayPalMetadata.objects.get",
            side_effect=PayPalMetadata.DoesNotExist,
        ):
            br = paypal_payload_to_webhook_payment_data(payload, api_get=lambda p: {})

        self.assertEqual(br.early_status, 400)
        self.assertEqual(br.early_body, {"error": "Metadata not found"})

    def test_build_order_completed_happy_path(self):
        payload = {
            "event_type": "CHECKOUT.ORDER.COMPLETED",
            "resource": {
                "id": "ORD-COMP",
                "purchase_units": [
                    {
                        "reference_id": "sk-completed",
                        "amount": {"value": "15.50", "currency_code": "EUR"},
                    }
                ],
            },
        }
        meta = MagicMock()
        meta.custom_data = {"user_id": 7}
        meta.invoice_data = {}
        meta.description_data = {}
        with patch(
            "payment.services.paypal_webhook.PayPalMetadata.objects.get",
            return_value=meta,
        ):
            br = paypal_payload_to_webhook_payment_data(payload)

        self.assertIsNone(br.early_status)
        self.assertEqual(br.data.session_id, "ORD-COMP")
        self.assertEqual(br.data.session_key, "sk-completed")
        self.assertEqual(br.data.amount, Decimal("15.50"))
        self.assertEqual(br.data.currency, "EUR")
        self.assertEqual(br.data.conv_cache_id, "sk-completed")

    def test_build_order_approved_capture_success(self):
        def api_capture(order_id):
            self.assertEqual(order_id, "ORD-APP")
            return {
                "purchase_units": [
                    {
                        "reference_id": "sk-app",
                        "payments": {
                            "captures": [
                                {
                                    "status": "COMPLETED",
                                    "amount": {"value": "9.99", "currency_code": "EUR"},
                                }
                            ]
                        },
                    }
                ]
            }

        payload = {
            "event_type": "CHECKOUT.ORDER.APPROVED",
            "resource": {"id": "ORD-APP"},
        }
        meta = MagicMock()
        meta.custom_data = {"user_id": 1}
        meta.invoice_data = {}
        meta.description_data = {}
        with patch(
            "payment.services.paypal_webhook.PayPalMetadata.objects.get",
            return_value=meta,
        ):
            br = paypal_payload_to_webhook_payment_data(
                payload, api_capture=api_capture
            )

        self.assertIsNone(br.early_status)
        self.assertEqual(br.data.session_id, "ORD-APP")
        self.assertEqual(br.data.session_key, "sk-app")
        self.assertEqual(br.data.amount, Decimal("9.99"))

    def test_build_order_approved_capture_failed_returns_500(self):
        def api_capture(order_id):
            raise RuntimeError("capture network down")

        payload = {
            "event_type": "CHECKOUT.ORDER.APPROVED",
            "resource": {"id": "ORD-BAD"},
        }
        br = paypal_payload_to_webhook_payment_data(
            payload, api_capture=api_capture
        )
        self.assertEqual(br.early_status, 500)
        self.assertEqual(br.early_body, {"error": "Capture failed"})

    def test_build_capture_completed_api_get_propagates_http_error(self):
        """Текущее поведение: ошибка api_get не перехватывается — исключение уходит наверх."""

        def api_get(path):
            raise requests.HTTPError("upstream 502")

        payload = {
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {
                "supplementary_data": {"related_ids": {"order_id": "ORD-H"}},
                "amount": {"value": "1.00", "currency_code": "EUR"},
            },
        }
        with self.assertRaises(requests.HTTPError):
            paypal_payload_to_webhook_payment_data(payload, api_get=api_get)


# ===========================================================================
# StripeWebhookView — HTTP-контракт (без реального Stripe verify)
# ===========================================================================

from payment.services.stripe_webhook import StripeWebhookVerifyResult


class TestStripeWebhookViewHttp(SimpleTestCase):
    """
    Ответы view при негативных путях (verify / metadata / orchestration).
    Идемпотентный replay и happy-path покрыты в test_checkout_flow / сервисах.
    """

    def setUp(self):
        self.client = APIClient()

    def test_verify_failure_400_empty_body(self):
        with patch(
            "payment.views.construct_stripe_webhook_event",
            return_value=StripeWebhookVerifyResult(
                early_status=400,
                early_no_body=True,
            ),
        ):
            resp = self.client.post(
                "/api/stripe-webhook/",
                data="{}",
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE="v0=fake",
            )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.content, b"")

    def test_unhandled_event_type_200_empty_body(self):
        with patch(
            "payment.views.construct_stripe_webhook_event",
            return_value=StripeWebhookVerifyResult(
                event={"type": "charge.succeeded", "data": {}},
            ),
        ):
            resp = self.client.post(
                "/api/stripe-webhook/",
                data="{}",
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE="v0=fake",
            )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.content, b"")

    def test_missing_session_key_400(self):
        ev = {
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_x", "metadata": {}}},
        }
        with patch(
            "payment.views.construct_stripe_webhook_event",
            return_value=StripeWebhookVerifyResult(event=ev),
        ):
            resp = self.client.post(
                "/api/stripe-webhook/",
                data="{}",
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["error"], "Missing session_key")

    def test_metadata_not_found_400(self):
        ev = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_nometa",
                    "amount_total": 100,
                    "currency": "eur",
                    "metadata": {"session_key": "nonexistent-uuid"},
                    "payment_intent": "pi_x",
                }
            },
        }
        with patch(
            "payment.views.construct_stripe_webhook_event",
            return_value=StripeWebhookVerifyResult(event=ev),
        ), patch(
            "payment.views.StripeMetadata.objects.get",
            side_effect=StripeMetadata.DoesNotExist,
        ):
            resp = self.client.post(
                "/api/stripe-webhook/",
                data="{}",
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["error"], "Session metadata not found")

    def test_order_creation_failed_500(self):
        ev = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_fail",
                    "amount_total": 100,
                    "currency": "eur",
                    "metadata": {"session_key": "sk-fail"},
                    "payment_intent": "pi_f",
                }
            },
        }
        meta = MagicMock()
        with patch(
            "payment.views.construct_stripe_webhook_event",
            return_value=StripeWebhookVerifyResult(event=ev),
        ), patch(
            "payment.views.StripeMetadata.objects.get",
            return_value=meta,
        ), patch(
            "payment.views.stripe_checkout_session_to_webhook_payment_data",
            return_value=_make_webhook_data(),
        ), patch(
            "payment.views.create_orders_and_payment",
            return_value=None,
        ):
            resp = self.client.post(
                "/api/stripe-webhook/",
                data="{}",
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 500)
        self.assertEqual(resp.data["error"], "Order creation failed")


# ===========================================================================
# PayPalWebhookView — HTTP-контракт (без реального PayPal verify)
# ===========================================================================

from payment.mixins import PayPalMixin
from payment.services.webhook_processing import WebhookProcessingResult


class TestPayPalWebhookViewHttp(SimpleTestCase):
    """Тонкий слой view: 403 при verify=False; replay 200 + 0 orders."""

    def setUp(self):
        self.client = APIClient()

    def test_verify_failure_returns_403(self):
        body = json.dumps(
            {
                "event_type": "CHECKOUT.ORDER.COMPLETED",
                "resource": {
                    "id": "O1",
                    "purchase_units": [
                        {
                            "reference_id": "sk-403",
                            "amount": {"value": "1", "currency_code": "EUR"},
                        }
                    ],
                },
            }
        )
        with patch.object(PayPalMixin, "verify_webhook", return_value=False):
            resp = self.client.post(
                "/api/paypal-webhook/",
                data=body,
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.data["error"], "Invalid webhook signature")

    def test_invalid_json_400_verify_not_called(self):
        with patch.object(PayPalMixin, "verify_webhook") as mock_verify:
            resp = self.client.post(
                "/api/paypal-webhook/",
                data="not-json",
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["error"], "Invalid JSON")
        mock_verify.assert_not_called()

    def test_replay_returns_200_zero_orders_message(self):
        body = json.dumps(
            {
                "event_type": "CHECKOUT.ORDER.COMPLETED",
                "resource": {
                    "id": "O-REPLAY",
                    "purchase_units": [
                        {
                            "reference_id": "sk-replay",
                            "amount": {"value": "3.00", "currency_code": "EUR"},
                        }
                    ],
                },
            }
        )
        meta = MagicMock()
        meta.custom_data = {"user_id": 99}
        meta.invoice_data = {}
        meta.description_data = {}
        replay = WebhookProcessingResult(orders=[], is_replay=True)
        with patch.object(PayPalMixin, "verify_webhook", return_value=True), patch(
            "payment.services.paypal_webhook.PayPalMetadata.objects.get",
            return_value=meta,
        ), patch(
            "payment.views.create_orders_and_payment",
            return_value=replay,
        ):
            resp = self.client.post(
                "/api/paypal-webhook/",
                data=body,
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            resp.data["status"],
            "0 order(s) created successfully",
        )

    def test_order_creation_failed_500(self):
        body = json.dumps(
            {
                "event_type": "CHECKOUT.ORDER.COMPLETED",
                "resource": {
                    "id": "O-FAIL",
                    "purchase_units": [
                        {
                            "reference_id": "sk-fail",
                            "amount": {"value": "2.00", "currency_code": "EUR"},
                        }
                    ],
                },
            }
        )
        meta = MagicMock()
        meta.custom_data = {"user_id": 1}
        meta.invoice_data = {}
        meta.description_data = {}
        with patch.object(PayPalMixin, "verify_webhook", return_value=True), patch(
            "payment.services.paypal_webhook.PayPalMetadata.objects.get",
            return_value=meta,
        ), patch(
            "payment.views.create_orders_and_payment",
            return_value=None,
        ):
            resp = self.client.post(
                "/api/paypal-webhook/",
                data=body,
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 500)
        self.assertEqual(resp.data["error"], "Order creation failed")
