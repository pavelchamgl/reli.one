from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from mptt.admin import MPTTModelAdmin
from mptt.forms import TreeNodeChoiceField

from .models import (
    BaseProduct,
    Brand,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
    ProductDocument,
    ProductExternalIdentifier,
    ProductAttributeValue,
    ProductMedia,
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
    readonly_fields = ('sku', 'get_price_with_acquiring')
    fields = (
        'sku',
        'name',
        'price',
        'get_price_with_acquiring',
        'weight_grams',
        'width_mm',
        'height_mm',
        'length_mm',
        'text',
        'image',
    )

    def get_price_with_acquiring(self, obj):
        return obj.price_with_acquiring

    get_price_with_acquiring.short_description = "Price with acquiring (4%)"


class BaseProductImageInline(admin.TabularInline):
    model = BaseProductImage
    extra = 1


class ProductParameterInline(admin.TabularInline):
    model = ProductParameter
    extra = 1
    fields = ('name', 'value')


class ProductMediaInline(admin.TabularInline):
    model = ProductMedia
    extra = 0
    fields = ('file', 'media_type', 'sort_order', 'is_main', 'status', 'legacy_image')
    readonly_fields = ('legacy_image',)


class ProductDocumentInline(admin.TabularInline):
    model = ProductDocument
    extra = 0
    fields = ('name', 'file', 'document_type', 'sort_order', 'status', 'file_size', 'content_type')


class BaseProductAdminForm(forms.ModelForm):
    category = TreeNodeChoiceField(queryset=Category.objects.all())

    class Meta:
        model = BaseProduct
        fields = '__all__'


class ProductAttributeValueAdminForm(forms.ModelForm):
    class Meta:
        model = ProductAttributeValue
        fields = '__all__'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'sku',
        'product',
        'name',
        'price',
        'get_price_with_acquiring',
        'weight_grams',
        'width_mm',
        'height_mm',
        'length_mm',
    )
    search_fields = [
        'sku',
        'product__name',
        'name',
    ]
    list_filter = [
        'product__seller',
    ]
    readonly_fields = ('sku', 'get_price_with_acquiring')
    autocomplete_fields = ['product']

    def get_price_with_acquiring(self, obj):
        return obj.price_with_acquiring

    get_price_with_acquiring.short_description = "Цена с эквайрингом (4%)"


@admin.register(BaseProduct)
class AdminBaseProduct(admin.ModelAdmin):
    form = BaseProductAdminForm
    list_display = (
        'id', 'name', 'article', 'status', 'product_description',
        'category', 'seller', 'vat_rate', 'is_age_restricted', 'is_active'
    )
    list_filter = ['status', 'category', 'seller', 'is_age_restricted', 'is_active']
    readonly_fields = ('approved_at',)
    search_fields = ['name', 'product_description', 'additional_details', 'article']

    fieldsets = (
        (None, {
            'fields': (
                'name', 'product_description', 'additional_details', 'category', 'brand', 'seller',
                'status', 'article', 'is_active'
            )
        }),
        ('Optional', {
            'fields': (
                'vat_rate', 'is_age_restricted',
            ),
        }),
        ('More information', {
            'fields': (
                'rating', 'total_reviews', 'approved_by', 'approved_at', 'rejected_reason'
            ),
            'classes': ('collapse',),
        }),
    )

    inlines = [
        BaseProductImageInline,
        ProductMediaInline,
        ProductDocumentInline,
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
    list_display = ('id', 'name', 'parent', 'allows_product_assignment')
    list_filter = ('allows_product_assignment',)
    search_fields = ('name',)


@admin.register(BaseProductImage)
class BaseProductImageAdmin(admin.ModelAdmin):
    search_fields = ('product__name', 'image')


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'status', 'created_by', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'slug')


@admin.register(ProductExternalIdentifier)
class ProductExternalIdentifierAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'identifier_type', 'value', 'source', 'is_primary')
    list_filter = ('identifier_type', 'source', 'is_primary')
    search_fields = ('product__name', 'value', 'source')
    autocomplete_fields = ('product',)


@admin.register(ProductMedia)
class ProductMediaAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'media_type', 'sort_order', 'is_main', 'status', 'legacy_image')
    list_filter = ('media_type', 'status', 'is_main')
    search_fields = ('product__name', 'file', 'alt_text')
    autocomplete_fields = ('product', 'legacy_image')


@admin.register(ProductDocument)
class ProductDocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'document_type', 'sort_order', 'status', 'name')
    list_filter = ('document_type', 'status')
    search_fields = ('product__name', 'name', 'file')
    autocomplete_fields = ('product',)


class CategoryAttributeOptionInline(admin.TabularInline):
    model = CategoryAttributeOption
    extra = 0
    fields = ('value', 'label', 'sort_order', 'is_active')


@admin.register(CategoryAttributeDefinition)
class CategoryAttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'code', 'name', 'data_type', 'is_required', 'is_filterable', 'is_active')
    list_filter = ('data_type', 'is_required', 'is_filterable', 'is_active')
    search_fields = ('category__name', 'code', 'name')
    autocomplete_fields = ('category',)
    inlines = [CategoryAttributeOptionInline]


@admin.register(CategoryAttributeOption)
class CategoryAttributeOptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'attribute_definition', 'value', 'label', 'sort_order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('attribute_definition__code', 'value', 'label')
    autocomplete_fields = ('attribute_definition',)


@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(admin.ModelAdmin):
    form = ProductAttributeValueAdminForm
    list_display = ('id', 'product', 'attribute_definition', 'source')
    list_filter = ('attribute_definition__data_type', 'source')
    search_fields = ('product__name', 'attribute_definition__code', 'value_text')
    autocomplete_fields = ('product', 'attribute_definition', 'value_option')


@admin.register(ProductParameter)
class ProductParameterAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name', 'value')
    search_fields = ['product__name', 'name', 'value']


admin.site.register(LicenseFile)
