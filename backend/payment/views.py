import json
import uuid
from typing import Optional, Union

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
from delivery.services.gls_rates import calculate_order_shipping_gls
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point
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
logger = logging.getLogger(__name__)


def _D(x):
    return x if isinstance(x, Decimal) else Decimal(str(x))


def increment_promo_usage(promo_code):
    promo = PromoCode.objects.get(code=promo_code)
    promo.increment_used_count()


def apply_promo_code(promo_code, basket_items):
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


def generate_next_invoice_number():
    last = Invoice.objects.order_by('-id').first()
    next_id = (last.id + 1) if last else 1
    return f"{next_id:06d}"


def get_warehouse_for_sku(sku):
    wh_item = WarehouseItem.objects.filter(product_variant__sku=sku, quantity_in_stock__gt=0).first()
    return wh_item.warehouse if wh_item else None


def _get_courier_code(val: Optional[Union[int, str]]) -> str:
    if val is None:
        return ""
    # строковый код: "gls" / "zasilkovna" / "packeta"
    if isinstance(val, str):
        return val.lower().strip()
    # числовой ID → читаем код из БД
    try:
        cs = CourierService.objects.only("code").get(id=val)
        return (cs.code or "").lower()
    except CourierService.DoesNotExist:
        return ""


class PaymentSessionValidator:
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
                    status=status.HTTP_400_BAD_REQUEST
                )
        return None


