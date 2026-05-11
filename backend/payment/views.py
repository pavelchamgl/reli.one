import copy
import json
import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Union

import requests
import stripe
from accounts.models import CustomUser
from delivery.helpers import resolve_country_code_from_group
from delivery.models import DeliveryAddress
from delivery.services.dpd_rates import calculate_order_shipping_dpd
from delivery.services.gls_rates import calculate_gls_shipping_options
from delivery.services.gls_split import split_items_into_parcels_gls
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point
from delivery.services.shipping_split import split_items_into_parcels, combine_parcel_options, calculate_order_shipping
from delivery.utils_async import async_parcels_and_seller_email
from delivery.validators.validators import validate_phone_matches_country
from delivery.validators.zip_utils import uppercase_zip
from delivery.validators.zip_validator import ZipCodeValidator
from django.conf import settings
from django.core.cache import caches
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample, OpenApiParameter, inline_serializer
from order.models import (
    CourierService,
    Order,
    DeliveryType,
    OrderProduct,
    OrderStatus,
    ProductStatus,
    Invoice,
    OrderEvent,
)
from order.services.invoice_data import prepare_invoice_data
from order.services.invoice_generator import generate_invoice_pdf
from order.services.invoice_numbers import next_invoice_identifiers
from product.models import BaseProduct, ProductVariant
from promocode.models import PromoCode
from rest_framework import status, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .mixins import PayPalMixin
from .models import Payment, StripeMetadata
from .serializers import SessionInputSerializer, StripeSessionOutputSerializer, PayPalSessionOutputSerializer
from .services import (
    create_stripe_checkout_session,
    create_paypal_checkout_session,
    get_orders_by_payment_session_id,
)
from .services.stripe_webhook import (
    stripe_checkout_session_to_webhook_payment_data,
    verify_and_resolve_stripe_checkout_event,
)
from .services.stripe_session import (
    StripeSessionBuildError,
    build_stripe_checkout_context,
)
from .services.paypal_session import (
    PayPalSessionBuildError,
    build_paypal_checkout_context,
)
from .services.paypal_webhook import (
    parse_paypal_webhook_body,
    paypal_payload_to_webhook_payment_data,
)
from .services.webhook_processing import create_orders_and_payment
from .services_async import async_send_client_email

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
    1: 'PUDO',  # пункт выдачи
    2: 'HD',  # доставка на дом
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



