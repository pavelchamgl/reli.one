"""
Создание PayPal Checkout Session (изоляция вызова PayPal API от HTTP-слоя).

Публичный контракт:
    create_paypal_checkout_session(*, line_items, total_price, session_key, invoice_number)
        -> tuple[str, str]   # (approval_url, order_id)

Внутренняя утилита:
    get_paypal_access_token() -> str | None
"""
from __future__ import annotations

import logging
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.conf import settings
from django.core.cache import cache
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)


def get_paypal_access_token() -> str | None:
    """
    Возвращает актуальный Bearer-токен PayPal, кешируя его до истечения.
    При ошибке логирует и возвращает None.
    """
    token = cache.get("paypal_access_token")
    if token:
        return token

    client_id = settings.PAYPAL_CLIENT_ID
    client_secret = settings.PAYPAL_CLIENT_SECRET
    api_url = settings.PAYPAL_API_URL

    try:
        response = requests.post(
            f"{api_url}/v1/oauth2/token",
            headers={
                "Accept": "application/json",
                "Accept-Language": "en_US",
            },
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
            timeout=10,
        )
        response.raise_for_status()
    except RequestException as e:
        logger.error("HTTP error while obtaining PayPal access token: %s", e)
        return None

    data = response.json()
    token = data.get("access_token")
    if token:
        expires_in = data.get("expires_in", 32400)
        cache.set("paypal_access_token", token, expires_in - 60)
        return token

    logger.error("Access token not found in PayPal response: %s", data)
    return None


def create_paypal_checkout_session(
    *,
    line_items: list,
    total_price: Decimal,
    session_key: str,
    invoice_number: str,
) -> tuple[str, str]:
    """
    Создаёт PayPal Checkout Order и возвращает (approval_url, order_id).

    Ключи API читаются из settings на каждый вызов, что позволяет импортировать
    сервис независимо от payment.views.

    Args:
        line_items:      список позиций в формате PayPal purchase_unit items.
        total_price:     итоговая сумма заказа (Decimal, EUR).
        session_key:     UUID сессии — используется как reference_id и в return_url.
        invoice_number:  номер инвойса — передаётся как invoice_id.

    Returns:
        (approval_url, order_id)

    Raises:
        RuntimeError: если не удалось получить токен, создать заказ
                      или PayPal вернул ответ без approval URL / order ID.
    """
    access_token = get_paypal_access_token()
    if not access_token:
        raise RuntimeError("Failed to obtain PayPal access token.")

    api_url = settings.PAYPAL_API_URL
    redirect_domain = settings.REDIRECT_DOMAIN.rstrip("/")

    # Сумма по позициям (item_total) — отдельно от total (может включать доставку)
    try:
        item_total = sum(
            Decimal(i["unit_amount"]["value"]) * Decimal(str(i["quantity"]))
            for i in line_items
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        item_total = total_price  # fallback при нестандартном формате

    return_url = f"{redirect_domain}/payment_end/?session_id={session_key}"
    cancel_url = f"{redirect_domain}/basket/"

    purchase_units = [
        {
            "reference_id": session_key,
            "invoice_id": invoice_number,
            "description": f"Invoice {invoice_number}",
            "amount": {
                "currency_code": "EUR",
                "value": f"{total_price:.2f}",
                "breakdown": {
                    "item_total": {
                        "currency_code": "EUR",
                        "value": f"{item_total:.2f}",
                    }
                },
            },
            "items": line_items,
        }
    ]

    payload = {
        "intent": "CAPTURE",
        "purchase_units": purchase_units,
        "application_context": {
            "brand_name": "Reli",
            "landing_page": "BILLING",
            "user_action": "PAY_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }

    try:
        response = requests.post(
            f"{api_url}/v2/checkout/orders",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
    except RequestException as e:
        logger.error("Error creating PayPal order: %s", e)
        raise RuntimeError("Failed to create PayPal order") from e

    response_data = response.json()
    order_id = response_data.get("id")
    approval_url = next(
        (link["href"] for link in response_data.get("links", []) if link["rel"] == "approve"),
        None,
    )

    if not approval_url or not order_id:
        logger.error("Unexpected PayPal response: %s", response_data)
        raise RuntimeError("Failed to retrieve approval URL or order ID")

    return approval_url, order_id
