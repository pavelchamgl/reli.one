"""
PayPal webhook: разбор payload и сборка WebhookPaymentData.

Верификация подписи остаётся в PayPalMixin.verify_webhook (вызывается из view).
HTTP-ответы формирует PayPalWebhookView.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Callable

import requests
from django.conf import settings

from payment.models import PayPalMetadata
from payment.services.checkout_shared import release_checkout_stock_reservation_if_enabled
from payment.services.paypal_checkout import get_paypal_access_token
from payment.services.reservation_payment import (
    PAYPAL_CAPTURE_SKIPPED_STATUS,
    log_paypal_capture_skipped,
    reservation_blocks_late_checkout_completion,
)
from payment.services.webhook_processing import WebhookPaymentData

logger = logging.getLogger(__name__)

PAYPAL_HANDLED_EVENT_TYPES = frozenset(
    {
        "PAYMENT.CAPTURE.COMPLETED",
        "CHECKOUT.ORDER.COMPLETED",
        "CHECKOUT.ORDER.APPROVED",
    }
)

PAYPAL_RELEASE_EVENT_TYPES = frozenset(
    {
        "PAYMENT.CAPTURE.DENIED",
        "CHECKOUT.ORDER.VOIDED",
    }
)

PAYPAL_KNOWN_EVENT_TYPES = PAYPAL_HANDLED_EVENT_TYPES | PAYPAL_RELEASE_EVENT_TYPES

PAYPAL_API_URL = settings.PAYPAL_API_URL


@dataclass(frozen=True)
class PayPalWebhookParseResult:
    """Результат разбора сырого тела: payload или HTTP-ответ для немедленного return."""

    payload: dict | None = None
    early_status: int | None = None
    early_body: dict | None = None


@dataclass(frozen=True)
class PayPalWebhookBuildResult:
    """Результат извлечения полей и загрузки metadata."""

    data: WebhookPaymentData | None = None
    early_status: int | None = None
    early_body: dict | None = None


def parse_paypal_webhook_body(raw_body: str) -> PayPalWebhookParseResult:
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return PayPalWebhookParseResult(early_status=400, early_body={"error": "Invalid JSON"})

    event_type = payload.get("event_type")
    if event_type not in PAYPAL_KNOWN_EVENT_TYPES:
        logger.info("Ignored PayPal event: %s", event_type)
        return PayPalWebhookParseResult(early_status=200, early_body={"status": "ignored"})

    return PayPalWebhookParseResult(payload=payload)


def paypal_release_session_key_from_payload(
    payload: dict,
    *,
    api_get: Callable[[str], dict] | None = None,
) -> str | None:
    """
    Resolve internal session_key (reference_id) from PayPal failure/cancel webhook payload.
    """
    event_type = payload.get("event_type")
    resource = payload.get("resource", {})

    if event_type == "CHECKOUT.ORDER.VOIDED":
        pu = (resource.get("purchase_units") or [{}])[0]
        return pu.get("reference_id")

    if event_type == "PAYMENT.CAPTURE.DENIED":
        related = (resource.get("supplementary_data") or {}).get("related_ids") or {}
        order_id = related.get("order_id")
        if not order_id:
            return None
        api_get = api_get or default_paypal_api_get
        try:
            order_details = api_get(f"/v2/checkout/orders/{order_id}")
        except Exception as exc:
            logger.exception(
                "[PayPalWebhook] Failed to load order %s for CAPTURE.DENIED release: %s",
                order_id,
                exc,
            )
            return None
        pu = (order_details.get("purchase_units") or [{}])[0]
        return pu.get("reference_id")

    return None


def handle_paypal_reservation_release_payload(payload: dict) -> None:
    """Release stock reservation for PayPal failure/cancel webhook events."""
    event_type = payload.get("event_type")
    if event_type not in PAYPAL_RELEASE_EVENT_TYPES:
        return

    session_key = paypal_release_session_key_from_payload(payload)
    if not session_key:
        logger.warning(
            "[PayPalWebhook] %s without resolvable session_key — skip reservation release",
            event_type,
        )
        return

    release_checkout_stock_reservation_if_enabled(session_key)
    logger.info(
        "[PayPalWebhook] Released stock reservation for session_key=%s (%s)",
        session_key,
        event_type,
    )


def default_paypal_api_get(path: str) -> dict:
    token = get_paypal_access_token()
    resp = requests.get(
        f"{PAYPAL_API_URL}{path}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def default_paypal_api_capture(order_id: str) -> dict:
    token = get_paypal_access_token()
    resp = requests.post(
        f"{PAYPAL_API_URL}/v2/checkout/orders/{order_id}/capture",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def paypal_payload_to_webhook_payment_data(
    payload: dict,
    *,
    api_get: Callable[[str], dict] | None = None,
    api_capture: Callable[[str], dict] | None = None,
) -> PayPalWebhookBuildResult:
    """
    Извлечь order_id, session_key, amount, currency; загрузить PayPalMetadata;
    собрать WebhookPaymentData. При ошибке — тот же status/body, что и в прежнем view.
    """
    api_get = api_get or default_paypal_api_get
    api_capture = api_capture or default_paypal_api_capture

    event_type = payload.get("event_type")
    resource = payload.get("resource", {})
    order_id = session_key = amount = currency = None

    if event_type == "PAYMENT.CAPTURE.COMPLETED":
        related = (resource.get("supplementary_data") or {}).get("related_ids") or {}
        order_id = related.get("order_id")
        if not order_id:
            logger.error("No order_id in capture.supplementary_data.related_ids")
            return PayPalWebhookBuildResult(early_status=400, early_body={"error": "No order_id in capture"})

        order_details = api_get(f"/v2/checkout/orders/{order_id}")
        pu = (order_details.get("purchase_units") or [{}])[0]
        session_key = pu.get("reference_id")
        if not session_key:
            logger.error("No reference_id (session_key) in order %s", order_id)
            return PayPalWebhookBuildResult(early_status=400, early_body={"error": "No reference_id in order"})

        amount = Decimal(resource["amount"]["value"]).quantize(Decimal("0.01"), ROUND_HALF_UP)
        currency = resource["amount"]["currency_code"]

    elif event_type == "CHECKOUT.ORDER.COMPLETED":
        order_id = resource.get("id")
        pu = (resource.get("purchase_units") or [{}])[0]
        session_key = pu.get("reference_id")
        if not session_key:
            logger.error("No reference_id in order.completed")
            return PayPalWebhookBuildResult(early_status=400, early_body={"error": "No reference_id"})
        amt = pu.get("amount") or {}
        amount = Decimal(amt.get("value", "0")).quantize(Decimal("0.01"), ROUND_HALF_UP)
        currency = amt.get("currency_code", "EUR")

    elif event_type == "CHECKOUT.ORDER.APPROVED":
        order_id = resource.get("id")
        pu = (resource.get("purchase_units") or [{}])[0]
        session_key = pu.get("reference_id")
        if not session_key and order_id:
            try:
                order_details = api_get(f"/v2/checkout/orders/{order_id}")
                pu = (order_details.get("purchase_units") or [{}])[0]
                session_key = pu.get("reference_id")
            except Exception as exc:
                logger.exception(
                    "Failed to load PayPal order %s before capture guard: %s",
                    order_id,
                    exc,
                )
                return PayPalWebhookBuildResult(
                    early_status=500,
                    early_body={"error": "Order lookup failed"},
                )

        if not session_key:
            logger.error("No reference_id in CHECKOUT.ORDER.APPROVED for order %s", order_id)
            return PayPalWebhookBuildResult(
                early_status=400,
                early_body={"error": "No reference_id"},
            )

        blocked, reservation_status = reservation_blocks_late_checkout_completion(session_key)
        if blocked:
            log_paypal_capture_skipped(
                session_key=session_key,
                reservation_status=reservation_status,
                order_id=order_id,
            )
            return PayPalWebhookBuildResult(
                early_status=200,
                early_body={"status": PAYPAL_CAPTURE_SKIPPED_STATUS},
            )

        try:
            capture_res = api_capture(order_id)
            purchase_units = capture_res.get("purchase_units") or []
            if not purchase_units:
                logger.error("Unexpected capture response (no purchase_units)")
                return PayPalWebhookBuildResult(early_status=400, early_body={"error": "Bad capture response"})
            pu = purchase_units[0]
            session_key = pu.get("reference_id")
            captures = (((pu.get("payments") or {}).get("captures")) or [])
            cap = next((c for c in captures if c.get("status") == "COMPLETED"), None)
            if not cap:
                logger.error("No COMPLETED capture in capture response for order %s", order_id)
                return PayPalWebhookBuildResult(early_status=400, early_body={"error": "Capture not completed"})
            amount = Decimal(cap["amount"]["value"]).quantize(Decimal("0.01"), ROUND_HALF_UP)
            currency = cap["amount"]["currency_code"]
        except Exception as e:
            logger.exception("Failed to capture PayPal order %s: %s", order_id, e)
            return PayPalWebhookBuildResult(early_status=500, early_body={"error": "Capture failed"})

    if not all([order_id, session_key, amount, currency]):
        logger.error(
            "Incomplete PayPal data: order_id=%s, session_key=%s, amount=%s, currency=%s",
            order_id,
            session_key,
            amount,
            currency,
        )
        return PayPalWebhookBuildResult(early_status=400, early_body={"error": "Incomplete data"})

    try:
        meta = PayPalMetadata.objects.get(session_key=session_key)
    except PayPalMetadata.DoesNotExist:
        logger.error("[PayPalWebhook] PayPalMetadata not found for session_key=%s", session_key)
        return PayPalWebhookBuildResult(early_status=400, early_body={"error": "Metadata not found"})

    webhook_data = WebhookPaymentData(
        payment_system="paypal",
        payment_method="paypal",
        session_id=order_id,
        session_key=session_key,
        conv_cache_id=session_key,
        amount=amount,
        currency=currency,
        customer_id=str(meta.custom_data.get("user_id", "")),
        payment_intent_id=order_id,
        custom_data=meta.custom_data or {},
        invoice_data=meta.invoice_data or {},
        description_data=meta.description_data,
    )
    return PayPalWebhookBuildResult(data=webhook_data)
