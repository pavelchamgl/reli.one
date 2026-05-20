"""
Stripe Checkout context builder.

Выносит из CreateStripePaymentView.post всю бизнес-логику:
- загрузку вариантов и DPD-валидацию размеров
- CZ-origin проверку
- цикл по группам: ZIP, phone, расчёт доставки, построение line_items
- расчёт итоговых сумм
- сохранение StripeMetadata

HTTP-уровень (Response) остаётся во view.
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from delivery.helpers import resolve_country_code_from_group
from delivery.services.dpd_rates import calculate_order_shipping_dpd
from delivery.services.gls_rates import calculate_gls_shipping_options
from delivery.services.gls_split import split_items_into_parcels_gls
from delivery.services.shipping_split import calculate_order_shipping
from delivery.validators.validators import validate_phone_matches_country
from delivery.validators.zip_utils import uppercase_zip
from delivery.validators.zip_validator import ZipCodeValidator
from order.services.invoice_numbers import next_invoice_identifiers
from product.models import ProductVariant

from payment.services.checkout_metadata import (
    build_checkout_custom_data,
    build_checkout_description_data,
    build_checkout_invoice_data,
    save_stripe_metadata_atomic,
)
from payment.services.checkout_shared import (
    CheckoutSessionBuildError,
    _CHANNEL_MAP,
    _D,
    check_cz_origin_for_checkout,
    create_checkout_stock_reservation_if_enabled,
)
from payment.services.reservation_payment import get_checkout_reservation_expires_at

logger = logging.getLogger(__name__)


class StripeSessionBuildError(CheckoutSessionBuildError):
    """Бизнес-ошибка при построении Stripe-сессии."""


@dataclass
class StripeCheckoutContext:
    """Результат build_stripe_checkout_context — всё необходимое для вызова Stripe API."""

    line_items: list
    session_key: str
    invoice_number: str
    variable_symbol: str
    groups: list = field(default_factory=list)
    checkout_expires_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Основная функция
# ---------------------------------------------------------------------------

def build_stripe_checkout_context(
    *,
    user,
    email: str,
    first_name: str,
    last_name: str,
    phone: str,
    delivery_address: dict,
    groups: list,
    root_country: str,
) -> StripeCheckoutContext:
    """
    Строит контекст Stripe Checkout Session:
    - валидирует SKU, размеры DPD, CZ-origin
    - рассчитывает доставку по группам
    - собирает line_items
    - сохраняет StripeMetadata в atomic-транзакции

    Raises:
        StripeSessionBuildError: при любой бизнес-ошибке (400).
    """
    # ------------------------------------------------------------------
    # 1. Загрузка вариантов
    # ------------------------------------------------------------------
    all_skus = {p["sku"] for g in groups for p in g["products"]}
    variants_qs = (
        ProductVariant.objects
        .filter(sku__in=all_skus)
        .select_related("product__seller__default_warehouse")
        .only(
            "sku",
            "price",
            "product__seller_id",
            "product__seller__default_warehouse__country",
            "weight_grams", "length_mm", "width_mm", "height_mm",
        )
    )
    variant_map = {v.sku: v for v in variants_qs}

    missing_skus = sorted(all_skus - set(variant_map.keys()))
    if missing_skus:
        raise StripeSessionBuildError(
            {"error": f"ProductVariant not found: {', '.join(missing_skus)}"},
        )

    # ------------------------------------------------------------------
    # 2. DPD dimension-check
    # ------------------------------------------------------------------
    dpd_skus = {
        p["sku"]
        for g in groups
        if g.get("courier_code") == "dpd"
        for p in g.get("products", [])
    }
    if dpd_skus:
        missing_dims = []
        for sku in dpd_skus:
            v = variant_map.get(sku)
            if not v:
                continue
            if any(x is None or x == 0 for x in [v.weight_grams, v.length_mm, v.width_mm, v.height_mm]):
                missing_dims.append(sku)
        if missing_dims:
            raise StripeSessionBuildError(
                {"error": f"Missing weight/dimensions for SKU(s): {', '.join(missing_dims)}"},
            )

    # ------------------------------------------------------------------
    # 3. CZ-origin
    # ------------------------------------------------------------------
    check_cz_origin_for_checkout(variant_map, groups, error_cls=StripeSessionBuildError)

    # ------------------------------------------------------------------
    # 4. Цикл по группам
    # ------------------------------------------------------------------
    line_items = []
    total_delivery = Decimal("0.00")

    for idx, group in enumerate(groups, start=1):
        delivery_type = group["delivery_type"]
        products = group["products"]
        seller_id = group["seller_id"]
        courier_code = group.get("courier_code")

        delivery_mode: Optional[str] = None
        if courier_code == "gls" and delivery_type == 1:
            delivery_mode = str(group.get("delivery_mode", "shop")).lower().strip()

        # DPD PUDO: ZIP пункта выдачи
        if courier_code == "dpd" and delivery_type == 1:
            pickup_zip = group.get("delivery_address", {}).get("zip")
            pickup_country = group.get("delivery_address", {}).get("country")

            if not pickup_zip or not pickup_country:
                raise StripeSessionBuildError(
                    {"error": f"Group {idx}: DPD PUDO requires pickup point ZIP and country in delivery_address."},
                )

            resolved_zip = ZipCodeValidator.validate_and_resolve(
                pickup_zip, pickup_country, prefer_remote=True
            )
            if not resolved_zip.valid:
                raise StripeSessionBuildError(
                    {"error": f"Group {idx}: Invalid ZIP '{pickup_zip}' for pickup point in country {pickup_country}."},
                )

        # Страна назначения
        country_code = resolve_country_code_from_group(
            group, idx, logger=logger, root_country=root_country, courier_code=courier_code,
        )
        if not country_code:
            raise StripeSessionBuildError(
                {"error": f"Group {idx}: Invalid delivery address or pickup point."},
            )

        # Принадлежность товаров продавцу
        for product in products:
            sku = product["sku"]
            variant = variant_map[sku]
            if variant.product.seller.id != seller_id:
                raise StripeSessionBuildError(
                    {"error": f"Group {idx}: Product {sku} does not belong to seller {seller_id}."},
                )

        # HD: ZIP + phone
        if delivery_type == 2:
            gaddr = group.get("delivery_address", {}) or {}
            zip_code = gaddr.get("zip")
            if not zip_code:
                raise StripeSessionBuildError(
                    {"error": f"Group {idx}: ZIP code is missing."},
                )

            resolved_zip = ZipCodeValidator.validate_and_resolve(zip_code, country_code, prefer_remote=True)
            if not resolved_zip.valid:
                raise StripeSessionBuildError(
                    {"error": f"Group {idx}: Invalid ZIP '{zip_code}' for country {country_code}."},
                )

            if resolved_zip.normalized_postcode:
                gaddr["zip"] = uppercase_zip(resolved_zip.normalized_postcode)

            phone_error = validate_phone_matches_country(phone, country_code)
            if phone_error:
                raise StripeSessionBuildError(
                    {"error": f"Group {idx}: {phone_error}"},
                )

        # Расчёт доставки
        items_for_calc = [{"sku": p["sku"], "quantity": p["quantity"]} for p in products]
        cod = Decimal("0.00")

        if courier_code == "gls":
            gls_blocks = split_items_into_parcels_gls(items_for_calc)
            address_bundle = "one" if len(gls_blocks) == 1 else "multi"
            shipping_result = calculate_gls_shipping_options(
                country=country_code,
                items=items_for_calc,
                cod=cod,
                currency="EUR",
                address_bundle=address_bundle,
            )
            logger.info("[GLS] group=%s seller=%s result=%s", idx, seller_id, shipping_result)

        elif courier_code == "dpd":
            shipping_result = calculate_order_shipping_dpd(
                country=country_code,
                items=items_for_calc,
                cod=False,
                currency="EUR",
                variant_map=variant_map,
            )
            logger.info("[DPD] Shipping result for group %s: %s", idx, shipping_result)

        else:
            shipping_result = calculate_order_shipping(
                country=country_code,
                items=items_for_calc,
                cod=cod,
                currency="EUR",
            )
            logger.info("[Packeta] Shipping result for group %s: %s", idx, shipping_result)

        # Канал доставки
        channel = _CHANNEL_MAP.get(delivery_type)
        if channel is None:
            raise StripeSessionBuildError(
                {"error": f"Group {idx}: Unknown delivery_type {delivery_type}."},
            )

        # Выбор опции
        if courier_code == "gls" and delivery_type == 1:
            desired = delivery_mode.upper()
            selected_option = next(
                (opt for opt in shipping_result.get("options", []) if opt["service"] == desired),
                None,
            )
        else:
            selected_option = next(
                (opt for opt in shipping_result.get("options", []) if opt["channel"] == channel),
                None,
            )

        if not selected_option:
            available = [f"{o['service']} ({o['channel']})" for o in shipping_result.get("options", [])]

            if courier_code == "gls" and delivery_type == 1:
                raise StripeSessionBuildError(
                    {
                        "error": (
                            f"Group {idx}: GLS does not support '{delivery_mode.upper()}' "
                            f"for this parcel set. Available: {', '.join(available)}"
                        )
                    },
                )

            raise StripeSessionBuildError(
                {"error": f"Group {idx}: No option for channel {channel}. Available: {', '.join(available)}"},
            )

        # Количество посылок
        raw_total_parcels = shipping_result.get("total_parcels", 1)
        if isinstance(raw_total_parcels, dict):
            if courier_code == "gls" and delivery_type == 1:
                selected_key = delivery_mode.upper() if delivery_mode else "SHOP"
                num_parcels = int(raw_total_parcels.get(selected_key, 1) or 1)
            else:
                num_parcels = int(raw_total_parcels.get(channel, 1) or 1)
        else:
            num_parcels = int(raw_total_parcels or 1)

        delivery_cost = _D(selected_option["priceWithVat"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_delivery += delivery_cost

        group["calculated_delivery_cost"] = str(delivery_cost)
        group["calculated_total_parcels"] = num_parcels

        # Товарные позиции
        group_total = Decimal("0.00")
        for product in products:
            variant = variant_map[product["sku"]]
            unit_price = variant.price_with_acquiring.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            quantity = int(product["quantity"])
            group_total += unit_price * quantity

            line_items.append(
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {"name": product["sku"]},
                        "unit_amount": int(
                            (unit_price * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
                        ),
                    },
                    "quantity": quantity,
                }
            )

        group_total += delivery_cost
        group["calculated_group_total"] = str(group_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    # ------------------------------------------------------------------
    # 5. Итоги + строка доставки
    # ------------------------------------------------------------------
    if total_delivery > 0:
        line_items.append(
            {
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": f"Delivery ({total_delivery} EUR)"},
                    "unit_amount": int(
                        (total_delivery * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
                    ),
                },
                "quantity": 1,
            }
        )

    gross_total = sum(_D(g["calculated_group_total"]) for g in groups).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    logger.info(
        "Gross total for all groups: %s EUR (including total delivery: %s EUR)",
        gross_total,
        total_delivery,
    )

    session_key = str(uuid.uuid4())
    invoice_number, variable_symbol = next_invoice_identifiers()

    # ------------------------------------------------------------------
    # 5b. Stock reservation (feature-flagged; before metadata / PSP)
    # ------------------------------------------------------------------
    create_checkout_stock_reservation_if_enabled(
        session_key=session_key,
        payment_system="stripe",
        groups=groups,
        variant_map=variant_map,
        error_cls=StripeSessionBuildError,
    )

    # ------------------------------------------------------------------
    # 6. Сохранение метаданных
    # ------------------------------------------------------------------
    custom_data = build_checkout_custom_data(
        user=user,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        delivery_address=delivery_address,
    )
    invoice_data = build_checkout_invoice_data(
        groups=groups,
        invoice_number=invoice_number,
    )
    description_data = build_checkout_description_data(
        gross_total=gross_total,
        delivery_total=total_delivery,
        variable_symbol=variable_symbol,
    )
    save_stripe_metadata_atomic(
        session_key=session_key,
        custom_data=custom_data,
        invoice_data=invoice_data,
        description_data=description_data,
    )

    logger.info(
        "Stripe metadata saved session_key=%s user=%s",
        session_key,
        user.id,
    )

    checkout_expires_at = get_checkout_reservation_expires_at(session_key)

    return StripeCheckoutContext(
        line_items=line_items,
        session_key=session_key,
        invoice_number=invoice_number,
        variable_symbol=variable_symbol,
        groups=groups,
        checkout_expires_at=checkout_expires_at,
    )
