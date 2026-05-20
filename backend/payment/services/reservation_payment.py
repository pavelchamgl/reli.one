"""
Align PSP checkout sessions with StockReservation TTL (Task 013 follow-up).

- Stripe: pass ``expires_at`` on Checkout Session create; optionally ``Session.expire`` on cleanup.
- PayPal: CAPTURE orders cannot be force-expired like Stripe Checkout Session. The business-safe
  equivalent is **server-side capture blocking** on ``CHECKOUT.ORDER.APPROVED`` when the reservation
  is not PENDING, plus late ``COMPLETED`` / ``CAPTURE.COMPLETED`` webhook guard as secondary protection.
"""
from __future__ import annotations

import logging
from datetime import datetime

import stripe
from django.conf import settings
from django.utils import timezone

from warehouses.models import StockReservation

logger = logging.getLogger(__name__)


def get_checkout_reservation_expires_at(session_key: str) -> datetime | None:
    """Return reservation ``expires_at`` when stock reservation is enabled, else None."""
    if not getattr(settings, "STOCK_RESERVATION_ENABLED", False):
        return None
    row = (
        StockReservation.objects.filter(session_key=session_key)
        .only("expires_at")
        .first()
    )
    return row.expires_at if row else None


def save_provider_checkout_id(session_key: str, provider_checkout_id: str) -> None:
    """Persist Stripe cs_… or PayPal order id on the reservation for cleanup."""
    if not getattr(settings, "STOCK_RESERVATION_ENABLED", False):
        return
    if not provider_checkout_id:
        return
    updated = StockReservation.objects.filter(session_key=session_key).update(
        provider_checkout_id=provider_checkout_id,
    )
    if not updated:
        logger.warning(
            "save_provider_checkout_id: no reservation for session_key=%s",
            session_key,
        )


PAYPAL_CAPTURE_SKIPPED_STATUS = "paypal_capture_skipped_reservation_expired"
LATE_PAYMENT_MANUAL_REVIEW_STATUS = "payment_received_reservation_expired_manual_review"


def reservation_blocks_late_checkout_completion(session_key: str) -> tuple[bool, str | None]:
    """
    True when a reservation exists and is not PENDING (expired/released/confirmed).

    Used to block order creation on late success webhooks while still returning 200 to PSP.
    """
    if not getattr(settings, "STOCK_RESERVATION_ENABLED", False):
        return False, None
    reservation = (
        StockReservation.objects.filter(session_key=session_key)
        .only("status", "payment_system", "provider_checkout_id")
        .first()
    )
    if reservation is None:
        return False, None
    if reservation.status == StockReservation.Status.PENDING:
        return False, None
    return True, reservation.status


def log_paypal_capture_skipped(
    *,
    session_key: str,
    reservation_status: str | None,
    order_id: str | None,
    event_type: str = "CHECKOUT.ORDER.APPROVED",
) -> None:
    """Log late PayPal approval/capture attempt for manual review (no funds captured)."""
    reservation = (
        StockReservation.objects.filter(session_key=session_key)
        .only("provider_checkout_id", "payment_system")
        .first()
    )
    logger.error(
        "[PayPalWebhook] Capture skipped (manual review, no refund needed): event=%s "
        "session_key=%s reservation_status=%s order_id=%s provider_checkout_id=%s",
        event_type,
        session_key,
        reservation_status,
        order_id,
        getattr(reservation, "provider_checkout_id", None) if reservation else None,
    )


def expire_provider_checkout_after_reservation_release(
    *,
    session_key: str,
    payment_system: str,
    provider_checkout_id: str | None,
) -> None:
    """
    Best-effort PSP session invalidation after reservation TTL cleanup.

    Failures are logged only — stock is already released.
    """
    if not provider_checkout_id:
        return

    if payment_system == "stripe":
        _expire_stripe_checkout_session(provider_checkout_id, session_key=session_key)
    elif payment_system == "paypal":
        _void_paypal_checkout_order(provider_checkout_id, session_key=session_key)


def _expire_stripe_checkout_session(stripe_session_id: str, *, session_key: str) -> None:
    stripe.api_key = settings.STRIPE_API_SECRET_KEY
    try:
        stripe.checkout.Session.expire(stripe_session_id)
        logger.info(
            "Expired Stripe Checkout Session %s for session_key=%s",
            stripe_session_id,
            session_key,
        )
    except stripe.error.StripeError as exc:
        logger.warning(
            "Stripe Session.expire failed for %s session_key=%s: %s",
            stripe_session_id,
            session_key,
            exc,
        )


def _void_paypal_checkout_order(paypal_order_id: str, *, session_key: str) -> None:
    """
    PayPal void only applies to AUTHORIZE intent or CAPTURE orders in APPROVED state.

    CREATED orders expire on PayPal side (~3h); webhook guard handles late capture.
    """
    from payment.services.paypal_checkout import void_paypal_checkout_order

    void_paypal_checkout_order(paypal_order_id, session_key=session_key)


def stripe_checkout_expires_at_unix(expires_at: datetime) -> int:
    """Unix timestamp for Stripe Checkout Session ``expires_at`` (must be in the future)."""
    if timezone.is_naive(expires_at):
        expires_at = timezone.make_aware(expires_at, timezone.get_current_timezone())
    return int(expires_at.timestamp())
