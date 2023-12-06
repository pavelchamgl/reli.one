import stripe
from django.contrib import admin
from .models import PromoCode
from backend import settings


admin.site.register(PromoCode)
