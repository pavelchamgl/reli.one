import logging

from threading import Thread
from django.db import transaction

from .services import (
    send_merged_customer_email_from_session,
    send_merged_manager_email_from_session,
    send_seller_emails_by_session,
)
from payment.async_pool import executor

logger = logging.getLogger(__name__)


def async_send_client_email(session_id: str):
    """
    Фоновая задача: отправка письма клиенту сразу после коммита.
    """
    def _cust():
        try:
            send_merged_customer_email_from_session(session_id)
            logger.info(f"[EMAIL→CUSTOMER] Клиент оповещён по session {session_id}")
        except Exception:
            logger.exception(f"[EMAIL→CUSTOMER] Ошибка отправки письма клиенту для session {session_id}")

    transaction.on_commit(lambda: executor.submit(_cust))
