from datetime import datetime
from django.contrib import admin

from .models import (
    Order,
    OrderProduct,
    DeliveryType,
    OrderStatus,
    SelfPickupStatus,
    CourierService
)


class OrderProductInline(admin.TabularInline):
    model = OrderProduct
    extra = 0
    fields = ('product', 'quantity', 'product_price', 'delivery_cost', 'received', 'received_at', 'supplier')
    readonly_fields = ('product', 'quantity', 'product_price', 'delivery_cost', 'supplier', 'received_at')
    can_delete = False

    def save_model(self, request, obj, form, change):
        if 'received' in form.changed_data:
            if not obj.received:
                obj.received_at = None
            elif obj.received:
                obj.received_at = datetime.now()
        super().save_model(request, obj, form, change)
        # Recalculate refund amount for the order
        obj.order.refund_amount = obj.order.calculate_refund()
        obj.order.save()

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = super().get_readonly_fields(request, obj)
        if obj and hasattr(obj, 'order') and hasattr(obj.order, 'order_status') and obj.order.order_status:
            readonly_fields = list(readonly_fields)
            if obj.order.order_status.name not in ['Pending', 'Processing']:
                readonly_fields.append('received')
        return readonly_fields


class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'order_date', 'delivery_type', 'order_status', 'self_pickup_status', 'refund_amount')
    list_filter = ('delivery_type', 'order_status', 'self_pickup_status')
    search_fields = ('order_number', 'user__email')
    inlines = [OrderProductInline]

    actions = ['sort_orders_by_date', 'recalculate_refund_amount', 'change_to_courier', 'change_to_self_pickup', 'cancel_orders']

    def sort_orders_by_date(self, request, queryset):
        sorted_orders = queryset.order_by('-order_date')
        self.message_user(request, f"Orders sorted by date")
        return sorted_orders

    sort_orders_by_date.short_description = "Sort selected orders by date"

    def recalculate_refund_amount(self, request, queryset):
        for order in queryset:
            order.refund_amount = order.calculate_refund()
            order.save()
        self.message_user(request, "Refund amounts recalculated successfully.")

    recalculate_refund_amount.short_description = "Recalculate refund amount for selected orders"

    def change_to_courier(self, request, queryset):
        queryset.update(delivery_type=DeliveryType.objects.get(name='Courier'))
        self.message_user(request, "Selected orders changed to Courier.")

    change_to_courier.short_description = 'Change selected to Courier'

    def change_to_self_pickup(self, request, queryset):
        queryset.update(delivery_type=DeliveryType.objects.get(name='Self Pickup'))
        self.message_user(request, "Selected orders changed to Self Pickup.")

    change_to_self_pickup.short_description = 'Change selected to Self Pickup'

    def cancel_orders(self, request, queryset):
        queryset.update(order_status=OrderStatus.objects.get(name='Cancelled'))
        self.message_user(request, "Selected orders have been cancelled.")

    cancel_orders.short_description = 'Cancel selected orders'

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        # Recalculate refund amount for the order
        order = form.instance
        order.refund_amount = order.calculate_refund()
        order.save()


admin.site.register(Order, OrderAdmin)
admin.site.register(OrderProduct)
admin.site.register(DeliveryType)
admin.site.register(CourierService)
admin.site.register(OrderStatus)
admin.site.register(SelfPickupStatus)
