from django.contrib import admin
from .models import BaseProduct, ParameterName, ParameterValue, BaseProductImage, Category, LicenseFile


class LicenseFileInline(admin.TabularInline):
    model = LicenseFile


class AdminBaseProduct(admin.ModelAdmin):
    list_display = ('name', 'product_description', 'price')
    list_filter = ['name', 'product_description', 'price']
    search_fields = ['name']
    inlines = [LicenseFileInline]


admin.site.register(BaseProduct, AdminBaseProduct)
admin.site.register(Category)
admin.site.register(BaseProductImage)
admin.site.register(ParameterValue)
admin.site.register(ParameterName)
