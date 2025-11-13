import json
import uuid
from typing import Optional, Union

import requests
import stripe
import logging

from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils.decorators import method_decorator
from rest_framework import status, serializers
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample, OpenApiParameter, inline_serializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.core.cache import caches
from django.views.decorators.csrf import csrf_exempt

from .models import Payment, PayPalMetadata, StripeMetadata
from .mixins import PayPalMixin
from .services import get_orders_by_payment_session_id
from .serializers import SessionInputSerializer, StripeSessionOutputSerializer, PayPalSessionOutputSerializer
from .services_async import async_send_client_email
from accounts.models import CustomUser
from delivery.models import DeliveryAddress
from product.models import BaseProduct, ProductVariant
from promocode.models import PromoCode
from order.models import (
    CourierService,
    Order,
    DeliveryType,
    OrderProduct,
    OrderStatus,
    ProductStatus,
    Invoice,
)
from warehouses.models import Warehouse, WarehouseItem
from delivery.helpers import resolve_country_code_from_group
from delivery.utils_async import async_parcels_and_seller_email
from order.services.invoice_data import prepare_invoice_data
from order.services.invoice_numbers import next_invoice_identifiers
from order.services.invoice_generator_without_vat import generate_invoice_pdf
from delivery.services.gls_split import split_items_into_parcels_gls
from delivery.services.gls_rates import calculate_gls_shipping_options
from delivery.services.dpd_rates import calculate_order_shipping_dpd
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point
from delivery.validators.zip_utils import uppercase_zip
from delivery.validators.zip_validator import ZipCodeValidator
from delivery.validators.validators import validate_phone_matches_country
from delivery.services.shipping_split import split_items_into_parcels, combine_parcel_options, calculate_order_shipping

conv_cache = caches["conv"]
CONV_CACHE_TTL = 60 * 60 * 24  # 24h

# Paypal secret fields
client_id = settings.PAYPAL_CLIENT_ID
client_secret = settings.PAYPAL_CLIENT_SECRET
PAYPAL_API_URL = settings.PAYPAL_API_URL

# Stripe secret fields
stripe.api_key = settings.STRIPE_API_SECRET_KEY
endpoint_secret = settings.STRIPE_WEBHOOK_ENDPOINT_SECRET

# карта delivery_type -> carrier channel для options
CHANNEL_MAP = {
    1: 'PUDO',       # пункт выдачи
    2: 'HD',         # доставка на дом
}

# --- GLS-specific delivery modes ---
# Работает только при courier_service = GLS и delivery_type = 1 (PUDO)
DELIVERY_MODES_GLS = {"shop", "box"}

logger = logging.getLogger(__name__)


def _D(x):
    return x if isinstance(x, Decimal) else Decimal(str(x))


def increment_promo_usage(promo_code: str):
    promo = PromoCode.objects.get(code=promo_code)
    promo.increment_used_count()


def apply_promo_code(promo_code: str, basket_items):
    """
    Оставляем старую логику, как была — без новых проверок.
    """
    price = 0
    for item in basket_items:
        price += basket_items[item].product.price * basket_items[item].quantity

    try:
        promo = PromoCode.objects.get(code=promo_code)
        now = timezone.now()
        if promo.valid_from <= now <= promo.valid_until and promo.used_count < promo.max_usage:
            discount_amount = price * promo.discount_percentage / 100
            return discount_amount
        else:
            raise ValidationError("Invalid or expired promo code.")
    except PromoCode.DoesNotExist:
        raise ValidationError("Invalid promo code.")


def _get_courier_code(val: Optional[Union[int, str]]) -> str:
    """
    Приводим к строковому коду курьера.
    НИКАКИХ новых валидаторов — только маппинг/чтение из БД как раньше.
    """
    if val is None:
        return ""
    if isinstance(val, str):
        return val.lower().strip()
    try:
        cs = CourierService.objects.only("code").get(id=val)
        return (cs.code or "").lower()
    except CourierService.DoesNotExist:
        return ""


