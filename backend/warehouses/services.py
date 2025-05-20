import logging

from .models import WarehouseItem
from warehouses.models import WarehouseItem, Warehouse
from product.models import ProductVariant

logger = logging.getLogger(__name__)


def decrease_stock(warehouse, variant, quantity):
    """
    Уменьшает остаток. Если WarehouseItem нет или не хватает — логируем и выходим.
    """
    try:
        wi = WarehouseItem.objects.get(
            warehouse=warehouse,
            product_variant=variant
        )
    except WarehouseItem.DoesNotExist:
        logger.warning(f"No stock record for SKU {variant.sku} in warehouse {warehouse.id}")
        return

    if wi.quantity_in_stock < quantity:
        logger.warning(f"Not enough stock for SKU {variant.sku} in warehouse {warehouse.id}: "
                       f"{wi.quantity_in_stock} < {quantity}")
        return

    wi.quantity_in_stock -= quantity
    wi.save(update_fields=["quantity_in_stock"])
