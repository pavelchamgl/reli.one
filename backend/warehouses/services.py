from django.core.exceptions import ValidationError

from .models import WarehouseItem


def decrease_stock(warehouse, product_variant, quantity):
    """
    Списывает `quantity` единиц `product_variant` из склада `warehouse`.
    """
    warehouse_item = WarehouseItem.objects.get(
        warehouse=warehouse,
        product_variant=product_variant
    )
    if warehouse_item.quantity_in_stock < quantity:
        raise ValidationError("Not enough stock")
    warehouse_item.quantity_in_stock -= quantity
    warehouse_item.save()
