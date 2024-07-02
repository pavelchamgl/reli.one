import os
import json
import uuid
import base64
import stripe
import logging
import requests

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes

from accounts.models import CustomUser
from product.models import BaseProduct
from order.models import DeliveryType
from promocode.models import PromoCode
from order.models import (
    Order,
    OrderProduct,
)

logging.basicConfig(level=logging.INFO)
clientID = os.environ.get("clientID")
clientSecret = os.environ.get("clientSecret")

stripe.api_key = "sk_test_51PNHLUFu0ltlaoJ6ODoNdt5MnlHG2HgbYBw2WfGSkPHPG6pDW5hS6u2mwougay1gp2H4Db3RiXFwQvtJ9csf3gKH00ZXistMnN"
endpoint_secret = "whsec_5e2fbe344a3d42d347585d8c6ead0e6754b08f03fed825bc778d31f12e145caf"

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    promocode = request.data.get("promocode")
    delivery_type = request.data.get("delivery_type")
    delivery_address = request.data.get("delivery_address")
    phone = request.data.get("phone")
    products = request.data.get("products")

    products_json = json.dumps(products)

    line_items = []
    total_price = 0

    for item in products:
        product_id = item['product_id']
        quantity = item['quantity']
        product = BaseProduct.objects.get(id=product_id)

        price = product.price
        currency = 'CZK'

        if promocode:
            promo_code = PromoCode.objects.filter(code=promocode).first()
            if promo_code and promo_code.is_valid():
                price = price - (price * promo_code.discount_percentage / 100)

        line_items.append({
            'price_data': {
                'currency': currency,
                'unit_amount': int(price * 100),
                'product_data': {
                    'name': product.name,
                }
            },
            'quantity': quantity,
        })
        total_price += price * quantity

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=line_items,
        mode='payment',
        success_url=settings.REDIRECT_DOMAIN + '/payment/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url=settings.REDIRECT_DOMAIN + '/payment/cancel',
        metadata={
            'user_id': 1, #request.user.id,
            'promo_code': promocode,
            'delivery_type': delivery_type,
            'delivery_address': delivery_address,
            'phone': phone,
            'products': products_json,
        }
    )

    return Response({'url': session.url}, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        customer_email = session['customer_details']['email']
        delivery_type_id = session['metadata']['delivery_type']
        delivery_address = session['metadata'].get('delivery_address', None)
        phone = session['metadata']['phone']
        products = json.loads(session['metadata']['products'])
        total_amount = int(session['amount_total'] / 100)

        delivery_type = DeliveryType.objects.get(id=delivery_type_id)
        user = CustomUser.objects.get(id=user_id)

        order = Order.objects.create(
            user=user,
            delivery_type=delivery_type,
            delivery_address=delivery_address,
            phone=phone,
            total_amount=total_amount,
        )
        order.save()

        for item in products:
            product_id = item['product_id']
            quantity = item['quantity']
            product = BaseProduct.objects.get(id=product_id)

            OrderProduct.objects.create(
                order=order,
                product=product,
                quantity=quantity,
            )

    return Response(status=status.HTTP_200_OK)


class CreatePayPalPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        promocode = request.data.get("promocode")
        delivery_type = request.data.get("delivery_type")
        delivery_address = request.data.get("delivery_address")
        phone = request.data.get("phone")
        products = request.data.get("products")
        user_id = 1 #request.get.user.id

        line_items = []
        total_price = 0

        for item in products:
            product_id = item['product_id']
            quantity = item['quantity']
            product = BaseProduct.objects.get(id=product_id)

            price = product.price
            currency = 'CZK'

            if promocode:
                promo_code = PromoCode.objects.filter(code=promocode).first()
                if promo_code and promo_code.is_valid():
                    price = price - (price * promo_code.discount_percentage / 100)

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

        access_token = self.get_paypal_access_token()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }

        invoice_id = str(uuid.uuid4())

        custom_data = {
            "delivery_type": delivery_type,
            "delivery_address": delivery_address,
            "phone": phone,
            "user_id": user_id,
        }
        encoded_custom_data = base64.urlsafe_b64encode(json.dumps(custom_data).encode()).decode()

        data = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": "CZK",
                        "value": f"{total_price:.2f}",
                        "breakdown": {
                            "item_total": {
                                "currency_code": "CZK",
                                "value": f"{total_price:.2f}",
                            }
                        }
                    },
                    "description": "Order description",
                    "items": line_items,
                    "custom_id": encoded_custom_data,
                    "invoice_id": invoice_id,
                }
            ],
            "application_context": {
                "return_url": settings.REDIRECT_DOMAIN + '/paypal/ok/',
                "cancel_url": settings.REDIRECT_DOMAIN + '/paypal/cancel/',
            }
        }

        response = requests.post("https://api-m.sandbox.paypal.com/v2/checkout/orders", headers=headers, data=json.dumps(data))

        if response.status_code == 201:
            order = response.json()
            return Response({'order_id': order['id'], 'approval_url': order['links'][1]['href']}, status=status.HTTP_200_OK)
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

        # Извлечение данных из purchase_units
        purchase_units = resource.get('purchase_units', [])
        if not purchase_units:
            logger.error(f"purchase_units отсутствуют в данных ресурса: {resource}")
            raise KeyError('purchase_units')

        purchase_unit = purchase_units[0]
        amount = purchase_unit['amount']['breakdown']['item_total']['value']

        logger.debug(f"PURCHASE UNIT: {purchase_unit=}")

        encoded_custom_data = purchase_unit.get('custom_id')
        if not encoded_custom_data:
            logger.error(f"custom_id отсутствует в данных ресурса: {resource}")
            raise KeyError('custom_id')

        try:
            custom_data = json.loads(base64.urlsafe_b64decode(encoded_custom_data).decode())
        except Exception as e:
            logger.error(f"Ошибка декодирования custom_id: {str(e)}")
            raise ValueError('Invalid custom_id encoding')

        delivery_type = custom_data.get('delivery_type')
        delivery_address = custom_data.get('delivery_address')
        phone = custom_data.get('phone')
        user_id = custom_data.get('user_id')

        logger.debug(f"Decoded custom_id data: {custom_data}")

        try:
            user = CustomUser.objects.get(id=user_id)
            if delivery_type:
                delivery_type_obj = DeliveryType.objects.get(id=delivery_type)
            else:
                delivery_type_obj = None

            order = Order.objects.create(
                user=user,
                delivery_type=delivery_type_obj,
                delivery_address=delivery_address,
                phone=phone,
                total_amount=float(amount),
            )

            items = purchase_unit.get('items', [])
            for item in items:
                product_id = int(item.get('sku'))
                quantity = int(item.get('quantity'))
                product = get_object_or_404(BaseProduct, id=product_id)
                OrderProduct.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                )
            logger.info(f"Order {order.id} created successfully from webhook")
            return True

        except CustomUser.DoesNotExist:
            logger.error(f"User with id {user_id} does not exist.")
            return False

        except DeliveryType.DoesNotExist:
            logger.error(f"DeliveryType with id {delivery_type} does not exist.")
            return False

        except BaseProduct.DoesNotExist:
            logger.error(f"Product with id {product_id} does not exist.")
            return False

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return False

    def post(self, request):
        data = request.data
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

            # Отключение верификации для отладки (НЕ рекомендуется для продакшн-окружения)
            # is_verified = self.verify_signature(transmission_id, transmission_time, settings.PAYPAL_WEBHOOK_ID, json.dumps(data), cert_url, actual_signature)
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
