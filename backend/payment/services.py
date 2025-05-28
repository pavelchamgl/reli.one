import os
import logging
from decimal import Decimal
from collections import defaultdict

from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage

from .models import Payment
from .invoices.pdf_generator import generate_invoice_pdf_by_orders
from delivery.models import DeliveryParcelItem
from delivery.services.packeta_point_service import get_pickup_point_details

logger = logging.getLogger(__name__)

def get_logo_base64():
    """
    Возвращает содержимое logo_reli.png в base64 для встраивания в письма.
    """
    path = os.path.join(settings.BASE_DIR, "logo_reli.png")
    if not os.path.exists(path):
        return ""
    import base64
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def get_orders_by_payment_session_id(session_id: str):
    """
    Возвращает список заказов по session_id.
    """
    logger.debug(f"[MAIL] Поиск заказов по session_id: {session_id}")
    payments = Payment.objects.filter(session_id=session_id).select_related("order")
    orders = [p.order for p in payments if p.order]
    logger.debug(f"[MAIL] Найдено заказов: {len(orders)}")
    return orders


def prepare_merged_customer_email_context(orders):
    """
    Формирует общий контекст для писем клиенту и менеджеру.
    """
    first = orders[0]
    ctx = {
        "logo_base64": get_logo_base64(),  # полностью квалифицированный URL для email-клиентов
        "customer": {
            "first_name": first.first_name,
            "last_name":  first.last_name,
            "email":      first.customer_email,
            "phone":      first.phone_number,
        },
        "groups":      [],
        "grand_total": f"{sum(o.group_subtotal for o in orders):.2f}",
        "order_date":  first.order_date.strftime("%d.%m.%Y %H:%M"),
    }

    for order in orders:
        delivery = order.delivery_type.name   if order.delivery_type else ""
        courier  = order.courier_service.name if order.courier_service else ""
        grp = {
            "order_number":     order.order_number,
            "delivery_type":    delivery,
            "courier_service":  courier,
            "delivery_address": None,
            "pickup_point_info":None,
            "products":         [],
            "delivery_cost":    f"{order.delivery_cost:.2f}",
            "group_total":      f"{order.group_subtotal:.2f}",
            "order_date":       order.order_date.strftime("%d.%m.%Y %H:%M"),
        }

        if order.delivery_address:
            a = order.delivery_address
            grp["delivery_address"] = ", ".join(filter(None, [
                a.street, a.city, a.zip_code, a.country
            ]))
        elif order.pickup_point_id:
            pt = get_pickup_point_details(order.pickup_point_id)
            if pt:
                grp["pickup_point_info"] = f"{pt['place']}, {pt['street']}, {pt['city']}"
            else:
                grp["pickup_point_info"] = f"Пункт самовывоза №{order.pickup_point_id}"

        for item in order.order_products.select_related("product__product", "seller_profile__user"):
            grp["products"].append({
                "product_name": item.product.product.name,
                "quantity":     item.quantity,
                "unit_price":   f"{item.product_price:.2f}",
                "total_price":  f"{(item.product_price * item.quantity):.2f}",
            })

        ctx["groups"].append(grp)

    return ctx


def send_merged_customer_email_from_session(session_id: str):
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[CUSTOMER-MAIL] Нет заказов по session_id {session_id}")
        return

    ctx = prepare_merged_customer_email_context(orders)
    html = render_to_string("emails/order_email_customer.html", ctx)

    email = EmailMessage(
        subject="Подтверждение заказа",
        body=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[ctx["customer"]["email"]],
    )
    email.content_subtype = "html"

    # Прикрепляем PDF-счёт
    invoice_pdf = generate_invoice_pdf_by_orders(orders, orders[0].order_number)
    email.attach(invoice_pdf.name, invoice_pdf.read(), "application/pdf")

    try:
        email.send()
        logger.info(f"[CUSTOMER-MAIL] Письмо клиенту {ctx['customer']['email']} отправлено")
    except Exception as e:
        logger.exception(f"[CUSTOMER-MAIL] Ошибка отправки письма клиенту: {e}")


