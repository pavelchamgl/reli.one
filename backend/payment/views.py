import json
import uuid
import stripe
import logging
import pycountry

from decimal import Decimal, ROUND_HALF_UP

from django.utils.decorators import method_decorator
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt

from .models import Payment, PayPalMetadata, StripeMetadata
from .mixins import PayPalMixin
from .services import send_order_emails_safely
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
)
from warehouses.models import Warehouse, WarehouseItem
from delivery.utils import resolve_country_from_local_pickup_point
from delivery.utils_async import async_generate_parcels_and_fetch_labels
from delivery.services.shipping_split import split_items_into_parcels, combine_parcel_options, calculate_order_shipping
from delivery.services.local_rates import calculate_shipping_options


logging.basicConfig(level=logging.INFO)

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


def get_warehouse_for_sku(sku):
    wh_item = WarehouseItem.objects.filter(product_variant__sku=sku, quantity_in_stock__gt=0).first()
    return wh_item.warehouse if wh_item else None


def validate_group_country(group, idx):
    delivery_type = group.get("delivery_type")
    if delivery_type == 2:
        delivery_address = group.get("delivery_address", {})
        country_code = delivery_address.get("country")
        if not country_code:
            return Response({"error": f"Group {idx}: Missing country in delivery_address."}, status=status.HTTP_400_BAD_REQUEST)
        return country_code
    elif delivery_type == 1:
        pickup_point_id = group.get("pickup_point_id")
        if not pickup_point_id:
            return Response({"error": f"Group {idx}: Missing pickup_point_id for PUDO delivery."}, status=status.HTTP_400_BAD_REQUEST)
        country_code = resolve_country_from_local_pickup_point(pickup_point_id)
        if not country_code:
            return Response({"error": f"Group {idx}: Cannot resolve country for pickup_point_id {pickup_point_id}."}, status=status.HTTP_400_BAD_REQUEST)
        return country_code
    else:
        return Response({"error": f"Group {idx}: Unknown delivery_type {delivery_type}."}, status=status.HTTP_400_BAD_REQUEST)


