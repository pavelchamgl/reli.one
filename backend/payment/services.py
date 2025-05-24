import logging
from collections import defaultdict
from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string

from .models import Payment
from delivery.services.packeta_point_service import get_pickup_point_details
from order.models import Order

logger = logging.getLogger(__name__)


def get_orders_by_payment_session_id(session_id: str):
    logger.debug(f"[MAIL] Поиск заказов по session_id: {session_id}")
    payments = Payment.objects.filter(session_id=session_id).select_related("order")
    orders = [p.order for p in payments if p.order is not None]
    logger.debug(f"[MAIL] Найдено заказов: {len(orders)}")
    return orders


def prepare_merged_customer_email_context(orders):
    context = {
        "customer": {
            "first_name": orders[0].first_name,
            "last_name": orders[0].last_name,
            "email": orders[0].customer_email,
            "phone": orders[0].phone_number,
        },
        "groups": [],
        "grand_total": sum(order.group_subtotal for order in orders),
        "order_date": orders[0].order_date.strftime("%d.%m.%Y %H:%M"),
    }

    for order in orders:
        delivery_type = order.delivery_type.name if order.delivery_type else ""
        courier = order.courier_service.name if order.courier_service else ""
        address_parts = []
        if order.delivery_address:
            addr = order.delivery_address
            address_parts = [addr.street, addr.city, addr.zip_code, addr.country]

        group = {
            "order_number": order.order_number,
            "delivery_type": delivery_type,
            "courier_service": courier,
            "delivery_address": ", ".join(filter(None, address_parts)) if address_parts else None,
            "pickup_point_id": order.pickup_point_id,
            "pickup_point_info": None,
            "products": [],
            "delivery_cost": f"{order.delivery_cost:.2f}",
            "group_total": f"{order.group_subtotal:.2f}",
            "order_date": order.order_date,
            "seller_info": set(),
        }

        if order.pickup_point_id:
            point = get_pickup_point_details(order.pickup_point_id)
            if point:
                group["pickup_point_info"] = f'{point["place"]}, {point["street"]}, {point["city"]}'
            else:
                group["pickup_point_info"] = f'Пункт самовывоза №: {order.pickup_point_id}'

        for item in order.order_products.select_related("product__product", "seller_profile__user"):
            group["products"].append({
                "product_name": item.product.product.name,
                "quantity": item.quantity,
                "unit_price": f"{item.product_price:.2f}",
                "total_price": f"{(item.product_price * item.quantity):.2f}",
            })
            if item.seller_profile and item.seller_profile.user:
                seller = item.seller_profile.user
                group["seller_info"].add(f"{seller.first_name} {seller.last_name} <{seller.email}>")

        group["seller_info"] = ", ".join(group["seller_info"])
        context["groups"].append(group)

    return context


def send_merged_customer_email_from_session(session_id: str):
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[MAIL] Нет заказов по session_id {session_id}")
        return

    context = prepare_merged_customer_email_context(orders)
    try:
        html = render_to_string("emails/merged_customer_email.html", context)
        email = EmailMessage(
            subject="Подтверждение заказа",
            body=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[context["customer"]["email"]],
        )
        email.content_subtype = "html"
        email.send()
        logger.info(f"[MAIL] Письмо клиенту отправлено по session {session_id}")
    except Exception as e:
        logger.exception(f"[MAIL] Ошибка при отправке письма клиенту: {e}")


def send_merged_manager_email_from_session(session_id: str):
    orders = get_orders_by_payment_session_id(session_id)
    if not orders:
        logger.warning(f"[MANAGER-MAIL] Нет заказов по session_id {session_id}")
        return

    context = prepare_merged_customer_email_context(orders)
    try:
        html = render_to_string("emails/merged_manager_email.html", context)
        email = EmailMessage(
            subject=f"Новый заказ",
            body=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=settings.PROJECT_MANAGERS_EMAILS,
        )
        email.content_subtype = "html"
        email.send()
        logger.info(f"[MANAGER-MAIL] Письмо менеджерам отправлено по session {session_id}")
    except Exception as e:
        logger.exception(f"[MANAGER-MAIL] Ошибка при отправке письма менеджерам: {e}")