def _check_cz_origin_for_groups(variant_map: dict, groups: list) -> Optional[Response]:
    """
    Лёгкая проверка происхождения: все товары из групп должны иметь продавца,
    у которого seller.default_warehouse.country == 'CZ'.
    Возвращает Response(400) с ключом 'origin' — как во вьюхе расчёта — либо None.
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
        # Сообщаем явно про неизвестные SKU — это ранняя, но полезная диагностика
        return Response({"error": f"Unknown SKU(s): {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

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


def _set_conv_cache_after_commit(session_id: str, amount: Decimal, currency: str = "EUR", logger=None):
    conv_cache = caches["conv"]
    payload = {
        "ready": True,
        "transaction_id": str(session_id),
        "value": float(amount),
        "currency": (currency or "EUR").upper(),
    }

    if logger:
        logger.info(
            "[StripeWebhook] Conversion cache planned after-commit for %s: %s %s",
            session_id, amount, currency
        )

    def _write():
        conv_cache.set(f"conv:{session_id}", payload, timeout=CONV_CACHE_TTL)
        if logger:
            logger.info(
                "[StripeWebhook] Conversion cache WRITE done for %s",
                session_id
            )

    transaction.on_commit(_write)


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Create Stripe Payment Session with Delivery and Seller-Based Grouping (Packeta/GLS)",
    description=(
        "Creates a Stripe Checkout Session by validating customer contact data and a list of product groups grouped by seller.\n\n"
        "**Business logic:**\n"
        "- Validates that each product belongs to the specified seller.\n"
        "- Validates the required delivery address provided at the root level.\n"
        "- Determines courier per group via `courier_service` (ID of `CourierService`): "
        "uses **GLS** calculator for `GLS`, otherwise uses **Zásilkovna (Packeta)** calculator.\n"
        "- Calculates delivery cost per group based on delivery type (`1=PUDO`, `2=HD`) and destination country.\n"
        "- Performs parcel splitting; for GLS uses `address_bundle` ('one' for single-parcel, 'multi' for multi-parcel).\n"
        "- Computes subtotal per group, adds delivery, and aggregates totals.\n"
        "- Persists session metadata (customer info, groups, pricing, delivery details) "
        "for later restoration by the Stripe webhook.\n\n"
        "**Webhook usage:**\n"
        "The `session_key` is used to restore saved metadata when the Stripe webhook confirms successful payment.\n\n"
        "**Note:**\n"
        "- The root-level `delivery_address` is required and must include `street`, `city`, `zip`, and `country` (ISO 3166-1 alpha-2).\n"
        "- Each group may provide either a `delivery_address` (for `delivery_type=2`) or a `pickup_point_id` (for `delivery_type=1`).\n"
        "- Field `courier_service` is an **integer ID** of the courier service (e.g., GLS or Packeta) and determines which pricing logic is applied."
        "\n\n**Redirect behavior:**\n"
        "- After successful payment, Stripe will redirect to "
        "`<REDIRECT_DOMAIN>/payment_end/?session_id={CHECKOUT_SESSION_ID}`.\n"
        "- The `session_id` query parameter can be used to call "
        "`/api/conversion-payload/?session_id=...` and trigger Ads/GA4 events."
    ),
    request=SessionInputSerializer,
    responses={
        200: OpenApiResponse(
            response=StripeSessionOutputSerializer,
            description="Stripe session created successfully",
            examples=[
                OpenApiExample(
                    name="StripeSessionResponse",
                    value={
                        "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_b1de42...",
                        "session_id": "cs_test_b1de42so99...",
                        "session_key": "2ca170e1-d053-4c78-b35b-e929ec41dcdd"
                    },
                    response_only=True
                )
            ]
        ),
        400: OpenApiResponse(
            description="Validation error (including CZ-origin check)",
            examples=[
                OpenApiExample(
                    "Origin not CZ",
                    value={"origin": ["Только отправка из Чехии. Продавец(ы) SKU 240819709 ..."]},
                ),
                OpenApiExample(
                    "Bad ZIP",
                    value={"error": "Group 1: ZIP code '010011' is invalid for country RO."},
                ),
            ],
        ),
        500: OpenApiResponse(description="Internal server error"),
    },
    examples=[
        OpenApiExample(
            name="CreateStripePaymentRequest (GLS + Packeta)",
            request_only=True,
            value={
                "email": "user666@example.com",
                "first_name": "Pavel",
                "last_name": "Ivanov",
                "phone": "+421123456789",
                "delivery_address": {
                    "street": "Benkova 373 / 7",
                    "city": "Nitra",
                    "zip": "94911",
                    "country": "SK"
                },
                "groups": [
                    {
                        "seller_id": 2,
                        "delivery_type": 2,
                        "courier_service": 3,
                        "delivery_address": {
                            "street": "Benkova 373 / 7",
                            "city": "Nitra",
                            "zip": "94911",
                            "country": "SK"
                        },
                        "products": [
                            {"sku": "258568745", "quantity": 15}
                        ]
                    },
                    {
                        "seller_id": 1,
                        "delivery_type": 1,
                        "courier_service": 2,
                        "pickup_point_id": "292",
                        "products": [
                            {"sku": "272464947", "quantity": 17}
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

        required_fields = ['email', 'first_name', 'last_name', 'phone', 'delivery_address', 'groups']
        for field in required_fields:
            if field not in data:
                return Response({"error": f"Missing required field: {field}"}, status=400)

        email = data['email']
        first_name = data['first_name']
        last_name = data['last_name']
        phone = data['phone']
        groups = data['groups']
        delivery_address = data['delivery_address']
        root_country = (delivery_address.get('country') or '').upper()

        if delivery_address:
            required_subfields = ['street', 'city', 'zip', 'country']
            for field in required_subfields:
                if field not in delivery_address:
                    return Response({"error": f"Missing '{field}' in delivery_address"}, status=400)

        validation_response = PaymentSessionValidator.validate_groups(groups, root_country=root_country)
        if validation_response:
            return validation_response

        logger.info(f"Validated {len(groups)} groups for user {user.id}. Starting calculation.")

        # Загружаем варианты товара + продавца + default_warehouse (для CZ-проверки)
        all_skus = {product['sku'] for group in groups for product in group['products']}
        variants_qs = (
            ProductVariant.objects
            .filter(sku__in=all_skus)
            .select_related('product__seller__default_warehouse')
            .only(
                'sku',
                'price',
                'product__seller_id',
                'product__seller__default_warehouse__country',
            )
        )
        variant_map = {v.sku: v for v in variants_qs}

        # Lite-проверка «только CZ»
        cz_resp = _check_cz_origin_for_groups(variant_map, groups)
        if cz_resp is not None:
            logger.warning("CZ origin check failed during Stripe session creation")
            return cz_resp

        line_items = []
        total_delivery = Decimal('0.00')

        for idx, group in enumerate(groups, start=1):
            delivery_type = group['delivery_type']       # 1=PUDO, 2=HD
            products = group['products']
            seller_id = group['seller_id']
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
                    status=400
                )

            # валидация принадлежности товаров продавцу
            for product in products:
                sku = product['sku']
                variant = variant_map.get(sku)
                if not variant:
                    return Response({"error": f"Group {idx}: ProductVariant not found: {sku}"}, status=400)
                if variant.product.seller.id != seller_id:
                    return Response({
                        "error": f"Group {idx}: Product {sku} does not belong to seller {seller_id}."
                    }, status=400)

            # доп. проверки для HD
            if delivery_type == 2:
                _addr = group.get("delivery_address", {})
                zip_code = _addr.get("zip")
                if not zip_code:
                    return Response({"error": f"Group {idx}: ZIP code is missing."}, status=400)
                if not ZipCodeValidator.validate_zip_exists(zip_code, country_code):
                    return Response({"error": f"Group {idx}: ZIP code '{zip_code}' is invalid for country {country_code}."}, status=400)
                phone_error = validate_phone_matches_country(phone, country_code)
                if phone_error:
                    return Response({"error": f"Group {idx}: {phone_error}"}, status=400)

            # выбор курьера: gls → свой калькулятор, иначе packeta-агрегатор
            items_for_calc = [{"sku": p['sku'], "quantity": p['quantity']} for p in products]
            cod = Decimal("0.00")
            if courier_code == "gls":
                shipping_result = calculate_order_shipping_gls(
                    country=country_code,
                    items=items_for_calc,
                    cod=cod,
                    currency='EUR'
                )
                logger.info(f"[GLS] Shipping result for group {idx}: {shipping_result}")
            else:
                shipping_result = calculate_order_shipping(
                    country=country_code,
                    items=items_for_calc,
                    cod=cod,
                    currency='EUR'
                )
                logger.info(f"[Packeta] Shipping result for group {idx}: {shipping_result}")

            channel = CHANNEL_MAP.get(delivery_type)
            if channel is None:
                return Response({"error": f"Group {idx}: Unknown delivery_type {delivery_type}."}, status=400)

            selected_option = next((opt for opt in shipping_result["options"] if opt["channel"] == channel), None)

            if not selected_option:
                return Response({"error": f"Group {idx}: No valid delivery option found for channel {channel}."}, status=400)

            num_parcels = shipping_result.get("total_parcels", 1)
            delivery_cost = _D(selected_option["priceWithVat"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            total_delivery += delivery_cost
            group["calculated_delivery_cost"] = str(delivery_cost)
            group["calculated_total_parcels"] = num_parcels

            # позиции по товарам
            group_total = Decimal('0.00')
            for product in products:
                variant = variant_map[product['sku']]
                unit_price = variant.price_with_acquiring.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                quantity = int(product['quantity'])
                group_total += unit_price * quantity

                line_items.append({
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {'name': product['sku']},
                        'unit_amount': int(
                            (unit_price * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
                        ),
                    },
                    'quantity': quantity,
                })

            group_total += delivery_cost
            group["calculated_group_total"] = str(
                group_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )

        # единая позиция "Delivery"
        if total_delivery > 0:
            line_items.append({
                'price_data': {
                    'currency': 'eur',
                    'product_data': {'name': f'Delivery ({total_delivery} EUR)'},
                    'unit_amount': int(
                        (total_delivery * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
                    ),
                },
                'quantity': 1,
            })

        gross_total = sum(Decimal(g["calculated_group_total"]) for g in groups).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        logger.info(f"Gross total for all groups: {gross_total} EUR (including total delivery: {total_delivery} EUR)")

        session_key = str(uuid.uuid4())
        invoice_number, variable_symbol = next_invoice_identifiers()

        # сохраняем метаданные
        StripeMetadata.objects.create(
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
                'delivery_total': str(total_delivery),
                'variable_symbol': variable_symbol,
            },
        )

        logger.info(f"Stripe metadata saved with session_key: {session_key}")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=settings.REDIRECT_DOMAIN + 'payment_end/?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=settings.REDIRECT_DOMAIN + 'basket/',
                metadata={
                    'session_key': session_key,
                    'invoice_number': invoice_number,
                }
            )

            logger.info(
                f"Stripe Checkout session created: {checkout_session.id} for user {user.id}, session_key: {session_key}"
            )

            return Response({
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id,
                "session_key": session_key
            }, status=200)

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
        payload = request.body.decode('utf-8')
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        # 1) Verify signature
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Stripe webhook verification failed: {e}")
            return Response(status=400)

        # 2) Accept both successful session events
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

        # 3) Idempotency: do nothing if already processed
        existing = Payment.objects.filter(session_id=session_id).only("amount_total", "currency").first()
        if existing:
            # на случай повтора хука — гарантируем, что кэш заполнен
            _set_conv_cache_after_commit(session_id, existing.amount_total, existing.currency, logger=logger)
            logger.info(
                "[StripeWebhook] Conversion cache refreshed for existing payment %s",
                session_id
            )
            return Response(status=200)

        # 4) Load metadata
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

        # 4.1) Lite-проверка CZ по данным из меты (defensive)
        all_skus = []
        for g in groups:
            for p in g.get("products", []):
                all_skus.append(str(p.get("sku")))
        variants = (
            ProductVariant.objects
            .filter(sku__in=all_skus)
            .select_related("product__seller__default_warehouse")
            .only(
                "sku",
                "price",
                "product__seller_id",
                "product__seller__default_warehouse__country",
            )
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

        if missing:
            logger.warning("[StripeWebhook] Unknown SKU(s) in metadata: %s", ", ".join(missing))
            # не блокируем — продолжаем, как и прежде (позиции без варианта будут пропущены ниже)

        origin_blocked = bool(not_cz)
        if origin_blocked:
            logger.warning(
                "[StripeWebhook] CZ-origin rule violated, SKUs: %s. "
                "Orders/payments will be created, but parcel generation will be skipped.",
                ", ".join(not_cz),
            )

        # 5) Resolve statuses (fail fast if misconfigured)
        try:
            pending_status = OrderStatus.objects.get(name="Pending")
            processing_status = OrderStatus.objects.get(name="Processing")
        except OrderStatus.DoesNotExist as e:
            logger.exception(f"[StripeWebhook] Missing OrderStatus: {e}")
            return Response({"error": "Order status misconfigured"}, status=500)

        # 6) Session totals (Decimal + quantize) + sanity-check с нашей расчётной суммой
        amount = (Decimal(session['amount_total']) / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        currency = session['currency'].upper()

        try:
            expected = Decimal((meta.description_data or {}).get("gross_total", "0") or "0").quantize(Decimal("0.01"))
        except Exception:
            expected = Decimal("0.00")
        if expected and (amount - expected).copy_abs() > Decimal("0.01"):
            logger.warning(
                "[StripeWebhook] amount_total mismatch: stripe=%s, expected=%s (session=%s)",
                amount, expected, session_id
            )

        # Корневой адрес (для PUDO берём отсюда страну)
        root_addr = meta.custom_data.get("delivery_address") or {}
        root_country = (root_addr.get("country") or "").upper()

        invoice_created = False

        # 7) Create orders + payment + invoice atomically
        with transaction.atomic():
            orders_created = []

            for idx, group in enumerate(groups, start=1):
                logger.info(f"Processing group #{idx}")

                delivery_type_id = group.get("delivery_type")
                courier_service_id = group.get("courier_service")
                pickup_point_id = group.get("pickup_point_id")
                products = group.get("products", [])

                # Суммы по группе, сохранённые на этапе Checkout
                delivery_cost = Decimal(group.get("calculated_delivery_cost", "0.00")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                group_total = Decimal(group.get("calculated_group_total", "0.00")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

                dt = DeliveryType.objects.filter(id=delivery_type_id).first()
                if not dt:
                    logger.error(f"Group {idx}: DeliveryType with id {delivery_type_id} not found.")
                    return Response({"error": f"DeliveryType {delivery_type_id} not found"}, status=400)

                cs = CourierService.objects.filter(id=courier_service_id).first()
                if not cs:
                    logger.warning(f"Group {idx}: CourierService id={courier_service_id} not found; saving order with NULL courier")

                # Адрес: HD — из группы, PUDO — пустой носитель с country=root_country
                if delivery_type_id == 2:
                    gaddr = group.get("delivery_address", {}) or {}
                    delivery_address_obj = DeliveryAddress.objects.create(
                        user=user,
                        full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                        phone=meta.custom_data.get("phone"),
                        email=meta.custom_data.get("email"),
                        street=gaddr.get("street", ""),
                        city=gaddr.get("city", ""),
                        zip_code=gaddr.get("zip", ""),
                        country=gaddr.get("country", ""),
                    )
                else:
                    # PUDO — сохраняем страну
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

                order = Order.objects.create(
                    user=user,
                    first_name=meta.custom_data.get("first_name", ""),
                    last_name=meta.custom_data.get("last_name", ""),
                    customer_email=meta.custom_data.get("email"),
                    delivery_type=dt,
                    delivery_address=delivery_address_obj,
                    pickup_point_id=pickup_point_id,  # строковый ID допускается текущей логикой
                    delivery_cost=delivery_cost,
                    courier_service=cs,
                    phone_number=meta.custom_data.get("phone"),
                    total_amount=amount,        # сумма по сессии
                    group_subtotal=group_total, # «итого по группе» (товары+доставка)
                    order_status=pending_status,
                )

                # Позиции заказа (используем vmap и seller_profile_id)
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
                        seller_profile_id=variant.product.seller_id,  # микроопт
                        product_price=variant.price_with_acquiring,
                        warehouse=warehouse,
                        status=ProductStatus.AWAITING_SHIPMENT,
                    )

                # Статус «Processing»
                order.order_status = processing_status
                order.save(update_fields=["order_status"])
                order.order_products.update(status=ProductStatus.AWAITING_SHIPMENT)

                # (опционально) пометить заказ, если нарушено CZ-правило
                if origin_blocked:
                    logger.info("Order %s marked as 'origin_blocked' (no parcel generation will be started).", order.id)

                orders_created.append(order)
                logger.info(f"[StripeWebhook] Group {idx}: Order {order.id} created successfully with {len(products)} products.")

            if not orders_created:
                logger.error("[StripeWebhook] No orders were created; aborting")
                return Response({"error": "Order creation failed"}, status=500)

            # Единый Payment на сессию
            payment = Payment.objects.create(
                payment_system="stripe",
                session_id=session_id,
                session_key=session_key,
                customer_id=session.get('customer'),
                payment_intent_id=session.get('payment_intent'),
                payment_method="stripe",
                amount_total=amount,
                currency=currency,
                customer_email=meta.custom_data.get("email"),
            )
            for order in orders_created:
                order.payment = payment
                order.save(update_fields=["payment"])

            _set_conv_cache_after_commit(session_id, amount, currency, logger=logger)
            logger.info(
                "[StripeWebhook] Conversion cache planned after-commit for %s: %s %s",
                session_id, amount, currency
            )

            # Инвойс
            try:
                invoice_number = meta.invoice_data.get("invoice_number")
                if not invoice_number:
                    raise ValueError("Missing invoice_number in metadata")

                # variable_symbol с обратной совместимостью
                variable_symbol = (
                    (meta.description_data or {}).get("variable_symbol")
                    or invoice_number
                )

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
                "[StripeWebhook] Parcel generation skipped for session %s due to non-CZ origin (SKUs: %s). "
                "Notify manager/seller manually if needed.",
                session_id, ", ".join(not_cz)
            )
        else:
            order_ids = [o.id for o in orders_created]
            async_parcels_and_seller_email(order_ids, session_id)
            logger.info(f"[StripeWebhook] Planned async parcels+seller_email+manager for orders {order_ids}")

        return Response({"status": f"{len(orders_created)} order(s) created successfully"}, status=200)


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Create PayPal Payment Session with Delivery and Seller-Based Grouping (Packeta/GLS)",
    description=(
        "Creates a PayPal payment session by validating customer contact data and a list of product groups grouped by seller.\n\n"
        "**Business logic:**\n"
        "- Validates that each product belongs to the specified seller.\n"
        "- Validates the required delivery address provided at the root level.\n"
        "- Determines courier per group via `courier_service` (ID of `CourierService`): "
        "uses **GLS** calculator for `GLS`, otherwise uses **Zásilkovna (Packeta)** calculator.\n"
        "- Calculates delivery cost per group based on delivery type (`1=PUDO`, `2=HD`) and destination country.\n"
        "- Performs parcel splitting (GLS handled in calculator).\n"
        "- Computes subtotal per group, adds delivery, and aggregates totals.\n"
        "- Persists session metadata (customer info, groups, pricing, delivery details) for the webhook.\n"
    ),
    request=SessionInputSerializer,
    responses={
        200: OpenApiResponse(
            response=PayPalSessionOutputSerializer,
            description="PayPal session created successfully",
            examples=[
                OpenApiExample(
                    name="PayPalSessionResponse",
                    value={
                        "approval_url": "https://www.sandbox.paypal.com/checkoutnow?token=3FJ45213AK318393U",
                        "order_id": "3FJ45213AK318393U",
                        "session_key": "7b73006d-e4a4-4b94-9c13-8f76c81e56a9"
                    },
                    response_only=True
                )
            ]
        )
    },
    tags=["PayPal"]
)
class CreatePayPalPaymentView(PayPalMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        logger.info("PayPal session creation request received", extra={"data": data})

        required_fields = ['email', 'first_name', 'last_name', 'phone', 'delivery_address', 'groups']
        for field in required_fields:
            if field not in data:
                return Response({"error": f"Missing required field: {field}"}, status=400)

        email = data['email']
        first_name = data['first_name']
        last_name = data['last_name']
        phone = data['phone']
        groups = data['groups']
        delivery_address = data['delivery_address']
        root_country = (delivery_address.get('country') or '').upper()

        # корневой адрес обязателен и должен содержать все поля
        for f in ['street', 'city', 'zip', 'country']:
            if f not in delivery_address:
                return Response({"error": f"Missing '{f}' in delivery_address"}, status=400)

        # базовые проверки групп (как в Stripe)
        validation_response = PaymentSessionValidator.validate_groups(groups, root_country=root_country)
        if validation_response:
            return validation_response

        # карта вариаций по SKU
        all_skus = {p['sku'] for g in groups for p in g['products']}
        variants_qs = ProductVariant.objects.filter(sku__in=all_skus).select_related('product__seller')
        variant_map = {v.sku: v for v in variants_qs}

        total_delivery = Decimal('0.00')
        line_items = []

        for idx, group in enumerate(groups, start=1):
            delivery_type = group['delivery_type']  # 1=PUDO, 2=HD
            products = group['products']
            seller_id = group['seller_id']

            # принадлежность товаров продавцу
            for product in products:
                sku = product['sku']
                variant = variant_map.get(sku)
                if not variant:
                    return Response({"error": f"Group {idx}: ProductVariant not found: {sku}"}, status=400)
                if variant.product.seller.id != seller_id:
                    return Response({"error": f"Group {idx}: Product {sku} does not belong to seller {seller_id}."}, status=400)

            # страна назначения (учитываем courier_code и root_country — как в Stripe)
            courier_code = _get_courier_code(group.get("courier_service"))
            country_code = resolve_country_code_from_group(
                group, idx, logger=logger, root_country=root_country, courier_code=courier_code
            )
            if not country_code:
                return Response({"error": f"Group {idx}: Invalid delivery address or pickup point."}, status=400)

            # доп. проверки для HD
            if delivery_type == 2:
                _addr = group.get("delivery_address", {})
                zip_code = _addr.get("zip")
                if not zip_code:
                    return Response({"error": f"Group {idx}: ZIP code is missing."}, status=400)
                if not ZipCodeValidator.validate_zip_exists(zip_code, country_code):
                    return Response({"error": f"Group {idx}: ZIP code '{zip_code}' is invalid for country {country_code}."}, status=400)
                phone_error = validate_phone_matches_country(phone, country_code)
                if phone_error:
                    return Response({"error": f"Group {idx}: {phone_error}"}, status=400)

            # расчёт доставки (GLS vs Packeta), как в Stripe
            items_for_calc = [{"sku": p['sku'], "quantity": p['quantity']} for p in products]
            cod = Decimal("0.00")
            if courier_code == "gls":
                shipping_result = calculate_order_shipping_gls(
                    country=country_code, items=items_for_calc, cod=cod, currency='EUR'
                )
                logger.info(f"[GLS] Shipping result for group {idx}: {shipping_result}")
            else:
                shipping_result = calculate_order_shipping(
                    country=country_code, items=items_for_calc, cod=cod, currency='EUR'
                )
                logger.info(f"[Packeta] Shipping result for group {idx}: {shipping_result}")

            channel = CHANNEL_MAP.get(delivery_type)
            if channel is None:
                return Response({"error": f"Group {idx}: Unknown delivery_type {delivery_type}."}, status=400)

            selected_option = next((opt for opt in shipping_result["options"] if opt["channel"] == channel), None)
            if not selected_option:
                return Response({"error": f"Group {idx}: No valid delivery option found for channel {channel}."}, status=400)

            num_parcels = shipping_result.get("total_parcels", 1)
            delivery_cost = _D(selected_option["priceWithVat"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_delivery += delivery_cost
            group["calculated_delivery_cost"] = str(delivery_cost)
            group["calculated_total_parcels"] = num_parcels

            # позиции по товарам
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

        # суммарно по товарам
        total_item_price = sum(Decimal(i['unit_amount']['value']) * int(i['quantity']) for i in line_items)
        gross_total = (total_item_price + total_delivery).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # отдельная линия «Delivery» (как Stripe)
        if total_delivery > 0:
            line_items.append({
                'name': 'Delivery',
                'sku': 'delivery',
                'unit_amount': {'currency_code': 'EUR', 'value': str(total_delivery.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))},
                'quantity': '1',
            })

        session_key = str(uuid.uuid4())
        invoice_number, variable_symbol = next_invoice_identifiers()

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

        logger.info(f"PayPal metadata saved with session_key: {session_key}")

        try:
            approval_url, order_id = self.create_paypal_order(
                line_items=line_items,
                total_price=gross_total,
                session_key=session_key,
                invoice_number=invoice_number,
            )
            logger.info(f"PayPal order created successfully: order_id={order_id}, session_key={session_key}")
            return Response({
                'approval_url': approval_url,
                'order_id': order_id,
                'session_key': session_key
            }, status=200)

        except Exception as e:
            logger.exception("PayPal session creation failed")
            return Response({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Handle PayPal Webhook for Approved Checkout Order",
    description=(
        "Processes PayPal 'CHECKOUT.ORDER.APPROVED' events. Restores saved metadata, creates orders/payments/invoice, "
        "triggers emails and parcel generation."
    ),
    responses={
        200: OpenApiResponse(description="Orders and payments created successfully"),
        403: OpenApiResponse(description="Invalid webhook signature"),
        400: OpenApiResponse(description="Invalid payload or event type"),
        500: OpenApiResponse(description="Order creation failed"),
    },
    tags=['PayPal']
)
class PayPalWebhookView(PayPalMixin, APIView):
    permission_classes = [AllowAny]

    def create_orders_from_webhook(self, data):
        resource = data.get("resource", {})
        pu = (resource.get("purchase_units") or [{}])[0]
        amount = Decimal(pu["amount"]["value"]).quantize(Decimal("0.01"), ROUND_HALF_UP)
        currency = pu["amount"]["currency_code"]
        session_id = resource.get("id")  # PayPal order id
        session_key = pu.get("reference_id")

        if not session_key:
            logger.error("Missing reference_id in webhook payload")
            return None

        # идемпотентность: если платёж уже есть для этого PayPal order id — выходим
        if Payment.objects.filter(session_id=session_id, payment_system="paypal").exists():
            logger.info(f"[PayPalWebhook] Payment for session {session_id} already exists — skipping")
            return []

        try:
            meta = PayPalMetadata.objects.get(session_key=session_key)
        except PayPalMetadata.DoesNotExist:
            logger.error(f"PayPalMetadata not found for {session_key}")
            return None

        user_id = meta.custom_data.get("user_id")
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            logger.error(f"CustomUser not found: {user_id}")
            return None

        groups = meta.invoice_data.get("groups", [])
        if not groups:
            logger.error("No groups found in metadata")
            return None

        # Статусы
        try:
            pending_status = OrderStatus.objects.get(name="Pending")
            processing_status = OrderStatus.objects.get(name="Processing")
        except OrderStatus.DoesNotExist as e:
            logger.exception(f"[PayPalWebhook] Missing OrderStatus: {e}")
            return None

        # корневой адрес — для PUDO (как в Stripe)
        root_addr = meta.custom_data.get("delivery_address") or {}
        root_country = (root_addr.get("country") or "").upper()

        orders_created = []
        with transaction.atomic():
            for idx, group in enumerate(groups, start=1):
                logger.info(f"Processing group #{idx}")

                delivery_type_id = group.get("delivery_type")
                courier_service_id = group.get("courier_service")
                pickup_point_id = group.get("pickup_point_id")
                products = group.get("products", [])

                # суммы, сохранённые на этапе Checkout
                delivery_cost = Decimal(group.get("calculated_delivery_cost", "0.00")).quantize(Decimal("0.01"), ROUND_HALF_UP)
                group_total = Decimal(group.get("calculated_group_total", "0.00")).quantize(Decimal("0.01"), ROUND_HALF_UP)

                dt = DeliveryType.objects.filter(id=delivery_type_id).first()
                if not dt:
                    logger.error(f"Group {idx}: DeliveryType with id {delivery_type_id} not found.")
                    return None

                cs = CourierService.objects.filter(id=courier_service_id).first()
                if not cs:
                    logger.warning(f"Group {idx}: CourierService id={courier_service_id} not found; saving order with NULL courier")

                # адрес (HD — из группы; PUDO — пустой, с country из корневого)
                delivery_address_obj = None
                if delivery_type_id == 2:
                    gaddr = group.get("delivery_address", {}) or {}
                    delivery_address_obj = DeliveryAddress.objects.create(
                        user=user,
                        full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}".strip(),
                        phone=meta.custom_data.get("phone"),
                        email=meta.custom_data.get("email"),
                        street=gaddr.get("street", ""),
                        city=gaddr.get("city", ""),
                        zip_code=gaddr.get("zip", ""),
                        country=gaddr.get("country", ""),
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
                    total_amount=amount,        # как и в Stripe — общая сумма сессии
                    group_subtotal=group_total, # итого по группе (товары + доставка)
                    order_status=pending_status,
                )

                for product in products:
                    sku = product.get("sku")
                    qty = int(product.get("quantity", 0))
                    try:
                        variant = ProductVariant.objects.get(sku=sku)
                    except ProductVariant.DoesNotExist:
                        logger.error(f"Group {idx}: ProductVariant not found: {sku}")
                        continue

                    wh_item = WarehouseItem.objects.filter(product_variant=variant, quantity_in_stock__gte=qty).first()
                    warehouse = wh_item.warehouse if wh_item else Warehouse.objects.first()

                    OrderProduct.objects.create(
                        order=order,
                        product=variant,
                        quantity=qty,
                        delivery_cost=Decimal("0.00"),
                        seller_profile=variant.product.seller,
                        product_price=variant.price_with_acquiring,
                        warehouse=warehouse,
                        status=ProductStatus.AWAITING_SHIPMENT,
                    )

                order.order_status = processing_status
                order.save(update_fields=["order_status"])
                order.order_products.update(status=ProductStatus.AWAITING_SHIPMENT)

                orders_created.append(order)
                logger.info(f"[PayPalWebhook] Group {idx}: Order {order.id} created successfully")

            if not orders_created:
                logger.error("[PayPalWebhook] No orders were created; aborting")
                return None

            # единый Payment
            payment = Payment.objects.create(
                payment_system="paypal",
                session_id=session_id,
                session_key=session_key,
                customer_id=user.id,
                payment_intent_id=session_id,
                payment_method="paypal",
                amount_total=amount,
                currency=currency,
                customer_email=meta.custom_data.get("email"),
            )
            for order in orders_created:
                order.payment = payment
                order.save(update_fields=["payment"])

            # Инвойс
            try:
                invoice_number = meta.invoice_data.get("invoice_number")
                if not invoice_number:
                    raise ValueError("Missing invoice_number in metadata")

                # variable_symbol с обратной совместимостью
                variable_symbol = (
                    (meta.description_data or {}).get("variable_symbol")
                    or invoice_number
                )

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
                invoice_created = False

        # вне транзакции: письма + ярлыки
        if invoice_created:
            async_send_client_email(session_id)
            logger.info(f"[PayPalWebhook] Planned async client email for session {session_id}")
        else:
            logger.warning(f"[PayPalWebhook] Skipped client email — invoice not ready for session {session_id}")

        order_ids = [o.id for o in orders_created]
        async_parcels_and_seller_email(order_ids, session_id)
        logger.info(f"[PayPalWebhook] Planned async parcels+seller+manager for orders {order_ids}")

        return orders_created

    @csrf_exempt
    def post(self, request):
        body = request.body.decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON"}, status=400)

        if data.get("event_type") != "CHECKOUT.ORDER.APPROVED":
            logger.info(f"Ignored event: {data.get('event_type')}")
            return Response({"status": "ignored"}, status=200)

        if not self.verify_webhook(request, body):
            return Response({"error": "Invalid webhook signature"}, status=403)

        orders = self.create_orders_from_webhook(data)
        if orders is None:
            return Response({"error": "Order creation failed"}, status=500)

        # если список пуст — это идемпотентный повтор
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
