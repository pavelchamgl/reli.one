from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, F
from django.db.models.functions import TruncDate

from order.models import OrderProduct


def get_seller_sales_statistics(seller_profile, days=15):
    now = timezone.now()
    cutoff = now - timedelta(days=days)

    # "Заказано": опираемся на order_date >= cutoff
    ordered_qs = (
        OrderProduct.objects
        .filter(
            seller_profile=seller_profile,
            order__order_date__gte=cutoff
        )
        .annotate(date=TruncDate('order__order_date'))
        .values('date')
        .annotate(
            ordered_amount=Sum(F('product_price') * F('quantity')),
            ordered_count=Sum('quantity')
        )
        .order_by('date')
    )

    # "Доставлено": опираемся на delivery_date >= cutoff
    # (предполагая, что order.delivery_date указывает фактическую дату доставки)
    delivered_qs = (
        OrderProduct.objects
        .filter(
            seller_profile=seller_profile,
            order__delivery_date__gte=cutoff
        )
        .annotate(date=TruncDate('order__delivery_date'))
        .values('date')
        .annotate(
            delivered_amount=Sum(F('product_price') * F('quantity')),
            delivered_count=Sum('quantity')
        )
        .order_by('date')
    )

    # Преобразуем в словари date -> {...}
    ordered_by_date = {item['date']: item for item in ordered_qs}
    delivered_by_date = {item['date']: item for item in delivered_qs}

    # Собираем массив за N дней
    chartData = []
    for i in range(days):
        the_date = (cutoff + timedelta(days=i+1)).date()

        ordered_data = ordered_by_date.get(the_date, {})
        delivered_data = delivered_by_date.get(the_date, {})

        chartData.append({
            "date": str(the_date),
            "ordered_amount": str(ordered_data.get("ordered_amount", 0)),
            "ordered_count": ordered_data.get("ordered_count", 0),
            "delivered_amount": str(delivered_data.get("delivered_amount", 0)),
            "delivered_count": delivered_data.get("delivered_count", 0),
        })

    # Итоговые суммы
    total_ordered_amount = sum(item['ordered_amount'] for item in ordered_qs)
    total_ordered_count = sum(item['ordered_count'] for item in ordered_qs)
    total_delivered_amount = sum(item['delivered_amount'] for item in delivered_qs)
    total_delivered_count = sum(item['delivered_count'] for item in delivered_qs)

    return {
        "chartData": chartData,
        "ordered_period": {
            "amount": str(total_ordered_amount),
            "count": total_ordered_count
        },
        "delivered_period": {
            "amount": str(total_delivered_amount),
            "count": total_delivered_count
        },
        "today": str(now.date())
    }
