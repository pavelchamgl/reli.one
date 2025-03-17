from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from order.models import OrderProduct, ProductStatus
from warehouses.models import Warehouse


def get_warehouse_orders_stats(warehouse, days=15):
    """
    Вычисляет статистику заказов для одного конкретного склада за последние N дней.
    """
    now = timezone.now()
    cutoff_date = now - timedelta(days=days)

    qs = OrderProduct.objects.filter(order__order_date__gte=cutoff_date, warehouse=warehouse)

    awaiting_assembly_qty = qs.filter(status=ProductStatus.AWAITING_ASSEMBLY).aggregate(Sum('quantity'))['quantity__sum'] or 0
    awaiting_shipment_qty = qs.filter(status=ProductStatus.AWAITING_SHIPMENT).aggregate(Sum('quantity'))['quantity__sum'] or 0
    deliverable_qty = qs.filter(status=ProductStatus.DELIVERABLE).aggregate(Sum('quantity'))['quantity__sum'] or 0
    delivered_qty = qs.filter(status=ProductStatus.DELIVERED).aggregate(Sum('quantity'))['quantity__sum'] or 0
    canceled_qty = qs.filter(status=ProductStatus.CANCELED).aggregate(Sum('quantity'))['quantity__sum'] or 0
    controversial_qty = qs.filter(status=ProductStatus.CONTROVERSIAL).aggregate(Sum('quantity'))['quantity__sum'] or 0

    awaiting_assembly_and_shipment_qty = awaiting_assembly_qty + awaiting_shipment_qty
    total_qty = awaiting_assembly_and_shipment_qty + deliverable_qty + delivered_qty + canceled_qty + controversial_qty

    return {
        "awaiting_assembly": awaiting_assembly_qty,
        "awaiting_shipment": awaiting_shipment_qty,
        "controversial": controversial_qty,
        "awaiting_assembly_and_shipment": awaiting_assembly_and_shipment_qty,
        "deliverable": deliverable_qty,
        "delivered": delivered_qty,
        "canceled": canceled_qty,
        "all": total_qty
    }


def get_stats_for_two_warehouses(days=15):
    """
    Возвращает статистику заказов по двум складам: Vendor и Reli.
    """
    vendor = Warehouse.objects.get(name="Vendor warehouse")
    reli = Warehouse.objects.get(name="Reli warehouse")

    return {
        "vendor_warehouse": get_warehouse_orders_stats(vendor, days=days),
        "reli_warehouse": get_warehouse_orders_stats(reli, days=days)
    }
