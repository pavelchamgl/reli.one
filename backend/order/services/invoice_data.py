from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from django_countries.fields import Country

from order.models import Order
from payment.models import Payment, PayPalMetadata, StripeMetadata


def prepare_invoice_data(session_id):
    """
    Подготавливает данные для PDF-инвойса.
    Работает как для Stripe, так и для PayPal — через session_key в Payment.
    """

    COMPANY_NAME = "Reli Group s.r.o."
    COMPANY_ADDRESS = "Na lysinách 551/34, Hodkovičky, 14700 Praha 4, Czech Republic"
    TAX_ID = "28003896"
    IBAN = "CZ9455000000005003011074"
    ACCOUNT_NUMBER = "8115228001/5500"
    SWIFT = "RZBCCZPP"

    # Получаем Payment
    payment = Payment.objects.filter(session_id=session_id).first()
    if not payment:
        raise ValueError("Payment not found for session_id")

    session_key = payment.session_key
    if not session_key:
        raise ValueError("Missing session_key in Payment")

    # Получаем метаданные (PayPal или Stripe)
    metadata = (
        PayPalMetadata.objects.filter(session_key=session_key).first() or
        StripeMetadata.objects.filter(session_key=session_key).first()
    )
    if not metadata or not metadata.invoice_data:
        raise ValueError("Missing invoice metadata")

    invoice_number = metadata.invoice_data.get("invoice_number")
    if not invoice_number:
        raise ValueError("Missing invoice_number in metadata")

    delivery_total = Decimal(metadata.description_data.get("delivery_total", "0.00")).quantize(Decimal("0.01"))

    # Получаем связанные заказы
    orders = (
        Order.objects.filter(payment__session_id=session_id)
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

    # Добавляем стоимость доставки в общий итог
    grand_total = (order_total + delivery_total).quantize(Decimal("0.01"))

    vat_summary = {
        float(rate): float(val.quantize(Decimal('0.01'), ROUND_HALF_UP))
        for rate, val in vat_summary.items()
    }

    payment_label = {
        'stripe': "Stripe",
        'paypal': "PayPal"
    }.get(payment.payment_system, "Unknown")

    invoice_data = {
        "invoice_number": invoice_number,
        "order_date": order_date,
        "customer": customer,
        "company_name": COMPANY_NAME,
        "company_address": COMPANY_ADDRESS,
        "tax_id": TAX_ID,
        "iban": IBAN,
        "account_number": ACCOUNT_NUMBER,
        "swift": SWIFT,
        "products": products,
        "vat_summary": vat_summary,
        "delivery_total": float(delivery_total),
        "grand_total": float(grand_total),
        "payment_method": payment_label,
    }
    return invoice_data
