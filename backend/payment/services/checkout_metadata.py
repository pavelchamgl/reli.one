"""
Сборка JSON для StripeMetadata / PayPalMetadata и атомарное сохранение.

Контракт ключей и вложенности должен оставаться синхронным с webhook
и prepare_invoice_data — менять только через явную задачу на контракт.
"""
from __future__ import annotations

from decimal import Decimal

from django.db import transaction

from payment.models import PayPalMetadata, StripeMetadata


def build_checkout_custom_data(
    *,
    user,
    email: str,
    first_name: str,
    last_name: str,
    phone: str,
    delivery_address: dict,
) -> dict:
    return {
        "user_id": str(user.id),
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "delivery_address": delivery_address,
    }


def build_checkout_invoice_data(*, groups: list, invoice_number: str) -> dict:
    return {
        "groups": groups,
        "invoice_number": invoice_number,
    }


def build_checkout_description_data(
    *,
    gross_total: Decimal,
    delivery_total: Decimal,
    variable_symbol: str,
) -> dict:
    return {
        "gross_total": str(gross_total),
        "delivery_total": str(delivery_total),
        "variable_symbol": variable_symbol,
    }


def save_stripe_metadata_atomic(
    *,
    session_key: str,
    custom_data: dict,
    invoice_data: dict,
    description_data: dict,
) -> StripeMetadata:
    with transaction.atomic():
        return StripeMetadata.objects.create(
            session_key=session_key,
            custom_data=custom_data,
            invoice_data=invoice_data,
            description_data=description_data,
        )


def save_paypal_metadata_atomic(
    *,
    session_key: str,
    custom_data: dict,
    invoice_data: dict,
    description_data: dict,
) -> PayPalMetadata:
    with transaction.atomic():
        return PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data=custom_data,
            invoice_data=invoice_data,
            description_data=description_data,
        )
