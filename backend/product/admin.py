from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from mptt.admin import MPTTModelAdmin
from mptt.forms import TreeNodeChoiceField

from .models import (
    BaseProduct,
    ProductParameter,
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


class ProductParameterInline(admin.TabularInline):
    model = ProductParameter
    extra = 1
    fields = ('name', 'value')


class BaseProductAdminForm(forms.ModelForm):
    category = TreeNodeChoiceField(queryset=Category.objects.all())

    class Meta:
        model = BaseProduct
        fields = '__all__'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name', 'price')
    search_fields = ['product__name', 'name']
    readonly_fields = ('sku',)
    autocomplete_fields = ['product']


@admin.register(BaseProduct)
class AdminBaseProduct(admin.ModelAdmin):
    form = BaseProductAdminForm
    list_display = ('id', 'name', 'article', 'status', 'product_description', 'category', 'seller')
    list_filter = ['status', 'category', 'seller']
    search_fields = ['name', 'product_description', 'article']

    fieldsets = (
        (None, {
            'fields': ('name', 'product_description', 'category', 'seller', 'status', 'article')
        }),
        ('More information', {
            'fields': ('rating', 'total_reviews', 'approved_by', 'approved_at', 'rejected_reason'),
            'classes': ('collapse',),
        }),
    )

    inlines = [
        BaseProductImageInline,
        ProductParameterInline,
        ProductVariantInline,
        LicenseFileInline
    ]

    def save_formset(self, request, form, formset, change):
        try:
            super().save_formset(request, form, formset, change)
        except ValidationError as e:
            form.add_error(None, e)


@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    pass


@admin.register(BaseProductImage)
class BaseProductImageAdmin(admin.ModelAdmin):
    pass


@admin.register(ProductParameter)
class ProductParameterAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name', 'value')
    search_fields = ['product__name', 'name', 'value']
