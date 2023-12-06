from django.contrib import admin

# Register your models here.
from .models import ChipBasket,BasketItem

admin.site.register(ChipBasket)
admin.site.register(BasketItem)