class PaymentSessionValidator:
    @staticmethod
    def validate_groups(groups):
        for idx, group in enumerate(groups, start=1):
            result = validate_group_country(group, idx)
            if isinstance(result, Response):
                return result
        return None


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Create Stripe Payment Session with Delivery and Seller-Based Grouping",
    description=(
        "Creates a Stripe Checkout Session by validating provided customer and product data.\n\n"
        "The request must include customer contact details and a list of product groups grouped by seller.\n\n"
        "**Business Logic:**\n"
        "- Validates product ownership by the specified seller.\n"
        "- Calculates delivery costs per group based on the provided delivery type and address.\n"
        "- Calculates total product and delivery costs.\n"
        "- Saves complete session metadata, including customer data, product groups, and calculated costs.\n"
        "- Returns the Stripe Checkout URL, session ID, and internal session key.\n\n"
        "**Webhook Handling:**\n"
        "The session key is used to restore all saved metadata when Stripe webhook confirms payment.\n\n"
        "**Expected Fields:**\n"
        "- email, first_name, last_name, phone, groups with product SKUs, seller IDs, delivery types, and delivery addresses or pickup points.\n\n"
        "**Response:**\n"
        "- checkout_url: URL to redirect the customer to Stripe Checkout\n"
        "- session_id: Stripe session identifier\n"
        "- session_key: Internal session key for order processing"
    ),
    responses={200: OpenApiResponse(description="Stripe session created successfully")},
    tags=["Stripe"]
)
class CreateStripePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        logger.info("Stripe session creation request received", extra={"data": data})

        required_fields = ['email', 'first_name', 'last_name', 'phone', 'groups']
        for field in required_fields:
            if field not in data:
                return Response({"error": f"Missing required field: {field}"}, status=400)

        email = data['email']
        first_name = data['first_name']
        last_name = data['last_name']
        phone = data['phone']
        groups = data['groups']

        validation_response = PaymentSessionValidator.validate_groups(groups)
        if validation_response:
            return validation_response

        logger.info(f"Validated {len(groups)} groups for user {user.id}. Starting calculation.")

        # Кэшируем ProductVariant для всех групп
        all_skus = {product['sku'] for group in groups for product in group['products']}
        variants_qs = ProductVariant.objects.filter(sku__in=all_skus).select_related('product__seller')
        variant_map = {v.sku: v for v in variants_qs}

        line_items = []
        total_delivery = Decimal('0.00')

        for idx, group in enumerate(groups, start=1):
            delivery_type = group['delivery_type']
            products = group['products']
            seller_id = group['seller_id']

            # Проверка принадлежности продавцу
            for product in products:
                sku = product['sku']
                variant = variant_map.get(sku)
                if not variant:
                    return Response({"error": f"Group {idx}: ProductVariant not found: {sku}"}, status=400)
                if variant.product.seller.id != seller_id:
                    return Response({
                        "error": f"Group {idx}: Product {sku} does not belong to seller {seller_id}."
                    }, status=400)

            country_code = self._resolve_country_code(group, idx)
            if not country_code:
                return Response({"error": f"Group {idx}: Invalid delivery address or pickup point."}, status=400)

            # Полный расчет доставки с учетом разбивки на посылки
            shipping_result = calculate_order_shipping(
                country=country_code,
                items=[{"sku": p['sku'], "quantity": p['quantity']} for p in products],
                cod=Decimal("0.00"),
                currency='EUR'
            )

            logger.info(f"Shipping result for group {idx}: {shipping_result}")

            channel = {1: "PUDO", 2: "HD"}.get(delivery_type)
            selected_option = next((opt for opt in shipping_result["options"] if opt["channel"] == channel), None)

            if not selected_option:
                return Response({"error": f"Group {idx}: No valid delivery option found for channel {channel}."}, status=400)

            # Учитываем количество посылок и стоимость доставки
            num_parcels = shipping_result.get("total_parcels", 1)
            delivery_cost = Decimal(str(selected_option["priceWithVat"])).quantize(Decimal("0.01"))
            total_delivery += delivery_cost
            group["calculated_delivery_cost"] = str(delivery_cost)
            group["calculated_total_parcels"] = num_parcels

            # Сумма товаров
            group_total = Decimal('0.00')
            for product in products:
                variant = variant_map[product['sku']]
                unit_price = Decimal(variant.price).quantize(Decimal("0.01"))
                quantity = int(product['quantity'])
                group_total += unit_price * quantity

                line_items.append({
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {'name': product['sku']},
                        'unit_amount': int(unit_price * 100),
                    },
                    'quantity': quantity,
                })

            group_total += delivery_cost
            group["calculated_group_total"] = str(group_total.quantize(Decimal("0.01")))

        # Добавляем стоимость доставки в line_items, если есть
        if total_delivery > 0:
            line_items.append({
                'price_data': {
                    'currency': 'eur',
                    'product_data': {'name': f'Delivery ({total_delivery} EUR)'},
                    'unit_amount': int(total_delivery * 100),
                },
                'quantity': 1,
            })

        gross_total = sum(Decimal(g["calculated_group_total"]) for g in groups).quantize(Decimal("0.01"))
        logger.info(f"Gross total for all groups: {gross_total} EUR (including total delivery: {total_delivery} EUR)")

        session_key = str(uuid.uuid4())
        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data={
                'user_id': str(user.id),
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
            },
            invoice_data={'groups': groups},
            description_data={
                'gross_total': str(gross_total),
                'delivery_total': str(total_delivery)
            },
        )

        logger.info(f"Stripe metadata saved with session_key: {session_key}")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=settings.REDIRECT_DOMAIN + 'payment_end/',
                cancel_url=settings.REDIRECT_DOMAIN + 'basket/',
                metadata={'session_key': session_key}
            )

            logger.info(
                f"Stripe Checkout session created: {checkout_session.id} for user {user.id}, session_key: {session_key}")

            return Response({
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id,
                "session_key": session_key
            }, status=200)

        except Exception as e:
            logger.exception("Stripe session creation failed")
            return Response({"error": str(e)}, status=500)

    def _resolve_country_code(self, group, idx):
        delivery_type = group.get("delivery_type")
        if delivery_type == 2:
            return group.get("delivery_address", {}).get("country")
        elif delivery_type == 1:
            pickup_point_id = group.get("pickup_point_id")
            if pickup_point_id:
                return resolve_country_from_local_pickup_point(pickup_point_id)
        return None


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    @csrf_exempt
    @extend_schema(
        summary="Handle Stripe Webhook for Completed Payment",
        description=(
                "Processes the Stripe webhook event 'checkout.session.completed'.\n\n"
                "The handler retrieves the session key from the webhook metadata, restores the saved session metadata, "
                "and creates one or more orders based on the original checkout data.\n\n"
                "**Business Logic:**\n"
                "- Verifies the Stripe webhook signature.\n"
                "- Restores saved metadata (customer data, product groups, delivery information).\n"
                "- Creates one or more orders grouped by seller.\n"
                "- Creates associated order items, delivery addresses, and payments.\n"
                "- Generates shipping labels asynchronously if applicable.\n\n"
                "**Expected Stripe Event:**\n"
                "- checkout.session.completed\n\n"
                "**Responses:**\n"
                "- 200: Orders and payments created successfully.\n"
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
    def post(self, request):
        payload = request.body.decode('utf-8')
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Stripe webhook verification failed: {e}")
            return Response(status=400)

        if event['type'] != 'checkout.session.completed':
            logger.info(f"Unhandled Stripe event: {event['type']}")
            return Response(status=200)

        session = event['data']['object']
        session_key = session.get('metadata', {}).get('session_key')

        if not session_key:
            logger.error("Missing session_key in Stripe webhook metadata.")
            return Response({"error": "Missing session_key"}, status=400)

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

        orders_created = []
        for idx, group in enumerate(groups, start=1):
            logger.info(f"Processing group #{idx}")

            delivery_type_id = group.get("delivery_type")
            courier_service_id = group.get("courier_service")
            pickup_point_id = group.get("pickup_point_id")
            products = group.get("products", [])
            delivery_cost = Decimal(group.get("calculated_delivery_cost", "0.00"))
            group_total = Decimal(group.get("calculated_group_total", "0.00"))

            dt = DeliveryType.objects.filter(id=delivery_type_id).first()
            if not dt:
                logger.error(f"Group {idx}: DeliveryType with id {delivery_type_id} not found.")
                continue

            cs = CourierService.objects.filter(id=courier_service_id).first()
            delivery_address = None
            if delivery_type_id == 2:
                address_data = group.get("delivery_address", {})
                delivery_address = DeliveryAddress.objects.create(
                    user=user,
                    full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}",
                    phone=meta.custom_data.get("phone"),
                    email=meta.custom_data.get("email"),
                    street=address_data.get("street", ""),
                    city=address_data.get("city", ""),
                    zip_code=address_data.get("zip", ""),
                    country=address_data.get("country", ""),
                )

            pending_status = OrderStatus.objects.get(name="Pending")
            amount = Decimal(session['amount_total']) / Decimal(100)
            currency = session['currency'].upper()

            order = Order.objects.create(
                user=user,
                first_name=meta.custom_data.get("first_name", ""),
                last_name=meta.custom_data.get("last_name", ""),
                customer_email=meta.custom_data.get("email"),
                delivery_type=dt,
                delivery_address=delivery_address,
                pickup_point_id=pickup_point_id,
                delivery_cost=delivery_cost,
                courier_service=cs,
                phone_number=meta.custom_data.get("phone"),
                total_amount=amount,
                group_subtotal=group_total,
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
                    product_price=variant.price,
                    warehouse=warehouse,
                    status=ProductStatus.AWAITING_SHIPMENT,
                )

            processing_status = OrderStatus.objects.get(name="Processing")
            order.order_status = processing_status
            order.save(update_fields=["order_status"])
            order.order_products.update(status=ProductStatus.AWAITING_SHIPMENT)

            Payment.objects.create(
                order=order,
                payment_system="stripe",
                session_id=session['id'],
                customer_id=session.get('customer'),
                payment_intent_id=session.get('payment_intent'),
                payment_method="stripe",
                amount_total=amount,
                currency=currency,
                customer_email=meta.custom_data.get("email"),
            )

            async_generate_parcels_and_fetch_labels(order.id)
            logger.info(f"Group {idx}: Order {order.id} created successfully with {len(products)} products.")
            orders_created.append(order)

        if not orders_created:
            return Response({"error": "Order creation failed"}, status=500)

        return Response({"status": f"{len(orders_created)} order(s) created successfully"}, status=200)


class CreatePayPalPaymentView(PayPalMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Create PayPal Payment Session with Delivery and Seller-Based Grouping",
        description=(
                "Creates a PayPal payment session by validating provided customer and product data.\n\n"
                "The request must include customer contact details and a list of product groups grouped by seller.\n\n"
                "**Business Logic:**\n"
                "- Validates product ownership by the specified seller.\n"
                "- Calculates delivery costs per group based on the provided delivery type and address.\n"
                "- Calculates total product and delivery costs.\n"
                "- Saves complete session metadata, including customer data, product groups, and calculated costs.\n"
                "- Returns the payment session details including redirect URL and internal session key.\n\n"
                "**Webhook Handling:**\n"
                "The session key is used to restore all saved metadata when the payment system confirms payment.\n\n"
                "**Expected Fields:**\n"
                "- email, first_name, last_name, phone, groups with product SKUs, seller IDs, delivery types, and delivery addresses or pickup points.\n\n"
                "**Response:**\n"
                "- redirect_url (PayPal: `approval_url`)\n"
                "- order_id"
        ),
        responses={200: OpenApiResponse(description="PayPal session created successfully")},
        tags=["PayPal"]
    )
    def post(self, request):
        user = request.user
        data = request.data

        # Validate required fields
        required_fields = ['email', 'first_name', 'last_name', 'phone', 'groups']
        for field in required_fields:
            if field not in data:
                return Response({"error": f"Missing required field: {field}"}, status=status.HTTP_400_BAD_REQUEST)

        email = data['email']
        first_name = data['first_name']
        last_name = data['last_name']
        phone = data['phone']
        groups = data['groups']

        validation_response = PaymentSessionValidator.validate_groups(groups)
        if validation_response:
            return validation_response

        total_delivery = Decimal('0.00')
        line_items = []

        for idx, group in enumerate(groups, start=1):
            delivery_type = group['delivery_type']
            products = group['products']
            seller_id_from_group = group.get('seller_id')

            # Validate seller_id consistency
            for product in products:
                sku = product['sku']
                try:
                    variant = ProductVariant.objects.get(sku=sku)
                except ProductVariant.DoesNotExist:
                    return Response({"error": f"Group {idx}: ProductVariant not found: {sku}"},
                                    status=status.HTTP_400_BAD_REQUEST)

                actual_seller_id = variant.product.seller.id
                if actual_seller_id != seller_id_from_group:
                    return Response({
                        "error": f"Group {idx}: Product {sku} does not belong to seller {seller_id_from_group}, actual seller is {actual_seller_id}"
                    }, status=status.HTTP_400_BAD_REQUEST)

            country_code = self._resolve_country_code(group, idx)
            if not country_code:
                return Response({"error": f"Group {idx}: Invalid delivery address or pickup point."},
                                status=status.HTTP_400_BAD_REQUEST)

            split_input = [{'sku': p['sku'], 'quantity': p['quantity']} for p in products]
            parcels = split_items_into_parcels(country=country_code, items=split_input, cod=False, currency='EUR')

            if not parcels:
                return Response({"error": f"Group {idx}: Products exceed allowed dimensions or weight."}, status=400)

            channel = {1: 'PUDO', 2: 'HD'}.get(delivery_type)
            delivery_cost_per_group = Decimal('0.00')

            for parcel in parcels:
                options = calculate_shipping_options(country=country_code, items=parcel, cod=False, currency='EUR')
                try:
                    selected_option = next(o for o in options if o['channel'] == channel)
                except StopIteration:
                    return Response({"error": f"Group {idx}: No valid delivery option found."},
                                    status=status.HTTP_400_BAD_REQUEST)

                delivery_cost = Decimal(selected_option['priceWithVat']).quantize(Decimal('0.01'))
                delivery_cost_per_group += delivery_cost

            total_delivery += delivery_cost_per_group
            group['calculated_delivery_cost'] = str(delivery_cost_per_group.quantize(Decimal('0.01')))

            group_total = Decimal('0.00')
            for product in products:
                variant = ProductVariant.objects.get(sku=product['sku'])
                unit_price = Decimal(variant.price).quantize(Decimal('0.01'))
                quantity = int(product['quantity'])
                group_total += unit_price * quantity

                line_items.append({
                    'name': product['sku'],
                    'sku': product['sku'],
                    'unit_amount': {'currency_code': 'EUR', 'value': f"{unit_price:.2f}"},
                    'quantity': str(quantity),
                })

            group_total += delivery_cost_per_group
            group['calculated_group_total'] = str(group_total.quantize(Decimal('0.01')))

        total_item_price = sum(Decimal(it['unit_amount']['value']) * int(it['quantity']) for it in line_items)
        gross_total = (total_item_price + total_delivery).quantize(Decimal('0.01'))

        if total_delivery > 0:
            line_items.append({
                'name': 'Delivery',
                'sku': 'delivery',
                'unit_amount': {'currency_code': 'EUR', 'value': f"{total_delivery:.2f}"},
                'quantity': '1',
            })

        session_key = str(uuid.uuid4())
        PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data={
                'user_id': str(user.id),
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
            },
            invoice_data={'groups': groups},
            description_data={
                'gross_total': str(gross_total),
                'delivery_total': str(total_delivery.quantize(Decimal('0.01')))
            },
        )

        approval_url, order_id = self.create_paypal_order(
            line_items=line_items,
            total_price=gross_total,
            session_key=session_key
        )
        return Response({'approval_url': approval_url, 'order_id': order_id})

    def _resolve_country_code(self, group, idx):
        delivery_type = group.get("delivery_type")

        if delivery_type == 2:
            # Home Delivery
            delivery_address = group.get("delivery_address", {})
            country_code = delivery_address.get("country")
            if not country_code:
                logger.error(f"Group {idx}: Missing country in delivery_address.")
                return None
            return country_code

        elif delivery_type == 1:
            # PUDO
            pickup_point_id = group.get("pickup_point_id")
            if not pickup_point_id:
                logger.error(f"Group {idx}: Missing pickup_point_id for PUDO delivery.")
                return None

            # Используем существующий резолвер
            country_code = resolve_country_from_local_pickup_point(pickup_point_id)
            if not country_code:
                logger.error(f"Group {idx}: Could not resolve country for pickup_point_id {pickup_point_id}.")
                return None

            return country_code

        else:
            logger.error(f"Group {idx}: Unknown delivery_type {delivery_type}")
            return None


