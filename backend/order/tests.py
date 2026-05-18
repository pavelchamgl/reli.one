"""
Regression tests for the order domain.

Covers:
- Order.calculate_refund() — all received / none received / partial / no items
- OrderProduct.save() — received_at set/cleared on received flag change; aware timestamps
- generate_order_number() — format and uniqueness
- OrderEvent — creation and FK integrity
- next_invoice_identifiers() — PAY-4: uniqueness under concurrency
- OrderStatusName vs seller actions — единый источник имён статуса заказа
- SellerOrderActionsService — confirm / mark shipped / cancel (Task 012)
- OrderStatus — регрессия строковой хрупкости имён (Task 004 analysis)
- OrderUserDeletionTests — SET_NULL регрессия: user.delete() не каскадирует заказ (Task 004 Iter 3b)

See also test_webhook_lifecycle.py for checkout webhook → Order/Payment/Invoice integration.
"""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

from django.db import close_old_connections
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.choices import UserRole
from accounts.models import CustomUser
from delivery.models import DeliveryAddress, DeliveryParcel
from order.models import (
    CourierService,
    DeliveryType,
    InvoiceSequence,
    Order,
    OrderEvent,
    OrderProduct,
    OrderStatus,
    ProductStatus as OrderLineStatus,
    generate_order_number,
)
from order.order_status_names import OrderStatusName
from order.services.invoice_numbers import INVOICE_NUMBER_PAD, next_invoice_identifiers
from order.services.seller_order_actions import SellerOrderActionsService
from payment.models import Payment
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse


