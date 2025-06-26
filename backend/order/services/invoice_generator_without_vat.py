import os

from io import BytesIO
from PIL import Image
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Table, TableStyle
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from django.core.files.base import ContentFile

from .invoice_data import prepare_invoice_data


font_dir = os.path.join(settings.BASE_DIR, "order", "fonts")
pdfmetrics.registerFont(TTFont("Roboto", os.path.join(font_dir, "Roboto-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Roboto-Bold", os.path.join(font_dir, "Roboto-Bold.ttf")))


def format_currency(value, symbol='€'):
    val = Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    val_str = f"{val:,.2f}"
    return f"{symbol} {val_str}"


def draw_logo_and_header(c, width, height):
    top_margin = 15 * mm
    right_margin = 25 * mm
    logo_height = 18 * mm

    logo_path = os.path.join(settings.BASE_DIR, 'logo_reli.png')
    if os.path.isfile(logo_path):
        im = Image.open(logo_path)
        aspect = im.width / im.height
        logo_width = logo_height * aspect
        logo_x = width - right_margin - logo_width
        logo_y = height - top_margin - logo_height
        c.drawImage(logo_path, logo_x, logo_y, width=logo_width, height=logo_height, mask='auto')
        logo_bottom = logo_y
    else:
        logo_bottom = height - top_margin - logo_height

    stripe_offset = 3 * mm
    bar_height = 5 * mm
    bar_y = logo_bottom - stripe_offset - bar_height
    c.setFillColor(colors.HexColor('#FFC107'))
    c.rect(0, bar_y, width, bar_height, stroke=0, fill=1)

    green_text = "Reli Group s.r.o. - Na lysinách 551/34, Hodkovičky, 14700 Praha 4, Czech Republic"
    green_font_size = 10
    c.setFont('Roboto', green_font_size)
    c.setFillColor(colors.black)
    text_width = c.stringWidth(green_text, 'Roboto', green_font_size)
    text_y = bar_y + (bar_height - green_font_size) / 2 + 1
    c.drawString((width - text_width) / 2, text_y, green_text)
    c.setFillColor(colors.black)

    return bar_y - 8 * mm


def draw_company_and_customer_info(c, data, width, y):
    left_x = 20 * mm
    right_x = width - 75 * mm

    company_text = c.beginText()
    company_text.setFont('Roboto-Bold', 12)
    company_text.setTextOrigin(left_x, y)
    company_text.textLine(data['company_name'])
    company_text.setFont('Roboto', 9)
    for line in data['company_address'].split(', '):
        company_text.textLine(line)
    company_text.textLine(f"Tax ID: {data['tax_id']}")
    company_text.textLine(f"IBAN: {data['iban']}")
    company_text.textLine(f"Account number/bank code: {data['account_number']}")
    company_text.textLine(f"SWIFT (BIC): {data['swift']}")
    c.drawText(company_text)

    customer = data['customer']
    customer_text = c.beginText()
    customer_text.setFont('Roboto-Bold', 11)
    customer_text.setTextOrigin(right_x, y)
    customer_text.textLine("Bill To:")
    customer_text.setFont('Roboto', 9)
    customer_text.textLine(customer['full_name'])
    customer_text.textLine(customer['address'])
    customer_text.textLine(f"{customer['zip_code']} {customer['city']}")
    customer_text.textLine(customer['country'])
    c.drawText(customer_text)

    return y - 30 * mm


def draw_invoice_meta(c, data, width, y):
    text = c.beginText()
    text.setFont('Roboto-Bold', 10)
    x0 = width - 75 * mm
    text.setTextOrigin(x0, y)
    text.textLine(f"Invoice Number: {data['invoice_number']}")
    text.textLine(f"Variable Symbol: {data.get('variable_symbol', data['invoice_number'])}")
    text.textLine(f"Invoice Date: {data['order_date']}")
    text.textLine(f"Payment Method: {data.get('payment_method', '-')}")
    c.drawText(text)
    return y - 20 * mm


def draw_invoice_title(c, y):
    c.setFont("Roboto-Bold", 18)
    text = "INVOICE"
    text_width = c.stringWidth(text, "Roboto-Bold", 18)
    x = (c._pagesize[0] - text_width) / 2
    c.drawString(x, y, text)
    return y - 5 * mm


def draw_products_table(c, data, y, page_width):
    table_data = [[
        'Qty', 'SKU', 'Description', 'Unit Price', 'Total'
    ]]
    for p in data['products']:
        table_data.append([
            str(p['qty']), p['sku'], p['name'],
            format_currency(p['unit_price']), format_currency(p['total']),
        ])
    col_widths = [
        15 * mm,  # Qty
        25 * mm,  # SKU
        page_width - 40 * mm - (15 + 25 + 35 + 35) * mm,  # Description = всё остальное
        35 * mm,  # Unit Price
        35 * mm  # Total
    ]
    tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFC107')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('FONT', (0, 0), (-1, 0), 'Roboto-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Roboto', 9),
        ('ALIGN', (0, 0), (1, -1), 'CENTER'),
        ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
        ('ALIGN', (5, 0), (5, -1), 'CENTER'),
    ]))
    avail_w = page_width - 40 * mm
    w, h = tbl.wrap(avail_w, y)
    tbl.drawOn(c, 20 * mm, y - h)
    return y - h - 10 * mm


