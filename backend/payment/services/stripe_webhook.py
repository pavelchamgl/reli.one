"""
Stripe Checkout webhook: верификация события и сборка WebhookPaymentData.

HTTP-ответы формируются в StripeWebhookView; здесь только провайдер-специфика.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

import stripe
from django.conf import settings

from payment.models import StripeMetadata
from payment.services.checkout_shared import release_checkout_stock_reservation_if_enabled
from payment.services.webhook_processing import WebhookPaymentData

logger = logging.getLogger(__name__)

_STRIPE_HANDLED_TYPES = frozenset(
    {"checkout.session.completed", "checkout.session.async_payment_succeeded"}
)

_STRIPE_RELEASE_TYPES = frozenset(
    {
        "checkout.session.expired",
        "checkout.session.async_payment_failed",
    }
)


@dataclass(frozen=True)
class StripeWebhookVerifyResult:
    """
    Результат verify / фильтра типа события.

    Если задан early_status — view должен сразу вернуть HTTP-ответ:
    - early_no_body=True → Response(status=early_status) без тела
    - иначе → Response(early_body, status=early_status)
    """

    event: object | None = None
    early_status: int | None = None
    early_body: dict | None = None
    early_no_body: bool = False


def construct_stripe_webhook_event(
    raw_body: str,
    signature_header: str,
    *,
    secret: str,
) -> StripeWebhookVerifyResult:
    """
    Verify Stripe signature (or parse JSON in E2E skip-sig mode) and return the event.

    Does not filter by event type — caller routes success vs release vs ignored.
    """
    if getattr(settings, "STRIPE_WEBHOOK_SKIP_SIGNATURE", False):
        try:
            event = json.loads(raw_body)
        except (ValueError, TypeError):
            return StripeWebhookVerifyResult(early_status=400, early_no_body=True)
        return StripeWebhookVerifyResult(event=event)

    try:
        event = stripe.Webhook.construct_event(raw_body, signature_header, secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.error("Stripe webhook verification failed: %s", e)
        return StripeWebhookVerifyResult(early_status=400, early_no_body=True)

    return StripeWebhookVerifyResult(event=event)


def verify_and_resolve_stripe_checkout_event(
    raw_body: str,
    signature_header: str,
    *,
    secret: str,
) -> StripeWebhookVerifyResult:
    """
    Проверка подписи Stripe и отбор событий checkout session (completed / async_payment_succeeded).

    Когда STRIPE_WEBHOOK_SKIP_SIGNATURE=True (E2E-only, никогда в prod), подпись не проверяется:
    тело парсится как JSON напрямую.
    """
    result = construct_stripe_webhook_event(raw_body, signature_header, secret=secret)
    if result.early_status is not None or result.event is None:
        return result

    if result.event.get("type") not in _STRIPE_HANDLED_TYPES:
        logger.info("Unhandled Stripe event: %s", result.event.get("type"))
        return StripeWebhookVerifyResult(early_status=200, early_no_body=True)

    return result


def stripe_session_key_from_checkout_object(session: dict) -> str | None:
    """Extract internal session_key from Stripe Checkout Session metadata."""
    key = (session.get("metadata") or {}).get("session_key")
    return str(key) if key else None


def handle_stripe_reservation_release_event(event: dict) -> None:
    """
    Release stock reservation for Stripe failure/cancel/expiry checkout events.
    """
    event_type = event.get("type")
    if event_type not in _STRIPE_RELEASE_TYPES:
        return

    session = event.get("data", {}).get("object") or {}
    session_key = stripe_session_key_from_checkout_object(session)
    if not session_key:
        logger.warning(
            "[StripeWebhook] %s without session_key in metadata — skip reservation release",
            event_type,
        )
        return

    release_checkout_stock_reservation_if_enabled(session_key)
    logger.info(
        "[StripeWebhook] Released stock reservation for session_key=%s (%s)",
        session_key,
        event_type,
    )


def stripe_checkout_session_to_webhook_payment_data(
    *,
    session: dict,
    meta: StripeMetadata,
    session_key: str,
) -> WebhookPaymentData:
    """
    Конвертация объекта Checkout Session + StripeMetadata → WebhookPaymentData
    (сумма в EUR, предупреждение при расхождении с gross_total в metadata).
    """
    session_id = session["id"]
    amount = (Decimal(session["amount_total"]) / Decimal(100)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    currency = session["currency"].upper()

    try:
        expected = Decimal(
            (meta.description_data or {}).get("gross_total", "0") or "0"
        ).quantize(Decimal("0.01"))
    except Exception:
        expected = Decimal("0.00")
    if expected and (amount - expected).copy_abs() > Decimal("0.01"):
        logger.warning(
            "[StripeWebhook] amount_total mismatch: stripe=%s, expected=%s (session=%s)",
            amount, expected, session_id,
        )

    return WebhookPaymentData(
        payment_system="stripe",
        payment_method="stripe",
        session_id=session_id,
        session_key=session_key,
        conv_cache_id=session_id,
        amount=amount,
        currency=currency,
        customer_id=session.get("customer"),
        payment_intent_id=session.get("payment_intent") or session_id,
        custom_data=meta.custom_data or {},
        invoice_data=meta.invoice_data or {},
        description_data=meta.description_data,
    )
