import logging

from threading import Thread
from django.db import transaction

from .services import (
    send_merged_customer_email_from_session,
    send_merged_manager_email_from_session,
    send_seller_emails_by_session,
)

logger = logging.getLogger(__name__)


def async_send_all_emails(session_id: str):
    """
    Асинхронно шлёт все три письма (клиент-женеральный, менеджерам и продавцам)
    после завершения текущей транзакции.
    """
    def _target():
        try:
            send_merged_customer_email_from_session(session_id)
            send_merged_manager_email_from_session(session_id)
            send_seller_emails_by_session(session_id)
        except Exception:
            logger.exception(f"Error in background sending emails for session {session_id}")

    # запланировать после коммита
    transaction.on_commit(lambda: Thread(target=_target, daemon=True).start())
