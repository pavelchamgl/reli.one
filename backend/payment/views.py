import os
import json
import base64
import stripe
import logging
import binascii
import requests

from decimal import Decimal
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse, OpenApiExample
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .models import Payment
from accounts.models import CustomUser
from product.models import BaseProduct
from promocode.models import PromoCode
from order.models import (
    CourierService,
    Order,
    DeliveryType,
    OrderProduct,
    OrderStatus,
)

logging.basicConfig(level=logging.INFO)
clientID = os.environ.get("clientID")
clientSecret = os.environ.get("clientSecret")

stripe.api_key = "sk_test_51PNHLUFu0ltlaoJ6ODoNdt5MnlHG2HgbYBw2WfGSkPHPG6pDW5hS6u2mwougay1gp2H4Db3RiXFwQvtJ9csf3gKH00ZXistMnN"
endpoint_secret = "whsec_A29lEPmZrtSuwrwQdGJuF8P3JYrytZy6"

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


class CreateStripeCheckoutSession(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Creates a Stripe checkout session for product payment",
        request={
            'application/json': {
                'type': 'object',
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
                        'type': 'number',
                        'description': 'Type of delivery, e.g., 1 - Delivery point, 2 - Courier',
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
                        'description': 'Cost of delivery'
                    },
                    'courier_service_name': {
                        'type': 'number',
                        'description': 'ID of the courier service, e.g., 1 - PPL, 2 - GEIS, 3 - DPD',
                        'example': 1
                    },
                    'products': {
                        'type': 'array',
                        'description': 'List of products to be purchased',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'product_id': {
                                    'type': 'integer',
                                    'description': 'ID of the product'
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
                    'courier_service_name': 1,
                    'products': [
                        {'product_id': 1, 'quantity': 2},
                        {'product_id': 2, 'quantity': 1}
                    ]
                }
            }
        },
        responses={
            200: OpenApiResponse(
                description='URL of the created Stripe checkout session',
                response={'type': 'object', 'properties': {'url': {'type': 'string'}}}
            ),
            404: OpenApiResponse(description='Product not found'),
            400: OpenApiResponse(description='Invalid request data'),
        },
        examples=[
            OpenApiExample(
                name="CourierServiceExamples",
                value=[
                    {
                        "pk": 1,
                        "name": "PPL"
                    },
                    {
                        "pk": 2,
                        "name": "GEIS"
                    },
                    {
                        "pk": 3,
                        "name": "DPD"
                    }
                ],
                request_only=True,
                response_only=False,
            ),
            OpenApiExample(
                name="DeliveryTypeExamples",
                value=[
                    {
                        "pk": 1,
                        "name": "Delivery point"
                    },
                    {
                        "pk": 2,
                        "name": "Courier"
                    }
                ],
                request_only=True,
                response_only=False,
            ),
        ],
        tags=['Stripe']
    )
    def post(self, request, *args, **kwargs):
        user_id = 1  # request.user.id
        email = request.data.get("email")
        promocode = request.data.get("promocode")
        delivery_type = request.data.get("delivery_type")
        delivery_address = request.data.get("delivery_address")
        phone = request.data.get("phone")
        delivery_cost = request.data.get("delivery_cost", 0)
        courier_service_name = request.data.get("courier_service_name")
        products = request.data.get("products")

        try:
            delivery_cost = Decimal(delivery_cost)
        except ValueError:
            delivery_cost = Decimal('0.00')

        logger.debug(f"Delivery cost: {delivery_cost}")

        products_json = json.dumps(products)
        line_items = []
        total_price = delivery_cost

        logger.debug(f"Initial total price including delivery cost: {total_price}")

        for item in products:
            product_id = item['product_id']
            quantity = item['quantity']

            try:
                product = BaseProduct.objects.get(id=product_id)
            except BaseProduct.DoesNotExist:
                logger.error(f"Product with id {product_id} does not exist.")
                return Response({"error": f"Product with id {product_id} not found"}, status=status.HTTP_404_NOT_FOUND)

            price = product.price
            currency = 'EUR'

            if promocode:
                promo_code = PromoCode.objects.filter(code=promocode).first()
                if promo_code and promo_code.is_valid():
                    price = price - (price * Decimal(promo_code.discount_percentage) / Decimal('100.00'))

            line_items.append({
                'price_data': {
                    'currency': currency,
                    'unit_amount_decimal': f"{price * 100:.2f}",
                    'product_data': {
                        'name': product.name,
                    }
                },
                'quantity': quantity,
            })
            total_price += price * quantity

            logger.debug(f"Updated total price after adding product {product_id}: {total_price}")

        if delivery_cost > 0:
            line_items.append({
                'price_data': {
                    'currency': 'EUR',
                    'unit_amount_decimal': f"{delivery_cost * 100:.2f}",
                    'product_data': {
                        'name': 'Delivery Cost',
                    }
                },
                'quantity': 1,
            })

        logger.debug(f"Final total price including delivery cost: {total_price}")

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=settings.REDIRECT_DOMAIN + '/payment/success',
            cancel_url=settings.REDIRECT_DOMAIN + '/payment/cancel',
            metadata={
                'user_id': user_id,
                'email': email,
                'promo_code': promocode,
                'delivery_type': delivery_type,
                'delivery_address': delivery_address,
                'delivery_cost': str(delivery_cost),
                'courier_service_name': courier_service_name,
                'phone': phone,
                'products': products_json,
            }
        )

        return Response({'url': session.url}, status=status.HTTP_200_OK)


