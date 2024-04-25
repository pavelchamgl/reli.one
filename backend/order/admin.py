from django.contrib import admin
from .models import OrderItem, DeliveryType, OrderStatus, SelfPickupStatus


class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'order_date', 'delivery_type', 'order_status', 'self_pickup_status')
    list_filter = ('delivery_type', 'order_status', 'self_pickup_status')

    actions = ['sort_orders_by_date']

    def sort_orders_by_date(self, request, queryset):
        sorted_orders = queryset.order_by('-order_date')
        self.message_user(request, f"Orders sorted by date")
        return sorted_orders

    sort_orders_by_date.short_description = "Sort selected orders by date"

    actions = ['change_to_courier', 'change_to_self_pickup', 'cancel_orders']

    def change_to_courier(self, request, queryset):
        queryset.update(delivery_type=DeliveryType.objects.get(name='Courier'))

    change_to_courier.short_description = 'Change selected to Courier'

    def change_to_self_pickup(self, request, queryset):
        queryset.update(delivery_type=DeliveryType.objects.get(name='Self Pickup'))

    change_to_self_pickup.short_description = 'Change selected to Self Pickup'

    def cancel_orders(self, request, queryset):
        queryset.update(order_status=OrderStatus.objects.get(name='Cancelled'))

    cancel_orders.short_description = 'Cancel selected orders'


admin.site.register(OrderItem, OrderItemAdmin)
admin.site.register(DeliveryType)
admin.site.register(OrderStatus)
admin.site.register(SelfPickupStatus)
