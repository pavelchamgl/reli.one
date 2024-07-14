from django.apps import AppConfig
from django.core.signals import setting_changed


class ProductConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'product'

    def ready(self):
        from .signals import update_product_rating_and_reviews

        setting_changed.connect(update_product_rating_and_reviews)
