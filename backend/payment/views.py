import json
import uuid
import stripe
import logging
import requests

from decimal import Decimal, ROUND_HALF_UP
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
)

logging.basicConfig(level=logging.INFO)

# Paypal secret fields
client_id = settings.PAYPAL_CLIENT_ID
client_secret = settings.PAYPAL_CLIENT_SECRET
PAYPAL_API_URL = settings.PAYPAL_API_URL

# Stripe secret fields
stripe.api_key = settings.STRIPE_API_SECRET_KEY
endpoint_secret = settings.STRIPE_WEBHOOK_ENDPOINT_SECRET

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


class CreateStripePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Creates a Stripe payment session based on the provided order details and stores them in StripeMetadata.",
        request={
            'application/json': {
                'type': 'object',
                'required': ['email', 'delivery_type', 'phone', 'products'],
                'properties': {
                    'email': {
                        'type': 'string',
                        'description': 'Email of the customer'
                    },
                    'promocode': {
                        'type': 'string',
                        'description': 'Promotional code for a discount (optional)'
                    },
                    'delivery_type': {
                        'type': 'integer',
                        'description': 'Delivery type: 1 - Pickup point, 2 - Courier',
                        'example': 1
                    },
                    'delivery_street': {
                        'type': 'string',
                        'description': 'Street (required if delivery_type is 2 - Courier)'
                    },
                    'delivery_city': {
                        'type': 'string',
                        'description': 'City (required if delivery_type is 2 - Courier)'
                    },
                    'delivery_zip': {
                        'type': 'string',
                        'description': 'ZIP code (required if delivery_type is 2 - Courier)'
                    },
                    'delivery_country': {
                        'type': 'string',
                        'description': 'Country (required if delivery_type is 2 - Courier)'
                    },
                    'pickup_point_id': {
                        'type': 'integer',
                        'description': 'ID of the pickup point (required if delivery_type is 1 - Pickup)'
                    },
                    'phone': {
                        'type': 'string',
                        'description': 'Customer phone number'
                    },
                    'delivery_cost': {
                        'type': 'number',
                        'description': 'Cost of delivery',
                        'default': 0.0
                    },
                    'courier_service': {
                        'type': 'integer',
                        'description': 'Courier service ID: 1 - PPL, 2 - GEIS, 3 - DPD'
                    },
                    'products': {
                        'type': 'array',
                        'description': 'List of product variants to be purchased',
                        'items': {
                            'type': 'object',
                            'required': ['sku', 'quantity'],
                            'properties': {
                                'sku': {
                                    'type': 'string',
                                    'description': 'SKU of the product variant'
                                },
                                'quantity': {
                                    'type': 'integer',
                                    'description': 'Quantity of the product'
                                }
                            }
                        }
                    }
                },
                'example': {
                    'email': 'user@example.com',
                    'promocode': 'SUMMER2024',
                    'delivery_type': 2,
                    'delivery_street': 'Main St 12',
                    'delivery_city': 'Prague',
                    'delivery_zip': '11000',
                    'delivery_country': 'Czech Republic',
                    'phone': '+420123456789',
                    'delivery_cost': 7.50,
                    'courier_service': 2,
                    'products': [
                        {'sku': '123456789', 'quantity': 2},
                        {'sku': '987654321', 'quantity': 1}
                    ]
                }
            }
        },
        responses={
            200: OpenApiResponse(
                description='Stripe checkout URL for redirecting the customer',
                response={
                    'type': 'object',
                    'properties': {
                        'url': {
                            'type': 'string',
                            'description': 'Stripe checkout session URL'
                        }
                    }
                }
            ),
            400: OpenApiResponse(description='Invalid input data (e.g., missing pickup_point_id for pickup delivery)'),
            404: OpenApiResponse(description='Product variant or delivery type not found'),
            500: OpenApiResponse(description='Error occurred while creating the Stripe payment session'),
        },
        tags=["Stripe"]
    )
    def post(self, request, *args, **kwargs):
        user_id = request.user.id
        email = request.data.get("email")
        promocode = request.data.get("promocode")
        delivery_type = request.data.get("delivery_type")
        phone = request.data.get("phone")
        delivery_cost = request.data.get("delivery_cost", 0)
        courier_service = request.data.get("courier_service")
        pickup_point_id = request.data.get("pickup_point_id")
        products = request.data.get("products")

        try:
            delivery_cost = Decimal(delivery_cost)
        except (ValueError, TypeError):
            delivery_cost = Decimal('0.00')

        logger.debug(f"Delivery cost: {delivery_cost}")

        if delivery_type == 1 and not pickup_point_id:
            return Response(
                {"error": "pickup_point_id is required for delivery_type = 1 (Pickup Point)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        line_items = []
        total_price = Decimal(0)

        for item in products:
            sku = item['sku']
            quantity = item['quantity']

            try:
                product_variant = ProductVariant.objects.get(sku=sku)
            except ProductVariant.DoesNotExist:
                logger.error(f"Product variant with SKU {sku} does not exist.")
                return Response({"error": f"Product variant with SKU {sku} not found"}, status=status.HTTP_404_NOT_FOUND)

            price = Decimal(product_variant.price)
            currency = 'EUR'

            if promocode:
                promo_code = PromoCode.objects.filter(code=promocode).first()
                if promo_code and promo_code.is_valid():
                    price = price - (price * Decimal(promo_code.discount_percentage) / Decimal('100.00'))

            line_items.append({
                'price_data': {
                    'currency': currency,
                    'unit_amount': int(price * 100),  # Stripe ожидает целое число в центах
                    'product_data': {
                        'name': f"{product_variant.product.name} - {product_variant.name}",
                    }
                },
                'quantity': quantity,
            })
            total_price += price * quantity

            logger.debug(f"Added product SKU {sku} with quantity {quantity} to line items.")

        if delivery_cost > 0:
            line_items.append({
                'price_data': {
                    'currency': 'EUR',
                    'unit_amount': int(delivery_cost * 100),
                    'product_data': {
                        'name': 'Delivery Cost',
                    }
                },
                'quantity': 1,
            })
            total_price += delivery_cost

        logger.debug(f"Total price including delivery cost: {total_price}")

        # Проверка наличия типа доставки
        if delivery_type:
            try:
                delivery_type_obj = DeliveryType.objects.get(id=delivery_type)
            except DeliveryType.DoesNotExist:
                logger.error(f"DeliveryType with id {delivery_type} does not exist.")
                return Response({"error": "Delivery type not found"}, status=status.HTTP_404_NOT_FOUND)

        # Подготовка данных для метаданных сессии
        custom_data = {
            "user_id": user_id,
            'email': email,
            'promo_code': promocode,
            "phone": phone,
        }

        invoice_data = {
            "delivery_type": delivery_type,
            "delivery_address": {
                "street": request.data.get("delivery_street", ""),
                "city": request.data.get("delivery_city", ""),
                "zip": request.data.get("delivery_zip", ""),
                "country": request.data.get("delivery_country", "")
            },
            "pickup_point_id": pickup_point_id,
        }

        description_data = {
            "delivery_cost": f"{delivery_cost:.2f}",
            "courier_service": courier_service,
        }

        # Генерация ключа сессии
        session_key = str(uuid.uuid4())

        # Сохраняем во временное хранилище
        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data=custom_data,
            invoice_data=invoice_data,
            description_data=description_data,
            products=products,
        )

        # Передаём только ключ
        metadata = {
            'session_key': session_key
        }

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=settings.REDIRECT_DOMAIN + 'payment_end/',
                cancel_url=settings.REDIRECT_DOMAIN + 'basket/',
                metadata=metadata,
            )
            logger.debug(f"Stripe checkout session created: {session.id}")
            return Response({'url': session.url}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {str(e)}")
            return Response({'error': 'Error creating Stripe payment session'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeWebhookHandler(APIView):
    permission_classes = [AllowAny]

    @csrf_exempt
    @extend_schema(
        description="Handles Stripe webhook for completed payments",
        request=None,
        responses={
            200: OpenApiResponse(description='Webhook received and processed successfully'),
            400: OpenApiResponse(description='Invalid payload or signature verification failed'),
            500: OpenApiResponse(description='Error processing order'),
        },
        tags=['Stripe']
    )
    def post(self, request, *args, **kwargs):
        payload = request.body.decode('utf-8')
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        logger.debug(f"Payload: {payload}")
        logger.debug(f"Signature Header: {sig_header}")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            return Response(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Signature verification failed: {e}")
            return Response(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            logger.debug(f"Session data: {session}")

            # Извлекаем session_key из метаданных
            session_key = session.get('metadata', {}).get('session_key')
            if not session_key:
                logger.error("Missing session_key in Stripe webhook")
                return Response({"error": "Missing session_key"}, status=400)

            try:
                metadata = StripeMetadata.objects.get(session_key=session_key)
            except StripeMetadata.DoesNotExist:
                logger.error(f"No StripeMetadata found for session_key: {session_key}")
                return Response({"error": "Session metadata not found"}, status=400)

            # Извлекаем все нужные данные из модели StripeMetadata
            custom_data = metadata.custom_data or {}
            invoice_data = metadata.invoice_data or {}
            description_data = metadata.description_data or {}
            products = metadata.products or []

            user_id = custom_data.get('user_id')
            customer_email = custom_data.get('email')
            promocode = custom_data.get('promo_code')
            phone = custom_data.get('phone')

            delivery_type_id = invoice_data.get('delivery_type')
            delivery_address_raw = invoice_data.get('delivery_address', {})
            pickup_point_id = invoice_data.get('pickup_point_id')

            delivery_cost = Decimal(description_data.get('delivery_cost', '0.00')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            courier_service_id = description_data.get('courier_service')

            total_amount = Decimal(session['amount_total']) / Decimal(100)
            total_amount = total_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            currency = session['currency'].upper()
            customer_id = session.get('customer')
            payment_intent_id = session.get('payment_intent')
            payment_method_types = session.get('payment_method_types', [])

            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                logger.error(f"User with id {user_id} does not exist.")
                return Response({"error": f"User with id {user_id} not found"}, status=400)

            if delivery_type_id:
                try:
                    delivery_type = DeliveryType.objects.get(id=delivery_type_id)
                except DeliveryType.DoesNotExist:
                    logger.error(f"DeliveryType with id {delivery_type} does not exist.")
                    delivery_type = None
            else:
                delivery_type = None

            try:
                order_status = OrderStatus.objects.get(name="Pending")
            except OrderStatus.DoesNotExist:
                logger.error("Order status 'Pending' does not exist.")
                order_status = None

            if courier_service_id:
                try:
                    courier_service_obj = CourierService.objects.get(id=courier_service_id)
                except CourierService.DoesNotExist:
                    logger.error(f"CourierService with id {courier_service_id} does not exist.")
                    courier_service_obj = None
            else:
                courier_service_obj = None

            # Создание адреса доставки (если выбран тип "Courier")
            delivery_address_obj = None
            if delivery_type_id == 2:
                delivery_address_obj = DeliveryAddress.objects.create(
                    user=user,
                    full_name=f"{user.first_name} {user.last_name}",
                    phone=phone,
                    email=customer_email,
                    street=delivery_address_raw.get("street", ""),
                    city=delivery_address_raw.get("city", ""),
                    zip_code=delivery_address_raw.get("zip", ""),
                    country=delivery_address_raw.get("country", "")
                )

            try:
                # Создание заказа
                order = Order.objects.create(
                    user=user,
                    customer_email=customer_email,
                    delivery_type=delivery_type,
                    delivery_address=delivery_address_obj,
                    delivery_cost=delivery_cost,
                    order_status=order_status,
                    phone_number=phone,
                    total_amount=total_amount,
                    courier_service=courier_service_obj,
                    pickup_point_id=pickup_point_id,
                )
                logger.debug(f"Order created: {order}")

                # Рассчитать стоимость доставки для каждого товара
                total_product_cost = Decimal('0.00')
                product_costs = []
                for item in products:
                    product_sku = item.get('sku')
                    if not product_sku:
                        logger.debug(f"Ignoring item without SKU: {item}")
                        continue
                    quantity = Decimal(item['quantity'])
                    try:
                        product_variant = ProductVariant.objects.get(sku=product_sku)
                    except ProductVariant.DoesNotExist:
                        logger.error(f"ProductVariant with SKU '{product_sku}' not found. Skipping item.")
                        continue
                    product_price = product_variant.price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    product_total_cost = (quantity * product_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    total_product_cost += product_total_cost
                    product_costs.append((product_variant, quantity, product_total_cost, product_price))

                rounded_delivery_costs = []
                total_rounded_delivery_cost = Decimal('0.00')

                for product_variant, quantity, product_total_cost, product_price in product_costs:
                    if total_product_cost > Decimal('0.00'):
                        ratio = (product_total_cost / total_product_cost).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
                        product_delivery_cost = (ratio * delivery_cost).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    else:
                        product_delivery_cost = Decimal('0.00')
                    rounded_delivery_costs.append((product_variant, quantity, product_delivery_cost, product_price))
                    total_rounded_delivery_cost += product_delivery_cost

                # Корректировка общей стоимости доставки
                difference = delivery_cost - total_rounded_delivery_cost
                if rounded_delivery_costs:
                    last_product_variant, last_quantity, last_cost, last_price = rounded_delivery_costs[-1]
                    last_cost_adjusted = (last_cost + difference).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    rounded_delivery_costs[-1] = (last_product_variant, last_quantity, last_cost_adjusted, last_price)

                # Создание записей OrderProduct
                for product_variant, quantity, delivery_cost_item, product_price in rounded_delivery_costs:
                    OrderProduct.objects.create(
                        order=order,
                        product=product_variant,
                        quantity=quantity,
                        delivery_cost=delivery_cost_item,
                        seller_profile=product_variant.product.seller,
                        product_price=product_price
                    )
                    logger.debug(
                        f"OrderProduct created for product_variant_id {product_variant.id} with delivery cost {delivery_cost_item}"
                    )

                # Создание платежа
                Payment.objects.create(
                    order=order,
                    payment_system='stripe',
                    session_id=session['id'],
                    customer_id=customer_id,
                    payment_intent_id=payment_intent_id,
                    payment_method=payment_method_types[0] if payment_method_types else 'unknown',
                    amount_total=total_amount,
                    currency=currency,
                    customer_email=customer_email,
                )
                logger.debug(f"Payment created for order {order.id}")

                # send_order_emails_safely(order)

                logger.info(f"Order {order.id} and Payment created successfully from Stripe webhook")
                return Response(status=200)

            except Exception as e:
                logger.error(f"Error processing order: {e}", exc_info=True)
                return Response({"error": "Error processing order"}, status=500)
        else:
            logger.warning(f"Unhandled event type {event['type']}")
            return Response(status=200)


class CreatePayPalPaymentView(PayPalMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Creates a PayPal payment for product purchase",
        request={
            'application/json': {
                'type': 'object',
                'required': ['email', 'delivery_type', 'delivery_address', 'phone', 'products'],
                'properties': {
                    'email': {
                        'type': 'string',
                        'description': 'Email of the user making the purchase'
                    },
                    'promocode': {
                        'type': 'string',
                        'description': 'Promocode for a discount on the purchase'
                    },
                    'delivery_type': {
                        'type': 'integer',
                        'description': 'Type of delivery: 1 - Pickup point, 2 - Courier',
                        'example': 1
                    },
                    'delivery_street': {
                        'type': 'string',
                        'description': 'Street and house number'
                    },
                    'delivery_city': {
                        'type': 'string',
                        'description': 'City'
                    },
                    'delivery_zip': {
                        'type': 'string',
                        'description': 'ZIP or postal code'
                    },
                    'delivery_country': {
                        'type': 'string',
                        'description': 'Country'
                    },
                    'phone': {
                        'type': 'string',
                        'description': 'Contact phone number'
                    },
                    'delivery_cost': {
                        'type': 'number',
                        'description': 'Cost of delivery',
                        'default': 0.0
                    },
                    'courier_service': {
                        'type': 'integer',
                        'description': 'ID of the courier service: 1 - PPL, 2 - GEIS, 3 - DPD',
                        'example': 1
                    },
                    "pickup_point_id": {
                        "type": "integer",
                        "description": "ID of the pickup point if delivery_type is 1 (Pickup)"
                    },
                    'products': {
                        'type': 'array',
                        'description': 'List of product variants to purchase',
                        'items': {
                            'type': 'object',
                            'required': ['sku', 'quantity'],
                            'properties': {
                                'sku': {
                                    'type': 'string',
                                    'description': 'SKU of the product variant'
                                },
                                'quantity': {
                                    'type': 'integer',
                                    'description': 'Quantity of the product'
                                }
                            }
                        }
                    }
                },
                'example': {
                    'email': 'user@example.com',
                    'promocode': 'SUMMER2024',
                    'delivery_type': 1,
                    'delivery_address': '123 Main St, City, Country',
                    'phone': '+1234567890',
                    'delivery_cost': 10.50,
                    'courier_service': 1,
                    'products': [
                        {'sku': '123456789', 'quantity': 2},
                        {'sku': '987654321', 'quantity': 1}
                    ]
                }
            }
        },
        responses={
            200: OpenApiResponse(
                description='Order ID and approval URL for the created PayPal payment',
                response={
                    'type': 'object',
                    'properties': {
                        'order_id': {'type': 'string', 'description': 'ID of the created PayPal order'},
                        'approval_url': {'type': 'string', 'description': 'URL to approve the PayPal payment'}
                    }
                }
            ),
            404: OpenApiResponse(description='Product variant not found or Delivery type not found'),
            500: OpenApiResponse(description='Error creating PayPal payment'),
        },
        tags=['PayPal']
    )
    def post(self, request):
        user_id = request.user.id
        email = request.data.get("email")
        promocode = request.data.get("promocode")
        delivery_type = request.data.get("delivery_type")
        delivery_street = request.data.get("delivery_street")
        delivery_city = request.data.get("delivery_city")
        delivery_zip = request.data.get("delivery_zip")
        delivery_country = request.data.get("delivery_country")
        phone = request.data.get("phone")
        delivery_cost = Decimal(request.data.get("delivery_cost", 0))
        courier_service = request.data.get("courier_service")
        pickup_point_id = request.data.get("pickup_point_id")
        products = request.data.get("products")

        logger.debug(f"Delivery cost: {delivery_cost}")

        line_items = []
        total_price = Decimal(0)

        if delivery_type == 1 and not pickup_point_id:
            return Response(
                {"error": "pickup_point_id is required for delivery_type = 1 (Pickup Point)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in products:
            sku = item['sku']
            quantity = item['quantity']
            try:
                product_variant = ProductVariant.objects.get(sku=sku)
            except ProductVariant.DoesNotExist:
                logger.error(f"Product variant with SKU {sku} does not exist.")
                return Response({"error": f"Product variant with SKU {sku} not found"}, status=status.HTTP_404_NOT_FOUND)

            price = Decimal(product_variant.price)
            currency = 'EUR'

            if promocode:
                promo_code = PromoCode.objects.filter(code=promocode).first()
                if promo_code and promo_code.is_valid():
                    price -= (price * Decimal(promo_code.discount_percentage) / Decimal(100))

            line_items.append({
                "sku": product_variant.sku,
                "name": f"{product_variant.product.name} - {product_variant.name}",
                "quantity": str(quantity),
                "unit_amount": {
                    "currency_code": currency,
                    "value": f"{price:.2f}",
                }
            })
            total_price += price * quantity

        if delivery_cost > 0:
            line_items.append({
                "name": 'Delivery Cost',
                "quantity": "1",
                "unit_amount": {
                    "currency_code": "EUR",
                    "value": f"{delivery_cost:.2f}",
                }
            })
            total_price += delivery_cost

        # Храним метаданные через session_key
        session_key = str(uuid.uuid4())

        PayPalMetadata.objects.create(
            session_key=session_key,
            custom_data={
                "user_id": user_id,
                "email": email,
                "promo_code": promocode,
                "phone": phone,
            },
            invoice_data={
                "delivery_type": delivery_type,
                "delivery_address": {
                    "street": delivery_street,
                    "city": delivery_city,
                    "zip": delivery_zip,
                    "country": delivery_country,
                },
                "pickup_point_id": pickup_point_id,
            },
            description_data={
                "delivery_cost": f"{delivery_cost:.2f}",
                "courier_service": courier_service,
            },
            products=products,
        )

        # формируем тело запроса
        data = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": "EUR",
                        "value": f"{total_price:.2f}",
                        "breakdown": {
                            "item_total": {
                                "currency_code": "EUR",
                                "value": f"{total_price:.2f}",
                            }
                        }
                    },
                    "description": session_key,
                    "custom_id": session_key,
                    "invoice_id": session_key,
                    "items": line_items,
                }
            ],
            "application_context": {
                "return_url": settings.REDIRECT_DOMAIN + 'payment_end/',
                "cancel_url": settings.REDIRECT_DOMAIN + 'basket/',
            }
        }

        access_token = self.get_paypal_access_token()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }

        response = requests.post(f'{PAYPAL_API_URL}/v2/checkout/orders', headers=headers, data=json.dumps(data))

        if response.status_code == 201:
            order_response = response.json()
            logger.debug(f"Order_id': {order_response['id']}, approval_url: {order_response['links'][1]['href']}")
            return Response({'order_id': order_response['id'], 'approval_url': order_response['links'][1]['href']}, status=status.HTTP_200_OK)
        else:
            return Response(response.json(), status=response.status_code)


@extend_schema(
    description="Handles PayPal webhook events to create orders and payments in the system",
    responses={
        200: OpenApiResponse(description='Order and Payment created successfully'),
        403: OpenApiResponse(description='Invalid webhook signature'),
        500: OpenApiResponse(description='Error creating order and payment'),
    },
    tags=["PayPal"]
)
class PayPalWebhookView(PayPalMixin, APIView):
    permission_classes = [AllowAny]

    def create_order_from_webhook(self, data):
        resource = data.get("resource", {})
        logger.debug(f"Received resource: {resource}")

        purchase_unit = resource.get("purchase_units", [{}])[0]
        amount = Decimal(purchase_unit.get("amount", {}).get("value", "0.00"))
        currency = purchase_unit.get("amount", {}).get("currency_code", "EUR")

        # Декодирование переданных данных
        session_key = purchase_unit.get("custom_id")
        if not session_key:
            logger.error("Missing session_key in custom_id")
            return False

        try:
            metadata = PayPalMetadata.objects.get(session_key=session_key)
        except PayPalMetadata.DoesNotExist:
            logger.error(f"No metadata found for session_key: {session_key}")
            return False

        custom_data = metadata.custom_data or {}
        invoice_data = metadata.invoice_data or {}
        description_data = metadata.description_data or {}
        products = metadata.products or []

        logger.debug(f"Parsed custom_data: {custom_data}")
        logger.debug(f"Parsed invoice_data: {invoice_data}")
        logger.debug(f"Parsed description_data: {description_data}")

        user_id = custom_data.get("user_id")
        email = custom_data.get("email")
        phone = custom_data.get("phone")
        delivery_type = invoice_data.get("delivery_type")
        pickup_point_id = invoice_data.get("pickup_point_id")
        delivery_cost = Decimal(description_data.get("delivery_cost", "0.00"))
        courier_service_id = description_data.get("courier_service")

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            logger.error(f"User with id {user_id} not found")
            return False

        # Сохраняем адрес доставки только для курьерской доставки
        delivery_address_obj = None
        if delivery_type == 2:
            delivery_address_raw = invoice_data.get("delivery_address", {})
            delivery_address_obj = DeliveryAddress.objects.create(
                user=user,
                full_name=f"{user.first_name} {user.last_name}",
                phone=phone,
                email=email,
                street=delivery_address_raw.get("street", ""),
                city=delivery_address_raw.get("city", ""),
                zip_code=delivery_address_raw.get("zip", ""),
                country=delivery_address_raw.get("country", "")
            )
            logger.debug(f"Created DeliveryAddress {delivery_address_obj}")

        # Получение связанных объектов
        delivery_type_obj = DeliveryType.objects.filter(id=delivery_type).first()
        courier_service_obj = CourierService.objects.filter(id=courier_service_id).first()
        order_status = OrderStatus.objects.filter(name="Pending").first()

        # Создание заказа
        order = Order.objects.create(
            user=user,
            customer_email=email,
            delivery_type=delivery_type_obj,
            delivery_address=delivery_address_obj,
            pickup_point_id=pickup_point_id,
            delivery_cost=delivery_cost,
            courier_service=courier_service_obj,
            phone_number=phone,
            total_amount=amount,
            order_status=order_status,
        )
        logger.debug(f"Order created: {order}")

        # Распределение доставки и создание OrderProduct
        total_product_cost = Decimal("0.00")
        product_items = []

        for item in products:
            sku = item.get("sku")
            quantity = Decimal(item.get("quantity", "1"))

            try:
                variant = ProductVariant.objects.get(sku=sku)
            except ProductVariant.DoesNotExist:
                logger.error(f"ProductVariant with SKU '{sku}' not found. Skipping item.")
                continue
            price = variant.price

            subtotal = quantity * price
            product_items.append((variant, quantity, subtotal, price))
            total_product_cost += subtotal

        delivery_allocations = []
        allocated = Decimal("0.00")

        for i, (variant, quantity, subtotal, price) in enumerate(product_items):
            if total_product_cost > 0:
                share = subtotal / total_product_cost
                delivery_part = (share * delivery_cost).quantize(Decimal("0.01"))
            else:
                delivery_part = Decimal("0.00")
            if i == len(product_items) - 1:
                delivery_part += delivery_cost - allocated
            allocated += delivery_part
            delivery_allocations.append((variant, quantity, delivery_part, price))

        for variant, quantity, delivery_part, price in delivery_allocations:
            OrderProduct.objects.create(
                order=order,
                product=variant,
                quantity=quantity,
                delivery_cost=delivery_part,
                seller_profile=variant.product.seller,
                product_price=price,
            )
            logger.debug(f"Created OrderProduct for {variant.sku} (qty={quantity}, delivery_cost={delivery_part})")

        # Платеж
        session_id = resource.get("id")
        payment_intent_id = resource.get("id")
        payment_method = f"{resource.get('payer', {}).get('name', {}).get('given_name', '')} {resource.get('payer', {}).get('name', {}).get('surname', '')}"

        Payment.objects.create(
            order=order,
            payment_system='paypal',
            session_id=session_id,
            customer_id=user.id,
            payment_intent_id=payment_intent_id,
            payment_method=payment_method,
            amount_total=amount,
            currency=currency,
            customer_email=email,
        )
        logger.debug(f"Payment recorded for order {order.id}")

        logger.info(f"Order {order.id} and Payment created successfully from Paypal webhook")
        return order

    @csrf_exempt
    def post(self, request):
        webhook_body = request.body.decode("utf-8")
        logger.debug(f"Webhook body received: {webhook_body}")

        try:
            data = json.loads(webhook_body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in PayPal webhook")
            return Response({"error": "Invalid JSON"}, status=400)

        try:
            if data.get("event_type") != "CHECKOUT.ORDER.APPROVED":
                logger.info(f"Ignored webhook event: {data.get('event_type')}")
                return Response({"status": "ignored"}, status=200)

            if not self.verify_webhook(request, webhook_body):
                logger.warning("Webhook signature verification failed")
                return Response({"error": "Invalid webhook signature"}, status=403)

            logger.info("Webhook verified successfully")
            order = self.create_order_from_webhook(data)
            if order:
                # send_order_emails_safely(order)
                return Response({"status": "Order and Payment created successfully"}, status=200)
            else:
                logger.error("Order creation failed after successful webhook verification")
                return Response({"error": "Error creating order"}, status=500)

        except Exception as e:
            logger.exception("Unexpected error while processing PayPal webhook")
            return Response({"error": "Internal server error"}, status=500)
