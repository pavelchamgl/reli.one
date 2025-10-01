import json
import requests
import logging
from django.conf import settings
from django.core.cache import cache
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

PAYPAL_API_URL = settings.PAYPAL_API_URL


class PayPalMixin:
    def get_paypal_access_token(self):
        token = cache.get('paypal_access_token')
        if token:
            return token

        client_id = settings.PAYPAL_CLIENT_ID
        client_secret = settings.PAYPAL_CLIENT_SECRET
        try:
            response = requests.post(
                f'{PAYPAL_API_URL}/v1/oauth2/token',
                headers={
                    'Accept': 'application/json',
                    'Accept-Language': 'en_US',
                },
                data={'grant_type': 'client_credentials'},
                auth=(client_id, client_secret),
                timeout=10
            )
            response.raise_for_status()
        except RequestException as e:
            logger.error(f"HTTP error while obtaining PayPal access token: {e}")
            return None

        response_data = response.json()
        token = response_data.get('access_token')
        if token:
            expires_in = response_data.get('expires_in', 32400)
            cache.set('paypal_access_token', token, expires_in - 60)
            return token
        else:
            logger.error(f"Access token not found in response: {response_data}")
            return None

    def verify_webhook(self, request, webhook_body):
        # Получаем заголовки для верификации
        transmission_id = request.headers.get('paypal-transmission-id')
        transmission_time = request.headers.get('paypal-transmission-time')
        cert_url = request.headers.get('paypal-cert-url')
        actual_signature = request.headers.get('paypal-transmission-sig')
        auth_algo = request.headers.get('paypal-auth-algo')
        webhook_id = settings.PAYPAL_WEBHOOK_ID

        logger.debug(
            f"Headers received: transmission_id={transmission_id}, transmission_time={transmission_time}, cert_url={cert_url}, actual_signature={actual_signature}, auth_algo={auth_algo}"
        )

        # Получаем доступ к PayPal
        access_token = self.get_paypal_access_token()
        if not access_token:
            logger.error("Unable to obtain PayPal access token for webhook verification.")
            return False

        # Формируем данные для проверки
        verification_data = {
            'transmission_id': transmission_id,
            'transmission_time': transmission_time,
            'cert_url': cert_url,
            'auth_algo': auth_algo,
            'transmission_sig': actual_signature,
            'webhook_id': webhook_id,
            'webhook_event': json.loads(webhook_body)
        }

        # Отправляем запрос на проверку в PayPal
        try:
            verification_response = requests.post(
                f'{PAYPAL_API_URL}/v1/notifications/verify-webhook-signature',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {access_token}',
                },
                json=verification_data,
                timeout=10
            )
            verification_response.raise_for_status()
        except RequestException as e:
            logger.error(f"HTTP error during webhook verification: {e}")
            return False

        verification_status = verification_response.json().get('verification_status')
        logger.debug(f"Verification status: {verification_status}")

        if verification_status == 'SUCCESS':
            return True
        else:
            logger.warning(f"Webhook verification failed: {verification_status}")
            return False

    def create_paypal_order(self, line_items, total_price, session_key, invoice_number):
        """
        Creates a PayPal order and returns the approval_url and order_id.
        """
        access_token = self.get_paypal_access_token()
        if not access_token:
            raise RuntimeError("Failed to obtain PayPal access token.")

        # 1) Считаем сумму по позициям (item_total) из line_items
        try:
            from decimal import Decimal, ROUND_HALF_UP
            item_total = sum(
                Decimal(i['unit_amount']['value']) * Decimal(str(i['quantity']))
                for i in line_items
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        except Exception:
            # на случай, если где-то quantity строкой — приводим и пробуем снова
            item_total = total_price  # fallback

        # 2) return_url с нашим session_key в качестве session_id
        return_url = settings.REDIRECT_DOMAIN.rstrip('/') + f'/payment_end/?session_id={session_key}'
        cancel_url = settings.REDIRECT_DOMAIN.rstrip('/') + '/basket/'

        purchase_units = [{
            "reference_id": session_key,
            "invoice_id": invoice_number,
            "description": f"Invoice {invoice_number}",
            "amount": {
                "currency_code": "EUR",
                "value": f"{total_price:.2f}",
                "breakdown": {
                    "item_total": {
                        "currency_code": "EUR",
                        "value": f"{item_total:.2f}"
                    }
                }
            },
            "items": line_items
        }]

        payload = {
            "intent": "CAPTURE",
            "purchase_units": purchase_units,
            "application_context": {
                "brand_name": "Reli",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url,
            }
        }

        try:
            response = requests.post(
                f"{PAYPAL_API_URL}/v2/checkout/orders",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}",
                },
                json=payload,
                timeout=10
            )
            response.raise_for_status()
        except RequestException as e:
            logger.error(f"Error creating PayPal order: {e}")
            raise RuntimeError("Failed to create PayPal order")

        response_data = response.json()
        order_id = response_data.get("id")
        approval_url = next(
            (link["href"] for link in response_data.get("links", []) if link["rel"] == "approve"),
            None
        )

        if not approval_url or not order_id:
            logger.error(f"Unexpected PayPal response: {response_data}")
            raise RuntimeError("Failed to retrieve approval URL or order ID")

        return approval_url, order_id
