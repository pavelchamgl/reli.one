from datetime import datetime
from django.contrib import admin
from django.shortcuts import get_object_or_404
from django.utils.html import format_html
from django.urls import reverse

from .models import (
    Order,
    OrderProduct,
    DeliveryType,
    OrderStatus,
    DeliveryStatus,
    CourierService,
    Invoice,
)

# ------------------------ OrderProduct Inline -------------------------

class OrderProductInline(admin.TabularInline):
    model = OrderProduct
    extra = 0
    fields = (
        'product_variant_display', 'quantity', 'product_price',
        'delivery_cost', 'received', 'received_at', 'seller_profile'
    )
    readonly_fields = (
        'product_variant_display', 'quantity', 'product_price',
        'delivery_cost', 'seller_profile', 'received_at'
    )
    can_delete = False

    def product_variant_display(self, obj):
        return f"{obj.product.sku}: {obj.product.product.name} - {obj.product.text}"
    product_variant_display.short_description = 'Product Variant'

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            if 'received' in form.changed_data:
                if not obj.received:
                    obj.received_at = None
                elif obj.received:
                    obj.received_at = datetime.now()
            obj.save()
            obj.order.refund_amount = obj.order.calculate_refund()
            obj.order.save()
        formset.save_m2m()

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = super().get_readonly_fields(request, obj)
        if obj and hasattr(obj, 'order') and hasattr(obj.order, 'order_status') and obj.order.order_status:
            readonly_fields = list(readonly_fields)
            if obj.order.order_status.name not in ['Pending', 'Processing']:
                readonly_fields.append('received')
        return readonly_fields

# ------------------------ Order Admin -------------------------

class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'total_amount', 'group_subtotal',
        'order_date', 'delivery_type', 'order_status', 'delivery_status', 'refund_amount'
    )
    list_filter = ('delivery_type', 'order_status', 'delivery_status')
    search_fields = ('order_number', 'user__email')
    inlines = [OrderProductInline]
    ordering = ('-order_date',)
    readonly_fields = ('group_subtotal',)

    actions = ['recalculate_refund_amount', 'change_to_courier', 'change_to_self_pickup', 'cancel_orders']

    def recalculate_refund_amount(self, request, queryset):
        for order in queryset:
            order.refund_amount = order.calculate_refund()
            order.save()
        self.message_user(request, "Refund amounts recalculated successfully.")
    recalculate_refund_amount.short_description = "Recalculate refund amount for selected orders"

    def change_to_courier(self, request, queryset):
        delivery_type = get_object_or_404(DeliveryType, name='Courier')
        queryset.update(delivery_type=delivery_type)
        self.message_user(request, "Selected orders changed to Courier.")
    change_to_courier.short_description = 'Change selected to Courier'

    def change_to_self_pickup(self, request, queryset):
        delivery_type = get_object_or_404(DeliveryType, name='Self Pickup')
        queryset.update(delivery_type=delivery_type)
        self.message_user(request, "Selected orders changed to Self Pickup.")
    change_to_self_pickup.short_description = 'Change selected to Self Pickup'

    def cancel_orders(self, request, queryset):
        order_status = get_object_or_404(OrderStatus, name='Cancelled')
        queryset.update(order_status=order_status)
        self.message_user(request, "Selected orders have been cancelled.")
    cancel_orders.short_description = 'Cancel selected orders'

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        order = form.instance
        order.refund_amount = order.calculate_refund()
        order.save()

# ------------------------ OrderProduct Admin -------------------------

class OrderProductAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'product_variant_display', 'quantity',
        'product_price', 'delivery_cost', 'received',
        'received_at', 'seller_profile'
    )
    list_filter = ('status', 'received', 'seller_profile')
    search_fields = ('order__order_number', 'product__sku', 'product__name')

    def product_variant_display(self, obj):
        return f"{obj.product.sku}: {obj.product.product.name} - {obj.product.name}"
    product_variant_display.short_description = 'Product Variant'

# ------------------------ Invoice Admin -------------------------

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'variable_symbol', 'payment_link', 'download_link')
    search_fields = ('invoice_number', 'variable_symbol', 'payment__session_id')
    readonly_fields = ('invoice_number', 'variable_symbol', 'payment', 'file')

    def payment_link(self, obj):
        if obj.payment:
            url = reverse('admin:payment_payment_change', args=[obj.payment.id])
            return format_html('<a href="{}">Payment {}</a>', url, obj.payment.id)
        return "-"
    payment_link.short_description = 'Payment'

    def download_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" download>Download PDF</a>', obj.file.url)
        return "-"
    download_link.short_description = 'Invoice PDF'

# ------------------------ Register Other Models -------------------------

admin.site.register(Order, OrderAdmin)
admin.site.register(OrderProduct, OrderProductAdmin)
admin.site.register(DeliveryType)
admin.site.register(CourierService)
admin.site.register(OrderStatus)
admin.site.register(DeliveryStatus)
