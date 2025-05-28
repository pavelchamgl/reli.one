import os
from io import BytesIO
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from delivery.services.packeta_point_service import get_pickup_point_details


def format_eur(value):
    return f"{Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def generate_invoice_pdf_by_orders(orders, invoice_number):
    if not orders:
        raise ValueError("Orders list is empty")

    # Регистрируем шрифт Roboto
    font_path = os.path.join(settings.BASE_DIR, "payment", "invoices", "fonts", "Roboto-Regular.ttf")
    if "Roboto" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("Roboto", font_path))

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    left = 15 * mm
    right = width - 15 * mm
    top = height - 15 * mm
    y = top

    p.setFont("Roboto", 10)

    # Заголовок
    p.setFont("Roboto", 14)
    p.drawString(left, y, "СЧЕТ-ФАКТУРА")
    y -= 10 * mm
    p.line(left, y, right, y)
    y -= 7 * mm

    # Продавец
    p.setFont("Roboto", 9)
    seller_info = [
        "Продавец: ООО «Рели»",
        "Ул. Примерная 12, 123456 Москва, Россия",
        "ИНН: 1234567890 / КПП: 123456789",
        "Email: support@reli.one",
    ]
    for line in seller_info:
        p.drawString(left, y, line)
        y -= 5 * mm

    y -= 5 * mm
    p.line(left, y, right, y)
    y -= 7 * mm

    # Покупатель
    order = orders[0]
    p.drawString(left, y, "Покупатель:")
    y -= 5 * mm
    p.drawString(left, y, f"{order.first_name} {order.last_name}")
    y -= 5 * mm
    if order.delivery_address:
        addr = order.delivery_address
        p.drawString(left, y, addr.street)
        y -= 5 * mm
        p.drawString(left, y, f"{addr.zip_code} {addr.city}")
        y -= 5 * mm
        p.drawString(left, y, addr.country)
        y -= 5 * mm
        p.drawString(left, y, f"Email: {addr.email}")
        y -= 5 * mm
    elif order.pickup_point_id:
        point = get_pickup_point_details(order.pickup_point_id)
        p.drawString(left, y, "Пункт самовывоза:")
        y -= 5 * mm
        if point:
            p.drawString(left, y, f"{point['place']}, {point['street']}, {point['city']}")
        else:
            p.drawString(left, y, f"ID: {order.pickup_point_id}")
        y -= 5 * mm
        p.drawString(left, y, f"Email: {order.customer_email}")
        y -= 5 * mm

    y -= 5 * mm
    p.line(left, y, right, y)
    y -= 8 * mm

    # Шапка таблицы
    p.setFont("Roboto", 9)
    p.drawString(left, y, "Кол-во")
    p.drawString(left + 20 * mm, y, "Артикул")
    p.drawString(left + 50 * mm, y, "Наименование")
    p.drawRightString(left + 140 * mm, y, "Цена за ед.")
    p.drawRightString(left + 165 * mm, y, "Сумма")
    p.drawRightString(right, y, "НДС")
    y -= 2 * mm
    p.line(left, y, right, y)
    y -= 6 * mm

    # Товары
    p.setFont("Roboto", 9)
    grand_total = Decimal("0.00")
    vat_rate = Decimal("0.12")
    for order in orders:
        for item in order.order_products.select_related("product__product"):
            name = item.product.product.name
            sku = item.product.sku
            qty = item.quantity
            price = item.product_price
            total = price * qty
            vat = f"{int(vat_rate * 100)}%"

            grand_total += total

            p.drawString(left, y, str(qty))
            p.drawString(left + 20 * mm, y, sku)
            p.drawString(left + 50 * mm, y, name[:40])
            p.drawRightString(left + 140 * mm, y, format_eur(price))
            p.drawRightString(left + 165 * mm, y, format_eur(total))
            p.drawRightString(right, y, vat)
            y -= 5 * mm

            if y < 60 * mm:
                p.showPage()
                y = top
                p.setFont("Roboto", 9)

    # --- Линия перед итогом ---
    y -= 5 * mm
    p.line(left, y, right, y)
    y -= 7 * mm

    # Подсчёт
    netto = grand_total / (1 + vat_rate)
    dph = grand_total - netto

    # Блок справа: суммы
    p.setFont("Roboto", 10)
    block_right_x = right
    block_y = y

    p.drawRightString(block_right_x - 60, block_y, "Сумма без НДС:")
    p.drawRightString(block_right_x, block_y, format_eur(netto))
    block_y -= 6 * mm

    p.drawRightString(block_right_x - 60, block_y, "НДС (12%):")
    p.drawRightString(block_right_x, block_y, format_eur(dph))
    block_y -= 6 * mm

    p.setFont("Roboto", 11)
    p.drawRightString(block_right_x - 60, block_y, "Итого к оплате:")
    p.drawRightString(block_right_x, block_y, format_eur(grand_total))

    # --- Футер: служебная информация внизу страницы ---
    p.setFont("Roboto", 9)
    footer_y = 15 * mm
    p.drawString(left, footer_y + 5 * mm, "Заказ оплачен. Счёт предоставлен для информации.")
    p.drawString(left, footer_y, "По вопросам возврата свяжитесь с support@reli.one")

    # Завершение
    p.showPage()
    p.save()
    buffer.seek(0)
    return ContentFile(buffer.getvalue(), name=f"invoice_{invoice_number}.pdf")
