from django.contrib import admin
from .models import BaseProduct, ParameterName, ParameterValue, BaseProductImage, Category


class AdminBaseProduct(admin.ModelAdmin):
    list_display = ('name', 'product_description', 'price')
    list_filter = ['name', 'product_description', 'price']
    search_fields = ['name']


admin.site.register(BaseProduct, AdminBaseProduct)
admin.site.register(Category)
admin.site.register(BaseProductImage)
admin.site.register(ParameterValue)
admin.site.register(ParameterName)
