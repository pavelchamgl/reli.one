import os
import logging
import unicodedata

from decimal import Decimal
from premailer import transform
from collections import defaultdict

from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.core.files.storage import default_storage

from order.models import Order, Invoice
from delivery.models import DeliveryParcelItem
from delivery.services.packeta_point_service import get_pickup_point_details

logger = logging.getLogger(__name__)

LOGO_URL = 'https://res.cloudinary.com/daffwdfvn/image/upload/v1748957272/Reli/logo_reli_ouhtmo.png'

# ссылки на поддержку курьеров (используются только в письме продавцу)
COURIER_SUPPORT = {
    "gls": "https://gls-group.com/CZ/en/senders/client-zone",
    "zasilkovna": "https://www.zasilkovna.cz/en/contacts",  # Packeta/Zásilkovna
    "packeta": "https://www.packeta.com/contact",
    "dpd": "https://www.dpd.com/cz/en/contact",              # ← добавлено
}


def _normalize_courier_name(s: str) -> str:
    """lower + убираем диакритику, чтобы 'Zásilkovna' == 'Zasilkovna'."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return s.lower()


def _courier_meta(name: str):
    """
    Возвращает (short_name, support_url) по названию курьерской службы.
    Матчит по подстроке на нормализованном имени (без диакритики).
    """
    key = _normalize_courier_name(name)
    if "gls" in key:
        return "GLS", COURIER_SUPPORT["gls"]
    if "dpd" in key:  # ← добавлено
        return "DPD", COURIER_SUPPORT["dpd"]
    if "zasil" in key or "packeta" in key:
        # считаем Zásilkovna == Packeta (бренд)
        return "Zásilkovna", COURIER_SUPPORT["zasilkovna"]
    return (name or "").strip() or "Courier", None


def get_orders_by_payment_session_id(session_id: str):
    """
    Возвращает список заказов по session_id из Payment.
    """
    logger.debug(f"[MAIL] Поиск заказов по session_id: {session_id}")
    orders = Order.objects.filter(payment__session_id=session_id)
    logger.debug(f"[MAIL] Найдено заказов: {orders.count()}")
    return list(orders)


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
    # Получаем все заказы, связанные с сессией
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[CUSTOMER-MAIL] Нет заказов по session_id {session_id}")
        return

    # Формируем контекст письма
    ctx = prepare_merged_customer_email_context(orders)
    html = render_to_string("emails/order_email_customer.html", ctx)

    # Готовим письмо
    email = EmailMessage(
        subject="ORDER CONFIRMATION",
        body=html,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL"),
        to=[ctx["customer"]["email"]],
    )
    email.content_subtype = "html"

    # Прикрепляем ранее сгенерированный PDF-инвойс
    invoice = Invoice.objects.filter(payment__session_id=session_id).first()
    if invoice and invoice.file and default_storage.exists(invoice.file.name):
        with default_storage.open(invoice.file.name, "rb") as f:
            email.attach(
                os.path.basename(invoice.file.name),
                f.read(),
                "application/pdf"
            )
        logger.info(f"[CUSTOMER-MAIL] Прикреплён существующий инвойс: {invoice.invoice_number}")
    else:
        logger.warning(f"[CUSTOMER-MAIL] Не найден файл инвойса для session_id {session_id}")

    # Отправляем письмо
    try:
        email.send()
        logger.info(f"[CUSTOMER-MAIL] Письмо клиенту {ctx['customer']['email']} отправлено успешно")
    except Exception as e:
        logger.exception(f"[CUSTOMER-MAIL] Ошибка отправки письма клиенту: {e}")


def send_merged_manager_email_from_session(session_id: str) -> None:
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[MANAGER-MAIL] Нет заказов по session_id {session_id}")
        return

    ctx = prepare_merged_customer_email_context(orders)

    # Посылки подгружаем отдельно для каждой группы (заказа)
    for grp in ctx["groups"]:
        oid = grp["order_id"]
        dpi_qs = (
            DeliveryParcelItem.objects
            .filter(order_product__order_id=oid)
            .select_related(
                "parcel",
                "order_product__product__product",
                "order_product__order__courier_service",
            )
        )

        local_map = defaultdict(list)  # ключ: (courier_short, tracking)
        for dpi in dpi_qs:
            order_obj = dpi.order_product.order
            courier_name = order_obj.courier_service.name if order_obj.courier_service else ""
            try:
                courier_short, _ = _courier_meta(courier_name)  # тот же хелпер, что у письма продавцу
            except NameError:
                courier_short = (courier_name or "").strip() or "Courier"

            tn = dpi.parcel.tracking_number or f"Parcel #{dpi.parcel.pk}"
            local_map[(courier_short, tn)].append({
                "product_name": dpi.order_product.product.product.name,
                "sku":          dpi.order_product.product.sku,
                "quantity":     dpi.quantity,
            })

        grp["parcels"] = [
            {"courier_short": cs, "tracking_number": tn, "items": items}
            for (cs, tn), items in local_map.items()
        ]

    html = render_to_string("emails/order_email_manager.html", ctx)
    email = EmailMessage(
        subject="NEW ORDER",
        body=html,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL"),
        to=settings.PROJECT_MANAGERS_EMAILS,
        # опционально: headers={"Reply-To": "office@reli.one"},
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
            "courier_short":     "",         # ← ДОБАВЛЕНО (но только в тексте, поведение не меняем)
            "courier_support_url": None,     # ← ДОБАВЛЕНО (только для шаблона)
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
            # короткое имя и ссылка поддержки курьера (для блока группы)
            short, support = _courier_meta(grp["courier_service"])
            grp["courier_short"] = short
            grp["courier_support_url"] = support

            grp["order_date"]      = order.order_date

            # Адрес или пункт самовывоза (оставляем прежний порядок)
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

        # Посылки и PDF-ярлыки (строго по товарам этого продавца)
        parcel_map, parcel_files = defaultdict(list), set()
        dpi_qs = (
            DeliveryParcelItem.objects
            .filter(order_product_id__in=product_ids)
            .select_related(
                "parcel",
                "order_product__product__product",
                "order_product__order__courier_service",  # ← чтобы не делать N+1 за курьером
            )
        )

        for dpi in dpi_qs:
            # короткое имя курьера берём из заказа конкретного DPI
            ord_obj = dpi.order_product.order
            courier_name = ord_obj.courier_service.name if ord_obj.courier_service else ""
            courier_short, _ = _courier_meta(courier_name)

            tracking = dpi.parcel.tracking_number or f"Parcel #{dpi.parcel.pk}"
            # ключ теперь (courier_short, tracking), чтобы маркировать трек курьером
            parcel_map[(courier_short, tracking)].append({
                "product_name": dpi.order_product.product.product.name,
                "sku":           dpi.order_product.product.sku,
                "quantity":      dpi.quantity,
            })
            # прикладываем файлы ТОЛЬКО продавцу (как в исходнике)
            if dpi.parcel.label_file and os.path.isfile(dpi.parcel.label_file.path):
                parcel_files.add(dpi.parcel.label_file.path)

        parcels = [
            {"courier_short": cs, "tracking_number": tn, "items": it}
            for (cs, tn), it in parcel_map.items()
        ]

        # Общий контекст (включает logo_url из prepare_merged_customer_email_context)
        ctx = prepare_merged_customer_email_context(orders)
        ctx.update({
            "groups":  list(seller_groups.values()),
            "parcels": parcels,  # в шаблоне рядом с треком будет {{ parcel.courier_short }}
        })

        # Рендерим и отправляем HTML-письмо
        html_raw = render_to_string("emails/order_email_seller.html", ctx)
        html_inline = transform(html_raw)
        email = EmailMultiAlternatives(
            subject="NEW ORDER",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL"),
            to=[seller_email],
        )
        email.attach_alternative(html_inline, "text/html")

        # Прикрепляем PDF-ярлыки (как было — через path)
        for fpath in parcel_files:
            email.attach_file(fpath)

        try:
            email.send()
            logger.info(f"[SELLER-MAIL] Письмо продавцу {seller_email} отправлено")
        except Exception as e:
            logger.exception(f"[SELLER-MAIL] Ошибка при отправке письма продавцу {seller_email}: {e}")
