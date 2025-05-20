import logging

from threading import Thread
from django.db import transaction

from .utils import generate_parcels_for_order, fetch_and_store_labels_for_order

logger = logging.getLogger(__name__)


def async_generate_parcels_and_fetch_labels(order_id: int):
    """
    Asynchronously generates parcels and stores their labels after transaction commit.
    """
    def _target():
        try:
            generate_parcels_for_order(order_id)
            fetch_and_store_labels_for_order(order_id)
        except Exception:
            logger.exception("Error in background parcel generation or label fetching")

    transaction.on_commit(lambda: Thread(target=_target, daemon=True).start())
