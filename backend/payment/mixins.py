import json
import requests
import logging
from django.conf import settings
from requests.exceptions import RequestException

from .services.paypal_checkout import (
    get_paypal_access_token as _get_paypal_access_token,
    create_paypal_checkout_session,
)

logger = logging.getLogger(__name__)

PAYPAL_API_URL = settings.PAYPAL_API_URL


class PayPalMixin:
    def get_paypal_access_token(self):
        return _get_paypal_access_token()

    def verify_webhook(self, request, webhook_body):
        # Получаем заголовки для верификации
        transmission_id = request.headers.get('paypal-transmission-id')
        transmission_time = request.headers.get('paypal-transmission-time')
        cert_url = request.headers.get('paypal-cert-url')
        actual_signature = request.headers.get('paypal-transmission-sig')
        auth_algo = request.headers.get('paypal-auth-algo')
        webhook_id = settings.PAYPAL_WEBHOOK_ID

        logger.debug(
            "PayPal webhook verify headers: transmission_id=%s, has_sig=%s, cert_url_set=%s, auth_algo=%s",
            transmission_id,
            bool(actual_signature),
            bool(cert_url),
            auth_algo,
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
        """Делегирует к сервисному слою."""
        return create_paypal_checkout_session(
            line_items=line_items,
            total_price=total_price,
            session_key=session_key,
            invoice_number=invoice_number,
        )
