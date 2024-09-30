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