def create_order_event(*, order, event_type, meta=None):
    OrderEvent.objects.create(
        order=order,
        type=event_type,
        meta=meta or {},
    )


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
    summary="Create Stripe Payment Session (Packeta / GLS / DPD — HD + PUDO + GLS SHOP/BOX)",
    description=(
            "Creates a Stripe Checkout Session based on customer data, grouped products, and the selected delivery method.\n\n"

            "=== 1) Input Validation ===\n"
            "- Validates email, first_name, last_name, phone, delivery_address, and product groups.\n"
            "- Ensures each group contains valid products, seller_id, delivery type, and courier.\n\n"

            "=== 2) ZIP Code Validation ===\n"
            "- Local ZIP validation is applied for all ZIP codes.\n"
            "- DPD GeoRouting is used only for HD shipments and may return a normalized ZIP.\n"
            "- For all PUDO shipments (Packeta, GLS, DPD), ZIP is validated but never overwritten.\n"
            "- In DPD PUDO groups, both pickup_point_id and delivery_address are expected; only ZIP/country are validated.\n\n"

            "=== 3) Destination Country Resolution ===\n"
            "- HD groups use `delivery_address.country`.\n"
            "- All PUDO groups use country resolved from `pickup_point_id`.\n\n"

            "=== 4) Business Logic Rules per Group ===\n"
            "- All SKUs must belong to the specified seller_id.\n"
            "- All products must originate from sellers whose default warehouse is located in the Czech Republic (CZ-origin rule).\n"
            "- `delivery_address` is required for HD groups.\n"
            "- `pickup_point_id` is required for all PUDO groups (Packeta / GLS / DPD).\n"
            "- GLS PUDO requires `delivery_mode` = 'shop' or 'box'.\n"
            "- DPD groups require weight_grams, length_mm, width_mm, height_mm for each product variant.\n\n"

            "=== 5) Courier Pricing Logic ===\n"
            "*Packeta (Zásilkovna)*\n"
            "- Unified aggregator-based pricing.\n"
            "- Supports both PUDO and HD.\n\n"

            "*GLS*\n"
            "- Supports HD, SHOP (PUDO), and BOX (PUDO).\n"
            "- For GLS PUDO, `delivery_mode` determines SHOP or BOX.\n"
            "- Applies parcel splitting and address_bundle rules.\n\n"

            "*DPD*\n"
            "- Strict dimension and weight limits.\n"
            "- Requires full dimensions for each product variant.\n"
            "- For DPD PUDO, ZIP is validated but never mutated.\n\n"

            "=== 6) Delivery Option Selection ===\n"
            "- `delivery_type = 1` → PUDO.\n"
            "- `delivery_type = 2` → HD.\n"
            "- For GLS PUDO, the selected option corresponds to SHOP or BOX.\n\n"

            "=== 7) Stripe Checkout Construction ===\n"
            "- Each SKU becomes an individual Stripe line item.\n"
            "- Delivery price is added as one aggregated line.\n"
            "- All prices are in EUR.\n"
            "- COD is disabled for Stripe payments.\n\n"

            "=== 8) Metadata Persistence ===\n"
            "- Customer details.\n"
            "- Delivery address.\n"
            "- Per-group parcel counts.\n"
            "- Delivery totals and group totals.\n"
            "- Invoice number and variable symbol.\n"
            "- Everything is stored in StripeMetadata and restored by the webhook.\n\n"

            "=== 9) After Successful Payment ===\n"
            "- Stripe webhook restores metadata.\n"
            "- Creates 1 order per seller group.\n"
            "- Generates invoice PDFs.\n"
            "- Sends notification emails to customer, sellers, and managers.\n"
    ),
    request=SessionInputSerializer,
    responses={
        200: OpenApiResponse(
            response=StripeSessionOutputSerializer,
            description="Stripe Checkout Session successfully created",
            examples=[
                OpenApiExample(
                    name="Success",
                    summary="Successful Stripe session creation",
                    value={
                        "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_123...",
                        "session_id": "cs_test_123",
                        "session_key": "d7f1a2f8-3e3f-4a2c-9c8e-7f9a1b234567"
                    }
                )
            ]
        ),

        400: OpenApiResponse(
            description="Validation error",
            examples=[
                OpenApiExample(
                    name="Missing Field",
                    value={"error": "Missing required field: email"}
                ),
                OpenApiExample(
                    name="Invalid ZIP",
                    value={"error": "Group 1: Invalid ZIP '00999' for country RO."}
                ),
                OpenApiExample(
                    name="CZ Origin",
                    value={"origin": ["Только отправка из Чехии. Продавец(ы) SKU 123..."]}
                ),
                OpenApiExample(
                    name="No option for channel",
                    value={"error": "Group 1: No option for channel HD. Available: PUDO"}
                ),
                OpenApiExample(
                    name="Missing GLS delivery_mode",
                    value={"error": "Group 1: GLS PUDO requires delivery_mode ['shop'/'box']."}
                ),
                OpenApiExample(
                    name="DPD Missing Dimensions",
                    value={"error": "Missing weight/dimensions for SKU(s): 240819709"}
                ),
            ]
        ),

        500: OpenApiResponse(
            description="Internal error / Stripe failure",
            examples=[
                OpenApiExample(
                    name="Stripe Error",
                    value={"error": "Stripe session creation failed: <message>"}
                )
            ]
        ),
    },

    examples=[
        OpenApiExample(
            name="Request Example: GLS BOX",
            summary="GLS PUDO with BOX mode",
            request_only=True,
            value={
                "email": "user123@example.com",
                "first_name": "Pavel",
                "last_name": "Ivanov",
                "phone": "+40711122334",
                "delivery_address": {
                    "street": "Strada Exemplu 23",
                    "city": "București",
                    "zip": "030026",
                    "country": "RO"
                },
                "groups": [
                    {
                        "seller_id": 7,
                        "delivery_type": 1,  # PUDO
                        "delivery_mode": "box",  # REQUIRED for GLS PUDO
                        "courier_service": 3,  # GLS
                        "pickup_point_id": "RO032534-PLOCKER001",
                        "products": [
                            {"sku": "240819709", "quantity": 4}
                        ]
                    }
                ]
            }
        ),

        OpenApiExample(
            name="Request Example: Packeta + DPD",
            summary="Two groups with mixed couriers",
            request_only=True,
            value={
                "email": "client@example.com",
                "first_name": "Anna",
                "last_name": "Novak",
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
                        "delivery_type": 1,  # PUDO
                        "courier_service": 4,  # DPD
                        "pickup_point_id": "35862",
                        "delivery_address": {
                            "street": "Bílá 158",
                            "city": "Bílá",
                            "zip": "73915",
                            "country": "CZ"
                        },
                        "products": [{"sku": "240819709", "quantity": 2}]
                    },
                    {
                        "seller_id": 1,
                        "delivery_type": 2,  # HD
                        "courier_service": 2,  # Packeta
                        "delivery_address": {
                            "street": "Na Lysinách 551/34",
                            "city": "Praha",
                            "zip": "14700",
                            "country": "CZ"
                        },
                        "products": [{"sku": "272464947", "quantity": 1}]
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

        delivery_address = data.get("delivery_address") or {}
        root_country = (delivery_address.get("country") or "").upper()

        input_serializer = SessionInputSerializer(
            data=data,
            context={"root_country": root_country},
        )
        input_serializer.is_valid(raise_exception=True)
        validated = input_serializer.validated_data

        logger.info(
            "Validated %d groups for user %s. Starting calculation.",
            len(validated["groups"]),
            user.id,
        )

        try:
            ctx = build_stripe_checkout_context(
                user=user,
                email=validated["email"],
                first_name=validated["first_name"],
                last_name=validated["last_name"],
                phone=validated["phone"],
                delivery_address=copy.deepcopy(validated["delivery_address"]),
                groups=copy.deepcopy(validated["groups"]),
                root_country=root_country,
            )
        except StripeSessionBuildError as exc:
            return Response(exc.detail, status=exc.http_status)

        try:
            checkout_session = create_stripe_checkout_session(
                line_items=ctx.line_items,
                session_key=ctx.session_key,
                invoice_number=ctx.invoice_number,
            )

            logger.info(
                "Stripe Checkout session created: %s for user %s, session_key: %s",
                checkout_session.id,
                user.id,
                ctx.session_key,
            )
            return Response(
                {
                    "checkout_url": checkout_session.url,
                    "session_id": checkout_session.id,
                    "session_key": ctx.session_key,
                },
                status=200,
            )

        except Exception as e:
            logger.exception(
                "Stripe session creation failed for user=%s session_key=%s",
                user.id,
                ctx.session_key,
            )
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

        verify = verify_and_resolve_stripe_checkout_event(
            payload, sig_header, secret=endpoint_secret,
        )
        if verify.early_status is not None:
            if verify.early_no_body:
                return Response(status=verify.early_status)
            return Response(verify.early_body, status=verify.early_status)

        event = verify.event
        session = event["data"]["object"]
        session_id = session["id"]
        session_key = (session.get("metadata") or {}).get("session_key")

        if not session_key:
            logger.error("Missing session_key in Stripe webhook metadata.")
            return Response({"error": "Missing session_key"}, status=400)

        try:
            meta = StripeMetadata.objects.get(session_key=session_key)
        except StripeMetadata.DoesNotExist:
            logger.error("No StripeMetadata found for session_key: %s", session_key)
            return Response({"error": "Session metadata not found"}, status=400)

        data = stripe_checkout_session_to_webhook_payment_data(
            session=session,
            meta=meta,
            session_key=session_key,
        )

        result = create_orders_and_payment(data)

        if result is None:
            return Response({"error": "Order creation failed"}, status=500)

        if result.is_replay:
            logger.info("[StripeWebhook] Idempotent replay for session %s", session_id)
            return Response(status=200)

        return Response(
            {"status": f"{len(result.orders)} order(s) created successfully"},
            status=200,
        )


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
                        "delivery_type": 2,  # HD
                        "courier_service": 3,  # GLS
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
                        "delivery_type": 1,  # PUDO
                        "courier_service": 4,  # DPD
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

        logger.info("PayPal session creation request received", extra={"data": request.data})

        delivery_address = request.data.get("delivery_address") or {}
        root_country = (delivery_address.get("country") or "").upper()

        input_serializer = SessionInputSerializer(
            data=request.data,
            context={"root_country": root_country},
        )
        input_serializer.is_valid(raise_exception=True)
        validated = input_serializer.validated_data

        try:
            ctx = build_paypal_checkout_context(
                user=user,
                email=validated["email"],
                first_name=validated["first_name"],
                last_name=validated["last_name"],
                phone=validated["phone"],
                delivery_address=copy.deepcopy(validated["delivery_address"]),
                groups=copy.deepcopy(validated["groups"]),
                root_country=root_country,
            )
        except PayPalSessionBuildError as e:
            return Response(e.detail, status=e.http_status)

        try:
            approval_url, order_id = create_paypal_checkout_session(
                line_items=ctx.line_items,
                total_price=ctx.gross_total,
                session_key=ctx.session_key,
                invoice_number=ctx.invoice_number,
            )
            logger.info(
                "PayPal Checkout session created: %s for user %s, session_key: %s",
                order_id,
                user.id,
                ctx.session_key,
            )
        except Exception as e:
            logger.exception(
                "PayPal session creation failed for user=%s session_key=%s",
                user.id,
                ctx.session_key,
            )
            return Response({"error": str(e)}, status=500)

        return Response({
            "approval_url": approval_url,
            "order_id": order_id,
            "session_key": ctx.session_key,
            "session_id": ctx.session_key,
        })


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
        200: OpenApiResponse(
            description=(
                "Success: created orders (or idempotent replay with 0..N orders), "
                "or unhandled `event_type` acknowledged with `{\"status\": \"ignored\"}`."
            )
        ),
        403: OpenApiResponse(description="Invalid webhook signature"),
        400: OpenApiResponse(description="Invalid JSON or incomplete/invalid payment payload after verification"),
        500: OpenApiResponse(description="Order creation failed"),
    },
    tags=['PayPal']
)
class PayPalWebhookView(PayPalMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        body = request.body.decode("utf-8")

        parsed = parse_paypal_webhook_body(body)
        if parsed.early_status is not None:
            return Response(parsed.early_body, status=parsed.early_status)

        if not self.verify_webhook(request, body):
            return Response({"error": "Invalid webhook signature"}, status=403)

        built = paypal_payload_to_webhook_payment_data(parsed.payload)
        if built.early_status is not None:
            return Response(built.early_body, status=built.early_status)

        webhook_data = built.data

        # Делегируем бизнес-логику в сервис
        result = create_orders_and_payment(webhook_data)

        if result is None:
            return Response({"error": "Order creation failed"}, status=500)

        if result.is_replay:
            logger.info("[PayPalWebhook] Idempotent replay for order %s", webhook_data.session_id)

        return Response(
            {"status": f"{len(result.orders)} order(s) created successfully"},
            status=200,
        )


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
            "value": float(value),  # возвращаем числом
            "currency": "EUR",
        }

        # кладём в кэш, чтобы следующие запросы были O(1)
        conv_cache.set(f"conv:{session_id}", payload, timeout=60 * 60 * 24)

        return Response(payload, status=200)
