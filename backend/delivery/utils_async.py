import logging

from django.db import transaction

from .utils import generate_parcels_for_order, fetch_and_store_labels_for_order
from payment.async_pool import executor

logger = logging.getLogger(__name__)

# Ленивый импорт внутри _target разрывает цикл импорта:
# payment.services ↔ webhook_processing ↔ utils_async ↔ payment.services
# Долгосрочно: очередь задач (Celery) + модуль уведомлений без обратного импорта из delivery.
# См. docs/tasks/005-delivery-cleanup/task.md


def async_parcels_and_seller_email(order_ids, session_id: str):
    """
    Фоновая задача (через ThreadPoolExecutor), которая:
      1) генерирует DeliveryParcelItem + сохраняет ярлыки PDF,
      2) как только всё готово, рассылает продавцам,
      3) **потом** рассылает письмо менеджеру (чтобы в нём уже были посылки).
    """
    def _target():
        # Ленивый импорт: иначе цикл payment.services → webhook_processing → utils_async → payment.services
        from payment.services import (
            send_merged_manager_email_from_session,
            send_seller_emails_by_session,
        )

        try:
            # 1) Генерируем парсели для каждого заказа (ошибка по одному заказу не блокирует остальные)
            for oid in order_ids:
                try:
                    generate_parcels_for_order(oid)
                    fetch_and_store_labels_for_order(oid)
                except Exception:
                    logger.exception(
                        "[PARCELS] Сбой генерации посылок или догрузки ярлыков: order_id=%s session=%s",
                        oid,
                        session_id,
                    )

            # 2) Продавцу — письмо с ярлыками
            try:
                send_seller_emails_by_session(session_id)
                logger.info(f"[PARCELS→SELLER] Продавцы оповещены по session {session_id}")
            except Exception:
                logger.exception(f"[PARCELS→SELLER] Ошибка при отправке письма продавцу по session {session_id}")

            # 3) Менеджеру — письмо уже с готовыми посылками
            try:
                send_merged_manager_email_from_session(session_id)
                logger.info(f"[PARCELS→MANAGER] Менеджер оповещён по session {session_id}")
            except Exception:
                logger.exception(f"[PARCELS→MANAGER] Ошибка при отправке письма менеджеру по session {session_id}")

        except Exception:
            logger.exception("Error in background parcel generation or label fetching")

    # Запускаем после коммита транзакции
    transaction.on_commit(lambda: executor.submit(_target))