def _check_cz_origin_for_groups(variant_map: dict, groups: list) -> Optional[Response]:
    """
    Оставляем «лайт»-проверку CZ, как была:
    — все SKU должны иметь seller.default_warehouse.country == 'CZ'
    — unknown SKU → 400
    — non-CZ → 400 c ключом 'origin'
    Ничего нового тут не добавляем.
    """
    skus_in_payload = []
    for g in groups:
        for p in g.get("products", []):
            skus_in_payload.append(str(p["sku"]))

    missing = []
    not_cz = []

    for sku in skus_in_payload:
        v = variant_map.get(sku)
        if not v:
            missing.append(sku)
            continue
        seller = getattr(v.product, "seller", None)
        dw = getattr(seller, "default_warehouse", None) if seller else None
        if not (dw and getattr(dw, "country", None) == "CZ"):
            not_cz.append(sku)

    if missing:
        return Response(
            {"error": f"Unknown SKU(s): {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not_cz:
        return Response(
            {
                "origin": [
                    (
                        "Только отправка из Чехии. Продавец(ы) SKU "
                        f"{', '.join(not_cz)} не имеют чешского склада "
                        "(default_warehouse.country != 'CZ')."
                    )
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return None


def _set_conv_cache_after_commit(
    session_id: str,
    amount: Decimal,
    currency: str = "EUR",
    logger=None,
    source: str = "StripeWebhook",
):
    """
    Универсальный метод записи conversion-кэша после успешной оплаты.

    Используется и StripeWebhook, и PayPalWebhook.
    После успешной оплаты мы сохраняем минимальный набор данных в кэш:
      - ready = True
      - transaction_id
      - value (float)
      - currency

    Аргументы:
        session_id (str): уникальный ключ (session_key)
        amount (Decimal): сумма транзакции
        currency (str): код валюты (по умолчанию EUR)
        logger: инстанс логгера
        source (str): имя источника (StripeWebhook, PayPalWebhook и т.п.)
    """
    payload = {
        "ready": True,
        "transaction_id": str(session_id),
        "value": float(amount),
        "currency": (currency or "EUR").upper(),
    }

    def _write():
        conv_cache.set(f"conv:{session_id}", payload, timeout=CONV_CACHE_TTL)
        if logger:
            logger.info(
                f"[{source}] Conversion cache WRITE done for {session_id}"
            )

    if logger:
        logger.info(
            f"[{source}] Conversion cache planned after-commit for {session_id}: {amount} {currency}"
        )

    transaction.on_commit(_write)


class PaymentSessionValidator:
    """
      - наличие country / pickup_point_id / адреса
      - resolve_country_code_from_group
    """
    @staticmethod
    def validate_groups(groups, root_country: Optional[str] = None):
        for idx, group in enumerate(groups, start=1):
            courier_code = _get_courier_code(group.get("courier_service"))
            country = resolve_country_code_from_group(
                group,
                idx,
                logger=logger,
                root_country=root_country,
                courier_code=courier_code,
            )
            if not country:
                return Response(
                    {"error": f"Group {idx}: invalid pickup point / address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # --- GLS-specific mode validation ---
            # Если GLS + PUDO → требуется delivery_mode = "shop" или "box"
            delivery_type = group.get("delivery_type")
            if courier_code == "gls" and delivery_type == 1:
                mode = str(group.get("delivery_mode", "")).lower().strip()
                if mode not in DELIVERY_MODES_GLS:
                    return Response(
                        {
                            "error": (
                                f"Group {idx}: For GLS PUDO delivery, 'delivery_mode' "
                                f"must be one of: {', '.join(DELIVERY_MODES_GLS)}"
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        return None


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Create Stripe Payment Session (Packeta / DPD / GLS)",
    description=(
            "Creates a Stripe Checkout Session by validating customer data and seller-grouped products, "
            "normalizing ZIP codes, and calculating delivery prices using Packeta (Zásilkovna), DPD, or GLS.\n\n"

            "**Processing Flow:**\n"
            "1) Validates required input fields and ensures a valid customer delivery address.\n"
            "2) Converts all ZIP codes to **uppercase** and performs postal validation:\n"
            "   • Local ZIP dataset checks (per-country rules)\n"
            "   • DPD GeoRouting checks for supported countries\n"
            "   • If DPD returns a normalized ZIP, it is written back to the group data.\n"
            "3) Enforces the **CZ-origin rule**: all products must originate from sellers whose default warehouse "
            "is located in the Czech Republic.\n"
            "4) Confirms seller ownership of each SKU in every group.\n"
            "5) Resolves group-level destination country from either pickup point or delivery address.\n"
            "6) Courier logic by `courier_service` value:\n"
            "   • `2` = Packeta (Zásilkovna) — aggregator pricing\n"
            "   • `3` = GLS — GLS parcel-split + address-bundle based pricing\n"
            "   • `4` = DPD — volumetric weight, per-country price tables, strict parcel dimension limits\n\n"

            "**DPD-specific checks:**\n"
            "- All product variants used in a DPD group must have defined: `weight_grams`, `length_mm`, `width_mm`, `height_mm`.\n"
            "- Parcel limits are enforced (≤31.5kg, ≤120cm longest side, ≤300cm combined dimensions).\n\n"

            "**Delivery Cost Selection:**\n"
            "- `delivery_type` determines channel:\n"
            "   `1` → PUDO (Pickup Point)\n"
            "   `2` → HD (Home Delivery)\n"
            "- The matching rate is selected from courier pricing results.\n"
            "- If multiple parcel counts appear (e.g., GLS/DPD splits), `total_parcels` is normalized to a single integer.\n\n"

            "**Stripe Session Construction:**\n"
            "- Product costs and delivery costs are added to `line_items`.\n"
            "- Computed group-level shipping data is written into `StripeMetadata`, "
            "to be restored by the webhook upon successful payment.\n"
            "- COD is **always disabled** for Stripe payments.\n"
            "- Currency is **EUR** throughout the calculation.\n\n"

            "**Post-Payment Workflow:**\n"
            "- Stripe webhook reads stored metadata, creates 1..N orders (one per seller-group), "
            "generates invoice(s), and sends emails to:\n"
            "   • Customer\n"
            "   • Seller(s)\n"
            "   • Managers\n\n"

            "**Redirect Behavior:**\n"
            "- Success: `REDIRECT_DOMAIN/payment_end/?session_id={CHECKOUT_SESSION_ID}`\n"
            "- Cancel:  `REDIRECT_DOMAIN/basket/`"
    ),
    request=SessionInputSerializer,
    responses={
        200: OpenApiResponse(
            response=StripeSessionOutputSerializer,
            description="Stripe session created successfully",
            examples=[
                OpenApiExample(
                    name="Success",
                    value={
                        "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_123...",
                        "session_id": "cs_test_123...",
                        "session_key": "d7f1a2f8-3e3f-4a2c-9c8e-7f9a1b234567"
                    },
                    response_only=True
                )
            ]
        ),
        400: OpenApiResponse(
            description="Validation error",
            examples=[
                OpenApiExample(
                    "Missing Root Address Field",
                    value={"error": "Missing 'zip' in delivery_address"}
                ),
                OpenApiExample(
                    "CZ-Origin Rule",
                    value={"origin": ["Только отправка из Чехии. Продавец(ы) SKU 240819709 ..."]}
                ),
                OpenApiExample(
                    "Invalid ZIP",
                    value={"error": "Group 1: ZIP code '010011' is invalid for country RO."}
                ),
                OpenApiExample(
                    "No Option For Channel",
                    value={"error": "Group 2: No option for channel PUDO. Available: HD"}
                ),
                OpenApiExample(
                    "Missing Dimensions For DPD",
                    value={"error": "Missing weight/dimensions for SKU(s): 123456, 654321"}
                ),
            ]
        ),
        500: OpenApiResponse(
            description="Internal server error",
            examples=[
                OpenApiExample("Stripe Failure", value={"error": "Stripe session creation failed: <reason>"}),
            ]
        ),
    },
    examples=[
        OpenApiExample(
            name="Request: GLS (HD) + DPD (PUDO)",
            summary="Two groups: one shipped by GLS (HD), one by DPD (PUDO)",
            request_only=True,
            value={
                "email": "user@example.com",
                "first_name": "Pavel",
                "last_name": "Ivanov",
                "phone": "+420777111222",
                "delivery_address": {
                    "street": "Na Lysinách 551/34",
                    "city": "Praha",
                    "zip": "14700",
                    "country": "CZ"
                },
                "groups": [
                    {
                        "seller_id": 2,
                        "delivery_type": 2,         # HD
                        "courier_service": 3,       # GLS
                        "delivery_address": {
                            "street": "Na Lysinách 551/34",
                            "city": "Praha",
                            "zip": "14700",
                            "country": "CZ"
                        },
                        "products": [
                            {"sku": "240819709", "quantity": 2}
                        ]
                    },
                    {
                        "seller_id": 1,
                        "delivery_type": 1,         # PUDO
                        "courier_service": 4,       # DPD
                        "delivery_address": {
                            "street": "Na Lysinách 551/34",
                            "city": "Praha",
                            "zip": "14700",
                            "country": "CZ"
                        },
                        "pickup_point_id": "35862",
                        "products": [
                            {"sku": "272464947", "quantity": 3}
                        ]
                    }
                ]
            }
        )
    ],
    tags=["Stripe"]
)
class CreateStripePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        logger.info("Stripe session creation request received", extra={"data": data})

        # --- базовые поля---
        required_fields = ["email", "first_name", "last_name", "phone", "delivery_address", "groups"]
        for field in required_fields:
            if field not in data:
                return Response({"error": f"Missing required field: {field}"}, status=400)

        email = data["email"]
        first_name = data["first_name"]
        last_name = data["last_name"]
        phone = data["phone"]
        delivery_address = data["delivery_address"]
        if "zip" in delivery_address and delivery_address["zip"] is not None:
            delivery_address["zip"] = uppercase_zip(delivery_address["zip"])

        groups = data["groups"]
        for g in groups:
            gaddr = g.get("delivery_address")
            if gaddr and ("zip" in gaddr) and (gaddr["zip"] is not None):
                gaddr["zip"] = uppercase_zip(gaddr["zip"])
        root_country = (delivery_address.get("country") or "").upper()

        # проверка адреса (как было)
        required_subfields = ["street", "city", "zip", "country"]
        for field in required_subfields:
            if field not in delivery_address:
                return Response({"error": f"Missing '{field}' in delivery_address"}, status=400)

        # проверка групп (как было)
        validation_response = PaymentSessionValidator.validate_groups(groups, root_country=root_country)
        if validation_response:
            return validation_response

        logger.info(f"Validated {len(groups)} groups for user {user.id}. Starting calculation.")

        # подгружаем варианты по всем SKU
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

        # --- проверка габаритов для DPD (как у тебя) ---
        dpd_skus = {
            p["sku"]
            for g in groups
            if _get_courier_code(g.get("courier_service")) == "dpd"
            for p in g.get("products", [])
        }
        if dpd_skus:
            missing_dims = []
            for sku in dpd_skus:
                v = variant_map.get(sku)
                if not v:
                    continue
                req = [v.weight_grams, v.length_mm, v.width_mm, v.height_mm]
                if any(x is None or x == 0 for x in req):
                    missing_dims.append(sku)
            if missing_dims:
                return Response(
                    {"error": f"Missing weight/dimensions for SKU(s): {', '.join(missing_dims)}"},
                    status=400,
                )

        # --- CZ-origin ---
        cz_resp = _check_cz_origin_for_groups(variant_map, groups)
        if cz_resp is not None:
            logger.warning("CZ origin check failed during Stripe session creation")
            return cz_resp

        line_items = []
        total_delivery = Decimal("0.00")

        for idx, group in enumerate(groups, start=1):
            delivery_type = group["delivery_type"]  # 1=PUDO, 2=HD
            products = group["products"]
            seller_id = group["seller_id"]
            courier_code = _get_courier_code(group.get("courier_service"))

            country_code = resolve_country_code_from_group(
                group,
                idx,
                logger=logger,
                root_country=root_country,
                courier_code=courier_code,
            )
            if not country_code:
                return Response(
                    {"error": f"Group {idx}: Invalid delivery address or pickup point."},
                    status=400,
                )

            # принадлежность товаров продавцу
            for product in products:
                sku = product["sku"]
                variant = variant_map.get(sku)
                if not variant:
                    return Response({"error": f"Group {idx}: ProductVariant not found: {sku}"}, status=400)
                if variant.product.seller.id != seller_id:
                    return Response(
                        {"error": f"Group {idx}: Product {sku} does not belong to seller {seller_id}."},
                        status=400,
                    )

            # доп. проверки для HD — оставляем твои
            if delivery_type == 2:
                gaddr = group.get("delivery_address", {}) or {}
                zip_code = gaddr.get("zip")
                if not zip_code:
                    return Response({"error": f"Group {idx}: ZIP code is missing."}, status=400)

                # Проверяем ZIP группы
                resolved_zip = ZipCodeValidator.validate_and_resolve(zip_code, country_code, prefer_remote=True)
                if not resolved_zip.valid:
                    return Response(
                        {"error": f"Group {idx}: Invalid ZIP '{zip_code}' for country {country_code}."},
                        status=400,
                    )

                # Если DPD вернул нормализованную форму — сохраняем её обратно
                if resolved_zip.normalized_postcode:
                    gaddr["zip"] = uppercase_zip(resolved_zip.normalized_postcode)

                phone_error = validate_phone_matches_country(phone, country_code)
                if phone_error:
                    return Response({"error": f"Group {idx}: {phone_error}"}, status=400)

            # --- расчёт доставки по курьеру ---
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
                logger.info(f"[GLS] Shipping result for group {idx}: {shipping_result}")

            elif courier_code == "dpd":
                shipping_result = calculate_order_shipping_dpd(
                    country=country_code,
                    items=items_for_calc,
                    cod=False,
                    currency="EUR",
                    variant_map=variant_map,
                )
                logger.info(f"[DPD] Shipping result for group {idx}: {shipping_result}")

            else:
                shipping_result = calculate_order_shipping(
                    country=country_code,
                    items=items_for_calc,
                    cod=cod,
                    currency="EUR",
                )
                logger.info(f"[Packeta] Shipping result for group {idx}: {shipping_result}")

            channel = CHANNEL_MAP.get(delivery_type)
            if channel is None:
                return Response({"error": f"Group {idx}: Unknown delivery_type {delivery_type}."}, status=400)

            selected_option = next(
                (opt for opt in shipping_result.get("options", []) if opt["channel"] == channel),
                None
            )
            if not selected_option:
                available = [o["channel"] for o in shipping_result.get("options", [])]
                return Response(
                    {"error": f"Group {idx}: No option for channel {channel}. Available: {', '.join(available) or 'none'}."},
                    status=400,
                )

            raw_total_parcels = shipping_result.get("total_parcels", 1)
            if isinstance(raw_total_parcels, dict):
                num_parcels = max(raw_total_parcels.values()) if raw_total_parcels else 1
            else:
                num_parcels = int(raw_total_parcels or 1)

            delivery_cost = _D(selected_option["priceWithVat"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_delivery += delivery_cost

            # сохраняем рассчитанные данные в группе (это потом webhook прочитает)
            group["calculated_delivery_cost"] = str(delivery_cost)
            group["calculated_total_parcels"] = num_parcels

            # товары
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

        # единая позиция «Delivery»
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

        gross_total = sum(Decimal(g["calculated_group_total"]) for g in groups).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        logger.info(
            f"Gross total for all groups: {gross_total} EUR (including total delivery: {total_delivery} EUR)"
        )

        session_key = str(uuid.uuid4())
        invoice_number, variable_symbol = next_invoice_identifiers()

        # сохраняем мету — как у тебя
        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": str(user.id),
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "delivery_address": delivery_address,
            },
            invoice_data={
                "groups": groups,
                "invoice_number": invoice_number,
            },
            description_data={
                "gross_total": str(gross_total),
                "delivery_total": str(total_delivery),
                "variable_symbol": variable_symbol,
            },
        )

        logger.info(f"Stripe metadata saved with session_key: {session_key}")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=settings.REDIRECT_DOMAIN + "payment_end/?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=settings.REDIRECT_DOMAIN + "basket/",
                metadata={
                    "session_key": session_key,
                    "invoice_number": invoice_number,
                },
            )

            logger.info(
                "Stripe Checkout session created: %s for user %s, session_key: %s",
                checkout_session.id,
                user.id,
                session_key,
            )

            return Response(
                {
                    "checkout_url": checkout_session.url,
                    "session_id": checkout_session.id,
                    "session_key": session_key,
                },
                status=200,
            )
        except Exception as e:
            logger.exception("Stripe session creation failed")
            return Response({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Handle Stripe Webhook for Completed Payment",
    description=(
        "Processes Stripe successful checkout events and creates orders.\n\n"
        "**Business Logic:**\n"
        "- Verifies the Stripe webhook signature.\n"
        "- Supports `checkout.session.completed` and `checkout.session.async_payment_succeeded`.\n"
        "- Idempotent: if Payment for this session already exists, returns 200 immediately.\n"
        "- Restores saved metadata (customer, groups, delivery info).\n"
        "- Creates one or more orders grouped by seller.\n"
        "- Creates associated order items, delivery addresses, and single Payment per session.\n"
        "- Generates invoice and sends email (async) when possible.\n"
        "- 🔒 Re-checks CZ-origin rule: if any SKU seller's default_warehouse is not in CZ, "
        "orders/payments are created, but parcel generation is **skipped**.\n\n"
        "**Responses:**\n"
        "- 200: Orders and payments created successfully (or already processed).\n"
        "- 400: Invalid payload, signature verification failure, or missing session metadata.\n"
        "- 500: Error during order processing."
    ),
    responses={
        200: OpenApiResponse(description="Orders and payments created successfully"),
        400: OpenApiResponse(description="Invalid payload or missing session metadata"),
        500: OpenApiResponse(description="Order creation failed"),
    },
    tags=['Stripe']
)
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body.decode("utf-8")
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        # 1. проверка подписи
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Stripe webhook verification failed: {e}")
            return Response(status=400)

        handled_types = {"checkout.session.completed", "checkout.session.async_payment_succeeded"}
        if event.get("type") not in handled_types:
            logger.info(f"Unhandled Stripe event: {event.get('type')}")
            return Response(status=200)

        session = event["data"]["object"]
        session_id = session["id"]
        session_key = (session.get("metadata") or {}).get("session_key")

        if not session_key:
            logger.error("Missing session_key in Stripe webhook metadata.")
            return Response({"error": "Missing session_key"}, status=400)

        # идемпотентность
        existing = Payment.objects.filter(session_id=session_id).only("amount_total", "currency").first()
        if existing:
            # на случай повтора хука — гарантируем, что кэш заполнен
            _set_conv_cache_after_commit(session_id, existing.amount_total, existing.currency, logger=logger, source="StripeWebhook")
            logger.info("[StripeWebhook] Conversion cache refreshed for existing payment %s", session_id)
            return Response(status=200)

        # поднимаем мету
        try:
            meta = StripeMetadata.objects.get(session_key=session_key)
        except StripeMetadata.DoesNotExist:
            logger.error(f"No StripeMetadata found for session_key: {session_key}")
            return Response({"error": "Session metadata not found"}, status=400)

        user_id = meta.custom_data.get("user_id")
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            logger.error(f"CustomUser not found: {user_id}")
            return Response({"error": "User not found"}, status=400)

        groups = meta.invoice_data.get("groups", [])
        if not groups:
            logger.error("No groups found in StripeMetadata")
            return Response({"error": "No groups found in metadata"}, status=400)

        # lite-проверка CZ (как у тебя)
        all_skus = []
        for g in groups:
            for p in g.get("products", []):
                all_skus.append(str(p.get("sku")))
        variants = (
            ProductVariant.objects
            .filter(sku__in=all_skus)
            .select_related("product__seller__default_warehouse")
            .only("sku", "product__seller_id", "product__seller__default_warehouse__country")
        )
        vmap = {v.sku: v for v in variants}
        not_cz = []
        missing = []
        for sku in all_skus:
            v = vmap.get(sku)
            if not v:
                missing.append(sku)
                continue
            seller = getattr(v.product, "seller", None)
            dw = getattr(seller, "default_warehouse", None) if seller else None
            if not (dw and getattr(dw, "country", None) == "CZ"):
                not_cz.append(sku)

        origin_blocked = bool(not_cz)
        if missing:
            logger.warning("[StripeWebhook] Unknown SKU(s) in metadata: %s", ", ".join(missing))
        if origin_blocked:
            logger.warning(
                "[StripeWebhook] CZ-origin rule violated, SKUs: %s. "
                "Orders/payments will be created, but parcel generation will be skipped.",
                ", ".join(not_cz),
            )

        # статусы
        try:
            pending_status = OrderStatus.objects.get(name="Pending")
            processing_status = OrderStatus.objects.get(name="Processing")
        except OrderStatus.DoesNotExist as e:
            logger.exception(f"[StripeWebhook] Missing OrderStatus: {e}")
            return Response({"error": "Order status misconfigured"}, status=500)

        amount = (Decimal(session["amount_total"]) / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        currency = session["currency"].upper()

        try:
            expected = Decimal((meta.description_data or {}).get("gross_total", "0") or "0").quantize(Decimal("0.01"))
        except Exception:
            expected = Decimal("0.00")
        if expected and (amount - expected).copy_abs() > Decimal("0.01"):
            logger.warning(
                "[StripeWebhook] amount_total mismatch: stripe=%s, expected=%s (session=%s)",
                amount,
                expected,
                session_id,
            )

        root_addr = meta.custom_data.get("delivery_address") or {}
        root_country = (root_addr.get("country") or "").upper()

        invoice_created = False

        with transaction.atomic():
            orders_created = []

            for idx, group in enumerate(groups, start=1):
                delivery_type_id = group.get("delivery_type")
                courier_service_id = group.get("courier_service")
                pickup_point_id = group.get("pickup_point_id")
                products = group.get("products", [])

                # суммы, которые мы посчитали и сохранили при создании сессии
                delivery_cost = Decimal(group.get("calculated_delivery_cost", "0.00")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                group_total = Decimal(group.get("calculated_group_total", "0.00")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

                # справочники
                dt = DeliveryType.objects.filter(id=delivery_type_id).first()
                if not dt:
                    return Response({"error": f"DeliveryType {delivery_type_id} not found"}, status=400)

                cs = CourierService.objects.filter(id=courier_service_id).first()
                courier_code = (cs.code or "").lower() if cs and cs.code else ""

                # ВАЖНО: достаём адрес из группы один раз
                gaddr = group.get("delivery_address") or {}

                # --- создаём DeliveryAddress ---
                if delivery_type_id == 2:
                    # HD — всегда берём адрес из группы, с фолбеком на root_country
                    delivery_address_obj = DeliveryAddress.objects.create(
                        user=user,
                        full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                        phone=meta.custom_data.get("phone"),
                        email=meta.custom_data.get("email"),
                        street=gaddr.get("street", ""),
                        city=gaddr.get("city", ""),
                        zip_code=gaddr.get("zip", ""),
                        country=gaddr.get("country", root_country),
                    )
                else:
                    # PUDO
                    if courier_code == "dpd" and gaddr:
                        # именно этот кейс у тебя упал в логах
                        delivery_address_obj = DeliveryAddress.objects.create(
                            user=user,
                            full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                            phone=meta.custom_data.get("phone"),
                            email=meta.custom_data.get("email"),
                            street=gaddr.get("street", ""),
                            city=gaddr.get("city", ""),
                            zip_code=gaddr.get("zip", ""),
                            country=gaddr.get("country", root_country),
                        )
                    else:
                        # Packeta / GLS / прочие PUDO
                        delivery_address_obj = DeliveryAddress.objects.create(
                            user=user,
                            full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                            phone=meta.custom_data.get("phone"),
                            email=meta.custom_data.get("email"),
                            street="",
                            city="",
                            zip_code="",
                            country=root_country,
                        )

                # --- создаём Order ---
                order = Order.objects.create(
                    user=user,
                    first_name=meta.custom_data.get("first_name", ""),
                    last_name=meta.custom_data.get("last_name", ""),
                    customer_email=meta.custom_data.get("email"),
                    delivery_type=dt,
                    delivery_address=delivery_address_obj,
                    pickup_point_id=pickup_point_id,
                    delivery_cost=delivery_cost,
                    courier_service=cs,
                    phone_number=meta.custom_data.get("phone"),
                    total_amount=amount,  # сумма по всей сессии
                    group_subtotal=group_total,  # сумма только по этой группе
                    order_status=pending_status,
                )

                # --- позиции заказа ---
                for product in products:
                    sku = product.get("sku")
                    qty = int(product.get("quantity", 0))

                    variant = vmap.get(str(sku))
                    if not variant:
                        logger.error(f"Group {idx}: ProductVariant not found in vmap (SKU={sku})")
                        continue

                    wh_item = WarehouseItem.objects.filter(
                        product_variant=variant, quantity_in_stock__gte=qty
                    ).first()
                    warehouse = wh_item.warehouse if wh_item else Warehouse.objects.first()

                    OrderProduct.objects.create(
                        order=order,
                        product=variant,
                        quantity=qty,
                        delivery_cost=Decimal("0.00"),
                        seller_profile_id=variant.product.seller_id,
                        product_price=variant.price_with_acquiring,
                        warehouse=warehouse,
                        status=ProductStatus.AWAITING_SHIPMENT,
                    )

                # статус → Processing
                order.order_status = processing_status
                order.save(update_fields=["order_status"])
                order.order_products.update(status=ProductStatus.AWAITING_SHIPMENT)

                if origin_blocked:
                    logger.info(
                        "Order %s marked as 'origin_blocked' (no parcel generation will be started).",
                        order.id,
                    )

                orders_created.append(order)
                logger.info(f"[StripeWebhook] Group {idx}: Order {order.id} created successfully with {len(products)} products.")

            if not orders_created:
                return Response({"error": "Order creation failed"}, status=500)

            # Единый Payment на сессию
            payment = Payment.objects.create(
                payment_system="stripe",
                session_id=session_id,
                session_key=session_key,
                customer_id=session.get("customer"),
                payment_intent_id=session.get("payment_intent"),
                payment_method="stripe",
                amount_total=amount,
                currency=currency,
                customer_email=meta.custom_data.get("email"),
            )
            for order in orders_created:
                order.payment = payment
                order.save(update_fields=["payment"])

            # конверсия в кэш — важно для фронта и Ads
            _set_conv_cache_after_commit(session_id, amount, currency, logger=logger, source="StripeWebhook")
            logger.info(
                "[StripeWebhook] Conversion cache planned after-commit for %s: %s %s",
                session_id, amount, currency
            )

            # Инвойс
            try:
                invoice_number = meta.invoice_data.get("invoice_number")
                if not invoice_number:
                    raise ValueError("Missing invoice_number in metadata")

                variable_symbol = (meta.description_data or {}).get("variable_symbol") or invoice_number

                invoice_data = prepare_invoice_data(session_id)
                pdf_file = generate_invoice_pdf(invoice_data)

                Invoice.objects.create(
                    payment=payment,
                    invoice_number=invoice_number,
                    variable_symbol=variable_symbol,
                    file=pdf_file,
                )
                logger.info(f"[INVOICE] Created Invoice {invoice_number} for Payment {session_id}")
                invoice_created = True
            except Exception as e:
                logger.exception(f"[INVOICE] Failed to create invoice for Payment {session_id}: {e}")

        # 8) Вне транзакции — письмо клиенту
        if invoice_created:
            async_send_client_email(session_id)
            logger.info(f"[StripeWebhook] Planned async client email for session {session_id}")
        else:
            logger.warning(f"[StripeWebhook] Skipped client email — invoice not ready for session {session_id}")

        # 9) Генерация посылок / уведомления
        if origin_blocked:
            logger.warning(
                "[StripeWebhook] Parcel generation skipped for session %s due to non-CZ origin (SKUs: %s).",
                session_id,
                ", ".join(not_cz),
            )
        else:
            order_ids = [o.id for o in orders_created]
            async_parcels_and_seller_email(order_ids, session_id)
            logger.info(f"[StripeWebhook] Planned async parcels+seller_email+manager for orders {order_ids}")

        return Response({"status": f"{len(orders_created)} order(s) created successfully"}, status=200)


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Create PayPal Payment Session (Packeta / DPD / GLS)",
    description=(
        "Creates a PayPal payment session by validating customer data and seller-grouped products, "
        "normalizing ZIP codes, and calculating delivery prices using Packeta (Zásilkovna), DPD, or GLS.\n\n"

        "**Processing Flow:**\n"
        "1) Validates required input fields and ensures a valid customer delivery address.\n"
        "2) Converts all ZIP codes to **uppercase** and performs postal validation:\n"
        "   • Local ZIP dataset checks (per-country rules)\n"
        "   • DPD GeoRouting checks for supported countries\n"
        "   • If DPD returns a normalized ZIP, it is written back to the group data.\n"
        "3) Enforces the **CZ-origin rule**: all products must originate from sellers whose default warehouse "
        "is located in the Czech Republic.\n"
        "4) Confirms seller ownership of each SKU in every group.\n"
        "5) Resolves group-level destination country from either pickup point or delivery address.\n"
        "6) Courier logic by `courier_service` value:\n"
        "   • `2` = Packeta (Zásilkovna) — aggregator pricing\n"
        "   • `3` = GLS — GLS parcel-split + address-bundle based pricing\n"
        "   • `4` = DPD — volumetric weight, per-country price tables, strict parcel dimension limits\n\n"

        "**DPD-specific checks:**\n"
        "- All product variants used in a DPD group must have defined: `weight_grams`, `length_mm`, `width_mm`, `height_mm`.\n"
        "- Parcel limits are enforced (≤31.5 kg, ≤120 cm longest side, ≤300 cm combined dimensions).\n\n"

        "**Delivery Cost Selection:**\n"
        "- `delivery_type` determines channel:\n"
        "   `1` → PUDO (Pickup Point)\n"
        "   `2` → HD (Home Delivery)\n"
        "- The matching rate is selected from courier pricing results.\n"
        "- If multiple parcel counts appear (e.g., GLS/DPD splits), `total_parcels` is normalized to a single integer.\n\n"

        "**PayPal Session Construction:**\n"
        "- Product costs and delivery costs are added to `purchase_units` items.\n"
        "- Computed group-level shipping data is written into `PayPalMetadata`, "
        "to be restored by the webhook upon successful payment.\n"
        "- COD is **always disabled** for PayPal payments.\n"
        "- Currency is **EUR** throughout the calculation.\n\n"

        "**Post-Payment Workflow:**\n"
        "- PayPal webhook reads stored metadata, creates 1..N orders (one per seller-group), "
        "generates invoice(s), and sends emails to:\n"
        "   • Customer\n"
        "   • Seller(s)\n"
        "   • Managers\n\n"

        "**Redirect Behavior:**\n"
        "- Success: `REDIRECT_DOMAIN/payment_end/?session_id=<session_key>`\n"
        "- Cancel:  `REDIRECT_DOMAIN/basket/`\n\n"

        "**Example of Multi-Courier Flow:**\n"
        "Two seller groups in one checkout:\n"
        "- Group 1 (GLS HD): Standard home delivery within CZ or EU, parcel split via GLS logic.\n"
        "- Group 2 (DPD PUDO): Pickup Point delivery abroad with strict volumetric and weight checks.\n"
        "→ Both groups are validated, delivery is calculated individually, totals are aggregated, "
        "and one unified PayPal session is created."
    ),
    request=SessionInputSerializer,
    responses={
        200: OpenApiResponse(
            response=PayPalSessionOutputSerializer,
            description="PayPal session created successfully",
            examples=[
                OpenApiExample(
                    name="Success",
                    value={
                        "approval_url": "https://www.sandbox.paypal.com/checkoutnow?token=3FJ45213AK318393U",
                        "order_id": "3FJ45213AK318393U",
                        "session_key": "7b73006d-e4a4-4b94-9c13-8f76c81e56a9",
                        "session_id": "7b73006d-e4a4-4b94-9c13-8f76c81e56a9"
                    },
                    response_only=True
                )
            ]
        ),
        400: OpenApiResponse(
            description="Validation error",
            examples=[
                OpenApiExample(
                    "Missing Root Address Field",
                    value={"error": "Missing 'zip' in delivery_address"}
                ),
                OpenApiExample(
                    "CZ-Origin Rule",
                    value={"origin": ["Только отправка из Чехии. Продавец(ы) SKU 240819709 ..."]}
                ),
                OpenApiExample(
                    "Invalid ZIP",
                    value={"error": "Group 1: ZIP code '010011' is invalid for country RO."}
                ),
                OpenApiExample(
                    "No Option For Channel",
                    value={"error": "Group 2: No option for channel PUDO. Available: HD"}
                ),
                OpenApiExample(
                    "Missing Dimensions For DPD",
                    value={"error": "Missing weight/dimensions for SKU(s): 123456, 654321"}
                ),
            ]
        ),
        500: OpenApiResponse(
            description="Internal server error",
            examples=[
                OpenApiExample("PayPal Failure", value={"error": "PayPal session creation failed: <reason>"}),
            ]
        ),
    },
    examples=[
        OpenApiExample(
            name="Request: GLS (HD) + DPD (PUDO)",
            summary="Two groups: one shipped by GLS (HD), one by DPD (PUDO)",
            request_only=True,
            value={
                "email": "user@example.com",
                "first_name": "Pavel",
                "last_name": "Ivanov",
                "phone": "+420777111222",
                "delivery_address": {
                    "street": "Na Lysinách 551/34",
                    "city": "Praha",
                    "zip": "14700",
                    "country": "CZ"
                },
                "groups": [
                    {
                        "seller_id": 2,
                        "delivery_type": 2,         # HD
                        "courier_service": 3,       # GLS
                        "delivery_address": {
                            "street": "Na Lysinách 551/34",
                            "city": "Praha",
                            "zip": "14700",
                            "country": "CZ"
                        },
                        "products": [
                            {"sku": "240819709", "quantity": 2}
                        ]
                    },
                    {
                        "seller_id": 1,
                        "delivery_type": 1,         # PUDO
                        "courier_service": 4,       # DPD
                        "delivery_address": {
                            "street": "Na Lysinách 551/34",
                            "city": "Praha",
                            "zip": "14700",
                            "country": "CZ"
                        },
                        "pickup_point_id": "35862",
                        "products": [
                            {"sku": "272464947", "quantity": 3}
                        ]
                    }
                ]
            }
        )
    ],
    tags=["PayPal"]
)
class CreatePayPalPaymentView(PayPalMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        logger.info("PayPal session creation request received", extra={"data": data})

        # базовые поля
        required_fields = ['email', 'first_name', 'last_name', 'phone', 'delivery_address', 'groups']
        for field in required_fields:
            if field not in data:
                return Response({"error": f"Missing required field: {field}"}, status=400)

        email = data['email']
        first_name = data['first_name']
        last_name = data['last_name']
        phone = data['phone']
        delivery_address = data['delivery_address']
        groups = data['groups']

        # Нормализуем корневой ZIP в верхний регистр
        if "zip" in delivery_address and delivery_address["zip"] is not None:
            delivery_address["zip"] = uppercase_zip(delivery_address["zip"])

        # Нормализуем ZIP в адресах групп
        for g in groups:
            gaddr = g.get("delivery_address")
            if gaddr and ("zip" in gaddr) and (gaddr["zip"] is not None):
                gaddr["zip"] = uppercase_zip(gaddr["zip"])

        root_country = (delivery_address.get('country') or '').upper()

        # корневой адрес обязателен и должен содержать все поля
        for f in ['street', 'city', 'zip', 'country']:
            if f not in delivery_address:
                return Response({"error": f"Missing '{f}' in delivery_address"}, status=400)

        # Базовая валидация групп: resolve_country_code_from_group и т.п.
        validation_response = PaymentSessionValidator.validate_groups(groups, root_country=root_country)
        if validation_response:
            return validation_response

        logger.info(f"Validated {len(groups)} groups for user {user.id}. Starting calculation.")

        # Подгружаем варианты по всем SKU
        all_skus = {p['sku'] for g in groups for p in g['products']}
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

        # DPD: проверка габаритов/веса
        dpd_skus = {
            p["sku"]
            for g in groups
            if _get_courier_code(g.get("courier_service")) == "dpd"
            for p in g.get("products", [])
        }
        if dpd_skus:
            missing_dims = []
            for sku in dpd_skus:
                v = variant_map.get(sku)
                if not v:
                    continue
                req = [v.weight_grams, v.length_mm, v.width_mm, v.height_mm]
                if any(x is None or x == 0 for x in req):
                    missing_dims.append(sku)
            if missing_dims:
                return Response(
                    {"error": f"Missing weight/dimensions for SKU(s): {', '.join(missing_dims)}"},
                    status=400,
                )

        # CZ-origin правило
        cz_resp = _check_cz_origin_for_groups(variant_map, groups)
        if cz_resp is not None:
            logger.warning("CZ origin check failed during PayPal session creation")
            return cz_resp

        total_delivery = Decimal('0.00')
        line_items = []

        for idx, group in enumerate(groups, start=1):
            delivery_type = group['delivery_type']  # 1=PUDO, 2=HD
            products = group['products']
            seller_id = group['seller_id']
            courier_code = _get_courier_code(group.get("courier_service"))

            # GLS PUDO: поддерживаем SUBMODE (SHOP / BOX)
            delivery_mode = None
            if courier_code == "gls" and delivery_type == 1:  # PUDO
                # На этом этапе PaymentSessionValidator уже гарантирует,
                # что delivery_mode ∈ {"shop", "box"}
                delivery_mode = str(group.get("delivery_mode", "")).lower().strip()

            # Принадлежность товаров продавцу
            for product in products:
                sku = product['sku']
                variant = variant_map.get(sku)
                if not variant:
                    return Response({"error": f"Group {idx}: ProductVariant not found: {sku}"}, status=400)
                if variant.product.seller.id != seller_id:
                    return Response(
                        {"error": f"Group {idx}: Product {sku} does not belong to seller {seller_id}."},
                        status=400
                    )

            # Страна назначения (учитываем courier_code и root_country)
            country_code = resolve_country_code_from_group(
                group, idx, logger=logger, root_country=root_country, courier_code=courier_code
            )
            if not country_code:
                return Response({"error": f"Group {idx}: Invalid delivery address or pickup point."}, status=400)

            # Доп. проверки для HD: ZIP validate_and_resolve + нормализация + телефон
            if delivery_type == 2:
                gaddr = group.get("delivery_address", {}) or {}
                zip_code = gaddr.get("zip")
                if not zip_code:
                    return Response({"error": f"Group {idx}: ZIP code is missing."}, status=400)

                resolved_zip = ZipCodeValidator.validate_and_resolve(zip_code, country_code, prefer_remote=True)
                if not resolved_zip.valid:
                    return Response(
                        {"error": f"Group {idx}: Invalid ZIP '{zip_code}' for country {country_code}."},
                        status=400,
                    )
                if resolved_zip.normalized_postcode:
                    gaddr["zip"] = uppercase_zip(resolved_zip.normalized_postcode)

                phone_error = validate_phone_matches_country(phone, country_code)
                if phone_error:
                    return Response({"error": f"Group {idx}: {phone_error}"}, status=400)

            # Расчёт доставки по курьеру
            items_for_calc = [{"sku": p['sku'], "quantity": p['quantity']} for p in products]
            cod = Decimal("0.00")  # COD всегда off для онлайн-оплаты

            if courier_code == "gls":
                # GLS: address_bundle зависит от сплита
                gls_blocks = split_items_into_parcels_gls(items_for_calc)
                address_bundle = "one" if len(gls_blocks) == 1 else "multi"
                shipping_result = calculate_gls_shipping_options(
                    country=country_code,
                    items=items_for_calc,
                    cod=cod,
                    currency='EUR',
                    address_bundle=address_bundle,
                )
                logger.info(f"[GLS] Shipping result for group {idx}: {shipping_result}")

            elif courier_code == "dpd":
                # DPD: используем ваш калькулятор с variant_map
                shipping_result = calculate_order_shipping_dpd(
                    country=country_code,
                    items=items_for_calc,
                    cod=False,
                    currency="EUR",
                    variant_map=variant_map,
                )
                logger.info(f"[DPD] Shipping result for group {idx}: {shipping_result}")

            else:
                # Packeta (Zásilkovna) по умолчанию
                shipping_result = calculate_order_shipping(
                    country=country_code,
                    items=items_for_calc,
                    cod=cod,
                    currency='EUR',
                )
                logger.info(f"[Packeta] Shipping result for group {idx}: {shipping_result}")

            # Выбираем канал по delivery_type
            channel = CHANNEL_MAP.get(delivery_type)
            if channel is None:
                return Response({"error": f"Group {idx}: Unknown delivery_type {delivery_type}."}, status=400)

            # --- Для GLS PUDO: определяем нужный режим ---
            if courier_code == "gls" and delivery_type == 1:
                desired_service = delivery_mode.upper()  # "SHOP" или "BOX"

                # Находим опцию по service
                selected_option = next(
                    (
                        opt for opt in shipping_result.get("options", [])
                        if opt.get("service", "").upper() == desired_service
                    ),
                    None
                )

            else:
                # fallback для любых других курьеров
                selected_option = next(
                    (opt for opt in shipping_result.get("options", []) if opt["channel"] == channel),
                    None
                )

            if not selected_option:
                available = [o["channel"] for o in shipping_result.get("options", [])]

                if courier_code == "gls" and delivery_type == 1:
                    return Response(
                        {
                            "error": (
                                f"Group {idx}: GLS does not support '{delivery_mode.upper()}' "
                                f"for this parcel set. Available: {', '.join(available)}"
                            )
                        },
                        status=400,)
                return Response(
                    {
                        "error": f"Group {idx}: No option for channel {channel}. Available: {', '.join(available) or 'none'}."},
                    status=400,
                )

            # Нормализуем количество посылок
            raw_total_parcels = shipping_result.get("total_parcels", 1)
            if isinstance(raw_total_parcels, dict):
                num_parcels = max(raw_total_parcels.values()) if raw_total_parcels else 1
            else:
                num_parcels = int(raw_total_parcels or 1)

            # Цена доставки
            delivery_cost = _D(selected_option["priceWithVat"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_delivery += delivery_cost

            # Сохраняем вычисленные поля — вебхук будет их читать
            group["calculated_delivery_cost"] = str(delivery_cost)
            group["calculated_total_parcels"] = num_parcels

            # Товарные позиции и стоимость группы
            group_total = Decimal('0.00')
            for product in products:
                variant = variant_map[product['sku']]
                unit_price = variant.price_with_acquiring.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                quantity = int(product['quantity'])
                group_total += unit_price * quantity

                line_items.append({
                    'name': product['sku'],
                    'sku': product['sku'],
                    'unit_amount': {'currency_code': 'EUR', 'value': str(unit_price)},
                    'quantity': str(quantity),
                })

            group_total += delivery_cost
            group["calculated_group_total"] = str(group_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

        # Итог по всем группам
        gross_total = sum(Decimal(g["calculated_group_total"]) for g in groups).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        logger.info(
            f"[PayPal] Gross total for all groups: {gross_total} EUR (including total delivery: {total_delivery} EUR)"
        )

        # Отдельная линия «Delivery» — суммарной стоимостью
        if total_delivery > 0:
            line_items.append({
                'name': 'Delivery',
                'sku': 'delivery',
                'unit_amount': {'currency_code': 'EUR',
                                'value': str(total_delivery.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))},
                'quantity': '1',
            })

        # Генерируем session_key и номера для инвойса
        session_key = str(uuid.uuid4())
        invoice_number, variable_symbol = next_invoice_identifiers()

        # Сохраняем PayPal метаданные
        PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data={
                'user_id': str(user.id),
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
                'delivery_address': delivery_address,
            },
            invoice_data={
                'groups': groups,
                'invoice_number': invoice_number,
            },
            description_data={
                'gross_total': str(gross_total),
                'delivery_total': str(total_delivery.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                'variable_symbol': variable_symbol,
            },
        )

        logger.info(f"[PayPal] metadata saved with session_key: {session_key}")

        # Создаём PayPal order
        try:
            approval_url, order_id = self.create_paypal_order(
                line_items=line_items,
                total_price=gross_total,
                session_key=session_key,
                invoice_number=invoice_number,
            )
            logger.info(f"[PayPal] order created successfully: order_id={order_id}, session_key={session_key}")
            return Response({
                'approval_url': approval_url,
                'order_id': order_id,
                'session_key': session_key,
                'session_id': session_key,
            }, status=200)

        except Exception as e:
            logger.exception("PayPal session creation failed")
            return Response({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Handle PayPal Webhook for Successful Payment",
    description=(
        "Processes PayPal payment webhooks. Accepts PAYMENT.CAPTURE.COMPLETED and CHECKOUT.ORDER.COMPLETED.\n"
        "If CHECKOUT.ORDER.APPROVED is received, captures the order and then proceeds.\n\n"
        "Creates orders grouped by seller, a single Payment per order, generates invoice, "
        "sends emails and updates the conversion cache (session_key) after commit."
    ),
    responses={
        200: OpenApiResponse(description="Orders and payments created successfully (or already processed)"),
        403: OpenApiResponse(description="Invalid webhook signature"),
        400: OpenApiResponse(description="Invalid payload or unsupported event type"),
        500: OpenApiResponse(description="Order creation failed"),
    },
    tags=['PayPal']
)
class PayPalWebhookView(PayPalMixin, APIView):
    permission_classes = [AllowAny]

    # --- внутренние утилиты для REST PayPal ---
    def _paypal_api_get(self, path: str):
        token = self.get_paypal_access_token()
        resp = requests.get(
            f"{PAYPAL_API_URL}{path}",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()

    def _paypal_api_capture(self, order_id: str):
        token = self.get_paypal_access_token()
        resp = requests.post(
            f"{PAYPAL_API_URL}/v2/checkout/orders/{order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={}, timeout=10
        )
        resp.raise_for_status()
        return resp.json()

    # --- основная логика восстановления и создания заказов ---
    def _create_orders(self, *, order_id: str, session_key: str, amount, currency: str):
        """
        Создаёт заказы/Payment/Invoice по сохранённой в PayPalMetadata метаданной.
        Полностью выровнено со StripeWebhook:
          - одинаковая логика адресов
          - одинаковая логика групп
          - одинаковое поведение при нарушении CZ-origin (skip parcels)
          - одинаковая запись conversion payload
        """
        # idempotency по intent/order_id
        existing = Payment.objects.filter(payment_system="paypal", payment_intent_id=order_id) \
            .only("amount_total", "currency", "session_key").first()
        if existing:
            _set_conv_cache_after_commit(existing.session_key or session_key,
                                         existing.amount_total,
                                         existing.currency,
                                         logger=logger,
                                         source="PayPalWebhook")
            return []

        try:
            meta = PayPalMetadata.objects.get(session_key=session_key)
        except PayPalMetadata.DoesNotExist:
            logger.error("PayPalMetadata not found for session_key=%s", session_key)
            return None

        user_id = meta.custom_data.get("user_id")
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            logger.error("CustomUser not found: %s", user_id)
            return None

        groups = meta.invoice_data.get("groups", [])
        if not groups:
            logger.error("No groups found in metadata")
            return None

        # --- CZ-origin check (1:1 как в StripeWebhook) ---
        all_skus = []
        for g in groups:
            for p in g.get("products", []):
                all_skus.append(str(p.get("sku")))
        variants = (
            ProductVariant.objects
            .filter(sku__in=all_skus)
            .select_related("product__seller__default_warehouse")
            .only("sku", "product__seller_id", "product__seller__default_warehouse__country")
        )
        vmap = {v.sku: v for v in variants}
        not_cz = []
        missing = []
        for sku in all_skus:
            v = vmap.get(sku)
            if not v:
                missing.append(sku)
                continue
            seller = getattr(v.product, "seller", None)
            dw = getattr(seller, "default_warehouse", None) if seller else None
            if not (dw and getattr(dw, "country", None) == "CZ"):
                not_cz.append(sku)

        origin_blocked = bool(not_cz)
        if missing:
            logger.warning("[PayPalWebhook] Unknown SKU(s) in metadata: %s", ", ".join(missing))
        if origin_blocked:
            logger.warning(
                "[PayPalWebhook] CZ-origin violated, skipping parcel creation. SKUs: %s",
                ", ".join(not_cz),
            )

        # statuses
        try:
            pending_status = OrderStatus.objects.get(name="Pending")
            processing_status = OrderStatus.objects.get(name="Processing")
        except OrderStatus.DoesNotExist as e:
            logger.exception("[PayPalWebhook] Missing OrderStatus: %s", e)
            return None

        root_addr = meta.custom_data.get("delivery_address") or {}
        root_country = (root_addr.get("country") or "").upper()

        orders_created = []
        with transaction.atomic():
            for idx, group in enumerate(groups, start=1):
                delivery_type_id = group.get("delivery_type")
                courier_service_id = group.get("courier_service")
                pickup_point_id = group.get("pickup_point_id")
                products = group.get("products", [])

                delivery_cost = Decimal(group.get("calculated_delivery_cost", "0.00")).quantize(Decimal("0.01"),
                                                                                                ROUND_HALF_UP)
                group_total = Decimal(group.get("calculated_group_total", "0.00")).quantize(Decimal("0.01"),
                                                                                            ROUND_HALF_UP)

                dt = DeliveryType.objects.filter(id=delivery_type_id).first()
                cs = CourierService.objects.filter(id=courier_service_id).first()
                courier_code = (cs.code or "").lower() if cs and cs.code else ""

                gaddr = group.get("delivery_address") or {}

                # --- адрес 1:1 со Stripe ---
                if delivery_type_id == 2:
                    delivery_address_obj = DeliveryAddress.objects.create(
                        user=user,
                        full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                        phone=meta.custom_data.get("phone"),
                        email=meta.custom_data.get("email"),
                        street=gaddr.get("street", ""),
                        city=gaddr.get("city", ""),
                        zip_code=gaddr.get("zip", ""),
                        country=gaddr.get("country", root_country),
                    )
                else:
                    if courier_code == "dpd" and gaddr:
                        delivery_address_obj = DeliveryAddress.objects.create(
                            user=user,
                            full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                            phone=meta.custom_data.get("phone"),
                            email=meta.custom_data.get("email"),
                            street=gaddr.get("street", ""),
                            city=gaddr.get("city", ""),
                            zip_code=gaddr.get("zip", ""),
                            country=gaddr.get("country", root_country),
                        )
                    else:
                        delivery_address_obj = DeliveryAddress.objects.create(
                            user=user,
                            full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                            phone=meta.custom_data.get("phone"),
                            email=meta.custom_data.get("email"),
                            street="",
                            city="",
                            zip_code="",
                            country=root_country,
                        )

                # --- Order ---
                order = Order.objects.create(
                    user=user,
                    first_name=meta.custom_data.get("first_name", ""),
                    last_name=meta.custom_data.get("last_name", ""),
                    customer_email=meta.custom_data.get("email"),
                    delivery_type=dt,
                    delivery_address=delivery_address_obj,
                    pickup_point_id=pickup_point_id,
                    delivery_cost=delivery_cost,
                    courier_service=cs,
                    phone_number=meta.custom_data.get("phone"),
                    total_amount=amount,
                    group_subtotal=group_total,
                    order_status=pending_status,
                )

                # items
                for product in products:
                    sku = product.get("sku")
                    qty = int(product.get("quantity", 0))

                    variant = vmap.get(str(sku))
                    if not variant:
                        logger.error(f"Group {idx}: SKU {sku} missing in vmap")
                        continue

                    wh_item = WarehouseItem.objects.filter(product_variant=variant, quantity_in_stock__gte=qty).first()
                    warehouse = wh_item.warehouse if wh_item else Warehouse.objects.first()

                    OrderProduct.objects.create(
                        order=order,
                        product=variant,
                        quantity=qty,
                        delivery_cost=Decimal("0.00"),
                        seller_profile_id=variant.product.seller_id,
                        product_price=variant.price_with_acquiring,
                        warehouse=warehouse,
                        status=ProductStatus.AWAITING_SHIPMENT,
                    )

                order.order_status = processing_status
                order.save(update_fields=["order_status"])
                order.order_products.update(status=ProductStatus.AWAITING_SHIPMENT)
                orders_created.append(order)

            if not orders_created:
                return None

            payment = Payment.objects.create(
                payment_system="paypal",
                session_id=order_id,
                session_key=session_key,
                customer_id=str(user.id),
                payment_intent_id=order_id,
                payment_method="paypal",
                amount_total=amount,
                currency=currency,
                customer_email=meta.custom_data.get("email"),
            )
            for o in orders_created:
                o.payment = payment
                o.save(update_fields=["payment"])

            _set_conv_cache_after_commit(session_key, amount, currency, logger=logger, source="PayPalWebhook")

            # invoice
            invoice_number = meta.invoice_data.get("invoice_number")
            variable_symbol = (meta.description_data or {}).get("variable_symbol") or invoice_number
            try:
                invoice_data = prepare_invoice_data(order_id)
                pdf_file = generate_invoice_pdf(invoice_data)
                Invoice.objects.create(
                    payment=payment,
                    invoice_number=invoice_number,
                    variable_symbol=variable_symbol,
                    file=pdf_file,
                )
                invoice_created = True
            except Exception as e:
                logger.exception("[INVOICE] Failed: %s", e)
                invoice_created = False

        # вне транзакции
        if invoice_created:
            async_send_client_email(order_id)

        if origin_blocked:
            logger.warning("[PayPalWebhook] Parcels skipped due to origin violation")
        else:
            order_ids = [o.id for o in orders_created]
            async_parcels_and_seller_email(order_ids, order_id)

        return orders_created

    # --- вход вебхука ---
    def post(self, request):
        body = request.body.decode("utf-8")

        # валидация JSON
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON"}, status=400)

        event_type = data.get("event_type")
        if event_type not in {
            "PAYMENT.CAPTURE.COMPLETED",
            "CHECKOUT.ORDER.COMPLETED",
            "CHECKOUT.ORDER.APPROVED"
        }:
            logger.info("Ignored PayPal event: %s", event_type)
            return Response({"status": "ignored"}, status=200)

        # подпись
        if not self.verify_webhook(request, body):
            return Response({"error": "Invalid webhook signature"}, status=403)

        resource = data.get("resource", {})
        order_id = None
        session_key = None
        amount = None
        currency = None

        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            # Берём order_id из related_ids, подтягиваем сам order, чтобы достать reference_id (session_key)
            related = (resource.get("supplementary_data") or {}).get("related_ids") or {}
            order_id = related.get("order_id")
            if not order_id:
                logger.error("No order_id in capture.supplementary_data.related_ids")
                return Response({"error": "No order_id in capture"}, status=400)

            # тянем детали заказа, чтобы получить purchase_units[0].reference_id
            order = self._paypal_api_get(f"/v2/checkout/orders/{order_id}")
            pu = (order.get("purchase_units") or [{}])[0]
            session_key = pu.get("reference_id")
            if not session_key:
                logger.error("No reference_id (session_key) in order %s", order_id)
                return Response({"error": "No reference_id in order"}, status=400)

            amount = Decimal(resource["amount"]["value"]).quantize(Decimal("0.01"), ROUND_HALF_UP)
            currency = resource["amount"]["currency_code"]

        elif event_type == "CHECKOUT.ORDER.COMPLETED":
            # Заказ уже завершён — берём данные из самого order
            order_id = resource.get("id")
            pu = (resource.get("purchase_units") or [{}])[0]
            session_key = pu.get("reference_id")
            if not session_key:
                logger.error("No reference_id in order.completed")
                return Response({"error": "No reference_id"}, status=400)
            amt = pu.get("amount") or {}
            amount = Decimal(amt.get("value", "0")).quantize(Decimal("0.01"), ROUND_HALF_UP)
            currency = amt.get("currency_code", "EUR")

        elif event_type == "CHECKOUT.ORDER.APPROVED":
            # Ещё не оплачено — делаем capture и продолжаем
            order_id = resource.get("id")
            try:
                capture_res = self._paypal_api_capture(order_id)
                # В capture_res ищем первую capture с COMPLETED
                purchase_units = capture_res.get("purchase_units") or []
                if purchase_units:
                    pu = purchase_units[0]
                    session_key = pu.get("reference_id")
                    captures = (((pu.get("payments") or {}).get("captures")) or [])
                    cap = next((c for c in captures if c.get("status") == "COMPLETED"), None)
                    if not cap:
                        logger.error("No COMPLETED capture in capture response for order %s", order_id)
                        return Response({"error": "Capture not completed"}, status=400)
                    amount = Decimal(cap["amount"]["value"]).quantize(Decimal("0.01"), ROUND_HALF_UP)
                    currency = cap["amount"]["currency_code"]
                else:
                    logger.error("Unexpected capture response (no purchase_units)")
                    return Response({"error": "Bad capture response"}, status=400)
            except Exception as e:
                logger.exception("Failed to capture PayPal order %s: %s", order_id, e)
                return Response({"error": "Capture failed"}, status=500)

        # sanity
        if not all([order_id, session_key, amount, currency]):
            logger.error("Incomplete PayPal data: order_id=%s, session_key=%s, amount=%s, currency=%s",
                         order_id, session_key, amount, currency)
            return Response({"error": "Incomplete data"}, status=400)

        # создаём заказы и Payment (или выходим при идемпотентности)
        orders = self._create_orders(order_id=order_id, session_key=session_key,
                                     amount=amount, currency=currency)
        if orders is None:
            return Response({"error": "Order creation failed"}, status=500)
        return Response({"status": f"{len(orders)} order(s) created successfully"}, status=200)


@extend_schema(
    summary="Get conversion payload for thank-you page",
    description=(
        "Returns the minimal payload required to fire Google Ads/GA4 purchase events on the client side.\n\n"
        "**Contract**:\n"
        "- `transaction_id` — unique ID used for deduplication (we use the payment session id).\n"
        "- `value` — total order amount in EUR (number).\n"
        "- `currency` — always `EUR` in our setup.\n"
        "- If the webhook hasn’t finished yet, the endpoint returns `{ ready: false }` and the client may retry."
    ),
    parameters=[
        OpenApiParameter(
            name="session_id",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Payment session identifier (Stripe Checkout Session ID or our internal session_key).",
        )
    ],
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name="ConversionPayloadResponse",
                fields={
                    "ready": serializers.BooleanField(),
                    "transaction_id": serializers.CharField(required=False),
                    "value": serializers.FloatField(required=False),
                    "currency": serializers.CharField(required=False),
                },
            ),
            description="`ready:true` — payload ready; `ready:false` — webhook not finished yet."
        ),
        400: OpenApiResponse(
            description="Missing or invalid `session_id`",
            examples=[OpenApiExample("Missing session_id", value={"error": "session_id is required"})],
        ),
    },
    examples=[
        OpenApiExample(
            name="Ready example",
            value={"ready": True, "transaction_id": "cs_test_123", "value": 340.94, "currency": "EUR"},
            response_only=True,
        ),
        OpenApiExample(
            name="Not ready yet",
            value={"ready": False},
            response_only=True,
        ),
    ],
    tags=["Payments"],
)
class ConversionPayloadView(APIView):
    """
    Returns the minimum payload for events on the “Thank you for your payment” page.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        session_id = request.query_params.get("session_id")
        if not session_id:
            return Response({"error": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1) быстрый путь: читаем из кэша
        cached = conv_cache.get(f"conv:{session_id}")
        if cached:
            # убеждаемся, что структура как надо
            payload = {
                "ready": bool(cached.get("ready", True)),
                "transaction_id": str(cached.get("transaction_id", session_id)),
                "value": float(cached.get("value")),  # число — удобно фронту/GTM
                "currency": str(cached.get("currency", "EUR")),
            }
            return Response(payload, status=200)

        # 2) фолбэк: собираем «на лету», если вебхук уже успел создать заказы
        orders = get_orders_by_payment_session_id(session_id)
        if not orders:
            # вебхук ещё не записал данные — фронт может повторить запрос через ~1–1.5 сек
            logger.info("Conversion payload not ready yet", extra={"session_id": session_id})
            return Response({"ready": False}, status=200)

        total = sum((o.group_subtotal for o in orders), Decimal("0.00"))
        value = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        payload = {
            "ready": True,
            "transaction_id": session_id,  # используем session_id как уникальный ID транзакции
            "value": float(value),          # возвращаем числом
            "currency": "EUR",
        }

        # кладём в кэш, чтобы следующие запросы были O(1)
        conv_cache.set(f"conv:{session_id}", payload, timeout=60 * 60 * 24)

        return Response(payload, status=200)
