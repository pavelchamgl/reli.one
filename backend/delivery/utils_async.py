import logging

from threading import Thread
from django.db import transaction

from order.models import Order
from delivery.utils import generate_parcels_for_order

logger = logging.getLogger(__name__)


def async_generate_parcels(order_id):
    """
    Запускает generate_parcels_for_order в фоновом потоке
    после коммита текущей транзакции.
    """
    def _target():
        try:
            generate_parcels_for_order(order_id)
        except Exception:
            logger.exception("Error in background parcel generation")

    transaction.on_commit(lambda: Thread(target=_target, daemon=True).start())
