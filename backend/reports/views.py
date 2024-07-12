from decimal import Decimal
from datetime import datetime
from django.shortcuts import render
from django.db.models import Sum, F

from supplier.models import Supplier
from order.models import OrderProduct, Order


def get_profit_percentage(category_name):
    categories_profit_percentage = {
        "Electronics": 0.08,
        "Children's goods": 0.10,
        "Luggage": 0.15,
        "Beauty and Health": 0.15,
        "Clothes and shoes": 0.11,
        "Furniture": 0.12,
        "House and garden": 0.15,
        "Office Supplies": 0.15,
        "Pet Products": 0.15,
        "Sport and relaxation": 0.15,
    }
    return categories_profit_percentage.get(category_name, 0.0)


def generate_report(request):
    supplier_id = request.GET.get('supplier_id')
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    supplier_name = ""

    if supplier_id and from_date and to_date:
        supplier = Supplier.objects.get(pk=supplier_id)
        supplier_name = supplier.name

        start_date = datetime.strptime(from_date, "%Y-%m-%d")
        end_date = datetime.strptime(to_date, "%Y-%m-%d")

        # Фильтруем продукты по дате и статусу "Closed"
        order_products = OrderProduct.objects.filter(
            supplier_id=supplier_id,
            received=True,
            received_at__date__range=[start_date, end_date]
        )

        # Сумма всех проданных товаров
        total_sold = order_products.aggregate(total=Sum(F('product_price') * F('quantity')))['total'] or Decimal('0.00')

        # Фильтруем заказы по дате и статусу "Closed"
        closed_orders = Order.objects.filter(
            order_status__name="Closed",
            order_date__date__range=[start_date, end_date]
        )

        # Берем доставку из всех закрытых заказов
        total_delivery = OrderProduct.objects.filter(
            order__in=closed_orders,
            supplier_id=supplier_id
        ).aggregate(total=Sum('delivery_cost'))['total'] or Decimal('0.00')

        total_quantity = order_products.aggregate(total=Sum('quantity'))['total'] or 0

        total_profit = Decimal('0.00')
        for order_product in order_products:
            root_category = order_product.product.category.get_root_category()
            profit_percentage = Decimal(str(get_profit_percentage(root_category.name)))
            total_profit += order_product.quantity * order_product.product_price * profit_percentage

        total_debt = total_sold - total_profit
        total_debt_minus_delivery = total_debt + total_delivery

        # Вывод отладочной информации
        print(f"Total sold: {total_sold}, Total delivery: {total_delivery}, Total profit: {total_profit}")

        context = {
            'subtitle': 'Отчет по поставщику',
            'suppliers': Supplier.objects.all(),
            'supplier_id': int(supplier_id),
            'from_date': from_date,
            'to_date': to_date,
            'total_sold': total_sold,
            'total_delivery': total_delivery,
            'total_debt': total_debt,
            'total_debt_minus_delivery': total_debt_minus_delivery,
            'profit': total_profit,
            'total_quantity': total_quantity,
            'sold_products': order_products,
            'supplier_name': supplier_name,
        }
    else:
        context = {
            'subtitle': 'Отчет по поставщику',
            'suppliers': Supplier.objects.all(),
            'supplier_name': supplier_name,
        }

    return render(request, 'reports/supplier_report.html', context)
