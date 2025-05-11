from django.urls import path
from django.http import HttpResponse
from django.contrib import admin
from django.shortcuts import get_object_or_404
from django.utils.html import format_html

from .models import DeliveryParcel, DeliveryAddress, ShippingRate, DeliveryParcelItem
from .services.packeta import PacketaService


@admin.register(DeliveryParcel)
class DeliveryParcelAdmin(admin.ModelAdmin):
    list_display = ("order", "warehouse", "service", "tracking_number", "status", "created_at", 'label_link',)
    readonly_fields = ("tracking_number", 'label_link', "created_at", "download_label_button")

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:object_id>/download-label/',
                self.admin_site.admin_view(self.download_label_view),
                name='deliveryparcel-download-label',
            ),
        ]
        return custom_urls + urls

    def download_label_button(self, obj):
        if obj.tracking_number:
            return format_html(
                '<a class="button" href="{}">📎 Скачать метку</a>',
                f"./{obj.pk}/download-label/"
            )
        return "Нет трек-номера"
    download_label_button.short_description = "Packeta Label"

    def download_label_view(self, request, object_id):
        parcel = get_object_or_404(DeliveryParcel, pk=object_id)

        if not parcel.tracking_number:
            return HttpResponse("У посылки нет tracking_number", status=400)

        try:
            service = PacketaService()
            pdf_data = service.get_label_pdf(packet_id=parcel.tracking_number)
        except Exception as e:
            return HttpResponse(f"Ошибка при получении метки: {str(e)}", status=500)

        response = HttpResponse(pdf_data, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="label_{parcel.tracking_number}.pdf"'
        return response


admin.site.register(DeliveryAddress)
admin.site.register(DeliveryParcelItem)
admin.site.register(ShippingRate)
