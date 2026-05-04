"""
Создание Stripe Checkout Session (изоляция вызова Stripe API от HTTP-слоя).
"""
from __future__ import annotations

import stripe
from django.conf import settings


def create_stripe_checkout_session(
    *,
    line_items: list,
    session_key: str,
    invoice_number: str,
):
    """
    Создаёт Stripe Checkout Session с фиксированным контрактом успеха/отмены и метаданными.

    Ключ API берётся из settings на каждый вызов, чтобы сервис был пригоден к импорту
    отдельно от payment.views.
    """
    stripe.api_key = settings.STRIPE_API_SECRET_KEY
    return stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=settings.REDIRECT_DOMAIN + "payment_end/?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=settings.REDIRECT_DOMAIN + "basket/",
        metadata={
            "session_key": session_key,
            "invoice_number": invoice_number,
        },
        idempotency_key=session_key,
    )
