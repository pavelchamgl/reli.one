import os
import logging
from decimal import Decimal
from premailer import transform
from collections import defaultdict

from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage, EmailMultiAlternatives

from .models import Payment
from .invoices.pdf_generator import generate_invoice_pdf_by_orders
from delivery.models import DeliveryParcelItem
from delivery.services.packeta_point_service import get_pickup_point_details

logger = logging.getLogger(__name__)

LOGO_URL = 'https://res.cloudinary.com/daffwdfvn/image/upload/v1748957272/Reli/logo_reli_ouhtmo.png'


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
    Для каждой группы (order) складывает:
      - order_id, order_number
      - delivery_type, courier_service
      - delivery_address или pickup_point_info
      - список sellers (email)
      - список products
      - delivery_cost, group_total, order_date
    """
    first = orders[0]
    ctx = {
        "logo_url": LOGO_URL,
        "customer": {
            "first_name": first.first_name,
            "last_name":  first.last_name,
            "email":      first.customer_email,
            "phone":      first.phone_number,
        },
        "order_date":  first.order_date.strftime("%d.%m.%Y %H:%M"),
        "grand_total": f"{sum(o.group_subtotal for o in orders):.2f}",
        "groups":      [],
    }

    for order in orders:
        sellers = set()
        delivery = order.delivery_type.name   if order.delivery_type else ""
        courier  = order.courier_service.name if order.courier_service else ""
        grp = {
            "order_id":          order.id,
            "order_number":      order.order_number,
            "delivery_type":     delivery,
            "courier_service":   courier,
            "delivery_address":  None,
            "pickup_point_info": None,
            "sellers":           [],
            "products":          [],
            "delivery_cost":     f"{order.delivery_cost:.2f}",
            "group_total":       f"{order.group_subtotal:.2f}",
            "order_date":        order.order_date.strftime("%d.%m.%Y %H:%M"),
        }

        if order.delivery_address:
            a = order.delivery_address
            grp["delivery_address"] = ", ".join(filter(None, [
                a.street, a.city, a.zip_code, a.country
            ]))
        elif order.pickup_point_id:
            pt = get_pickup_point_details(order.pickup_point_id)
            grp["pickup_point_info"] = (
                f"{pt['place']}, {pt['street']}, {pt['city']}"
                if pt else f"Пункт самовывоза №{order.pickup_point_id}"
            )

        for item in order.order_products.select_related("seller_profile__user", "product__product"):
            user = getattr(item.seller_profile, "user", None)
            if user and user.email:
                sellers.add(user.email)
            grp["products"].append({
                "product_name": item.product.product.name,
                "quantity":     item.quantity,
                "unit_price":   f"{item.product_price:.2f}",
                "total_price":  f"{(item.product_price * item.quantity):.2f}",
            })

        grp["sellers"] = sorted(sellers)
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

    # 1) базовый контекст
    ctx = prepare_merged_customer_email_context(orders)

    # 2) собрать данные по посылкам
    order_ids = [g["order_id"] for g in ctx["groups"]]
    parcel_map = {oid: defaultdict(list) for oid in order_ids}

    items = DeliveryParcelItem.objects.filter(
        order_product__order_id__in=order_ids
    ).select_related("parcel", "order_product__product__product", "order_product")

    for dpi in items:
        oid = dpi.order_product.order_id
        tn  = dpi.parcel.tracking_number or f"Parcel #{dpi.parcel.pk}"
        parcel_map[oid][tn].append({
            "product_name": dpi.order_product.product.product.name,
            "sku":           dpi.order_product.product.sku,
            "quantity":      dpi.quantity,
        })

    # 3) вложить parcels в группы
    for grp in ctx["groups"]:
        grp["parcels"] = [
            {"tracking_number": tn, "items": itm}
            for tn, itm in parcel_map[grp["order_id"]].items()
        ]

    # 4) рендер и отправка
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
        logger.info(f"[MANAGER-MAIL] Письмо менеджерам отправлено по session {session_id}")
    except Exception as e:
        logger.exception(f"[MANAGER-MAIL] Ошибка при отправке письма менеджерам: {e}")


def send_seller_emails_by_session(session_id: str):
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[SELLER-MAIL] Нет заказов по session_id {session_id}")
        return

    # Сгруппировать OrderProduct по каждому seller.email
    sellers = defaultdict(list)
    for order in orders:
        for item in order.order_products.select_related("product__product", "seller_profile__user"):
            email_to = getattr(item.seller_profile.user, "email", None)
            if email_to:
                sellers[email_to].append((order, item))

    for seller_email, entries in sellers.items():
        # Структура групп для шаблона
        seller_groups = defaultdict(lambda: {
            "order_number":      None,
            "delivery_type":     "",
            "courier_service":   "",
            "delivery_address":  None,
            "pickup_point_info": None,
            "products":          [],
            "delivery_cost":     Decimal("0.00"),
            "group_total":       Decimal("0.00"),
            "order_date":        None,
        })
        product_ids = []

        # Наполняем данные по каждой группе
        for order, item in entries:
            grp = seller_groups[order.id]
            grp["order_number"]    = order.order_number
            grp["delivery_type"]   = order.delivery_type.name   if order.delivery_type else ""
            grp["courier_service"] = order.courier_service.name if order.courier_service else ""
            grp["order_date"]      = order.order_date

            # Адрес или пункт самовывоза
            if order.delivery_address:
                a = order.delivery_address
                grp["delivery_address"] = ", ".join(filter(None, [
                    a.street, a.city, a.zip_code, a.country
                ]))
            elif order.pickup_point_id:
                pt = get_pickup_point_details(order.pickup_point_id)
                grp["pickup_point_info"] = (
                    f"{pt['place']}, {pt['street']}, {pt['city']}"
                    if pt else f"Пункт самовывоза №{order.pickup_point_id}"
                )

            # Товары продавца в этом заказе
            grp["products"].append({
                "product_name": item.product.product.name,
                "quantity":     item.quantity,
                "unit_price":   f"{item.product_price:.2f}",
                "total_price":  f"{(item.product_price * item.quantity):.2f}",
            })
            grp["delivery_cost"] += order.delivery_cost
            grp["group_total"]   += item.product_price * item.quantity
            product_ids.append(item.id)

        # Отформатировать числа и даты
        for g in seller_groups.values():
            g["delivery_cost"] = f"{g['delivery_cost']:.2f}"
            g["group_total"]   = f"{g['group_total']:.2f}"
            g["order_date"]    = g["order_date"].strftime("%d.%m.%Y %H:%M")

        # Подготовить данные по посылкам и PDF-ярлыкам
        parcel_map, parcel_files = defaultdict(list), set()
        for dpi in DeliveryParcelItem.objects.filter(order_product_id__in=product_ids) \
                                             .select_related("parcel", "order_product__product__product"):
            tracking = dpi.parcel.tracking_number or f"Parcel #{dpi.parcel.pk}"
            parcel_map[tracking].append({
                "product_name": dpi.order_product.product.product.name,
                "sku":           dpi.order_product.product.sku,
                "quantity":      dpi.quantity,
            })
            if dpi.parcel.label_file and os.path.isfile(dpi.parcel.label_file.path):
                parcel_files.add(dpi.parcel.label_file.path)
        parcels = [{"tracking_number": t, "items": it} for t, it in parcel_map.items()]

        # Общий контекст (включает logo_base64 из prepare_merged_customer_email_context)
        ctx = prepare_merged_customer_email_context(orders)
        ctx.update({
            "groups":  list(seller_groups.values()),
            "parcels": parcels,
        })

        # Рендерим и отправляем HTML-письмо
        html_raw = render_to_string("emails/order_email_seller.html", ctx)
        html_inline = transform(html_raw)
        email = EmailMultiAlternatives(
            subject="Новый заказ для вас",
            body="123",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[seller_email],
        )
        email.attach_alternative(html_inline, "text/html")

        # Прикрепляем PDF-ярлыки
        for fpath in parcel_files:
            email.attach_file(fpath)

        try:
            email.send()
            logger.info(f"[SELLER-MAIL] Письмо продавцу {seller_email} отправлено")
        except Exception as e:
            logger.exception(f"[SELLER-MAIL] Ошибка при отправке письма продавцу {seller_email}: {e}")
