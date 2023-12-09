import stripe
from django.contrib import admin
from .models import PromoCode
from backend import settings

class AdminPromocode(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage', 'max_usage', 'used_count')

admin.site.register(PromoCode,AdminPromocode)
