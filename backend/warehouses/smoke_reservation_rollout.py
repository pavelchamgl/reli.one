"""
Task 013 Phase 6 — repeatable rollout smoke (service layer, no PSP).

Used by:
  - ``warehouses/tests_stock_reservation_smoke.py`` (pytest, CI-friendly)
  - ``python manage.py smoke_stock_reservation`` (local Docker / staging prep)

Requires ``STOCK_RESERVATION_ENABLED=True``. All external payment providers stay mocked
in automated paths; this module never calls Stripe/PayPal APIs.
"""
from __future__ import annotations

import uuid
from datetime import timedelta
from decimal import Decimal
from typing import Callable

from django.core.management import call_command
from django.utils import timezone

from accounts.choices import UserRole
from accounts.models import CustomUser
from payment.services.checkout_shared import (
    create_checkout_stock_reservation_if_enabled,
)
from payment.services.stripe_session import StripeSessionBuildError
from product.models import BaseProduct, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.exceptions import InsufficientStockError
from warehouses.models import StockReservation, Warehouse, WarehouseItem
from warehouses.services.reservation import StockReservationService

LogFn = Callable[[str], None]


def _noop_log(_msg: str) -> None:
    pass


def run_rollout_smoke(*, log: LogFn = _noop_log) -> None:
    """
    Run the full stock-reservation rollout smoke sequence.

    Raises ``AssertionError`` on any failed check.
    """
    slug = f"smoke-{uuid.uuid4().hex[:8]}"
    log(f"[1/7] Creating catalog (quantity_in_stock=1) …")

    warehouse = Warehouse.objects.create(
        name=f"WH-Smoke-{slug}",
        street="Smoke 1",
        city="Praha",
        zip_code="10000",
        country="CZ",
    )
    phone_suffix = abs(hash(slug)) % 10_000_000
    seller_user = CustomUser.objects.create_user(
        email=f"seller-{slug}@smoke.example.com",
        password="unused",
        first_name="S",
        last_name="T",
        role=UserRole.SELLER,
        phone_number=f"+420730{phone_suffix:07d}",
    )
    seller_profile = SellerProfile.objects.get(user=seller_user)
    seller_profile.default_warehouse = warehouse
    seller_profile.save(update_fields=["default_warehouse"])

    base_product = BaseProduct.objects.create(
        name=f"Smoke Product {slug}",
        product_description="Smoke",
        seller=seller_profile,
        vat_rate=Decimal("21.00"),
        status=ProductStatus.APPROVED,
        is_active=True,
    )
    variant = ProductVariant.objects.create(
        product=base_product,
        name="V",
        text="opt",
        price=Decimal("10.00"),
        weight_grams=100,
    )
    wi = WarehouseItem.objects.create(
        warehouse=warehouse,
        product_variant=variant,
        quantity_in_stock=1,
        reserved_quantity=0,
    )
    variant_map = {variant.sku: variant}
    groups_one = [{"products": [{"sku": variant.sku, "quantity": 1}]}]

    sk1 = f"smoke-sk1-{slug}"
    log(f"[2/7] First reservation (session_key={sk1}) …")
    StockReservationService.create_reservation(
        session_key=sk1,
        payment_system="stripe",
        groups=groups_one,
        variant_map=variant_map,
    )
    wi.refresh_from_db()
    assert wi.reserved_quantity == 1, f"expected reserved_quantity=1, got {wi.reserved_quantity}"
    assert wi.quantity_in_stock == 1

    log("[3/7] Second reservation must fail (InsufficientStockError) …")
    sk2 = f"smoke-sk2-{slug}"
    try:
        StockReservationService.create_reservation(
            session_key=sk2,
            payment_system="stripe",
            groups=groups_one,
            variant_map=variant_map,
        )
        raise AssertionError("Expected InsufficientStockError on second reservation")
    except InsufficientStockError as exc:
        assert exc.detail.get("available") == 0
        assert exc.detail.get("requested") == 1

    log("[3b/7] Checkout hook maps insufficient stock to HTTP 409 …")
    sk409 = f"smoke-sk409-{slug}"
    try:
        create_checkout_stock_reservation_if_enabled(
            session_key=sk409,
            payment_system="stripe",
            groups=groups_one,
            variant_map=variant_map,
            error_cls=StripeSessionBuildError,
        )
        raise AssertionError("Expected StripeSessionBuildError(409)")
    except StripeSessionBuildError as exc:
        assert exc.http_status == 409
        assert "stock" in exc.detail

    log(f"[4/7] Confirm reservation {sk1} …")
    StockReservationService.confirm_reservation(sk1)
    wi.refresh_from_db()
    assert wi.quantity_in_stock == 0
    assert wi.reserved_quantity == 0
    r1 = StockReservation.objects.get(session_key=sk1)
    assert r1.status == StockReservation.Status.CONFIRMED

    log("[5/7] Replay confirm must not double-decrement …")
    StockReservationService.confirm_reservation(sk1)
    wi.refresh_from_db()
    assert wi.quantity_in_stock == 0

    log("[6/7] Expired PENDING reservation + cleanup command …")
    wi.quantity_in_stock = 3
    wi.reserved_quantity = 0
    wi.save(update_fields=["quantity_in_stock", "reserved_quantity"])

    sk_exp = f"smoke-sk-exp-{slug}"
    reservation_exp = StockReservationService.create_reservation(
        session_key=sk_exp,
        payment_system="paypal",
        groups=groups_one,
        variant_map=variant_map,
    )
    reservation_exp.expires_at = timezone.now() - timedelta(minutes=1)
    reservation_exp.save(update_fields=["expires_at"])
    wi.refresh_from_db()
    assert wi.reserved_quantity == 1

    call_command("release_expired_reservations", verbosity=0)
    reservation_exp.refresh_from_db()
    assert reservation_exp.status == StockReservation.Status.EXPIRED
    wi.refresh_from_db()
    assert wi.reserved_quantity == 0
    assert wi.quantity_in_stock == 3

    log("[7/7] Rollout smoke completed successfully.")
