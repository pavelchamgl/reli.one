import json
import stripe
import logging
import requests

from decimal import Decimal, ROUND_HALF_UP
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema,  OpenApiResponse, OpenApiExample
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt

from .models import Payment
from .mixins import PayPalMixin
from accounts.models import CustomUser
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
        description="Creates a Stripe payment session for product purchase",
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
                    'delivery_address': {
                        'type': 'string',
                        'description': 'Delivery address'
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
                description='URL for the created Stripe payment session',
                response={
                    'type': 'object',
                    'properties': {
                        'url': {'type': 'string', 'description': 'URL to redirect the user to the Stripe payment session'}
                    }
                }
            ),
            404: OpenApiResponse(description='Product variant not found or Delivery type not found'),
            500: OpenApiResponse(description='Error creating Stripe payment session'),
        },
        tags=['Stripe']
    )
    def post(self, request, *args, **kwargs):
        user_id = request.user.id
        email = request.data.get("email")
        promocode = request.data.get("promocode")
        delivery_type = request.data.get("delivery_type")
        delivery_address = request.data.get("delivery_address")
        phone = request.data.get("phone")
        delivery_cost = request.data.get("delivery_cost", 0)
        courier_service = request.data.get("courier_service")
        products = request.data.get("products")

        try:
            delivery_cost = Decimal(delivery_cost)
        except (ValueError, TypeError):
            delivery_cost = Decimal('0.00')

        logger.debug(f"Delivery cost: {delivery_cost}")

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
            "delivery_address": delivery_address,
        }

        description_data = {
            "delivery_cost": f"{delivery_cost:.2f}",
            "courier_service": courier_service,
        }

        # Объединение всех данных в метаданные сессии
        metadata = {
            'custom_data': json.dumps(custom_data),
            'invoice_data': json.dumps(invoice_data),
            'description_data': json.dumps(description_data),
            'products': json.dumps(products),
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

            # Извлечение метаданных из сессии
            custom_data = json.loads(session['metadata'].get('custom_data', '{}'))
            invoice_data = json.loads(session['metadata'].get('invoice_data', '{}'))
            description_data = json.loads(session['metadata'].get('description_data', '{}'))
            products = json.loads(session['metadata'].get('products', '[]'))

            logger.debug(f"Custom data: {custom_data}")
            logger.debug(f"Invoice data: {invoice_data}")
            logger.debug(f"Description data: {description_data}")
            logger.debug(f"Products: {products}")

            user_id = custom_data.get('user_id')
            customer_email = custom_data.get('email')
            promocode = custom_data.get('promo_code')
            phone = custom_data.get('phone')

            delivery_type_id = invoice_data.get('delivery_type')
            delivery_address = invoice_data.get('delivery_address')

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
                return False

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

            try:
                # Создание заказа
                order = Order.objects.create(
                    user=user,
                    customer_email=customer_email,
                    delivery_type=delivery_type,
                    delivery_address=delivery_address,
                    delivery_cost=delivery_cost,
                    order_status=order_status,
                    phone_number=phone,
                    total_amount=total_amount,
                    courier_service=courier_service_obj,
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
                    product_variant = ProductVariant.objects.get(sku=product_sku)
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
                        supplier=product_variant.product.supplier,
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

                logger.info(f"Order {order.id} and Payment created successfully from Stripe webhook")
                return Response(status=200)

            except Exception as e:
                logger.error(f"Error processing order: {e}")
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
                    'delivery_address': {
                        'type': 'string',
                        'description': 'Delivery address'
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
        delivery_address = request.data.get("delivery_address")
        phone = request.data.get("phone")
        delivery_cost = Decimal(request.data.get("delivery_cost", 0))
        courier_service = request.data.get("courier_service")
        products = request.data.get("products")

        logger.debug(f"Delivery cost: {delivery_cost}")

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
                    price = price - (price * Decimal(promo_code.discount_percentage) / Decimal(100))

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

        custom_data = {
            "user_id": user_id,
            'email': email,
            'promo_code': promocode,
            "phone": phone,
        }

        if delivery_type:
            try:
                delivery_type_obj = DeliveryType.objects.get(id=delivery_type)
            except DeliveryType.DoesNotExist:
                logger.error(f"DeliveryType with id {delivery_type} does not exist.")
                return Response({"error": "Delivery type not found"}, status=status.HTTP_404_NOT_FOUND)

        invoice_data = {
            "delivery_type": delivery_type,
            "delivery_address": delivery_address,
        }

        description_data = {
            "delivery_cost": f"{delivery_cost:.2f}",
            "courier_service": courier_service,
        }

        access_token = self.get_paypal_access_token()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }

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
                    "description": json.dumps(description_data),
                    "items": line_items,
                    "custom_id": json.dumps(custom_data),
                    "invoice_id": json.dumps(invoice_data),
                }
            ],
            "application_context": {
                "return_url": settings.REDIRECT_DOMAIN + 'payment_end/',
                "cancel_url": settings.REDIRECT_DOMAIN + 'basket/',
            }
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
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'id': {'type': 'string', 'description': 'Event ID'},
                'event_version': {'type': 'string', 'description': 'Event version'},
                'create_time': {'type': 'string', 'description': 'Event creation time'},
                'resource_type': {'type': 'string', 'description': 'Resource type'},
                'event_type': {'type': 'string', 'description': 'Event type (e.g., CHECKOUT.ORDER.APPROVED)'},
                'summary': {'type': 'string', 'description': 'Event summary'},
                'resource': {
                    'type': 'object',
                    'description': 'Resource data related to the event',
                    'properties': {
                        'id': {'type': 'string', 'description': 'Resource ID (order ID)'},
                        'status': {'type': 'string', 'description': 'Order status'},
                        'purchase_units': {
                            'type': 'array',
                            'description': 'List of purchase units',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'amount': {
                                        'type': 'object',
                                        'properties': {
                                            'currency_code': {'type': 'string', 'description': 'Currency code'},
                                            'value': {'type': 'string', 'description': 'Order amount'}
                                        }
                                    },
                                    'custom_id': {'type': 'string', 'description': 'Custom data in JSON format'},
                                    'invoice_id': {'type': 'string', 'description': 'Invoice data in JSON format'},
                                    'description': {'type': 'string', 'description': 'Description in JSON format'},
                                    'items': {
                                        'type': 'array',
                                        'description': 'List of items',
                                        'items': {
                                            'type': 'object',
                                            'properties': {
                                                'sku': {'type': 'string', 'description': 'Item SKU'},
                                                'quantity': {'type': 'string', 'description': 'Quantity'},
                                                'unit_amount': {
                                                    'type': 'object',
                                                    'properties': {
                                                        'currency_code': {'type': 'string', 'description': 'Currency code'},
                                                        'value': {'type': 'string', 'description': 'Unit price'}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'payer': {
                            'type': 'object',
                            'properties': {
                                'email_address': {'type': 'string', 'description': 'Payer email address'},
                                'payer_id': {'type': 'string', 'description': 'Payer ID'},
                                'name': {
                                    'type': 'object',
                                    'properties': {
                                        'given_name': {'type': 'string', 'description': 'First name'},
                                        'surname': {'type': 'string', 'description': 'Last name'}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'example': {
                'id': 'WH-1234567890',
                'event_version': '1.0',
                'create_time': '2024-07-16T07:36:22.484Z',
                'resource_type': 'checkout-order',
                'event_type': 'CHECKOUT.ORDER.APPROVED',
                'summary': 'An order has been approved by buyer',
                'resource': {
                    'id': 'ORDER-1234567890',
                    'status': 'APPROVED',
                    'purchase_units': [
                        {
                            'amount': {
                                'currency_code': 'EUR',
                                'value': '100.00'
                            },
                            'custom_id': '{"user_id": 1, "email": "user@example.com", "promo_code": null, "phone": "+1234567890"}',
                            'invoice_id': '{"delivery_type": 1, "delivery_address": "123 Main St"}',
                            'description': '{"delivery_cost": "10.00", "courier_service": 1}',
                            'items': [
                                {
                                    'sku': '123456789',
                                    'quantity': '2',
                                    'unit_amount': {
                                        'currency_code': 'EUR',
                                        'value': '45.00'
                                    }
                                }
                            ]
                        }
                    ],
                    'payer': {
                        'email_address': 'payer@example.com',
                        'payer_id': 'PAYERID123',
                        'name': {
                            'given_name': 'John',
                            'surname': 'Doe'
                        }
                    }
                }
            }
        }
    },
    responses={
        200: OpenApiResponse(
            description='Order and Payment created successfully',
            response={'type': 'object', 'properties': {'status': {'type': 'string', 'example': 'Order and Payment created successfully'}}}
        ),
        403: OpenApiResponse(description='Invalid webhook signature'),
        500: OpenApiResponse(description='Error creating order and payment'),
    },
    tags=['PayPal']
)
class PayPalWebhookView(PayPalMixin, APIView):
    permission_classes = [AllowAny]

    def create_order_from_webhook(self, data):
        resource = data['resource']
        logger.debug(f"Resource data: {resource}")

        # Извлечение данных о заказе
        purchase_unit = resource['purchase_units'][0]
        amount = Decimal(purchase_unit['amount']['value'])
        currency = purchase_unit['amount']['currency_code']
        logger.debug(f"Amount: {amount}, Currency: {currency}")

        # Извлечение кастомных данных
        custom_data = json.loads(purchase_unit['custom_id'])
        invoice_data = json.loads(purchase_unit['invoice_id'])
        description_data = json.loads(purchase_unit['description'])
        logger.debug(f"Custom data: {custom_data}, Invoice data: {invoice_data}, Description data: {description_data}")

        user_id = custom_data.get('user_id')
        email = custom_data.get('email')
        phone = custom_data.get('phone')
        delivery_type = invoice_data.get('delivery_type')
        delivery_address = invoice_data.get('delivery_address')
        delivery_cost = Decimal(description_data.get('delivery_cost'))
        courier_service = description_data.get('courier_service')
        logger.debug(
            f"User data: user_id={user_id}, email={email}, phone={phone}, delivery_cost={delivery_cost}, courier_service={courier_service}, delivery_address={delivery_address}, delivery_type={delivery_type}")

        products = purchase_unit.get('items', [])
        logger.debug(f"Products: {products}")

        # Получение статуса заказа
        try:
            order_status = OrderStatus.objects.get(name="Pending")
        except OrderStatus.DoesNotExist:
            logger.error("Order status 'Pending' does not exist.")
            order_status = None

        # Получение пользователя
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            logger.error(f"User with id {user_id} does not exist.")
            return False

        # Получение типа доставки
        if delivery_type:
            try:
                delivery_type_obj = DeliveryType.objects.get(id=delivery_type)
            except DeliveryType.DoesNotExist:
                logger.error(f"DeliveryType with id {delivery_type} does not exist.")
                delivery_type_obj = None
        else:
            delivery_type_obj = None

        courier_service_id = description_data.get('courier_service')
        if courier_service_id:
            try:
                courier_service_obj = CourierService.objects.get(id=courier_service_id)
            except CourierService.DoesNotExist:
                logger.error(f"CourierService with id {courier_service_id} does not exist.")
                courier_service_obj = None
        else:
            courier_service_obj = None

        try:
            # Создание заказа
            order = Order.objects.create(
                user=user,
                customer_email=email,
                delivery_type=delivery_type_obj,
                delivery_address=delivery_address,
                delivery_cost=delivery_cost,
                order_status=order_status,
                phone_number=phone,
                total_amount=amount,
                courier_service=courier_service_obj,
            )
            logger.debug(f"Order created: {order}")

            # Рассчитать стоимость доставки для каждого товара
            total_product_cost = sum(
                Decimal(item['quantity']) * ProductVariant.objects.get(sku=item['sku']).price
                for item in products if item.get('sku')
            )
            rounded_delivery_costs = []
            total_rounded_delivery_cost = Decimal('0.00')

            for item in products:
                product_sku = item.get('sku')
                if not product_sku:
                    logger.debug(f"Ignoring item without SKU: {item}")
                    continue
                quantity = Decimal(item['quantity'])
                product_variant = ProductVariant.objects.get(sku=product_sku)

                product_total_cost = quantity * product_variant.price
                product_delivery_cost = round((product_total_cost / total_product_cost) * delivery_cost, 2)
                rounded_delivery_costs.append((product_variant, quantity, product_delivery_cost, product_variant.price))
                total_rounded_delivery_cost += product_delivery_cost

            # Корректировка общей стоимости доставки
            difference = delivery_cost - total_rounded_delivery_cost
            if rounded_delivery_costs:
                last_product_variant, last_quantity, last_cost, last_price = rounded_delivery_costs[-1]
                rounded_delivery_costs[-1] = (last_product_variant, last_quantity, last_cost + difference, last_price)

            # Создание записей OrderProduct
            for product_variant, quantity, delivery_cost, product_price in rounded_delivery_costs:
                OrderProduct.objects.create(
                    order=order,
                    product=product_variant,
                    quantity=quantity,
                    delivery_cost=delivery_cost,
                    supplier=product_variant.product.supplier,
                    product_price=product_price
                )
                logger.debug(
                    f"OrderProduct created for product_variant_id {product_variant.id} with delivery cost {delivery_cost}")

            # Извлечение данных для платежа
            session_id = resource.get('id', 'unknown_session_id')
            payment_intent_id = resource.get('id', 'unknown_intent_id')
            payment_source = resource.get('payment_source', {})
            paypal_info = payment_source.get('paypal', {})
            payer_name = paypal_info.get('name', {})
            payment_method = f"{payer_name.get('given_name', '')} {payer_name.get('surname', '')}"

            logger.debug(
                f"Payment data before creation: session_id={session_id},"
                f" payment_intent_id={payment_intent_id},"
                f" payment_method={payment_method},"
                f" amount_total={amount},"
                f" currency={currency}"
            )

            # Создание платежа
            try:
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
                logger.debug(f"Payment created for order {order.id}")
            except Exception as e:
                logger.error(f"Error creating payment: {str(e)}")
                return False

            logger.info(f"Order {order.id} and Payment created successfully from webhook")
            return True

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return False

    @csrf_exempt
    def post(self, request):
        webhook_body = request.body.decode('utf-8')
        data = json.loads(webhook_body)
        logger.debug(f"Received webhook data: {data}")
        event_type = data.get('event_type')
        accepted_webhooks = (
            'CHECKOUT.ORDER.APPROVED',
        )

        logger.debug(f"Received event: {event_type}")

        if event_type in accepted_webhooks:
            is_verified = self.verify_webhook(request, webhook_body)

            if is_verified:
                logger.info("Webhook verification successful.")
                if event_type == 'CHECKOUT.ORDER.APPROVED':
                    success = self.create_order_from_webhook(data)
                    if success:
                        return Response({'status': 'Order and Payment created successfully'}, status=200)
                    else:
                        logger.error(f"Error creating order and payment for event: {event_type}")
                        return Response({'error': 'Error creating order and payment'}, status=500)
            else:
                logger.warning("Webhook verification failed.")
                return Response({'error': 'Invalid webhook signature'}, status=403)

        logger.info(f"Unhandled event type: {event_type}")
        return Response({'status': 'event not handled'}, status=200)
