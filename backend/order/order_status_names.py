"""
Канонические значения ``OrderStatus.name`` в БД.

В проекте статус заказа — это FK на строковое имя в справочнике, не TextChoices
на модели Order. Литералы имени размазаны по коду; этот модуль — единая точка
для сравнений и lookup, без изменения значений в базе.

Использование: ``OrderStatus.objects.get(name=OrderStatusName.PENDING)``.

Не переименовывать константы без миграции данных в таблице ``order_orderstatus``.
"""
from __future__ import annotations


class OrderStatusName:
    PENDING = "Pending"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"
    CLOSED = "Closed"
