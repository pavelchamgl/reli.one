from decimal import Decimal
from datetime import datetime
from django.shortcuts import render
from django.db.models import Sum, F, DecimalField

from supplier.models import Supplier
from order.models import OrderProduct, Order


def get_profit_percentage(category_name, product_price):
    if category_name == "Jewelery":
        if product_price < Decimal('230.00'):
            return Decimal('0.16')
        else:
            return Decimal('0.05')
    elif category_name == "Watches":
        if product_price < Decimal('1400.00'):
            return Decimal('0.16')
        else:
            return Decimal('0.05')
    else:
        categories_profit_percentage = {
            "Electronics": Decimal('0.08'),
            "Children's goods": Decimal('0.10'),
            "Luggage": Decimal('0.15'),
            "Beauty and Health": Decimal('0.15'),
            "Clothes and shoes": Decimal('0.11'),
            "Furniture": Decimal('0.12'),
            "House and garden": Decimal('0.15'),
            "Office Supplies": Decimal('0.15'),
            "Pet Products": Decimal('0.15'),
            "Sport and relaxation": Decimal('0.15'),
            "Toys/games": Decimal('0.15'),
        }
        return categories_profit_percentage.get(category_name, Decimal('0.00'))


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

        # Фильтруем продукты по дате и статусу "Received"
        order_products = OrderProduct.objects.filter(
            supplier_id=supplier_id,
            received=True,
            received_at__date__range=[start_date, end_date]
        )

        # Сумма всех проданных товаров
        total_sold = order_products.aggregate(
            total=Sum(F('product_price') * F('quantity'), output_field=DecimalField())
        )['total'] or Decimal('0.00')

        # Фильтруем заказы по дате и статусу "Closed"
        closed_orders = Order.objects.filter(
            order_status__name="Closed",
            order_date__date__range=[start_date, end_date]
        )

        # Сумма всех доставок
        total_delivery = OrderProduct.objects.filter(
            order__in=closed_orders,
            supplier_id=supplier_id
        ).aggregate(
            total=Sum('delivery_cost', output_field=DecimalField())
        )['total'] or Decimal('0.00')

        total_quantity = order_products.aggregate(total=Sum('quantity'))['total'] or 0

        total_profit = Decimal('0.00')
        for order_product in order_products:
            root_category = order_product.product.product.category.get_root_category()
            profit_percentage = get_profit_percentage(root_category.name, order_product.product_price)
            total_profit += order_product.quantity * order_product.product_price * profit_percentage

        total_debt = total_sold - total_profit
        total_debt_minus_delivery = total_debt - total_delivery

        # Вычисляем сумму для каждого продукта
        sold_products_with_sum = [
            {
                'product': order_product,
                'sum': order_product.quantity * order_product.product_price
            }
            for order_product in order_products
        ]

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
            'sold_products': sold_products_with_sum,
            'supplier_name': supplier_name,
        }
    else:
        context = {
            'subtitle': 'Отчет по поставщику',
            'suppliers': Supplier.objects.all(),
            'supplier_name': supplier_name,
        }

    return render(request, 'reports/supplier_report.html', context)
