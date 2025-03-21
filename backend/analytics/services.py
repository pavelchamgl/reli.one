from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum

from order.models import OrderProduct, ProductStatus
from warehouses.models import Warehouse


def get_warehouse_orders_stats(warehouse, seller_profile, days=15):
    """
    Считает статистику заказов (OrderProduct) для ОДНОГО склада (warehouse),
    за последние N дней (days), но ТОЛЬКО по товарам данного продавца (seller_profile).

    1. Фильтр по дате (order_date >= cutoff_date).
    2. Фильтр по warehouse=...
    3. Фильтр по seller_profile=...
    4. Группируем по статусам и суммируем quantity.
    """
    now = timezone.now()
    cutoff_date = now - timedelta(days=days)

    qs = OrderProduct.objects.filter(
        order__order_date__gte=cutoff_date,
        warehouse=warehouse,
        seller_profile=seller_profile
    )

    awaiting_assembly_qty = qs.filter(
        status=ProductStatus.AWAITING_ASSEMBLY
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    awaiting_shipment_qty = qs.filter(
        status=ProductStatus.AWAITING_SHIPMENT
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    deliverable_qty = qs.filter(
        status=ProductStatus.DELIVERABLE
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    delivered_qty = qs.filter(
        status=ProductStatus.DELIVERED
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    canceled_qty = qs.filter(
        status=ProductStatus.CANCELED
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    controversial_qty = qs.filter(
        status=ProductStatus.CONTROVERSIAL
    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

    # Суммируем «Awaiting assembly» + «Awaiting shipment»
    awaiting_assembly_and_shipment_qty = awaiting_assembly_qty + awaiting_shipment_qty

    # Общая сумма
    total_qty = (
        awaiting_assembly_and_shipment_qty
        + deliverable_qty
        + delivered_qty
        + canceled_qty
        + controversial_qty
    )

    return {
        "awaiting_assembly": awaiting_assembly_qty,
        "awaiting_shipment": awaiting_shipment_qty,
        "controversial": controversial_qty,
        "awaiting_assembly_and_shipment": awaiting_assembly_and_shipment_qty,
        "deliverable": deliverable_qty,
        "delivered": delivered_qty,
        "canceled": canceled_qty,
        "all": total_qty,
    }


def get_stats_for_two_warehouses(seller_profile, days=15):
    """
    Возвращает статистику заказов ПООТДЕЛЬНО по двум складам:
      - Vendor warehouse
      - Reli warehouse
    Но только для товаров, принадлежащих `seller_profile`.

    1. Ищем объекты Warehouse с названиями "Vendor warehouse" и "Reli warehouse".
    2. Для каждого из них вызываем get_warehouse_orders_stats(...).
    """
    vendor = Warehouse.objects.get(name="Vendor warehouse")
    reli = Warehouse.objects.get(name="Reli warehouse")

    return {
        "vendor_warehouse": get_warehouse_orders_stats(vendor, seller_profile, days=days),
        "reli_warehouse": get_warehouse_orders_stats(reli, seller_profile, days=days),
    }
