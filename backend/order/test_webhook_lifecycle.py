"""
Интеграционные тесты жизненного цикла заказа после успешного webhook checkout
(create_orders_and_payment): заказ, строки, Payment, Invoice, идемпотентность, адреса доставки.
"""
from __future__ import annotations

from contextlib import contextmanager
from decimal import Decimal
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.test import TestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from order.models import (
    CourierService,
    DeliveryType,
    Invoice,
    Order,
    OrderEvent,
    OrderProduct,
    OrderStatus,
)
from payment.models import Payment, StripeMetadata
from payment.services.webhook_processing import WebhookPaymentData, create_orders_and_payment
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem


@contextmanager
def _webhook_side_effect_patches():
    with patch(
        "payment.services.webhook_processing.async_parcels_and_seller_email",
    ), patch(
        "payment.services.webhook_processing.async_send_client_email",
    ), patch(
        "payment.services.webhook_processing.set_conv_cache_after_commit",
    ), patch(
        "payment.services.webhook_processing.generate_invoice_pdf",
    ) as mock_pdf:
        yield mock_pdf

class OrderWebhookLifecycleTests(TestCase):
    """Полный путь create_orders_and_payment (Stripe) с реальной БД и моком PDF/email."""

    @classmethod
    def setUpTestData(cls):
        cls.warehouse = Warehouse.objects.create(
            name=f"WH-LC-{cls.__name__}",
            street="WH 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        slug = cls.__name__.lower()
        h = abs(hash(slug))

        cls.seller_user = CustomUser.objects.create_user(
            email=f"seller-lc-{h}@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="LC",
            role=UserRole.SELLER,
            phone_number=f"+420730{h % 1000000:06d}",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.warehouse
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.customer = CustomUser.objects.create_user(
            email=f"buyer-lc-{h}@example.com",
            password="pass12345",
            first_name="Buyer",
            last_name="LC",
            role=UserRole.CUSTOMER,
            phone_number=f"+420731{h % 1000000:06d}",
        )

        cls.base_product = BaseProduct.objects.create(
            name="LC Product",
            product_description="T",
            seller=cls.seller_profile,
            article=f"{h % 10_000_000_000:010d}",
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
            sku=f"LC{h % 10**6:06d}",
        )
        WarehouseItem.objects.create(
            warehouse=cls.warehouse,
            product_variant=cls.variant,
            quantity_in_stock=100,
        )

        OrderStatus.objects.get_or_create(name="Pending")
        DeliveryType.objects.all().delete()
        cls.dt_pudo = DeliveryType.objects.create(pk=1, name="PUDO")
        cls.dt_hd = DeliveryType.objects.create(pk=2, name="Home Delivery")
        CourierService.objects.all().delete()
        CourierService.objects.create(pk=2, code="packeta", name="Packeta", active=True)
        CourierService.objects.create(pk=3, code="gls", name="GLS", active=True)
        CourierService.objects.create(pk=4, code="dpd", name="DPD", active=True)

    def _order_totals(self, qty: int, delivery: Decimal) -> tuple[Decimal, Decimal]:
        unit = self.variant.price_with_acquiring
        line = (unit * qty).quantize(Decimal("0.01"))
        gross = (line + delivery).quantize(Decimal("0.01"))
        return line, gross

    def _stripe_context(self, test_id: str):
        sid = f"cs_lc_{test_id}"
        sk = f"sk_lc_{test_id}"
        return sid, sk

    def _run_checkout(
        self,
        *,
        session_id: str,
        session_key: str,
        group: dict,
        invoice_number: str,
        variable_symbol: str,
        gross_total: Decimal,
        delivery_total: Decimal,
        mock_pdf,
        create_metadata: bool = True,
    ):
        if create_metadata:
            StripeMetadata.objects.create(
                session_key=session_key,
                custom_data={
                    "user_id": str(self.customer.pk),
                    "email": self.customer.email,
                    "first_name": "Buyer",
                    "last_name": "LC",
                    "phone": "+420777000111",
                    "delivery_address": {"country": "CZ"},
                },
                invoice_data={
                    "invoice_number": invoice_number,
                    "groups": [group],
                },
                description_data={
                    "variable_symbol": variable_symbol,
                    "delivery_total": str(delivery_total),
                    "gross_total": str(gross_total),
                },
            )
        mock_pdf.return_value = ContentFile(b"%PDF-lc-test", name="invoice.pdf")

        data = WebhookPaymentData(
            payment_system="stripe",
            payment_method="stripe",
            session_id=session_id,
            session_key=session_key,
            conv_cache_id=session_id,
            amount=gross_total,
            currency="EUR",
            customer_id="cus_lc",
            payment_intent_id=f"pi_lc_{session_id}",
            custom_data={
                "user_id": str(self.customer.pk),
                "email": self.customer.email,
                "first_name": "Buyer",
                "last_name": "LC",
                "phone": "+420777000111",
                "delivery_address": {"country": "CZ"},
            },
            invoice_data={
                "invoice_number": invoice_number,
                "groups": [group],
            },
            description_data={
                "variable_symbol": variable_symbol,
                "delivery_total": str(delivery_total),
                "gross_total": str(gross_total),
            },
        )
        return create_orders_and_payment(data)

    def test_order_products_payment_invoice_after_successful_payment(self):
        """После оплаты: один заказ, корректные OrderProduct, Payment привязан, один Invoice."""
        sid, sk = self._stripe_context("success01")
        qty = 2
        delivery = Decimal("5.21")
        unit = self.variant.price_with_acquiring
        line = (unit * qty).quantize(Decimal("0.01"))
        group_total = (line + delivery).quantize(Decimal("0.01"))

        group = {
            "seller_id": self.seller_profile.id,
            "delivery_type": 2,
            "courier_service": 2,
            "delivery_address": {
                "street": "Main 10",
                "city": "Praha",
                "zip": "12000",
                "country": "CZ",
            },
            "products": [{"sku": self.variant.sku, "quantity": qty}],
            "calculated_delivery_cost": str(delivery),
            "calculated_group_total": str(group_total),
        }

        with _webhook_side_effect_patches() as mock_pdf:
            result = self._run_checkout(
                session_id=sid,
                session_key=sk,
                group=group,
                invoice_number="INV-LC-OK",
                variable_symbol="LCVS01",
                gross_total=group_total,
                delivery_total=delivery,
                mock_pdf=mock_pdf,
            )
        self.assertIsNotNone(result)
        self.assertFalse(result.is_replay)
        self.assertTrue(result.invoice_created)
        self.assertEqual(len(result.orders), 1)

        order = Order.objects.get()
        pay = Payment.objects.get(session_id=sid)
        self.assertEqual(order.payment_id, pay.id)
        self.assertEqual(pay.orders.count(), 1)
        self.assertEqual(OrderProduct.objects.filter(order=order).count(), 1)
        op = OrderProduct.objects.get(order=order)
        self.assertEqual(op.product_id, self.variant.id)
        self.assertEqual(op.quantity, qty)
        self.assertEqual(op.product_price, unit)
        self.assertEqual(
            Invoice.objects.filter(payment=pay, invoice_number="INV-LC-OK").count(),
            1,
        )
        ev_types = set(order.events.values_list("type", flat=True))
        self.assertIn(OrderEvent.Type.ORDER_CREATED, ev_types)
        self.assertIn(OrderEvent.Type.PAYMENT_CONFIRMED, ev_types)
        mock_pdf.assert_called_once()

    def test_repeated_webhook_does_not_duplicate_order_or_invoice(self):
        """Второй webhook с тем же session_id: replay, без новых Order/Invoice и без повторного PDF."""
        sid, sk = self._stripe_context("idem02")
        qty = 1
        delivery = Decimal("5.00")
        unit = self.variant.price_with_acquiring
        line = (unit * qty).quantize(Decimal("0.01"))
        group_total = (line + delivery).quantize(Decimal("0.01"))

        group = {
            "seller_id": self.seller_profile.id,
            "delivery_type": 2,
            "courier_service": 2,
            "delivery_address": {
                "street": "X",
                "city": "Praha",
                "zip": "11000",
                "country": "CZ",
            },
            "products": [{"sku": self.variant.sku, "quantity": qty}],
            "calculated_delivery_cost": str(delivery),
            "calculated_group_total": str(group_total),
        }

        with _webhook_side_effect_patches() as mock_pdf:
            r1 = self._run_checkout(
                session_id=sid,
                session_key=sk,
                group=group,
                invoice_number="INV-LC-ID",
                variable_symbol="LCVS02",
                gross_total=group_total,
                delivery_total=delivery,
                mock_pdf=mock_pdf,
            )
            r2 = self._run_checkout(
                session_id=sid,
                session_key=sk,
                group=group,
                invoice_number="INV-LC-ID",
                variable_symbol="LCVS02",
                gross_total=group_total,
                delivery_total=delivery,
                mock_pdf=mock_pdf,
                create_metadata=False,
            )

        self.assertIsNotNone(r1)
        self.assertFalse(r1.is_replay)
        self.assertTrue(r1.invoice_created)

        self.assertIsNotNone(r2)
        self.assertTrue(r2.is_replay)
        self.assertEqual(r2.orders, [])

        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Payment.objects.filter(session_id=sid).count(), 1)
        self.assertEqual(Invoice.objects.count(), 1)
        mock_pdf.assert_called_once()

    def test_delivery_address_home_delivery_uses_group_address(self):
        sid, sk = self._stripe_context("hd03")
        delivery = Decimal("5.00")
        _, group_total = self._order_totals(1, delivery)
        group = {
            "seller_id": self.seller_profile.id,
            "delivery_type": 2,
            "courier_service": 2,
            "delivery_address": {
                "street": "Home Street 9",
                "city": "Brno",
                "zip": "60200",
                "country": "CZ",
            },
            "products": [{"sku": self.variant.sku, "quantity": 1}],
            "calculated_delivery_cost": str(delivery),
            "calculated_group_total": str(group_total),
        }
        with _webhook_side_effect_patches() as mock_pdf:
            self._run_checkout(
                session_id=sid,
                session_key=sk,
                group=group,
                invoice_number="INV-LC-HD",
                variable_symbol="LCVS03",
                gross_total=group_total,
                delivery_total=delivery,
                mock_pdf=mock_pdf,
            )
        order = Order.objects.get()
        addr = order.delivery_address
        self.assertEqual(addr.street, "Home Street 9")
        self.assertEqual(addr.city, "Brno")
        self.assertEqual(addr.zip_code, "60200")

    def test_delivery_address_packeta_pudo_empty_street(self):
        """Packeta PUDO: пустой адрес в БД (пункт по pickup позже)."""
        sid, sk = self._stripe_context("pudo04")
        delivery = Decimal("5.00")
        _, group_total = self._order_totals(1, delivery)
        group = {
            "seller_id": self.seller_profile.id,
            "delivery_type": 1,
            "courier_service": 2,
            "pickup_point_id": "ZBOX123",
            "delivery_address": {
                "street": "Should Ignore",
                "city": "Praha",
                "zip": "10000",
                "country": "CZ",
            },
            "products": [{"sku": self.variant.sku, "quantity": 1}],
            "calculated_delivery_cost": str(delivery),
            "calculated_group_total": str(group_total),
        }
        with _webhook_side_effect_patches() as mock_pdf:
            self._run_checkout(
                session_id=sid,
                session_key=sk,
                group=group,
                invoice_number="INV-LC-PU",
                variable_symbol="LCVS04",
                gross_total=group_total,
                delivery_total=delivery,
                mock_pdf=mock_pdf,
            )
        order = Order.objects.get()
        addr = order.delivery_address
        self.assertEqual(addr.street, "")
        self.assertEqual(addr.city, "")
        self.assertEqual(order.pickup_point_id, "ZBOX123")

    def test_delivery_address_dpd_pudo_uses_point_coordinates(self):
        """DPD PUDO с непустым gaddr — адрес пункта выдачи в DeliveryAddress."""
        sid, sk = self._stripe_context("dpd05")
        delivery = Decimal("5.00")
        _, group_total = self._order_totals(1, delivery)
        group = {
            "seller_id": self.seller_profile.id,
            "delivery_type": 1,
            "courier_service": 4,
            "delivery_address": {
                "street": "DPD Point 7",
                "city": "Olomouc",
                "zip": "77900",
                "country": "CZ",
            },
            "products": [{"sku": self.variant.sku, "quantity": 1}],
            "calculated_delivery_cost": str(delivery),
            "calculated_group_total": str(group_total),
        }
        with _webhook_side_effect_patches() as mock_pdf:
            self._run_checkout(
                session_id=sid,
                session_key=sk,
                group=group,
                invoice_number="INV-LC-DPD",
                variable_symbol="LCVS05",
                gross_total=group_total,
                delivery_total=delivery,
                mock_pdf=mock_pdf,
            )
        order = Order.objects.get()
        addr = order.delivery_address
        self.assertEqual(addr.street, "DPD Point 7")
        self.assertEqual(addr.city, "Olomouc")
        self.assertEqual(addr.zip_code, "77900")
