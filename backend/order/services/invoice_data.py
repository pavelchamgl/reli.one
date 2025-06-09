from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from django_countries.fields import Country

from order.models import Order
from payment.models import Payment


def prepare_invoice_data(session_id):
    """
    Готовит данные для PDF-инвойса под твои модели и требования.
    """

    COMPANY_NAME = "Reli Group s.r.o."
    COMPANY_ADDRESS = "Na lysinách 551/34, Hodkovičky, 14700 Prague, Czech Republic"
    TAX_ID = "CZ123456789"
    IBAN = "DE00000000000000000000"

    orders = (
        Order.objects.filter(payments__session_id=session_id)
        .select_related('delivery_address', 'user')
        .prefetch_related('order_products__product__product')
    )
    if not orders.exists():
        raise ValueError("Нет заказов по session_id")

    order0 = orders[0]
    delivery = order0.delivery_address

    customer = {
        "full_name": f"{order0.first_name} {order0.last_name}",
        "address": delivery.street if delivery else "",
        "zip_code": delivery.zip_code if delivery else "",
        "city": delivery.city if delivery else "",
        "country": Country(delivery.country).name if delivery and delivery.country else "",
    }

    invoice_number = order0.order_number if hasattr(order0, "order_number") else order0.invoice_number
    order_date = order0.order_date.strftime('%d.%m.%Y')

    products = []
    vat_summary = defaultdict(Decimal)
    order_total = Decimal("0.00")

    for order in orders:
        order_products = order.order_products.select_related('product', 'product__product')
        for op in order_products:
            variant = op.product
            base = variant.product
            vat_rate = Decimal(str(base.vat_rate or "0.00"))
            qty = op.quantity
            unit_price = Decimal(str(op.product_price)).quantize(Decimal('0.01'), ROUND_HALF_UP)
            total = (unit_price * qty).quantize(Decimal('0.01'), ROUND_HALF_UP)

            products.append({
                "qty": qty,
                "sku": variant.sku,
                "name": f"{base.name} - {variant.name}: {variant.text}",
                "unit_price": float(unit_price),
                "total": float(total),
                "vat_rate": float(vat_rate),
            })

            vat_value = (total * vat_rate / (100 + vat_rate)).quantize(Decimal('0.01'), ROUND_HALF_UP) if vat_rate > 0 else Decimal('0.00')
            vat_summary[vat_rate] += vat_value
            order_total += total

    vat_summary = {float(rate): float(val.quantize(Decimal('0.01'), ROUND_HALF_UP)) for rate, val in vat_summary.items()}

    payment = Payment.objects.filter(session_id=session_id).first()
    payment_label = "Unknown"
    if payment:
        if payment.payment_system == 'stripe':
            payment_label = "Stripe"
        elif payment.payment_system == 'paypal':
            payment_label = "PayPal"

    invoice_data = {
        "invoice_number": invoice_number,
        "order_date": order_date,
        "customer": customer,
        "company_name": COMPANY_NAME,
        "company_address": COMPANY_ADDRESS,
        "tax_id": TAX_ID,
        "iban": IBAN,
        "products": products,
        "vat_summary": vat_summary,
        "grand_total": float(order_total.quantize(Decimal('0.01'), ROUND_HALF_UP)),
        "payment_method": payment_label,
    }
    return invoice_data
