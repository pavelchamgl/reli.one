import os
from io import BytesIO
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm

from order.models import Order, OrderProduct
from product.models import ProductVariant
from sellers.models import SellerProfile


def format_eur(value):
    return f"{Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)} €"


def prepare_invoice_data(session_id):
    """
    Готовит данные для генерации PDF-инвойса в требуемой структуре.
    На вход — session_id платежа.
    """

    orders = (
        Order.objects.filter(payment__session_id=session_id)
        .select_related('delivery_address', 'user')
        .prefetch_related('order_products__product__product')
    )
    if not orders.exists():
        raise ValueError("Нет заказов по session_id")

    # --- Клиент (берем из первого заказа, т.к. все должны быть от одного клиента и адреса)
    order0 = orders[0]
    delivery = order0.delivery_address
    customer = {
        "full_name": f"{delivery.first_name} {delivery.last_name}",
        "address": delivery.address_line,
        "zip_code": delivery.zip_code,
        "city": delivery.city,
        "country": delivery.country,
    }

    # --- Общая дата и номер инвойса (берём из первого заказа)
    invoice_number = order0.invoice_number
    order_date = order0.created_at.strftime('%d.%m.%Y')

    # --- Группируем товары по продавцам
    vendors_map = {}  # seller_id -> vendor_data

    for order in orders:
        # Получаем продавца через первую позицию в заказе (все позиции в заказе должны быть от одного продавца)
        order_products = order.order_products.select_related('product', 'product__product')
        if not order_products:
            continue

        # Берем SellerProfile из BaseProduct первого OrderProduct (допустим все товары в заказе от одного продавца)
        base_product = order_products[0].product.product
        seller_profile = getattr(base_product, "seller_profile", None)
        if not seller_profile:
            # Если не найден, можно либо пропустить, либо подставить дефолтные данные, либо кинуть ошибку
            raise ValueError("Не найден профиль продавца у BaseProduct")

        seller_id = seller_profile.id

        # Если продавец ещё не в vendors_map — добавляем
        if seller_id not in vendors_map:
            vendors_map[seller_id] = {
                "company_name": seller_profile.company_name,
                "company_address": seller_profile.company_address,
                "tax_id": seller_profile.tax_id,
                "iban": seller_profile.iban,
                "products": [],
                "vat_summary": defaultdict(Decimal),
                "order_total": Decimal("0.00"),
            }

        vendor = vendors_map[seller_id]

        for op in order_products:
            variant = op.product
            base = variant.product
            vat_rate = Decimal(str(base.vat_rate or "0.00"))
            qty = op.quantity
            unit_price = Decimal(str(op.product_price)).quantize(Decimal('0.01'), ROUND_HALF_UP)
            total = (unit_price * qty).quantize(Decimal('0.01'), ROUND_HALF_UP)

            # Добавляем в таблицу товаров
            vendor["products"].append({
                "qty": qty,
                "sku": variant.sku,
                "name": f"{base.name} – {variant.name}",
                "unit_price": float(unit_price),
                "total": float(total),
                "vat_rate": float(vat_rate),
            })

            # Подсчёт по VAT
            # Сумма НДС = total * vat_rate / (100 + vat_rate) — если цены с НДС
            vat_value = (total * vat_rate / (100 + vat_rate)).quantize(Decimal('0.01'), ROUND_HALF_UP) if vat_rate > 0 else Decimal('0.00')
            vendor["vat_summary"][vat_rate] += vat_value

            # Итог по группе
            vendor["order_total"] += total

    # --- Формируем vendors для итоговой структуры
    vendors = []
    grand_total = Decimal("0.00")
    for vendor in vendors_map.values():
        # Преобразуем vat_summary из defaultdict в обычный dict с округлением
        vendor["vat_summary"] = {float(rate): float(val.quantize(Decimal('0.01'), ROUND_HALF_UP))
                                 for rate, val in vendor["vat_summary"].items()}
        vendor["order_total"] = float(vendor["order_total"].quantize(Decimal('0.01'), ROUND_HALF_UP))
        grand_total += Decimal(str(vendor["order_total"]))
        vendors.append(vendor)

    # --- Финальный датасет
    invoice_data = {
        "invoice_number": invoice_number,
        "order_date": order_date,
        "customer": customer,
        "vendors": vendors,
        "grand_total": float(grand_total.quantize(Decimal('0.01'), ROUND_HALF_UP)),
    }
    return invoice_data