class OrderTestMixin:
    """Shared DB setup for order-domain TestCase classes."""

    _payment_counter = 0

    @classmethod
    def setUpTestData(cls):
        cls.customer = CustomUser.objects.create_user(
            email="order-test-customer@example.com",
            password="pass123",
            first_name="Jan",
            last_name="Novak",
            role=UserRole.CUSTOMER,
            phone_number="+420777001001",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="order-test-seller@example.com",
            password="pass123",
            first_name="Pavel",
            last_name="Prodavac",
            role=UserRole.SELLER,
            phone_number="+420777001002",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.warehouse = Warehouse.objects.create(
            name="Order-Test-WH",
            street="Průmyslová 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.product = BaseProduct.objects.create(
            name="Order Test Product",
            product_description="T",
            seller=cls.seller_profile,
            article="OT001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            name="V",
            text="t",
            price=Decimal("50.00"),
            weight_grams=300,
            length_mm=100,
            width_mm=100,
            height_mm=100,
        )
        cls.delivery_type = DeliveryType.objects.create(name="Courier-OrderTest")
        cls.order_status = OrderStatus.objects.create(name="Pending-OrderTest")
        cls.delivery_address = DeliveryAddress.objects.create(
            user=cls.customer,
            full_name="Jan Novak",
            phone="+420777001001",
            email="order-test-customer@example.com",
            street="Test 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )

    def _make_payment(self, suffix=""):
        """Create a unique Payment for each order (no unique constraint, but keep IDs distinct)."""
        tag = f"{self.__class__.__name__}-{suffix or id(self)}"
        return Payment.objects.create(
            payment_system="stripe",
            session_id=f"cs_test_order_{tag}",
            payment_intent_id=f"pi_order_{tag}",
            payment_method="stripe",
            amount_total=Decimal("100.00"),
            currency="EUR",
            customer_email="order-test-customer@example.com",
        )

    def _make_order(self, delivery_cost=Decimal("5.00"), payment=None):
        if payment is None:
            payment = self._make_payment()
        return Order.objects.create(
            user=self.customer,
            first_name="Jan",
            last_name="Novak",
            customer_email="order-test-customer@example.com",
            total_amount=Decimal("105.00"),
            group_subtotal=Decimal("105.00"),
            delivery_type=self.delivery_type,
            order_status=self.order_status,
            delivery_cost=delivery_cost,
            payment=payment,
            delivery_address=self.delivery_address,
        )

    def _add_product(self, order, received=False, price=Decimal("50.00"), qty=1):
        return OrderProduct.objects.create(
            order=order,
            product=self.variant,
            quantity=qty,
            seller_profile=self.seller_profile,
            warehouse=self.warehouse,
            product_price=price,
            delivery_cost=Decimal("0.00"),
            received=received,
        )


# ---------------------------------------------------------------------------
# Order.calculate_refund()
# ---------------------------------------------------------------------------


class OrderCalculateRefundTests(OrderTestMixin, TestCase):

    def test_refund_zero_when_no_products(self):
        """Empty order → refund = 0."""
        order = self._make_order(delivery_cost=Decimal("5.00"))
        self.assertEqual(order.calculate_refund(), 0)

    def test_refund_zero_when_all_products_received(self):
        """All items received → refund = 0, delivery NOT included."""
        order = self._make_order(delivery_cost=Decimal("5.00"))
        self._add_product(order, received=True, price=Decimal("30.00"))
        self._add_product(order, received=True, price=Decimal("20.00"))

        self.assertEqual(order.calculate_refund(), 0)

    def test_refund_all_items_plus_delivery_when_none_received(self):
        """No items received → refund = sum of all item prices + delivery."""
        order = self._make_order(delivery_cost=Decimal("5.00"))
        self._add_product(order, received=False, price=Decimal("30.00"), qty=2)
        self._add_product(order, received=False, price=Decimal("20.00"), qty=1)

        expected = Decimal("30.00") * 2 + Decimal("20.00") + Decimal("5.00")
        self.assertEqual(order.calculate_refund(), expected)

    def test_refund_only_unreceived_items_plus_delivery(self):
        """Partial: only unreceived items counted, delivery still added."""
        order = self._make_order(delivery_cost=Decimal("7.00"))
        self._add_product(order, received=True, price=Decimal("50.00"))
        self._add_product(order, received=False, price=Decimal("30.00"), qty=2)

        expected = Decimal("30.00") * 2 + Decimal("7.00")
        self.assertEqual(order.calculate_refund(), expected)

    def test_refund_delivery_not_added_when_all_received(self):
        """Edge: delivery is NOT added if every item is received."""
        order = self._make_order(delivery_cost=Decimal("9.99"))
        self._add_product(order, received=True, price=Decimal("100.00"))

        self.assertEqual(order.calculate_refund(), 0)

    def test_refund_respects_quantity(self):
        """Refund = product_price * quantity for unreceived items."""
        order = self._make_order(delivery_cost=Decimal("3.00"))
        self._add_product(order, received=False, price=Decimal("10.00"), qty=5)

        expected = Decimal("10.00") * 5 + Decimal("3.00")
        self.assertEqual(order.calculate_refund(), expected)


# ---------------------------------------------------------------------------
# OrderProduct.save() — received_at lifecycle
# ---------------------------------------------------------------------------


class OrderProductReceivedAtTests(OrderTestMixin, TestCase):

    def setUp(self):
        self.order = self._make_order()

    def test_received_at_none_on_new_unreceived_product(self):
        """Creating an unreceived OrderProduct leaves received_at as None."""
        op = self._add_product(self.order, received=False)
        self.assertIsNone(op.received_at)

    def test_received_at_none_on_new_received_product(self):
        """Creating with received=True does NOT set received_at (no prior change)."""
        op = self._add_product(self.order, received=True)
        self.assertIsNone(op.received_at)

    def test_received_at_set_when_marked_received(self):
        """Updating received False→True sets received_at."""
        op = self._add_product(self.order, received=False)
        op.received = True
        op.save()
        op.refresh_from_db()
        self.assertIsNotNone(op.received_at)
        self.assertTrue(timezone.is_aware(op.received_at))

    def test_received_at_cleared_when_unmarked_received(self):
        """Updating received True→False clears received_at back to None."""
        op = self._add_product(self.order, received=False)
        op.received = True
        op.save()
        op.received = False
        op.save()
        op.refresh_from_db()
        self.assertIsNone(op.received_at)

    def test_received_at_not_changed_on_unrelated_save(self):
        """Saving without changing received does NOT touch received_at."""
        op = self._add_product(self.order, received=False)
        op.received = True
        op.save()
        op.refresh_from_db()
        ts_before = op.received_at

        # Save again without changing received
        op.save()
        op.refresh_from_db()
        self.assertEqual(op.received_at, ts_before)


# ---------------------------------------------------------------------------
# next_invoice_identifiers() — InvoiceSequence (PAY-4)
# ---------------------------------------------------------------------------


class NextInvoiceIdentifiersTests(TestCase):
    """PAY-4: sequence реализована через atomic + select_for_update + F() — регрессия."""

    def test_sequential_calls_return_distinct_invoice_numbers(self):
        inv1, vs1 = next_invoice_identifiers()
        inv2, vs2 = next_invoice_identifiers()
        self.assertNotEqual(inv1, inv2)
        self.assertEqual(inv1, vs1)
        self.assertEqual(inv2, vs2)

    def test_sequential_calls_use_expected_prefix_and_width(self):
        series = timezone.now().strftime("%Y")
        before = InvoiceSequence.objects.filter(series=series).values_list(
            "last_number", flat=True
        ).first()
        start = before or 0
        inv, _ = next_invoice_identifiers()
        self.assertTrue(inv.startswith(series))
        suffix = inv[len(series) :]
        self.assertEqual(len(suffix), INVOICE_NUMBER_PAD)
        self.assertEqual(int(suffix), start + 1)


class NextInvoiceIdentifiersConcurrencyTests(TransactionTestCase):
    """Параллельные вызовы — отдельные коммиты; обычный TestCase держит транзакцию и мешает потокам."""

    def test_concurrent_calls_produce_unique_identifiers(self):
        n = 25

        def _call():
            try:
                return next_invoice_identifiers()
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=10) as pool:
            pairs = list(pool.map(lambda _: _call(), range(n)))

        invoice_nums = [p[0] for p in pairs]
        var_symbols = [p[1] for p in pairs]
        self.assertEqual(len(invoice_nums), len(set(invoice_nums)))
        self.assertEqual(len(var_symbols), len(set(var_symbols)))
        for inv, vs in pairs:
            self.assertEqual(inv, vs)


# ---------------------------------------------------------------------------
# generate_order_number()
# ---------------------------------------------------------------------------


class OrderNumberFormatTests(TestCase):

    _NUMBER_PATTERN = re.compile(r"^\d{12}-[0-9a-f]{6}$")

    def test_order_number_matches_expected_format(self):
        """generate_order_number() returns DDMMYYHHMMSS-xxxxxx format."""
        number = generate_order_number()
        self.assertRegex(number, self._NUMBER_PATTERN)

    def test_order_number_length_is_correct(self):
        number = generate_order_number()
        self.assertEqual(len(number), 19)

    def test_consecutive_calls_return_different_numbers(self):
        """UUID suffix ensures uniqueness even within the same second."""
        numbers = {generate_order_number() for _ in range(20)}
        self.assertEqual(len(numbers), 20)


# ---------------------------------------------------------------------------
# OrderEvent
# ---------------------------------------------------------------------------


class OrderEventTests(OrderTestMixin, TestCase):

    def setUp(self):
        self.order = self._make_order()

    def test_order_event_created_with_correct_type(self):
        event = OrderEvent.objects.create(
            order=self.order,
            type=OrderEvent.Type.ORDER_CREATED,
        )
        self.assertEqual(event.order, self.order)
        self.assertEqual(event.type, OrderEvent.Type.ORDER_CREATED)
        self.assertIsNotNone(event.created_at)

    def test_order_event_meta_stored(self):
        meta = {"invoice_number": "2026-001", "amount": "100.00"}
        event = OrderEvent.objects.create(
            order=self.order,
            type=OrderEvent.Type.PAYMENT_CONFIRMED,
            meta=meta,
        )
        event.refresh_from_db()
        self.assertEqual(event.meta["invoice_number"], "2026-001")

    def test_multiple_events_per_order(self):
        for event_type in [
            OrderEvent.Type.ORDER_CREATED,
            OrderEvent.Type.PAYMENT_CONFIRMED,
            OrderEvent.Type.SHIPMENT_CREATED,
        ]:
            OrderEvent.objects.create(order=self.order, type=event_type)

        self.assertEqual(self.order.events.count(), 3)

    def test_order_event_all_types_are_valid_choices(self):
        """Smoke-test: every Type choice can be saved without IntegrityError."""
        for event_type in OrderEvent.Type.values:
            OrderEvent.objects.create(order=self.order, type=event_type)

        self.assertEqual(self.order.events.count(), len(OrderEvent.Type.values))


class OrderStatusNameConsistencyTests(TestCase):
    """Константы имён статуса заказа не расходятся между модулями."""

    def test_seller_actions_aliases_order_status_name(self):
        self.assertEqual(SellerOrderActionsService.STATUS_PENDING, OrderStatusName.PENDING)
        self.assertEqual(SellerOrderActionsService.STATUS_PROCESSING, OrderStatusName.PROCESSING)
        self.assertEqual(SellerOrderActionsService.STATUS_SHIPPED, OrderStatusName.SHIPPED)
        self.assertEqual(SellerOrderActionsService.STATUS_DELIVERED, OrderStatusName.DELIVERED)
        self.assertEqual(SellerOrderActionsService.STATUS_CANCELLED, OrderStatusName.CANCELLED)


class OrderStatusStringFragilityTests(TestCase):
    """
    Документирует хрупкость строковых статусов без нормализации (Task 004 backlog).
    Два разных регистра — две разные строки БД; переходы сервиса завязаны на OrderStatusName.
    """

    def test_distinct_rows_for_case_variant_names(self):
        low = OrderStatus.objects.create(name="pending")
        title = OrderStatus.objects.create(name="Pending")
        self.assertNotEqual(low.pk, title.pk)
        self.assertNotEqual(low.name, title.name)


# ---------------------------------------------------------------------------
# Order.user SET_NULL — deletion regression (Task 004 Iteration 3b / Task 012)
# ---------------------------------------------------------------------------


class OrderUserDeletionTests(OrderTestMixin, TestCase):
    """
    After Order.user → on_delete=SET_NULL (migration 0009), deleting a customer
    must NOT cascade-delete their orders.  The order must remain accessible and
    Order.__str__() must not raise.

    Each test creates its own isolated customer so that deleting it does not
    affect shared fixtures from OrderTestMixin.setUpTestData.
    """

    def _fresh_customer(self) -> "CustomUser":
        """Per-test user; email is unique via id(self)."""
        return CustomUser.objects.create_user(
            email=f"deletable-{id(self)}@example.com",
            password="x",
            first_name="Temp",
            last_name="Customer",
            role=UserRole.CUSTOMER,
        )

    def _make_order_for(self, user: "CustomUser") -> Order:
        return Order.objects.create(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
            customer_email=user.email,
            total_amount=Decimal("50.00"),
            group_subtotal=Decimal("50.00"),
            delivery_type=self.delivery_type,
            order_status=self.order_status,
            delivery_cost=Decimal("0.00"),
        )

    def test_order_survives_user_deletion(self):
        """Deleting a customer does NOT cascade-delete their orders."""
        user = self._fresh_customer()
        order = self._make_order_for(user)
        order_pk = order.pk
        user.delete()
        self.assertTrue(Order.objects.filter(pk=order_pk).exists())

    def test_order_user_is_none_after_user_deletion(self):
        """After user.delete(), Order.user is set to None (SET_NULL)."""
        user = self._fresh_customer()
        order = self._make_order_for(user)
        user.delete()
        order.refresh_from_db()
        self.assertIsNone(order.user)

    def test_order_str_safe_after_user_deletion(self):
        """Order.__str__() must not raise AttributeError when user is None."""
        user = self._fresh_customer()
        order = self._make_order_for(user)
        user.delete()
        order.refresh_from_db()
        result = str(order)
        self.assertIn("deleted_user", result)
        self.assertIn(order.order_number, result)


# ---------------------------------------------------------------------------
# SellerOrderActionsService — lifecycle (Task 012)
# ---------------------------------------------------------------------------


class SellerOrderActionsLifecycleTests(OrderTestMixin, TestCase):
    """Регрессии для действий продавца / админа над заказом."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        for name in (
            OrderStatusName.PENDING,
            OrderStatusName.PROCESSING,
            OrderStatusName.SHIPPED,
            OrderStatusName.DELIVERED,
            OrderStatusName.CANCELLED,
        ):
            OrderStatus.objects.get_or_create(name=name)
        cls.courier = CourierService.objects.create(
            name="Lifecycle Test Courier",
            code=f"lifecycle-cs-{id(cls)}",
        )

    def _make_order_with_status(self, status_name: str) -> Order:
        st = OrderStatus.objects.get(name=status_name)
        payment = self._make_payment(suffix=f"{status_name}-{id(self)}")
        return Order.objects.create(
            user=self.customer,
            first_name="Jan",
            last_name="Novak",
            customer_email="order-test-customer@example.com",
            total_amount=Decimal("105.00"),
            group_subtotal=Decimal("105.00"),
            delivery_type=self.delivery_type,
            order_status=st,
            delivery_cost=Decimal("5.00"),
            payment=payment,
            delivery_address=self.delivery_address,
        )

    def test_confirm_order_moves_pending_to_processing(self):
        order = self._make_order_with_status(OrderStatusName.PENDING)
        self._add_product(order)
        SellerOrderActionsService.confirm_order(order_id=order.pk, user=self.seller_user)
        order.refresh_from_db()
        self.assertEqual(order.order_status.name, OrderStatusName.PROCESSING)
        self.assertTrue(
            OrderEvent.objects.filter(
                order=order,
                type=OrderEvent.Type.ORDER_ACKNOWLEDGED,
            ).exists()
        )

    def test_confirm_order_rejects_when_not_pending(self):
        order = self._make_order_with_status(OrderStatusName.PROCESSING)
        self._add_product(order)
        with self.assertRaises(ValidationError):
            SellerOrderActionsService.confirm_order(order_id=order.pk, user=self.seller_user)

    def test_mark_shipped_requires_parcels(self):
        order = self._make_order_with_status(OrderStatusName.PROCESSING)
        self._add_product(order)
        with self.assertRaises(ValidationError) as ctx:
            SellerOrderActionsService.mark_as_shipped(order_id=order.pk, user=self.seller_user)
        err = ctx.exception.detail
        blob = err if isinstance(err, str) else str(err)
        self.assertIn("parcel", blob.lower())

    def test_mark_shipped_ok_with_parcel(self):
        order = self._make_order_with_status(OrderStatusName.PROCESSING)
        self._add_product(order)
        DeliveryParcel.objects.create(
            order=order,
            warehouse=self.warehouse,
            service=self.courier,
            weight_grams=500,
            parcel_index=0,
            shipping_price=Decimal("5.00"),
            tracking_number="TRACK-1",
        )
        SellerOrderActionsService.mark_as_shipped(order_id=order.pk, user=self.seller_user)
        order.refresh_from_db()
        self.assertEqual(order.order_status.name, OrderStatusName.SHIPPED)

    def test_cancel_order_denied_for_non_staff_seller(self):
        order = self._make_order_with_status(OrderStatusName.PENDING)
        self._add_product(order)
        with self.assertRaises(PermissionDenied):
            SellerOrderActionsService.cancel_order(order_id=order.pk, user=self.seller_user)

    def test_cancel_order_staff_sets_cancelled_and_product_lines(self):
        admin_user = CustomUser.objects.create_user(
            email="admin-order-lifecycle@example.com",
            password="pass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        order = self._make_order_with_status(OrderStatusName.PENDING)
        op = self._add_product(order)
        SellerOrderActionsService.cancel_order(order_id=order.pk, user=admin_user)
        order.refresh_from_db()
        op.refresh_from_db()
        self.assertEqual(order.order_status.name, OrderStatusName.CANCELLED)
        self.assertEqual(op.status, OrderLineStatus.CANCELED)

    def test_cancel_order_staff_rejects_when_delivered(self):
        admin_user = CustomUser.objects.create_user(
            email="admin-cancel-delivered@example.com",
            password="pass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        order = self._make_order_with_status(OrderStatusName.DELIVERED)
        self._add_product(order)
        with self.assertRaises(ValidationError):
            SellerOrderActionsService.cancel_order(order_id=order.pk, user=admin_user)

    def test_cancel_order_staff_rejects_when_already_cancelled(self):
        admin_user = CustomUser.objects.create_user(
            email="admin-cancel-twice@example.com",
            password="pass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        order = self._make_order_with_status(OrderStatusName.CANCELLED)
        self._add_product(order)
        with self.assertRaises(ValidationError):
            SellerOrderActionsService.cancel_order(order_id=order.pk, user=admin_user)

    def test_cancel_order_staff_succeeds_from_shipped(self):
        admin_user = CustomUser.objects.create_user(
            email="admin-cancel-shipped@example.com",
            password="pass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        order = self._make_order_with_status(OrderStatusName.SHIPPED)
        self._add_product(order)
        SellerOrderActionsService.cancel_order(order_id=order.pk, user=admin_user)
        order.refresh_from_db()
        self.assertEqual(order.order_status.name, OrderStatusName.CANCELLED)
        self.assertTrue(
            OrderEvent.objects.filter(
                order=order,
                type=OrderEvent.Type.CANCELLED,
            ).exists()
        )
