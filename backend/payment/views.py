import base64
import os
from backend.settings import REDIRECT_DOMAIN
import requests
from rest_framework.exceptions import ValidationError
from rest_framework import status
from django.utils import timezone
from chipBasket.models import BasketItem
from promocode.models import PromoCode
import stripe
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from rest_framework.views import APIView
from order.models import OrderItem
import logging

logging.basicConfig(level=logging.INFO)
clientID = os.environ.get("clientID")
clientSecret = os.environ.get("clientSecret")





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

    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY_TEST")
    user_basket = request.user.chips_basket

    if user_basket:
        basket_items = BasketItem.objects.filter(basket=user_basket)

    else:
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    line_items = []

    for item in range(len(basket_items)):
        name = basket_items[item].product
        currency = 'czk'
        price = basket_items[item].product.price
        item = {
            'price_data': {
                'currency': currency,
                'unit_amount': price * 100,
                'product_data': {
                    'name': name
                }
            },
            'quantity': basket_items[item].quantity,
        }
        line_items.append(item)
    checkout_session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=line_items,
        mode='payment',
        allow_promotion_codes=True,
        customer_creation='always',
        success_url=settings.REDIRECT_DOMAIN + '/api/stripe_check_session?session_id={CHECKOUT_SESSION_ID}',
        cancel_url=settings.REDIRECT_DOMAIN + '/payment_cancelled',
    )
    return Response({'url': checkout_session.url}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_check_session(request):
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY_TEST")

    session_id = request.GET.get('session_id')
    print(session_id)
    checkout_session = stripe.checkout.Session.retrieve(session_id)

    statusStripe = checkout_session.payment_status
    if statusStripe == 'paid':
            total_price = request.user.chips_basket.calculate_total_price()
            promo_code = request.GET.get('promo_code', None)
            order = OrderItem(user=request.user,
                              order_date=timezone.now(),
                              total_amount=total_price,
                              promo_code=promo_code,
                              user_basket=request.user.chips_basket)
            order.save()
            return Response(status=status.HTTP_200_OK)
    elif statusStripe == 'unpaid':
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return Response("ПЕРЕМОГА ваще не БУДЕ")







def PaypalToken(client_ID, client_Secret):
    url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"

    data = {
        "client_id": client_ID,
        "client_secret": client_Secret,
        "grant_type": "client_credentials"
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic {0}".format(base64.b64encode((client_ID + ":" + client_Secret).encode()).decode())
    }

    token = requests.post(url, data, headers=headers)
    return token.json()['access_token']


class CreateOrderViewRemote(APIView):
    def get(self, request):
        url = "https://api-m.sandbox.paypal.com/v2/checkout/orders"
        token = PaypalToken(clientID, clientSecret)
        user_basket = request.user.chips_basket
        if user_basket:
            basket_items = BasketItem.objects.filter(basket=user_basket)

        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        items = []
        total_price = 0
        for item in range(len(basket_items)):
            name = basket_items[item].product.name
            currency = 'czk'
            price = basket_items[item].product.price
            item = {
                "name": name,
                "quantity": basket_items[item].quantity,
                "unit_amount": {
                    "currency_code": "CZK",
                    "value": price
                }

            }
            total_price += price
            items.append(item)

        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
        total_value = sum(item["quantity"] * item["unit_amount"]["value"] for item in items)
        json_data = {
            "intent": "CAPTURE",
            "application_context": {
                "return_url": REDIRECT_DOMAIN + "/api/check_and_create_order/",
                "cancel_url": REDIRECT_DOMAIN,
            },
            "purchase_units": [
                {
                    'reference_id': "default",
                    "amount": {
                        "currency_code": "CZK",
                        "value": str(total_value),
                        "breakdown": {
                            "item_total": {
                                "currency_code": "CZK",
                                "value": str(total_value),
                            }
                        }
                    },
                    "items": items,
                    "payment_instruction": {
                        "disbursement_mode": "INSTANT",
                    },
                    "payment_capture": {
                        "payment_mode": "INSTANT_CAPTURE",
                    }
                }
            ]
        }

        response = requests.post(url, json=json_data, headers=headers)
        order_id = response.json()["id"]

        return_url = REDIRECT_DOMAIN + f"/api/check_and_create_order/?order_id={order_id}"
        return Response(response)


@api_view(('GET',))
@permission_classes([IsAuthenticated])
def check_and_create_order(request):
    token = request.GET.get('token')  # Извлеките token из query parameters
    payer_id = request.GET.get('PayerID')  # Извлеките user_id из query parameters

    if token and payer_id:
        tokenPaypal = PaypalToken(clientID, clientSecret)
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tokenPaypal
        }

        response = requests.get(f'https://api-m.sandbox.paypal.com/v2/checkout/orders/{token}',
                                headers=headers)

        status_payment = response.json()['status']
        if status_payment == "APPROVED":
            total_price = request.user.chips_basket.calculate_total_price()
            # Используйте order_id и user_id для создания заказа
            token = PaypalToken(clientID, clientSecret)
            promo_code = request.GET.get('promo_code', None)
            order = OrderItem(user=request.user,
                              order_date=timezone.now(),
                              total_amount=total_price,
                              promo_code=promo_code,
                              user_basket=request.user.chips_basket)
            order.save()
            return Response(status=status.HTTP_200_OK)
        else:
            pass
    else:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    


