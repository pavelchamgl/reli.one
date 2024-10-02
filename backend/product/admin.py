from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import (
    BaseProduct,
    ParameterName,
    ParameterValue,
    BaseProductImage,
    Category,
    LicenseFile,
    ProductVariant
)


class LicenseFileInline(admin.StackedInline):
    model = LicenseFile
    extra = 0


class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 1
    readonly_fields = ('sku',)
    fields = ('sku', 'name', 'text', 'image', 'price')


class BaseProductImageInline(admin.TabularInline):
    model = BaseProductImage
    extra = 1


class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name', 'price')
    search_fields = ['product__name', 'name']
    readonly_fields = ('sku',)
    autocomplete_fields = ['product']


class AdminBaseProduct(admin.ModelAdmin):
    list_display = ('id', 'name', 'product_description')
    list_filter = ['name', 'category', 'supplier']
    search_fields = ['name', 'product_description']
    fieldsets = (
        (None, {
            'fields': ('name', 'product_description', 'category', 'supplier', 'parameters')
        }),
        ('More information', {
            'fields': ('rating', 'total_reviews'),
            'classes': ('collapse',),
        }),
    )
    inlines = [BaseProductImageInline, ProductVariantInline, LicenseFileInline]

    def save_formset(self, request, form, formset, change):
        try:
            super().save_formset(request, form, formset, change)
        except ValidationError as e:
            form.add_error(None, e)


admin.site.register(BaseProduct, AdminBaseProduct)
admin.site.register(ProductVariant, ProductVariantAdmin)
admin.site.register(Category)
admin.site.register(BaseProductImage)
admin.site.register(ParameterValue)
admin.site.register(ParameterName)
