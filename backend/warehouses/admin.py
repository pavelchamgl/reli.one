from django.contrib import admin
from .models import Warehouse, WarehouseItem


class WarehouseItemInline(admin.TabularInline):
    """
    Inline-редактор для товаров на складе.
    Позволяет редактировать товары прямо в админке склада.
    """
    model = WarehouseItem
    extra = 1
    readonly_fields = ('product_variant',)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    """
    Админка для управления складами.
    """
    list_display = ('name','pickup_by_courier')
    list_filter  = ('pickup_by_courier',)
    inlines = [WarehouseItemInline]


@admin.register(WarehouseItem)
class WarehouseItemAdmin(admin.ModelAdmin):
    """
    Админка для управления остатками товаров на складах.
    """
    list_display = ('warehouse','product_variant','quantity_in_stock')
    list_filter = ('warehouse',)
    search_fields = ('product_variant__sku',)