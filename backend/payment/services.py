import logging
from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_order_emails_safely(order):
    try:
        # 1. Покупателю
        html_customer = render_to_string("emails/customer_order_email.html", {
            "order": order,
            "order_products": order.order_products.select_related("product", "product__product"),
        })
        email = EmailMessage(
            subject=f"Ваш заказ №{order.order_number}",
            body=html_customer,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.customer_email],
        )
        email.content_subtype = "html"
        email.send()

        # 2. Продавцам
        for op in order.order_products.select_related("seller_profile"):
            seller_email = op.seller_profile.user.email if op.seller_profile and op.seller_profile.user.email else None
            if seller_email:
                send_mail(
                    subject=f"Заказ №{order.order_number} - Ваш товар куплен!",
                    message=(
                        f"У вас купили товар на сумму {op.product_price * op.quantity}. "
                        f"Детали заказа #{order.order_number}."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[seller_email],
                    fail_silently=False,
                )

        # 3. Менеджерам
        manager_emails = getattr(settings, 'PROJECT_MANAGERS_EMAILS', [])
        if manager_emails:
            html_manager = render_to_string("emails/manager_order_details.html", {
                "order": order,
                "order_products": order.order_products.select_related("product", "seller_profile", "product__product"),
            })
            for m_email in manager_emails:
                email = EmailMessage(
                    subject=f"Новый заказ №{order.order_number}",
                    body=html_manager,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[m_email],
                )
                email.content_subtype = "html"
                email.send()

        logger.info(f"Emails for order {order.id} successfully sent.")
    except Exception as mail_err:
        logger.error(f"Failed to send emails for order {order.id}: {mail_err}", exc_info=True)
