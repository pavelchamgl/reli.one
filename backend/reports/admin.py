from django.urls import reverse
from django.contrib import admin
from django.utils.html import format_html

from supplier.models import Supplier


class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'generate_report_button']

    def generate_report_button(self, obj):
        url = reverse('supplier-report')
        return format_html('<a class="button" href="{}?supplier_id={}">Generate Report</a>', url, obj.id)

    generate_report_button.short_description = 'Generate Report'
    generate_report_button.allow_tags = True


admin.site.register(Supplier, SupplierAdmin)
