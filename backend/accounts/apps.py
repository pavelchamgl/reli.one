from django.apps import AppConfig
from django.core.signals import setting_changed

from .signals import send_email_confirmation_otp


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        setting_changed.connect(send_email_confirmation_otp)