def draw_totals(c, data, y_top, page_width):
    c.setStrokeColor(colors.HexColor("#CCCCCC"))
    c.setLineWidth(0.5)
    c.line(20 * mm, y_top + 5 * mm, page_width - 20 * mm, y_top + 5 * mm)

    total = Decimal(str(data.get('grand_total', 0)))
    delivery_total = Decimal(str(data.get('delivery_total', '0.00'))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    net_amount = total.quantize(Decimal('0.01'), ROUND_HALF_UP)

    x0 = page_width - 20 * mm - 70 * mm
    y = y_top
    line_height = 5 * mm

    c.setFont('Roboto', 9)
    c.drawString(x0, y, 'Net Amount (EUR):')
    c.drawRightString(page_width - 20 * mm, y, format_currency(net_amount))
    y -= line_height

    c.drawString(x0, y, 'Delivery Total (EUR):')
    c.drawRightString(page_width - 20 * mm, y, format_currency(delivery_total))
    y -= line_height + 2 * mm

    c.setFont('Roboto-Bold', 10)
    c.drawString(x0, y, 'Total Amount Due (EUR):')
    c.drawRightString(page_width - 20 * mm, y, format_currency(total))

    return y - 10 * mm


def draw_terms_block(c, page_width):
    c.setFont("Roboto", 8)
    c.setFillColor(colors.black)
    x = 20 * mm
    y = 31 * mm

    terms = [
        "Order paid in advance. Returns accepted within 14 days from delivery. No VAT deduction possible (B2C transaction).",
        "Contact: info@reli.one",
    ]

    for line in terms:
        c.drawString(x, y, line)
        y -= 4 * mm

    return y


def draw_footer(c, data, page_width):
    c.setFont("Roboto-Bold", 8)
    c.setFillColor(colors.black)
    x = 20 * mm
    y = 22 * mm
    lines = data.get('footer_lines') or [
        "Order paid. Invoice issued.",
        "For return inquiries, contact: office@reli.one"
    ]
    for line in lines:
        c.drawString(x, y, line)
        y -= 4 * mm

    method = data.get("payment_method")
    if method:
        c.setFont("Roboto", 8)
        c.drawString(x, y - 1 * mm, f"Paid via {method.title()}")


def generate_invoice_pdf(data_or_session_id) -> ContentFile:
    if isinstance(data_or_session_id, dict):
        data = data_or_session_id
    else:
        data = prepare_invoice_data(data_or_session_id)

    # Проверка обязательных ключей
    if 'invoice_number' not in data:
        raise ValueError("Missing 'invoice_number' in invoice data")

    if 'variable_symbol' not in data:
        data['variable_symbol'] = data['invoice_number']

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_w, page_h = A4

    y = draw_logo_and_header(c, page_w, page_h)
    y = draw_company_and_customer_info(c, data, page_w, y)
    y = draw_invoice_meta(c, data, page_w, y)
    y = draw_invoice_title(c, y)
    y = draw_products_table(c, data, y, page_w)
    y = draw_totals(c, data, y, page_w)
    y = draw_terms_block(c, page_w)
    draw_footer(c, data, page_w)

    c.showPage()
    c.save()
    buffer.seek(0)

    filename = f"Invoice_{data['invoice_number']}.pdf"

    # Логгирование (опционально)
    logger = getattr(settings, "INVOICE_LOGGER", None)
    if logger:
        logger.info(f"[INVOICE] PDF generated for invoice {data['invoice_number']}")

    return ContentFile(buffer.read(), name=filename)
