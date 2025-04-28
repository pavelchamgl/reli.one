from threading import Thread
from django.db import transaction


def async_generate_parcels(order_id):
    """
    Запускает generate_parcels_for_order(order) в фоновом потоке
    после успешного коммита транзакции.
    """
    from order.models import Order
    from delivery.utils import generate_parcels_for_order

    def _target():
        try:
            order = Order.objects.get(pk=order_id)
            generate_parcels_for_order(order)
        except Exception:
            # здесь можно логировать ошибку
            pass

    # запустим _target() после коммита текущей транзакции
    transaction.on_commit(lambda: Thread(target=_target, daemon=True).start())
