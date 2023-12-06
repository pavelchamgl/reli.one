from django.contrib import admin
from .models import OrderItem, OrderStatus
from django.db import models
from account.admin import MyUserAdmin
from authemail.admin import EmailUserAdmin


"""


class OrderItemAdmin(admin.ModelAdmin):

    list_display = ('get_user_basket_address', 'quantity')

    def get_user_basket_address(self, obj):
        return obj.user_basket.user.adress

    get_user_basket_address.short_description = 'address'  # Название столбца в административной панели



"""
admin.site.register(OrderItem)

