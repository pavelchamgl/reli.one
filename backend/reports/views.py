import logging
from datetime import datetime
from decimal import Decimal

from django.core.exceptions import FieldError
from django.db.models import DecimalField, F, Sum
from django.shortcuts import render

from order.models import Order, OrderProduct
from supplier.models import Supplier

logger = logging.getLogger(__name__)


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
    # TODO (task-001/BE-7): Этот view использует устаревшую модель Supplier и поле
    # supplier_id на OrderProduct (которого нет — есть seller_profile).
    # Сейчас фильтрация по supplier_id заглушена до полноценного рефакторинга в task-003+.
    supplier_id = request.GET.get('supplier_id')
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    supplier_name = ""

    base_context = {
        'subtitle': 'Отчет по поставщику',
        'supplier_name': supplier_name,
    }

    try:
        base_context['suppliers'] = Supplier.objects.all()
    except Exception:
        base_context['suppliers'] = []

    if supplier_id and from_date and to_date:
        try:
            supplier = Supplier.objects.get(pk=supplier_id)
            supplier_name = supplier.name
        except Supplier.DoesNotExist:
            logger.warning("generate_report: Supplier pk=%s not found", supplier_id)
            return render(request, 'reports/supplier_report.html', {
                **base_context,
                'error': f'Supplier with id={supplier_id} not found.',
            })

        try:
            start_date = datetime.strptime(from_date, "%Y-%m-%d")
            end_date = datetime.strptime(to_date, "%Y-%m-%d")

            order_products = OrderProduct.objects.filter(
                seller_profile__user__email=supplier.email,
                received=True,
                received_at__date__range=[start_date, end_date],
            )

            total_sold = order_products.aggregate(
                total=Sum(F('product_price') * F('quantity'), output_field=DecimalField())
            )['total'] or Decimal('0.00')

            closed_orders = Order.objects.filter(
                order_status__name="Closed",
                order_date__date__range=[start_date, end_date],
            )

            total_delivery = OrderProduct.objects.filter(
                order__in=closed_orders,
                seller_profile__user__email=supplier.email,
            ).aggregate(
                total=Sum('delivery_cost', output_field=DecimalField())
            )['total'] or Decimal('0.00')

            total_quantity = order_products.aggregate(total=Sum('quantity'))['total'] or 0

            total_profit = Decimal('0.00')
            for order_product in order_products:
                try:
                    root_category = order_product.product.product.category.get_root_category()
                    profit_percentage = get_profit_percentage(root_category.name, order_product.product_price)
                    total_profit += order_product.quantity * order_product.product_price * profit_percentage
                except Exception:
                    logger.exception("generate_report: failed to compute profit for OrderProduct pk=%s", order_product.pk)

            total_debt = total_sold - total_profit
            total_debt_minus_delivery = total_debt - total_delivery

            sold_products_with_sum = [
                {
                    'product': order_product,
                    'sum': order_product.quantity * order_product.product_price,
                }
                for order_product in order_products
            ]

            context = {
                **base_context,
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
        except (FieldError, Exception):
            logger.exception("generate_report: query failed for supplier_id=%s", supplier_id)
            context = {
                **base_context,
                'error': 'Failed to generate report. Please contact support.',
            }
    else:
        context = base_context

    return render(request, 'reports/supplier_report.html', context)
