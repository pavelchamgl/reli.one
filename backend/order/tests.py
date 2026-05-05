"""
Regression tests for the order domain.

Covers:
- Order.calculate_refund() — all received / none received / partial / no items
- OrderProduct.save() — received_at set/cleared on received flag change
- generate_order_number() — format and uniqueness
- OrderEvent — creation and FK integrity
"""
from __future__ import annotations

import re
from decimal import Decimal

from django.test import TestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from delivery.models import DeliveryAddress
from order.models import (
    CourierService,
    DeliveryType,
    Order,
    OrderEvent,
    OrderProduct,
    OrderStatus,
    generate_order_number,
)
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
            article="ORDER-TEST-001",
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