def generate_invoice_pdf_by_orders(orders, invoice_number):
    if not orders:
        raise ValueError("Orders list is empty")

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Register fonts
    font_path = os.path.join(settings.BASE_DIR, "order", "fonts", "Roboto-Regular.ttf")
    bold_font_path = os.path.join(settings.BASE_DIR, "order", "fonts", "Roboto-Bold.ttf")
    pdfmetrics.registerFont(TTFont("Roboto", font_path))
    pdfmetrics.registerFont(TTFont("Roboto-Bold", bold_font_path))

    c.setFont("Roboto", 10)
    cursor_y = height - 20 * mm

    # Header
    logo_path = os.path.join(settings.BASE_DIR, "order", "static", "logo_invoice.png")
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 20 * mm, cursor_y - 10 * mm, width=40 * mm, preserveAspectRatio=True, mask='auto')
    c.setFont("Roboto-Bold", 14)
    c.drawRightString(width - 20 * mm, cursor_y, "Faktura / Invoice")
    cursor_y -= 25 * mm

    # Seller
    c.setFont("Roboto", 9)
    seller_lines = [
        "Zooshop Marketplace s.r.o.",
        "Herzog-Wilhelm-Strasse 18",
        "80331 München, Germany",
        "IBAN: DE00000000000000000000",
        "SWIFT: TESTDEFF",
        "DIČ: CZ123456789"
    ]
    for line in seller_lines:
        c.drawString(20 * mm, cursor_y, line)
        cursor_y -= 5 * mm

    # Buyer
    buyer = orders[0]
    buyer_lines = [
        f"{buyer.first_name} {buyer.last_name}",
        buyer.customer_email or "",
        str(buyer.phone_number or "")
    ]
    tmp_y = height - 40 * mm
    for line in buyer_lines:
        c.drawRightString(width - 20 * mm, tmp_y, line)
        tmp_y -= 5 * mm

    # Metadata
    meta_data = {
        "Invoice no.": invoice_number,
        "Order date": buyer.order_date.strftime('%d.%m.%Y')
    }
    cursor_y -= 10 * mm
    for key, val in meta_data.items():
        c.drawString(20 * mm, cursor_y, key + ":")
        c.drawString(60 * mm, cursor_y, str(val))
        cursor_y -= 5 * mm

    # Table Header
    c.setFont("Roboto-Bold", 9)
    headers = ["Qty", "SKU", "Name", "Price/pc", "Total", "VAT"]
    x_positions = [22 * mm, 35 * mm, 55 * mm, 135 * mm, 160 * mm, 180 * mm]

    cursor_y -= 10 * mm
    for i, header in enumerate(headers):
        c.drawString(x_positions[i], cursor_y, header)
    cursor_y -= 2 * mm
    c.line(20 * mm, cursor_y, width - 20 * mm, cursor_y)
    cursor_y -= 6 * mm

    # Table Rows
    c.setFont("Roboto", 9)
    total_sum = Decimal("0.00")
    vat_by_rate = {}
    for order in orders:
        for op in order.order_products.select_related("product"):
            variant = op.product
            name = f"{variant.product.name} – {variant.name}"
            qty = op.quantity
            unit_price = Decimal(op.product_price)
            total = unit_price * qty
            vat_rate = Decimal(variant.product.vat_rate or "0.00")
            vat_value = total * vat_rate / (100 + vat_rate) if vat_rate > 0 else Decimal("0.00")

            vat_by_rate.setdefault(vat_rate, Decimal("0.00"))
            vat_by_rate[vat_rate] += vat_value
            total_sum += total

            c.drawString(x_positions[0] - 1, cursor_y, str(qty))
            c.drawString(x_positions[1], cursor_y, variant.sku)
            c.drawString(x_positions[2], cursor_y, name[:45])
            c.drawRightString(x_positions[3] + 39, cursor_y, format_eur(unit_price))
            c.drawRightString(x_positions[4] + 35, cursor_y, format_eur(total))
            c.drawRightString(x_positions[5] + 22, cursor_y, f"{vat_rate:.2f}%")
            cursor_y -= 5 * mm

            if cursor_y < 30 * mm:
                c.showPage()
                cursor_y = height - 20 * mm
                c.setFont("Roboto", 9)

    # VAT Summary & Total
    cursor_y -= 5 * mm
    for rate, vat_val in vat_by_rate.items():
        c.drawRightString(width - 20 * mm, cursor_y, f"Including VAT: {format_eur(vat_val)}")
        cursor_y -= 5 * mm
    c.setFont("Roboto-Bold", 10)
    c.drawRightString(width - 20 * mm, cursor_y, f"Total amount: {format_eur(total_sum)}")
    cursor_y -= 10 * mm

    # Footer
    c.setFont("Roboto", 9)
    c.drawString(20 * mm, 25 * mm, "Заказ оплачен. Счёт предоставлен.")
    c.drawString(20 * mm, 20 * mm, "По вопросам возврата — support@zooshop.eu")

    c.save()
    buffer.seek(0)
    filename = f"invoice_{invoice_number}.pdf"
    return ContentFile(buffer.read(), name=filename)
