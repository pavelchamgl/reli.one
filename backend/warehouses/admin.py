from django.contrib import admin
from .models import StockReservation, StockReservationItem, Warehouse, WarehouseItem


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
    list_display = (
        "warehouse",
        "product_variant",
        "quantity_in_stock",
        "reserved_quantity",
    )
    list_filter = ("warehouse",)
    search_fields = ("product_variant__sku",)


class StockReservationItemInline(admin.TabularInline):
    model = StockReservationItem
    extra = 0
    readonly_fields = ("warehouse_item", "quantity")


@admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    list_display = (
        "session_key",
        "payment_system",
        "status",
        "expires_at",
        "created_at",
        "confirmed_at",
        "released_at",
    )
    list_filter = ("status", "payment_system")
    search_fields = ("session_key",)
    readonly_fields = ("created_at", "confirmed_at", "released_at")
    inlines = [StockReservationItemInline]