class StripeWebhookHandler(APIView):
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

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
        payload = request.body
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
            user_id = session['metadata']['user_id']
            customer_email = session['metadata']['email']
            delivery_type_id = session['metadata']['delivery_type']
            delivery_address = session['metadata'].get('delivery_address', None)
            delivery_cost = Decimal(session['metadata']['delivery_cost'])
            phone = session['metadata']['phone']
            products = json.loads(session['metadata']['products'])
            total_amount = Decimal(session['amount_total']) / Decimal('100.00')
            courier_service_name = session['metadata']['courier_service_name']
            customer_id = session.get('customer')

            try:
                delivery_type = DeliveryType.objects.get(id=delivery_type_id)
                user = CustomUser.objects.get(id=1)

                if not CourierService.objects.filter(id=courier_service_name).exists():
                    logger.error(f"Courier service with id {courier_service_name} does not exist.")
                    return Response(
                        {"error": f"Courier service with id {courier_service_name} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                courier_service = CourierService.objects.get(id=courier_service_name)

                try:
                    order_status = OrderStatus.objects.get(name="Pending")
                except OrderStatus.DoesNotExist:
                    logger.error("Order status 'Pending' does not exist.")
                    return Response({"error": "Order status 'Pending' not found"}, status=status.HTTP_404_NOT_FOUND)

                order = Order.objects.create(
                    user=user,
                    customer_email=customer_email,
                    delivery_type=delivery_type,
                    delivery_address=delivery_address,
                    delivery_cost=delivery_cost,
                    order_status=order_status,
                    phone_number=phone,
                    total_amount=total_amount,
                    courier_service=courier_service,
                )

                total_product_cost = sum(item['quantity'] * BaseProduct.objects.get(id=item['product_id']).price for item in products)
                rounded_delivery_costs = []
                total_rounded_delivery_cost = Decimal('0.00')

                for item in products:
                    product_id = item['product_id']
                    quantity = item['quantity']
                    product = BaseProduct.objects.get(id=product_id)

                    product_total_cost = quantity * product.price
                    product_delivery_cost = round((product_total_cost / total_product_cost) * delivery_cost, 2)
                    rounded_delivery_costs.append((product, quantity, product_delivery_cost, product.price))
                    total_rounded_delivery_cost += product_delivery_cost

                difference = delivery_cost - total_rounded_delivery_cost
                if rounded_delivery_costs:
                    last_product, last_quantity, last_cost, last_price = rounded_delivery_costs[-1]
                    rounded_delivery_costs[-1] = (last_product, last_quantity, last_cost + difference, last_price)

                for product, quantity, delivery_cost, product_price in rounded_delivery_costs:
                    OrderProduct.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        delivery_cost=delivery_cost,
                        supplier=product.supplier,
                        product_price=product_price
                    )

                Payment.objects.create(
                    order=order,
                    payment_system='stripe',
                    session_id=session['id'],
                    customer_id=customer_id,
                    payment_intent_id=session['payment_intent'],
                    payment_method=session['payment_method_types'][0],
                    amount_total=total_amount,
                    currency=session['currency'].upper(),
                    customer_email=customer_email,
                )

            except Exception as e:
                logger.error(f"Error processing order: {e}")
                return Response(status=500)
        else:
            logger.warning(f"Unhandled event type {event['type']}")

        return Response(status=200)


class CreatePayPalPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = 1  # request.user.id
        email = request.data.get("email")
        promocode = request.data.get("promocode")
        delivery_type = request.data.get("delivery_type")
        delivery_address = request.data.get("delivery_address")
        phone = request.data.get("phone")
        delivery_cost = Decimal(request.data.get("delivery_cost", 0))
        courier_service_name = request.data.get("courier_service_name")
        products = request.data.get("products")

        logger.debug(f"Delivery cost: {delivery_cost}")

        line_items = []
        total_price = Decimal(0)

        for item in products:
            product_id = item['product_id']
            quantity = item['quantity']

            try:
                product = BaseProduct.objects.get(id=product_id)
            except BaseProduct.DoesNotExist:
                logger.error(f"Product with id {product_id} does not exist.")
                return Response({"error": f"Product with id {product_id} not found"}, status=status.HTTP_404_NOT_FOUND)

            price = Decimal(product.price)
            currency = 'EUR'

            if promocode:
                promo_code = PromoCode.objects.filter(code=promocode).first()
                if promo_code and promo_code.is_valid():
                    price = price - (price * Decimal(promo_code.discount_percentage) / Decimal(100))

            line_items.append({
                "sku": str(product.id),
                "name": product.name,
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

        invoice_data = {
            "delivery_type": delivery_type,
            "delivery_address": delivery_address,
        }

        description_data = {
            "delivery_cost": f"{delivery_cost:.2f}",
            "courier_service_name": courier_service_name,
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
                "return_url": settings.REDIRECT_DOMAIN + '/payment/success',
                "cancel_url": settings.REDIRECT_DOMAIN + '/payment/cancel',
            }
        }

        response = requests.post("https://api-m.sandbox.paypal.com/v2/checkout/orders", headers=headers, data=json.dumps(data))

        if response.status_code == 201:
            order_response = response.json()
            return Response({'order_id': order_response['id'], 'approval_url': order_response['links'][1]['href']}, status=status.HTTP_200_OK)
        else:
            return Response(response.json(), status=response.status_code)

    def get_paypal_access_token(self):
        client_id = settings.PAYPAL_CLIENT_ID
        client_secret = settings.PAYPAL_CLIENT_SECRET
        response = requests.post(
            'https://api-m.sandbox.paypal.com/v1/oauth2/token',
            headers={
                'Accept': 'application/json',
            },
            data={'grant_type': 'client_credentials'},
            auth=(client_id, client_secret)
        )
        response_data = response.json()
        return response_data['access_token']


class PayPalWebhookView(APIView):
    permission_classes = [AllowAny]

    def create_order_from_webhook(self, data):
        resource = data['resource']
        logger.debug(f"Resource data: {resource}")

        purchase_units = resource.get('purchase_units', [])
        if not purchase_units:
            logger.error(f"purchase_units отсутствуют в данных ресурса: {resource}")
            raise KeyError('purchase_units')

        purchase_unit = purchase_units[0]
        amount = Decimal(purchase_unit['amount']['breakdown']['item_total']['value'])
        currency = purchase_unit['amount']['currency_code']
        logger.debug(f"Amount: {amount}, Currency: {currency}")

        logger.debug(f"PURCHASE UNIT: {purchase_unit=}")

        custom_data = json.loads(purchase_unit.get('custom_id'))
        invoice_data = json.loads(purchase_unit.get('invoice_id'))
        description_data = json.loads(purchase_unit.get('description'))
        logger.debug(f"Custom data: {custom_data}, Invoice data: {invoice_data}, Description data: {description_data}")

        user_id = custom_data.get('user_id')
        email = custom_data.get('email')
        promocode = custom_data.get('promo_code')
        phone = custom_data.get('phone')
        logger.debug(f"User data: user_id={user_id}, email={email}, promocode={promocode}, phone={phone}")

        delivery_type = invoice_data.get('delivery_type')
        delivery_address = invoice_data.get('delivery_address')
        delivery_cost = Decimal(description_data.get('delivery_cost'))
        courier_service_name = description_data.get('courier_service_name')  # Не преобразуем в строку сразу
        logger.debug(f"Delivery data: delivery_type={delivery_type}, delivery_address={delivery_address}, delivery_cost={delivery_cost}, courier_service_name={courier_service_name}")

        try:
            order_status = OrderStatus.objects.get(name="Pending")
        except OrderStatus.DoesNotExist:
            logger.error("Order status 'Pending' does not exist.")
            return Response({"error": "Order status 'Pending' not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            user = CustomUser.objects.get(id=user_id)
            if delivery_type:
                delivery_type_obj = DeliveryType.objects.get(id=delivery_type)
            else:
                delivery_type_obj = None

            if courier_service_name is None:
                logger.error("Courier service name is None")
                return Response({"error": "Courier service name is None"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                courier_service_name = str(courier_service_name)
                logger.debug(f"Courier service name: {courier_service_name}")
                try:
                    courier_service_id = int(courier_service_name)
                except ValueError as e:
                    logger.error(f"Error converting courier_service_name to int: {str(e)}")
                    return Response({"error": f"Invalid courier service name: {courier_service_name}"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                courier_service = CourierService.objects.get(id=courier_service_id)
            except CourierService.DoesNotExist:
                logger.error(f"CourierService with id {courier_service_id} does not exist.")
                return Response({"error": "CourierService not found"}, status=status.HTTP_404_NOT_FOUND)

            order = Order.objects.create(
                user=user,
                customer_email=email,
                delivery_type=delivery_type_obj,
                delivery_address=delivery_address,
                delivery_cost=delivery_cost,
                order_status=order_status,
                phone_number=phone,
                total_amount=amount + delivery_cost,
                courier_service=courier_service,
            )
            logger.debug(f"Order created: {order}")

            for item in purchase_unit.get('items', []):
                product_id = int(item.get('sku'))
                quantity = int(item.get('quantity'))
                product = get_object_or_404(BaseProduct, id=product_id)
                OrderProduct.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    delivery_cost=delivery_cost,
                    supplier=product.supplier,
                    product_price=product.price,
                )
                logger.debug(f"OrderProduct created for product_id {product_id}")

            # Извлечение данных для платежа
            session_id = resource.get('id', 'unknown_session_id')
            payment_intent_id = resource.get('id', 'unknown_intent_id')
            payment_source = resource.get('payment_source', {}).get('paypal', {})
            payment_method = payment_source.get('name', {}).get('given_name', 'paypal')

            logger.debug(f"Payment data before creation: session_id={session_id}, payment_intent_id={payment_intent_id}, payment_method={payment_method}, amount_total={amount}, currency={currency}")

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

            logger.info(f"Order {order.id} created successfully from webhook")
            return True

        except CustomUser.DoesNotExist:
            logger.error(f"User with id {user_id} does not exist.")
            return False

        except DeliveryType.DoesNotExist:
            logger.error(f"DeliveryType with id {delivery_type} does not exist.")
            return False

        except CourierService.DoesNotExist:
            logger.error(f"CourierService with id {courier_service_name} does not exist.")
            return False

        except BaseProduct.DoesNotExist:
            logger.error(f"Product with id {product_id} does not exist.")
            return False

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return False

    def post(self, request):
        data = request.data
        logger.debug(f"Received webhook data: {data}")
        event_type = data.get('event_type')
        accepted_webhooks = (
            'PAYMENT.CAPTURE.REVERSED',
            'PAYMENT.CAPTURE.REFUNDED',
            'PAYMENT.CAPTURE.DENIED',
            'PAYMENT.CAPTURE.COMPLETED',
            'CHECKOUT.ORDER.APPROVED',
        )

        logger.debug(f"Received event: {event_type}")

        if event_type in accepted_webhooks:
            transmission_id = request.headers.get('paypal-transmission-id')
            transmission_time = request.headers.get('paypal-transmission-time')
            cert_url = request.headers.get('paypal-cert-url')
            actual_signature = request.headers.get('paypal-transmission-sig')

            logger.debug(
                f"Headers received: {transmission_id=}, {transmission_time=}, {cert_url=}, {actual_signature=}")

            is_verified = True  # Здесь мы временно устанавливаем верификацию как успешную

            if not is_verified:
                logger.warning(f"Webhook verification failed for event: {event_type}")
                return Response({'error': 'Invalid webhook signature'}, status=403)

            if event_type in ['PAYMENT.CAPTURE.COMPLETED', 'CHECKOUT.ORDER.APPROVED']:
                success = self.create_order_from_webhook(data)
                if success:
                    return Response({'status': 'Order created successfully'}, status=200)
                else:
                    logger.error(f"Error creating order for event: {event_type}")
                    return Response({'error': 'Error creating order'}, status=500)

        logger.info(f"Unhandled event type: {event_type}")
        return Response({'status': 'event not handled'}, status=200)
