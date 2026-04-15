import os
from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO

from PIL import Image
from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    Flowable,
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from .invoice_data import prepare_invoice_data

font_dir = os.path.join(settings.BASE_DIR, "order", "fonts")
pdfmetrics.registerFont(TTFont("Roboto", os.path.join(font_dir, "Roboto-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Roboto-Bold", os.path.join(font_dir, "Roboto-Bold.ttf")))


class NumberedCanvas(Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(total_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, total_pages):
        page_width, _ = A4
        self.setFont("Roboto", 8)
        self.setFillColor(colors.black)
        self.drawRightString(
            page_width - 20 * mm,
            10 * mm,
            f"Page {self._pageNumber} of {total_pages}"
        )


class BottomAlignedBlock(Flowable):
    """
    Занимает оставшуюся высоту страницы и рисует вложенные flowables
    у нижнего края, но с безопасным нижним отступом.
    """

    def __init__(self, flowables, top_padding_mm=0, bottom_padding_mm=6):
        super().__init__()
        self.flowables = flowables
        self.top_padding = top_padding_mm * mm
        self.bottom_padding = bottom_padding_mm * mm
        self._child_sizes = []
        self._content_height = 0

    def wrap(self, availWidth, availHeight):
        self._child_sizes = []
        total_h = 0

        for flowable in self.flowables:
            w, h = flowable.wrap(availWidth, availHeight)
            self._child_sizes.append((flowable, w, h))
            total_h += h

        total_h += self.top_padding + self.bottom_padding
        self._content_height = total_h
        return availWidth, availHeight

    def draw(self):
        y = self._content_height - self.top_padding - self.bottom_padding
        for flowable, w, h in self._child_sizes:
            y -= h
            flowable.drawOn(self.canv, 0, y)


def format_currency(value, symbol='€'):
    val = Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    val_str = f"{val:,.2f}"
    return f"{symbol} {val_str}"


def build_styles():
    styles = getSampleStyleSheet()

    return {
        "normal": ParagraphStyle(
            "InvoiceNormal",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=9,
            leading=11,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "small": ParagraphStyle(
            "InvoiceSmall",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=8,
            leading=10,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "small_bold": ParagraphStyle(
            "InvoiceSmallBold",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "bold": ParagraphStyle(
            "InvoiceBold",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "title": ParagraphStyle(
            "InvoiceTitle",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=18,
            leading=22,
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "cell_left": ParagraphStyle(
            "InvoiceCellLeft",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=8.5,
            leading=10,
            alignment=TA_LEFT,
            textColor=colors.black,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
        "cell_center": ParagraphStyle(
            "InvoiceCellCenter",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=8.5,
            leading=10,
            alignment=TA_CENTER,
            textColor=colors.black,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
        "cell_right": ParagraphStyle(
            "InvoiceCellRight",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=8.5,
            leading=10,
            alignment=TA_RIGHT,
            textColor=colors.black,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
        "header_cell": ParagraphStyle(
            "InvoiceHeaderCell",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=9,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "customer_name": ParagraphStyle(
            "InvoiceCustomerName",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=10,
            leading=12,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "meta_block": ParagraphStyle(
            "InvoiceMetaBlock",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.black,
            spaceAfter=0,
            spaceBefore=0,
        ),
        "totals_label": ParagraphStyle(
            "InvoiceTotalsLabel",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=8.5,
            leading=10,
            alignment=TA_LEFT,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
        "totals_label_bold": ParagraphStyle(
            "InvoiceTotalsLabelBold",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=9,
            leading=11,
            alignment=TA_LEFT,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
        "totals_value": ParagraphStyle(
            "InvoiceTotalsValue",
            parent=styles["Normal"],
            fontName="Roboto",
            fontSize=9,
            leading=11,
            alignment=TA_RIGHT,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
        "totals_value_bold": ParagraphStyle(
            "InvoiceTotalsValueBold",
            parent=styles["Normal"],
            fontName="Roboto-Bold",
            fontSize=10,
            leading=12,
            alignment=TA_RIGHT,
            wordWrap="LTR",
            spaceAfter=0,
            spaceBefore=0,
        ),
    }


def draw_first_page(canvas, doc):
    page_width, page_height = A4

    top_margin = 15 * mm
    right_margin = 25 * mm
    logo_height = 18 * mm

    logo_path = os.path.join(settings.BASE_DIR, 'logo_reli.png')
    if os.path.isfile(logo_path):
        im = Image.open(logo_path)
        aspect = im.width / im.height
        logo_width = logo_height * aspect
        logo_x = page_width - right_margin - logo_width
        logo_y = page_height - top_margin - logo_height
        canvas.drawImage(
            logo_path,
            logo_x,
            logo_y,
            width=logo_width,
            height=logo_height,
            mask='auto'
        )
        logo_bottom = logo_y
    else:
        logo_bottom = page_height - top_margin - logo_height

    stripe_offset = 3 * mm
    bar_height = 5 * mm
    bar_y = logo_bottom - stripe_offset - bar_height
    canvas.setFillColor(colors.HexColor('#FFC107'))
    canvas.rect(0, bar_y, page_width, bar_height, stroke=0, fill=1)

    header_text = "Reli Group s.r.o. - Na lysinách 551/34, Hodkovičky, 14700 Praha 4, Czech Republic"
    font_size = 10
    canvas.setFont("Roboto", font_size)
    canvas.setFillColor(colors.black)
    text_width = canvas.stringWidth(header_text, "Roboto", font_size)
    text_y = bar_y + (bar_height - font_size) / 2 + 1
    canvas.drawString((page_width - text_width) / 2, text_y, header_text)


def draw_later_pages(canvas, doc):
    pass


def build_company_customer_table(data, styles, page_width):
    content_width = page_width - 40 * mm

    company_lines = [
        f"<font name='Roboto-Bold' size='12'>{data['company_name']}</font>",
        "Na lysinách 551/34",
        "Hodkovičky",
        "14700 Praha 4",
        "Czech Republic",
        f"Company Identification Number: {data['tax_id']}",
        f"IBAN: {data['iban']}",
        f"Account number/bank code: {data['account_number']}",
        f"SWIFT (BIC): {data['swift']}",
        "VAT: VAT registered",
    ]

    customer = data["customer"]
    customer_lines = [
        "<font name='Roboto-Bold' size='11'>Bill To:</font>",
        f"{customer.get('full_name', '') or ''}",
    ]

    if customer.get("address"):
        customer_lines.append(customer["address"])

    zip_city = f"{customer.get('zip_code', '')} {customer.get('city', '')}".strip()
    if zip_city:
        customer_lines.append(zip_city)

    if customer.get("country"):
        customer_lines.append(customer["country"])

    left_cell = Paragraph("<br/>".join(company_lines), styles["normal"])
    right_cell = Paragraph("<br/>".join(customer_lines), styles["customer_name"])

    table = Table(
        [[left_cell, right_cell]],
        colWidths=[content_width * 0.58, content_width * 0.42],
    )
    table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return table


def build_invoice_meta_table(data, styles, page_width):
    content_width = page_width - 40 * mm

    meta_lines = [
        f"Invoice Number: {data['invoice_number']}",
        f"Variable Symbol: {data.get('variable_symbol', data['invoice_number'])}",
        f"Invoice Date: {data['order_date']}",
        f"Payment Method: {data.get('payment_method', '-')}",
    ]

    meta_paragraph = Paragraph("<br/>".join(meta_lines), styles["meta_block"])

    table = Table(
        [['', meta_paragraph]],
        colWidths=[content_width * 0.58, content_width * 0.42],
    )
    table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return table


def build_products_table(data, styles, page_width):
    table_data = [[
        Paragraph('No.', styles["header_cell"]),
        Paragraph('Qty', styles["header_cell"]),
        Paragraph('SKU', styles["header_cell"]),
        Paragraph('Description', styles["header_cell"]),
        Paragraph('Unit Price<br/><font name="Roboto" size="8">(incl. VAT)</font>', styles["header_cell"]),
        Paragraph('Total<br/><font name="Roboto" size="8">(incl. VAT)</font>', styles["header_cell"]),
        Paragraph('VAT Rate', styles["header_cell"]),
    ]]

    for index, product in enumerate(data["products"], start=1):
        vat_rate = product.get("vat_rate", 0)
        vat_text = f"{vat_rate:.0f}%" if float(vat_rate).is_integer() else f"{vat_rate}%"

        table_data.append([
            Paragraph(str(index), styles["cell_center"]),
            Paragraph(str(product["qty"]), styles["cell_center"]),
            Paragraph(str(product["sku"]), styles["cell_center"]),
            Paragraph(product["name"], styles["cell_left"]),
            Paragraph(format_currency(product["unit_price"]), styles["cell_right"]),
            Paragraph(format_currency(product["total"]), styles["cell_right"]),
            Paragraph(vat_text, styles["cell_center"]),
        ])

    content_width = page_width - 40 * mm

    # Сохраняем ту же общую геометрию, но делаем колонки Unit Price / Total
    # достаточно широкими для двухстрочного заголовка.
    col_widths = [
        10 * mm,  # No.
        11 * mm,  # Qty
        22 * mm,  # SKU
        content_width - (10 * mm + 11 * mm + 22 * mm + 26 * mm + 26 * mm + 18 * mm),  # Description
        26 * mm,  # Unit Price
        26 * mm,  # Total
        18 * mm,  # VAT Rate
    ]

    table = Table(
        table_data,
        colWidths=col_widths,
        repeatRows=1,
        splitByRow=1,
    )
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFC107')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),

        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),

        ('ALIGN', (0, 0), (2, -1), 'CENTER'),
        ('ALIGN', (4, 0), (5, -1), 'RIGHT'),
        ('ALIGN', (6, 0), (6, -1), 'CENTER'),
    ]))
    return table


def build_totals_table(data, styles, page_width):
    total = Decimal(str(data.get('grand_total', 0))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    delivery_total = Decimal(str(data.get('delivery_total', '0.00'))).quantize(Decimal('0.01'), ROUND_HALF_UP)
    vat_amount = sum(
        Decimal(str(v)) for v in data.get('vat_summary', {}).values()
    ).quantize(Decimal('0.01'), ROUND_HALF_UP)

    # ВАЖНО:
    # Net Amount = сумма товаров без VAT и без доставки.
    # Иначе доставка попадает и сюда, и отдельной строкой Delivery Total.
    net_amount = (total - vat_amount - delivery_total).quantize(Decimal('0.01'), ROUND_HALF_UP)

    content_width = page_width - 40 * mm

    left_spacer = 95 * mm
    label_col_width = 40 * mm
    value_col_width = content_width - left_spacer - label_col_width

    rows = [
        [
            '',
            Paragraph("Net&nbsp;Amount&nbsp;(EUR):", styles["totals_label"]),
            Paragraph(format_currency(net_amount), styles["totals_value"]),
        ],
        [
            '',
            Paragraph("VAT&nbsp;Amount&nbsp;(EUR):", styles["totals_label"]),
            Paragraph(format_currency(vat_amount), styles["totals_value"]),
        ],
        [
            '',
            Paragraph("Delivery&nbsp;Total&nbsp;(EUR):", styles["totals_label"]),
            Paragraph(format_currency(delivery_total), styles["totals_value"]),
        ],
        [
            '',
            Paragraph("Total&nbsp;Amount&nbsp;Due&nbsp;(EUR):", styles["totals_label_bold"]),
            Paragraph(format_currency(total), styles["totals_value_bold"]),
        ],
    ]

    table = Table(
        rows,
        colWidths=[
            left_spacer,
            label_col_width,
            value_col_width,
        ],
    )

    table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),

        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),

        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
    ]))

    return table


def build_bottom_footer_block(data, styles):
    items = []

    terms = [
        "Order paid in advance. Returns accepted within 14 days from delivery. VAT may be deductible subject to applicable law.",
        "Contact: info@reli.one",
    ]
    for line in terms:
        items.append(Paragraph(line, styles["small"]))
        items.append(Spacer(1, 2 * mm))

    items.append(Spacer(1, 2 * mm))

    footer_lines = data.get('footer_lines') or [
        "Order paid. Invoice issued.",
        "For return inquiries, contact: office@reli.one",
    ]
    for line in footer_lines:
        items.append(Paragraph(line, styles["small_bold"]))
        items.append(Spacer(1, 2 * mm))

    method = data.get("payment_method")
    if method:
        items.append(Paragraph(f"Paid via {method.title()}", styles["small"]))

    return BottomAlignedBlock(items, top_padding_mm=3)


def build_story(data, styles, page_width):
    story = []

    story.append(Spacer(1, 22 * mm))

    story.append(build_company_customer_table(data, styles, page_width))
    story.append(Spacer(1, 4 * mm))

    story.append(build_invoice_meta_table(data, styles, page_width))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("INVOICE", styles["title"]))
    story.append(Spacer(1, 5 * mm))

    story.append(build_products_table(data, styles, page_width))
    story.append(Spacer(1, 5 * mm))

    story.append(build_totals_table(data, styles, page_width))
    story.append(Spacer(1, 5 * mm))

    story.append(build_bottom_footer_block(data, styles))

    return story


def generate_invoice_pdf(data_or_session_id) -> ContentFile:
    if isinstance(data_or_session_id, dict):
        data = data_or_session_id
    else:
        data = prepare_invoice_data(data_or_session_id)

    if 'invoice_number' not in data:
        raise ValueError("Missing 'invoice_number' in invoice data")

    if 'variable_symbol' not in data:
        data['variable_symbol'] = data['invoice_number']

    buffer = BytesIO()
    page_w, _ = A4

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        allowSplitting=1,
    )

    styles = build_styles()
    story = build_story(data, styles, page_w)

    doc.build(
        story,
        onFirstPage=draw_first_page,
        onLaterPages=draw_later_pages,
        canvasmaker=NumberedCanvas,
    )

    buffer.seek(0)
    filename = f"Invoice_{data['invoice_number']}.pdf"

    logger = getattr(settings, "INVOICE_LOGGER", None)
    if logger:
        logger.info(f"[INVOICE] PDF generated for invoice {data['invoice_number']}")

    return ContentFile(buffer.read(), name=filename)