def send_merged_manager_email_from_session(session_id: str):
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[MANAGER-MAIL] Нет заказов по session_id {session_id}")
        return

    ctx = prepare_merged_customer_email_context(orders)
    html = render_to_string("emails/order_email_manager.html", ctx)

    email = EmailMessage(
        subject="Новый заказ",
        body=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=settings.PROJECT_MANAGERS_EMAILS,
    )
    email.content_subtype = "html"

    try:
        email.send()
        logger.info("[MANAGER-MAIL] Письмо менеджерам отправлено")
    except Exception as e:
        logger.exception(f"[MANAGER-MAIL] Ошибка отправки письма менеджерам: {e}")


def send_seller_emails_by_session(session_id: str):
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[SELLER-MAIL] Нет заказов по session_id {session_id}")
        return

    # Группируем OrderProduct по email продавца
    sellers = defaultdict(list)
    for order in orders:
        for item in order.order_products.select_related("product__product", "seller_profile__user"):
            email_to = getattr(item.seller_profile.user, "email", None)
            if email_to:
                sellers[email_to].append((order, item))

    for seller_email, entries in sellers.items():
        seller_groups = defaultdict(lambda: {
            "order_number":     None,
            "delivery_type":    "",
            "courier_service":  "",
            "delivery_address": None,
            "pickup_point_info":None,
            "products":         [],
            "delivery_cost":    Decimal("0.00"),
            "group_total":      Decimal("0.00"),
            "order_date":       None,
        })
        product_ids = []

        for order, item in entries:
            grp = seller_groups[order.id]
            grp["order_number"]   = order.order_number
            grp["delivery_type"]  = order.delivery_type.name    if order.delivery_type else ""
            grp["courier_service"]= order.courier_service.name  if order.courier_service else ""
            grp["order_date"]     = order.order_date

            if order.delivery_address:
                a = order.delivery_address
                grp["delivery_address"] = ", ".join(filter(None, [
                    a.street, a.city, a.zip_code, a.country
                ]))
            elif order.pickup_point_id:
                pt = get_pickup_point_details(order.pickup_point_id)
                grp["pickup_point_info"] = (
                    f"{pt['place']}, {pt['street']}, {pt['city']}" if pt else
                    f"Пункт самовывоза №{order.pickup_point_id}"
                )

            grp["products"].append({
                "product_name": item.product.product.name,
                "quantity":     item.quantity,
                "unit_price":   f"{item.product_price:.2f}",
                "total_price":  f"{(item.product_price * item.quantity):.2f}",
            })
            grp["delivery_cost"] += order.delivery_cost
            grp["group_total"]   += item.product_price * item.quantity
            product_ids.append(item.id)

        for grp in seller_groups.values():
            grp["delivery_cost"] = f"{grp['delivery_cost']:.2f}"
            grp["group_total"]   = f"{grp['group_total']:.2f}"
            grp["order_date"]    = grp["order_date"].strftime("%d.%m.%Y %H:%M")

        parcel_map = defaultdict(list)
        parcel_files = set()
        for dpi in (DeliveryParcelItem.objects.filter(order_product_id__in=product_ids)
                .select_related("parcel", "order_product__product__product")):
            tracking = dpi.parcel.tracking_number or f"Parcel #{dpi.parcel.pk}"
            parcel_map[tracking].append({
                "product_name": dpi.order_product.product.product.name,
                "sku":           dpi.order_product.product.sku,
                "quantity":      dpi.quantity,
            })
            if dpi.parcel.label_file and os.path.isfile(dpi.parcel.label_file.path):
                parcel_files.add(dpi.parcel.label_file.path)

        parcels = [{"tracking_number": t, "items": it} for t, it in parcel_map.items()]

        ctx = prepare_merged_customer_email_context(orders)
        ctx.update({
            "seller_email": seller_email,
            "groups":       list(seller_groups.values()),
            "parcels":      parcels,
        })
        html = render_to_string("emails/order_email_seller.html", ctx)

        email = EmailMessage(
            subject="Новый заказ для вас",
            body=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[seller_email],
        )
        email.content_subtype = "html"

        for path in parcel_files:
            email.attach_file(path)

        try:
            email.send()
            logger.info(f"[SELLER-MAIL] Письмо продавцу {seller_email} отправлено")
        except Exception as e:
            logger.exception(f"[SELLER-MAIL] Ошибка при отправке письма продавцу {seller_email}: {e}")