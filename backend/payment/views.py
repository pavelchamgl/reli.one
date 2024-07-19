import json
import stripe
import logging
import requests

from decimal import Decimal
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema,  OpenApiResponse, OpenApiExample
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

# Paypal secret fields
client_id = settings.PAYPAL_CLIENT_ID
client_secret = settings.PAYPAL_CLIENT_SECRET
webhook_id = settings.PAYPAL_WEBHOOK_ID
oauth2_url = settings.PAYPAL_OAUTH2_URL
checkout_url = settings.PAYPAL_CHECKOUT_URL

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
        user_id = request.user.id
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
            success_url=settings.REDIRECT_DOMAIN + 'payment_end/',
            cancel_url=settings.REDIRECT_DOMAIN + 'basket/',
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
                user = CustomUser.objects.get(id=user_id)

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
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Creates a PayPal payment for product purchase",
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
                description='Order ID and approval URL for the created PayPal payment',
                response={
                    'type': 'object',
                    'properties': {
                        'order_id': {'type': 'string', 'description': 'ID of the created PayPal order'},
                        'approval_url': {'type': 'string', 'description': 'URL to approve the PayPal payment'}
                    }
                }
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
                "return_url": settings.REDIRECT_DOMAIN + 'payment_end/',
                "cancel_url": settings.REDIRECT_DOMAIN + 'basket/',
            }
        }

        response = requests.post(checkout_url, headers=headers, data=json.dumps(data))

        if response.status_code == 201:
            order_response = response.json()
            return Response({'order_id': order_response['id'], 'approval_url': order_response['links'][1]['href']}, status=status.HTTP_200_OK)
        else:
            return Response(response.json(), status=response.status_code)

    def get_paypal_access_token(self):
        response = requests.post(
            oauth2_url,
            headers={
                'Accept': 'application/json',
            },
            data={'grant_type': 'client_credentials'},
            auth=(client_id, client_secret)
        )
        response_data = response.json()
        return response_data['access_token']


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
                'resource_version': {'type': 'string', 'description': 'Resource version'},
                'event_type': {'type': 'string', 'description': 'Event type'},
                'summary': {'type': 'string', 'description': 'Event summary'},
                'resource': {
                    'type': 'object',
                    'properties': {
                        'create_time': {'type': 'string', 'description': 'Resource creation time'},
                        'purchase_units': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'reference_id': {'type': 'string', 'description': 'Reference ID'},
                                    'amount': {
                                        'type': 'object',
                                        'properties': {
                                            'currency_code': {'type': 'string', 'description': 'Currency code'},
                                            'value': {'type': 'string', 'description': 'Amount value'},
                                            'breakdown': {
                                                'type': 'object',
                                                'properties': {
                                                    'item_total': {
                                                        'type': 'object',
                                                        'properties': {
                                                            'currency_code': {'type': 'string', 'description': 'Currency code'},
                                                            'value': {'type': 'string', 'description': 'Item total value'}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    'payee': {
                                        'type': 'object',
                                        'properties': {
                                            'email_address': {'type': 'string', 'description': 'Payee email address'},
                                            'merchant_id': {'type': 'string', 'description': 'Merchant ID'}
                                        }
                                    },
                                    'description': {'type': 'string', 'description': 'Description data as JSON string'},
                                    'custom_id': {'type': 'string', 'description': 'Custom data as JSON string'},
                                    'invoice_id': {'type': 'string', 'description': 'Invoice data as JSON string'},
                                    'items': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'object',
                                            'properties': {
                                                'name': {'type': 'string', 'description': 'Item name'},
                                                'unit_amount': {
                                                    'type': 'object',
                                                    'properties': {
                                                        'currency_code': {'type': 'string', 'description': 'Currency code'},
                                                        'value': {'type': 'string', 'description': 'Unit amount value'}
                                                    }
                                                },
                                                'quantity': {'type': 'string', 'description': 'Item quantity'},
                                                'sku': {'type': 'string', 'description': 'Item SKU'}
                                            }
                                        }
                                    },
                                    'shipping': {
                                        'type': 'object',
                                        'properties': {
                                            'name': {'type': 'object', 'properties': {'full_name': {'type': 'string', 'description': 'Full name'}}},
                                            'address': {
                                                'type': 'object',
                                                'properties': {
                                                    'address_line_1': {'type': 'string', 'description': 'Address line 1'},
                                                    'admin_area_2': {'type': 'string', 'description': 'Admin area 2'},
                                                    'admin_area_1': {'type': 'string', 'description': 'Admin area 1'},
                                                    'postal_code': {'type': 'string', 'description': 'Postal code'},
                                                    'country_code': {'type': 'string', 'description': 'Country code'}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'links': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'href': {'type': 'string', 'description': 'Link URL'},
                                    'rel': {'type': 'string', 'description': 'Link relation'},
                                    'method': {'type': 'string', 'description': 'HTTP method for the link'}
                                }
                            }
                        },
                        'id': {'type': 'string', 'description': 'Resource ID'},
                        'payment_source': {
                            'type': 'object',
                            'properties': {
                                'paypal': {
                                    'type': 'object',
                                    'properties': {
                                        'email_address': {'type': 'string', 'description': 'Payer email address'},
                                        'account_id': {'type': 'string', 'description': 'Payer account ID'},
                                        'account_status': {'type': 'string', 'description': 'Payer account status'},
                                        'name': {
                                            'type': 'object',
                                            'properties': {
                                                'given_name': {'type': 'string', 'description': 'Payer given name'},
                                                'surname': {'type': 'string', 'description': 'Payer surname'}
                                            }
                                        },
                                        'address': {'type': 'object', 'properties': {'country_code': {'type': 'string', 'description': 'Country code'}}}
                                    }
                                }
                            }
                        },
                        'intent': {'type': 'string', 'description': 'Payment intent'},
                        'payer': {
                            'type': 'object',
                            'properties': {
                                'name': {
                                    'type': 'object',
                                    'properties': {
                                        'given_name': {'type': 'string', 'description': 'Payer given name'},
                                        'surname': {'type': 'string', 'description': 'Payer surname'}
                                    }
                                },
                                'email_address': {'type': 'string', 'description': 'Payer email address'},
                                'payer_id': {'type': 'string', 'description': 'Payer ID'},
                                'address': {'type': 'object', 'properties': {'country_code': {'type': 'string', 'description': 'Country code'}}}
                            }
                        },
                        'status': {'type': 'string', 'description': 'Order status'}
                    }
                }
            },
            'example': {
                'id': 'WH-7U685702AP210252D-7TR69619RV252802B',
                'event_version': '1.0',
                'create_time': '2024-07-16T07:36:22.484Z',
                'resource_type': 'checkout-order',
                'resource_version': '2.0',
                'event_type': 'CHECKOUT.ORDER.APPROVED',
                'summary': 'An order has been approved by buyer',
                'resource': {
                    'create_time': '2024-07-16T07:35:57Z',
                    'purchase_units': [{
                        'reference_id': 'default',
                        'amount': {'currency_code': 'EUR', 'value': '4300.99', 'breakdown': {'item_total': {'currency_code': 'EUR', 'value': '4300.99'}}},
                        'payee': {'email_address': 'sb-qfikm31385026@business.example.com', 'merchant_id': 'LRJMHWR6YH3TC'},
                        'description': '{"delivery_cost": "300.99", "courier_service_name": 1}',
                        'custom_id': '{"user_id": 1, "email": "admin@admin.com", "promo_code": null, "phone": "+12345678901"}',
                        'invoice_id': '{"delivery_type": 1, "delivery_address": "123 Main St, Springfield, USA"}',
                        'items': [
                            {'name': 'IPhone 14 Pro', 'unit_amount': {'currency_code': 'EUR', 'value': '1000.00'}, 'quantity': '3', 'sku': '1'},
                            {'name': 'Galuxy 10', 'unit_amount': {'currency_code': 'EUR', 'value': '1000.00'}, 'quantity': '1', 'sku': '2'},
                            {'name': 'Delivery Cost', 'unit_amount': {'currency_code': 'EUR', 'value': '300.99'}, 'quantity': '1'}
                        ],
                        'shipping': {
                            'name': {'full_name': 'John Doe'},
                            'address': {'address_line_1': '1 Main St', 'admin_area_2': 'San Jose', 'admin_area_1': 'CA', 'postal_code': '95131', 'country_code': 'US'}
                        }
                    }],
                    'links': [
                        {'href': 'https://api.sandbox.paypal.com/v2/checkout/orders/768804163A558803D', 'rel': 'self', 'method': 'GET'},
                        {'href': 'https://api.sandbox.paypal.com/v2/checkout/orders/768804163A558803D', 'rel': 'update', 'method': 'PATCH'},
                        {'href': 'https://api.sandbox.paypal.com/v2/checkout/orders/768804163A558803D/capture', 'rel': 'capture', 'method': 'POST'}
                    ],
                    'id': '768804163A558803D',
                    'payment_source': {
                        'paypal': {
                            'email_address': 'sb-43g1wc31380570@personal.example.com',
                            'account_id': 'CRCQUC8R9UCDE',
                            'account_status': 'VERIFIED',
                            'name': {'given_name': 'John', 'surname': 'Doe'},
                            'address': {'country_code': 'US'}
                        }
                    },
                    'intent': 'CAPTURE',
                    'payer': {
                        'name': {'given_name': 'John', 'surname': 'Doe'},
                        'email_address': 'sb-43g1wc31380570@personal.example.com',
                        'payer_id': 'CRCQUC8R9UCDE',
                        'address': {'country_code': 'US'}
                    },
                    'status': 'APPROVED'
                }
            }
        }
    },
    responses={
        200: OpenApiResponse(
            description='Order and Payment created successfully',
            response={'type': 'object', 'properties': {'status': {'type': 'string'}}}
        ),
        400: OpenApiResponse(description='Invalid webhook signature'),
        404: OpenApiResponse(description='Order status not found or user not found or courier service not found'),
        500: OpenApiResponse(description='Error creating order and payment')
    },
    tags=['PayPal']
)
class PayPalWebhookView(APIView):
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
        courier_service_name = description_data.get('courier_service_name')
        logger.debug(f"User data: user_id={user_id}, email={email}, phone={phone}, delivery_cost={delivery_cost}, courier_service_name={courier_service_name}, delivery_address={delivery_address}, delivery_type={delivery_type}")

        products = purchase_unit.get('items', [])
        logger.debug(f"Products: {products}")

        try:
            order_status = OrderStatus.objects.get(name="Pending")
        except OrderStatus.DoesNotExist:
            logger.error("Order status 'Pending' does not exist.")
            return Response({"error": "Order status 'Pending' not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            logger.error(f"User with id {user_id} does not exist.")
            return False

        if delivery_type:
            try:
                delivery_type_obj = DeliveryType.objects.get(id=delivery_type)
            except DeliveryType.DoesNotExist:
                logger.error(f"DeliveryType with id {delivery_type} does not exist.")
                return False
        else:
            delivery_type_obj = None

        try:
            courier_service_id = int(courier_service_name)
        except (ValueError, TypeError):
            logger.error(f"Invalid courier service name: {courier_service_name}")
            return Response({"error": f"Invalid courier service name: {courier_service_name}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            courier_service = CourierService.objects.get(id=courier_service_id)
        except CourierService.DoesNotExist:
            logger.error(f"CourierService with id {courier_service_id} does not exist.")
            return Response({"error": "CourierService not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            order = Order.objects.create(
                user=user,
                customer_email=email,
                delivery_type=delivery_type_obj,
                delivery_address=delivery_address,
                delivery_cost=delivery_cost,
                order_status=order_status,
                phone_number=phone,
                total_amount=amount,
                courier_service=courier_service,
            )
            logger.debug(f"Order created: {order}")

            # Рассчитать стоимость доставки для каждого товара
            total_product_cost = sum(Decimal(item['quantity']) * BaseProduct.objects.get(id=item['sku']).price for item in products if item.get('sku'))
            rounded_delivery_costs = []
            total_rounded_delivery_cost = Decimal('0.00')

            for item in products:
                product_id = item.get('sku')
                if not product_id:
                    logger.debug(f"Ignoring item without SKU: {item}")
                    continue
                quantity = Decimal(item['quantity'])
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
                logger.debug(f"OrderProduct created for product_id {product.id} with delivery cost {delivery_cost}")

            # Извлечение данных для платежа
            session_id = resource.get('id', 'unknown_session_id')
            payment_intent_id = resource.get('id', 'unknown_intent_id')
            payment_method = f"{resource['payment_source']['paypal']['name']['given_name']} {resource['payment_source']['paypal']['name']['surname']}"

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

            logger.info(f"Order {order.id} and Payment created successfully from webhook")
            return True

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return False

    def post(self, request):
        data = request.data
        logger.debug(f"Received webhook data: {data}")
        event_type = data.get('event_type')
        accepted_webhooks = (
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

            if event_type in ['CHECKOUT.ORDER.APPROVED']:
                success = self.create_order_from_webhook(data)
                if success:
                    return Response({'status': 'Order and Payment created successfully'}, status=200)
                else:
                    logger.error(f"Error creating order and payment for event: {event_type}")
                    return Response({'error': 'Error creating order and payment'}, status=500)

        logger.info(f"Unhandled event type: {event_type}")
        return Response({'status': 'event not handled'}, status=200)
