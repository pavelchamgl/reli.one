import logging

from django.db import transaction

from .exceptions import InsufficientStockError
from .models import WarehouseItem

logger = logging.getLogger(__name__)


def decrease_stock(warehouse, variant, quantity):
    """
    Уменьшает остаток под блокировкой строки.

    Если WarehouseItem отсутствует — noop (warning + return), без исключения.

    Если остатка меньше, чем quantity — warning и InsufficientStockError;
    quantity_in_stock не меняется.

    При достаточном остатке — атомарное списание.

    Примечание: списание из webhook пока отключено; вызовы из payment/webhook не добавляются в Task 009.
    """
    try:
        with transaction.atomic():
            wi = WarehouseItem.objects.select_for_update().get(
                warehouse=warehouse,
                product_variant=variant,
            )
            if wi.quantity_in_stock < quantity:
                logger.warning(
                    "Not enough stock for SKU %s in warehouse %s: %s < %s",
                    variant.sku,
                    warehouse.id,
                    wi.quantity_in_stock,
                    quantity,
                )
                raise InsufficientStockError()

            wi.quantity_in_stock -= quantity
            wi.save(update_fields=["quantity_in_stock"])
    except WarehouseItem.DoesNotExist:
        logger.warning(
            "No stock record for SKU %s in warehouse %s",
            variant.sku,
            warehouse.id,
        )