@method_decorator(csrf_exempt, name='dispatch')
@extend_schema(
    summary="Handle PayPal Webhook for Approved Checkout Order",
    description=(
        "Processes the PayPal webhook event 'CHECKOUT.ORDER.APPROVED'.\n\n"
        "The handler retrieves the session key from the reference_id in the webhook payload, restores the saved session metadata, "
        "and creates one or more orders based on the original checkout data.\n\n"
        "**Business Logic:**\n"
        "- Verifies the PayPal webhook signature.\n"
        "- Restores saved metadata (customer data, product groups, delivery information).\n"
        "- Creates one or more orders grouped by seller.\n"
        "- Creates associated order items, delivery addresses, and payments.\n"
        "- Generates shipping labels asynchronously if applicable.\n\n"
        "**Expected PayPal Event:**\n"
        "- CHECKOUT.ORDER.APPROVED\n\n"
        "**Responses:**\n"
        "- 200: Orders and payments created successfully.\n"
        "- 403: Invalid webhook signature.\n"
        "- 400: Invalid JSON or invalid event type.\n"
        "- 500: Error during order processing."
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
        pu = resource.get("purchase_units", [{}])[0]
        amount = Decimal(pu["amount"]["value"]).quantize(Decimal("0.01"), ROUND_HALF_UP)
        currency = pu["amount"]["currency_code"]
        session_key = pu.get("reference_id")

        if not session_key:
            logger.error("Missing reference_id in webhook payload")
            return None

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

        orders_created = []
        for idx, group in enumerate(groups, start=1):
            logger.info(f"Processing group #{idx}")

            delivery_type_id = group.get("delivery_type")
            courier_service_id = group.get("courier_service")
            pickup_point_id = group.get("pickup_point_id")
            products = group.get("products", [])
            delivery_cost = Decimal(group.get("calculated_delivery_cost", "0.00"))
            group_total = Decimal(group.get("calculated_group_total", "0.00"))

            dt = DeliveryType.objects.filter(id=delivery_type_id).first()
            if not dt:
                logger.error(f"Group {idx}: DeliveryType with id {delivery_type_id} not found.")
                continue

            cs = CourierService.objects.filter(id=courier_service_id).first()
            delivery_address = None
            if delivery_type_id == 2:
                address_data = group.get("delivery_address", {})
                delivery_address = DeliveryAddress.objects.create(
                    user=user,
                    full_name=f"{meta.custom_data.get('first_name', '')} {meta.custom_data.get('last_name', '')}",
                    phone=meta.custom_data.get("phone"),
                    email=meta.custom_data.get("email"),
                    street=address_data.get("street", ""),
                    city=address_data.get("city", ""),
                    zip_code=address_data.get("zip", ""),
                    country=address_data.get("country", ""),
                )

            pending_status = OrderStatus.objects.get(name="Pending")
            order = Order.objects.create(
                user=user,
                first_name=meta.custom_data.get("first_name", ""),
                last_name=meta.custom_data.get("last_name", ""),
                customer_email=meta.custom_data.get("email"),
                delivery_type=dt,
                delivery_address=delivery_address,
                pickup_point_id=pickup_point_id,
                delivery_cost=delivery_cost,
                courier_service=cs,
                phone_number=meta.custom_data.get("phone"),
                total_amount=amount,
                group_subtotal=group_total,
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
                    product_price=variant.price,
                    warehouse=warehouse,
                    status=ProductStatus.AWAITING_SHIPMENT,
                )

            processing_status = OrderStatus.objects.get(name="Processing")
            order.order_status = processing_status
            order.save(update_fields=["order_status"])
            order.order_products.update(status=ProductStatus.AWAITING_SHIPMENT)

            Payment.objects.create(
                order=order,
                payment_system="paypal",
                session_id=resource.get("id"),
                customer_id=user.id,
                payment_intent_id=resource.get("id"),
                payment_method="paypal",
                amount_total=amount,
                currency=currency,
                customer_email=meta.custom_data.get("email"),
            )

            async_generate_parcels_and_fetch_labels(order.id)
            logger.info(f"Group {idx}: Order {order.id} created successfully with {len(products)} products.")
            orders_created.append(order)

        return orders_created if orders_created else None

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
        if not orders:
            return Response({"error": "Order creation failed"}, status=500)

        return Response({"status": f"{len(orders)} order(s) created successfully"}, status=200)
