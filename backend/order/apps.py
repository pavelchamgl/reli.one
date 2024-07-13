from django.apps import AppConfig
from django.core.signals import setting_changed


class OrderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'order'

    def ready(self):
        from .signals import send_order_confirmation_email
        setting_changed.connect(send_order_confirmation_email)

