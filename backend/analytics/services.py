from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum

from order.models import OrderProduct, ProductStatus
from warehouses.models import Warehouse

VENDOR_WAREHOUSE_NAME = "Vendor warehouse"
RELI_WAREHOUSE_NAME = "Reli warehouse"


def zero_warehouse_order_stats():
    """
    Тот же набор ключей, что возвращает get_warehouse_orders_stats, — нулевые агрегаты.
    Используется при отсутствии/переименовании складов с каноническими именами (Task 009 Step 4).
    """
    return {
        "awaiting_assembly": 0,
        "awaiting_shipment": 0,
        "controversial": 0,
        "awaiting_assembly_and_shipment": 0,
        "deliverable": 0,
        "delivered": 0,
        "canceled": 0,
        "all": 0,
    }


def _warehouse_by_canonical_name(name):
    """Возвращает Warehouse или None, без Warehouse.DoesNotExist."""
    try:
        return Warehouse.objects.get(name=name)
    except Warehouse.DoesNotExist:
        return None


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

    Склады резолвятся по историческим именам. Если склад отсутствует или переименован —
    возвращается нулевая статистика с тем же набором полей для соответствующей стороны.
    Формат ответа и ключи статистики не меняются.
    """
    vendor_wh = _warehouse_by_canonical_name(VENDOR_WAREHOUSE_NAME)
    reli_wh = _warehouse_by_canonical_name(RELI_WAREHOUSE_NAME)
    tmpl = zero_warehouse_order_stats()

    return {
        "vendor_warehouse": (
            get_warehouse_orders_stats(vendor_wh, seller_profile, days=days)
            if vendor_wh is not None
            else {**tmpl}
        ),
        "reli_warehouse": (
            get_warehouse_orders_stats(reli_wh, seller_profile, days=days)
            if reli_wh is not None
            else {**tmpl}
        ),
    }
