"""
Shared pytest fixtures for the reli.one backend test suite.

These fixtures are available in all test modules via pytest-django.
Django TestCase-based tests do NOT use these fixtures directly —
they use their own setUp/setUpTestData. Use these for pytest-style tests.
"""
from __future__ import annotations

from decimal import Decimal

import pytest

from accounts.choices import UserRole
from accounts.models import CustomUser
from delivery.models import DeliveryAddress
from order.models import CourierService, DeliveryType, Order, OrderProduct, OrderStatus
from payment.models import Payment
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


@pytest.fixture
def customer(db):
    return CustomUser.objects.create_user(
        email="fixture-customer@example.com",
        password="testpass123",
        first_name="Jan",
        last_name="Novak",
        role=UserRole.CUSTOMER,
        phone_number="+420777900001",
    )


@pytest.fixture
def seller_user(db):
    return CustomUser.objects.create_user(
        email="fixture-seller@example.com",
        password="testpass123",
        first_name="Pavel",
        last_name="Prodavac",
        role=UserRole.SELLER,
        phone_number="+420777900002",
    )


@pytest.fixture
def manager_user(db):
    return CustomUser.objects.create_user(
        email="fixture-manager@example.com",
        password="testpass123",
        first_name="Anna",
        last_name="Managerova",
        role=UserRole.MANAGER,
        phone_number="+420777900003",
        is_staff=True,
    )


# ---------------------------------------------------------------------------
# Sellers
# ---------------------------------------------------------------------------


@pytest.fixture
def seller_profile(seller_user):
    """SellerProfile is auto-created via signal on seller user creation."""
    return SellerProfile.objects.get(user=seller_user)


# ---------------------------------------------------------------------------
# Warehouse / logistics
# ---------------------------------------------------------------------------


@pytest.fixture
def warehouse(db):
    return Warehouse.objects.create(
        name="Fixture Warehouse CZ",
        street="Průmyslová 1",
        city="Praha",
        zip_code="10000",
        country="CZ",
    )


@pytest.fixture
def delivery_type(db):
    return DeliveryType.objects.create(name="Fixture Courier")


@pytest.fixture
def order_status(db):
    return OrderStatus.objects.create(name="Fixture Pending")


@pytest.fixture
def courier_service(db):
    return CourierService.objects.create(name="Zásilkovna Fixture", code="zasilkovna-fixture")


@pytest.fixture
def delivery_address(customer):
    return DeliveryAddress.objects.create(
        user=customer,
        full_name="Jan Novak",
        phone="+420777900001",
        email="fixture-customer@example.com",
        street="Testovací 1",
        city="Praha",
        zip_code="10000",
        country="CZ",
    )


# ---------------------------------------------------------------------------
# Product catalog
# ---------------------------------------------------------------------------


@pytest.fixture
def base_product(seller_profile, db):
    return BaseProduct.objects.create(
        name="Fixture Test Product",
        product_description="Fixture product description.",
        seller=seller_profile,
        article="FIXTURE-001",
        vat_rate=Decimal("21.00"),
        status=ProductStatus.APPROVED,
        is_active=True,
    )


@pytest.fixture
def product_variant(base_product):
    return ProductVariant.objects.create(
        product=base_product,
        name="Default Variant",
        text="default",
        price=Decimal("100.00"),
        weight_grams=500,
        length_mm=200,
        width_mm=150,
        height_mm=100,
    )


# ---------------------------------------------------------------------------
# Payment / Order
# ---------------------------------------------------------------------------


@pytest.fixture
def payment_obj(db):
    return Payment.objects.create(
        payment_system="stripe",
        session_id="cs_test_fixture_conftest_001",
        payment_intent_id="pi_fixture_conftest_001",
        payment_method="stripe",
        amount_total=Decimal("105.00"),
        currency="EUR",
        customer_email="fixture-customer@example.com",
    )


@pytest.fixture
def order(customer, seller_profile, warehouse, product_variant, delivery_type, order_status, payment_obj, delivery_address):
    """A minimal order with one unreceived order product."""
    o = Order.objects.create(
        user=customer,
        first_name="Jan",
        last_name="Novak",
        customer_email="fixture-customer@example.com",
        total_amount=Decimal("105.00"),
        group_subtotal=Decimal("105.00"),
        delivery_type=delivery_type,
        order_status=order_status,
        delivery_cost=Decimal("5.00"),
        payment=payment_obj,
        delivery_address=delivery_address,
    )
    OrderProduct.objects.create(
        order=o,
        product=product_variant,
        quantity=1,
        seller_profile=seller_profile,
        warehouse=warehouse,
        product_price=Decimal("100.00"),
        delivery_cost=Decimal("5.00"),
        received=False,
    )
    return o
