from __future__ import annotations

from django import forms
from django.contrib import admin, messages
from django.contrib.admin.helpers import ACTION_CHECKBOX_NAME
from django.core.exceptions import ValidationError
from django.db.models import Count, Sum
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from mptt.admin import MPTTModelAdmin
from mptt.forms import TreeNodeChoiceField
from rest_framework.exceptions import ValidationError as DRFValidationError

from sellers.admin import ManagerOrAdminOnlyMixin, RejectForm
from warehouses.models import WarehouseItem

from product.compat import get_product_cover_image
from product.models import (
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
    ProductStatus,
    ProductVariant,
)
from product.services_moderation import (
    approve_product,
    reject_product,
    validate_product_before_approve,
)


class DefaultPendingStatusFilterMixin:
    """Redirect changelist to pending queue when status filter is not set."""

    def changelist_view(self, request, extra_context=None):
        if "status__exact" not in request.GET and "status" not in request.GET:
            query = request.GET.copy()
            query["status__exact"] = ProductStatus.PENDING
            return HttpResponseRedirect(f"{request.path}?{query.urlencode()}")
        return super().changelist_view(request, extra_context=extra_context)


class LicenseFileInline(admin.StackedInline):
    model = LicenseFile
    extra = 0


class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 0
    autocomplete_fields = ("attribute_definition", "value_option")
    fields = (
        "attribute_definition",
        "value_text",
        "value_number",
        "value_boolean",
        "value_option",
        "source",
    )


class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 1
    readonly_fields = ("sku", "get_price_with_acquiring", "get_stock_summary")
    fields = (
        "sku",
        "name",
        "price",
        "get_price_with_acquiring",
        "get_stock_summary",
        "weight_grams",
        "width_mm",
        "height_mm",
        "length_mm",
        "text",
        "image",
    )

    def get_price_with_acquiring(self, obj):
        return obj.price_with_acquiring

    get_price_with_acquiring.short_description = "Price with acquiring (4%)"

    @admin.display(description="Stock")
    def get_stock_summary(self, obj):
        if not obj or not obj.pk:
            return "—"
        agg = WarehouseItem.objects.filter(product_variant=obj).aggregate(
            total=Sum("quantity_in_stock"),
            reserved=Sum("reserved_quantity"),
        )
        total = agg["total"] or 0
        reserved = agg["reserved"] or 0
        available = max(0, total - reserved)
        return f"{available} available ({total} in stock, {reserved} reserved)"


class BaseProductImageInline(admin.TabularInline):
    model = BaseProductImage
    extra = 1
    verbose_name = "Legacy image"
    verbose_name_plural = "Legacy images (seller wizard bulk upload)"


class ProductParameterInline(admin.TabularInline):
    model = ProductParameter
    extra = 1
    fields = ("name", "value")


class ProductMediaInline(admin.TabularInline):
    model = ProductMedia
    extra = 0
    fields = ("file", "media_type", "sort_order", "is_main", "status", "legacy_image")
    readonly_fields = ("legacy_image",)


class ProductDocumentInline(admin.TabularInline):
    model = ProductDocument
    extra = 0
    fields = ("name", "file", "document_type", "sort_order", "status", "file_size", "content_type")


class BaseProductAdminForm(forms.ModelForm):
    category = TreeNodeChoiceField(queryset=Category.objects.all())

    class Meta:
        model = BaseProduct
        fields = "__all__"


class ProductAttributeValueAdminForm(forms.ModelForm):
    class Meta:
        model = ProductAttributeValue
        fields = "__all__"


@admin.register(ProductVariant)
class ProductVariantAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "sku",
        "product",
        "name",
        "price",
        "get_price_with_acquiring",
        "weight_grams",
        "width_mm",
        "height_mm",
        "length_mm",
    )
    search_fields = [
        "sku",
        "product__name",
        "name",
    ]
    list_filter = [
        "product__seller",
    ]
    readonly_fields = ("sku", "get_price_with_acquiring")
    autocomplete_fields = ["product"]

    def get_price_with_acquiring(self, obj):
        return obj.price_with_acquiring

    get_price_with_acquiring.short_description = "Цена с эквайрингом (4%)"


@admin.register(BaseProduct)
class AdminBaseProduct(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    form = BaseProductAdminForm
    list_display = (
        "id",
        "thumbnail_preview",
        "name",
        "seller_email",
        "category",
        "status",
        "variants_count",
        "article",
        "barcode",
    )
    list_filter = ["status", "category", "seller", "is_age_restricted", "is_active"]
    readonly_fields = (
        "status",
        "approved_by",
        "approved_at",
        "rejected_reason",
        "cover_preview",
        "moderation_tools",
        "rating",
        "total_reviews",
    )
    search_fields = [
        "name",
        "article",
        "barcode",
        "seller__user__email",
        "variants__sku",
    ]
    autocomplete_fields = ("seller", "brand")
    ordering = ("-id",)
    actions = ["approve_selected_products", "reject_selected_products"]

    fieldsets = (
        (
            "Moderation",
            {
                "fields": (
                    "status",
                    "rejected_reason",
                    "approved_by",
                    "approved_at",
                    "moderation_tools",
                )
            },
        ),
        (
            "Cover",
            {
                "fields": ("cover_preview",),
            },
        ),
        (
            "Category & seller",
            {
                "fields": ("category", "seller", "brand"),
            },
        ),
        (
            "Product info",
            {
                "fields": (
                    "name",
                    "product_description",
                    "additional_details",
                ),
            },
        ),
        (
            "Identifiers",
            {
                "fields": ("article", "barcode"),
            },
        ),
        (
            "Additional details",
            {
                "fields": ("country_of_origin", "warranty_months"),
            },
        ),
        (
            "Pricing & visibility",
            {
                "fields": ("vat_rate", "is_age_restricted", "is_active"),
            },
        ),
        (
            "Statistics",
            {
                "classes": ("collapse",),
                "fields": ("rating", "total_reviews"),
            },
        ),
    )

    inlines = [
        ProductAttributeValueInline,
        BaseProductImageInline,
        ProductMediaInline,
        ProductDocumentInline,
        ProductParameterInline,
        ProductVariantInline,
        LicenseFileInline,
    ]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("seller__user", "category", "brand", "approved_by")
            .prefetch_related("images", "variants")
            .annotate(_variants_count=Count("variants", distinct=True))
        )

    def changelist_view(self, request, extra_context=None):
        if "status__exact" not in request.GET and "status" not in request.GET:
            query = request.GET.copy()
            query["status__exact"] = ProductStatus.PENDING
            return HttpResponseRedirect(f"{request.path}?{query.urlencode()}")
        return super().changelist_view(request, extra_context=extra_context)

    @admin.display(description="Preview")
    def thumbnail_preview(self, obj: BaseProduct) -> str:
        image = get_product_cover_image(obj)
        if image and getattr(image, "image", None):
            return format_html(
                '<img src="{}" style="max-height:48px;max-width:48px;object-fit:contain;" />',
                image.image.url,
            )
        return "—"

    @admin.display(description="Seller")
    def seller_email(self, obj: BaseProduct) -> str:
        return obj.seller.user.email

    @admin.display(description="Variants")
    def variants_count(self, obj: BaseProduct) -> int:
        return getattr(obj, "_variants_count", obj.variants.count())

    @admin.display(description="Cover preview")
    def cover_preview(self, obj: BaseProduct) -> str:
        image = get_product_cover_image(obj)
        if image and getattr(image, "image", None):
            return format_html(
                '<img src="{}" style="max-height:200px;max-width:200px;object-fit:contain;" />',
                image.image.url,
            )
        return "—"

    @admin.display(description="Moderation")
    def moderation_tools(self, obj: BaseProduct) -> str:
        if not obj or not obj.pk:
            return "Save the product first to use moderation actions."

        approve_url = reverse("admin:product_baseproduct_approve", args=[obj.pk])
        reject_url = reverse("admin:product_baseproduct_reject", args=[obj.pk])
        validation_errors = validate_product_before_approve(obj)

        approve_allowed = obj.status in (ProductStatus.PENDING, ProductStatus.REJECTED) and not validation_errors
        reject_allowed = obj.status in (ProductStatus.PENDING, ProductStatus.APPROVED)

        if approve_allowed:
            approve_state = "Available"
            approve_reason = "Product passes pre-approve validation."
            approve_href = approve_url
            approve_style = ""
        else:
            approve_state = "Blocked"
            if obj.status not in (ProductStatus.PENDING, ProductStatus.REJECTED):
                approve_reason = "Available only for pending/rejected products."
            else:
                approve_reason = validation_errors[0] if validation_errors else "Validation issues found."
            approve_href = "#"
            approve_style = "opacity:0.5;pointer-events:none;"

        if reject_allowed:
            reject_state = "Available"
            reject_reason = "Reject is available for this status."
            reject_href = reject_url
            reject_style = ""
        else:
            reject_state = "Blocked"
            reject_reason = "Not allowed for current status."
            reject_href = "#"
            reject_style = "opacity:0.5;pointer-events:none;"

        return format_html(
            "<div style='display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));gap:16px;max-width:900px;'>"
            "<div style='border:1px solid #dfe5ea;border-left:4px solid #198754;border-radius:12px;padding:16px;'>"
            "<div style='font-weight:700;margin-bottom:8px;'>Approve ({})</div>"
            "<div style='margin-bottom:12px;color:#505a64;'>{}</div>"
            "<a href='{}' style='display:inline-block;padding:8px 12px;border-radius:8px;background:#198754;color:#fff;"
            "text-decoration:none;font-weight:700;{}'>Approve product</a>"
            "</div>"
            "<div style='border:1px solid #dfe5ea;border-left:4px solid #dc3545;border-radius:12px;padding:16px;'>"
            "<div style='font-weight:700;margin-bottom:8px;'>Reject ({})</div>"
            "<div style='margin-bottom:12px;color:#505a64;'>{}</div>"
            "<a href='{}' style='display:inline-block;padding:8px 12px;border-radius:8px;background:#dc3545;color:#fff;"
            "text-decoration:none;font-weight:700;{}'>Reject product</a>"
            "</div>"
            "</div>",
            approve_state,
            approve_reason,
            approve_href,
            approve_style,
            reject_state,
            reject_reason,
            reject_href,
            reject_style,
        )

    def save_formset(self, request, form, formset, change):
        try:
            super().save_formset(request, form, formset, change)
        except ValidationError as e:
            form.add_error(None, e)

    @admin.action(description="Approve selected products")
    def approve_selected_products(self, request, queryset):
        approved = 0
        for product in queryset:
            try:
                approve_product(product, request.user)
            except DRFValidationError as exc:
                detail = exc.detail
                if isinstance(detail, list):
                    message = ", ".join(str(item) for item in detail)
                elif isinstance(detail, dict):
                    message = str(detail.get("detail", detail))
                else:
                    message = str(detail)
                self.message_user(
                    request,
                    f"Product #{product.pk} was not approved: {message}",
                    level=messages.ERROR,
                )
            else:
                approved += 1
        if approved:
            self.message_user(request, f"Approved {approved} product(s).", level=messages.SUCCESS)

    @admin.action(description="Reject selected products")
    def reject_selected_products(self, request, queryset):
        selected = request.POST.getlist(ACTION_CHECKBOX_NAME)
        return HttpResponseRedirect(
            f"{reverse('admin:product_baseproduct_reject_bulk')}?ids={','.join(selected)}"
        )

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<int:product_id>/approve/",
                self.admin_site.admin_view(self.approve_view),
                name="product_baseproduct_approve",
            ),
            path(
                "<int:product_id>/reject/",
                self.admin_site.admin_view(self.reject_view),
                name="product_baseproduct_reject",
            ),
            path(
                "reject-bulk/",
                self.admin_site.admin_view(self.reject_bulk_view),
                name="product_baseproduct_reject_bulk",
            ),
        ]
        return custom + urls

    def approve_view(self, request: HttpRequest, product_id: int) -> HttpResponse:
        product = get_object_or_404(BaseProduct, pk=product_id)

        if product.status not in (ProductStatus.PENDING, ProductStatus.REJECTED):
            messages.warning(request, "Approve доступен только для pending/rejected товаров.")
            return redirect("admin:product_baseproduct_change", product.pk)

        validation_errors = validate_product_before_approve(product)
        if validation_errors:
            messages.error(request, f"Нельзя approve: {validation_errors[0]}")
            return redirect("admin:product_baseproduct_change", product.pk)

        if request.method == "POST":
            try:
                approve_product(product, request.user)
            except DRFValidationError as exc:
                messages.error(request, f"Не удалось approve: {exc.detail}")
            else:
                messages.success(request, "Товар одобрен.")
            return redirect("admin:product_baseproduct_change", product.pk)

        ctx = {
            **self.admin_site.each_context(request),
            "title": f"Approve product #{product.pk}",
            "product": product,
            "opts": self.model._meta,
            "original": product,
        }
        return render(request, "admin/product/baseproduct/approve.html", ctx)

    def reject_view(self, request: HttpRequest, product_id: int) -> HttpResponse:
        product = get_object_or_404(BaseProduct, pk=product_id)

        if product.status not in (ProductStatus.PENDING, ProductStatus.APPROVED):
            messages.warning(request, "Reject доступен только для pending/approved товаров.")
            return redirect("admin:product_baseproduct_change", product.pk)

        form = RejectForm(request.POST or None, initial={"rejected_reason": product.rejected_reason or ""})

        if request.method == "POST" and form.is_valid():
            try:
                reject_product(product, request.user, form.cleaned_data["rejected_reason"])
            except DRFValidationError as exc:
                messages.error(request, f"Не удалось reject: {exc.detail}")
            else:
                messages.success(request, "Товар отклонён.")
            return redirect("admin:product_baseproduct_change", product.pk)

        ctx = {
            **self.admin_site.each_context(request),
            "title": f"Reject product #{product.pk}",
            "product": product,
            "form": form,
            "opts": self.model._meta,
            "original": product,
        }
        return render(request, "admin/product/baseproduct/reject.html", ctx)

    def reject_bulk_view(self, request: HttpRequest) -> HttpResponse:
        ids_param = request.GET.get("ids") or request.POST.get("ids") or ""
        product_ids = [int(pk) for pk in ids_param.split(",") if pk.strip().isdigit()]
        queryset = BaseProduct.objects.filter(pk__in=product_ids)

        if not queryset.exists():
            messages.warning(request, "Не выбраны товары для reject.")
            return redirect("admin:product_baseproduct_changelist")

        form = RejectForm(request.POST or None)

        if request.method == "POST" and form.is_valid():
            rejected = 0
            for product in queryset:
                try:
                    reject_product(product, request.user, form.cleaned_data["rejected_reason"])
                except DRFValidationError as exc:
                    messages.error(request, f"Product #{product.pk}: {exc.detail}")
                else:
                    rejected += 1
            if rejected:
                messages.success(request, f"Rejected {rejected} product(s).")
            return redirect("admin:product_baseproduct_changelist")

        ctx = {
            **self.admin_site.each_context(request),
            "title": "Reject selected products",
            "products": queryset,
            "form": form,
            "ids": ids_param,
            "opts": self.model._meta,
        }
        return render(request, "admin/product/baseproduct/reject_bulk.html", ctx)


@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    list_display = ("id", "name", "parent", "allows_product_assignment")
    list_filter = ("allows_product_assignment",)
    search_fields = ("name",)


@admin.register(BaseProductImage)
class BaseProductImageAdmin(admin.ModelAdmin):
    search_fields = ("product__name", "image")


def _set_nested_resource_status(model_admin, request, queryset, status):
    updated = queryset.update(status=status)
    label = "approved" if status == ProductStatus.APPROVED else "rejected"
    model_admin.message_user(request, f"{updated} item(s) {label}.", level=messages.SUCCESS)


@admin.register(Brand)
class BrandAdmin(ManagerOrAdminOnlyMixin, DefaultPendingStatusFilterMixin, admin.ModelAdmin):
    list_display = ("id", "name", "slug", "status", "created_by", "created_at", "products_count")
    list_filter = ("status",)
    search_fields = ("name", "slug")
    actions = ["approve_selected", "reject_selected"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_products_count=Count("products"))

    @admin.display(description="Products")
    def products_count(self, obj: Brand) -> int:
        return getattr(obj, "_products_count", obj.products.count())

    @admin.action(description="Approve selected brands")
    def approve_selected(self, request, queryset):
        _set_nested_resource_status(self, request, queryset, ProductStatus.APPROVED)

    @admin.action(description="Reject selected brands")
    def reject_selected(self, request, queryset):
        _set_nested_resource_status(self, request, queryset, ProductStatus.REJECTED)


@admin.register(ProductExternalIdentifier)
class ProductExternalIdentifierAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "identifier_type", "value", "source", "is_primary")
    list_filter = ("identifier_type", "source", "is_primary")
    search_fields = ("product__name", "value", "source")
    autocomplete_fields = ("product",)


@admin.register(ProductMedia)
class ProductMediaAdmin(ManagerOrAdminOnlyMixin, DefaultPendingStatusFilterMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "product",
        "seller_email",
        "media_type",
        "sort_order",
        "is_main",
        "status",
        "legacy_image",
    )
    list_filter = ("media_type", "status", "is_main")
    search_fields = ("product__name", "file", "alt_text", "product__seller__user__email")
    autocomplete_fields = ("product", "legacy_image")
    actions = ["approve_selected", "reject_selected"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("product__seller__user")

    @admin.display(description="Seller")
    def seller_email(self, obj: ProductMedia) -> str:
        return obj.product.seller.user.email

    @admin.action(description="Approve selected media")
    def approve_selected(self, request, queryset):
        _set_nested_resource_status(self, request, queryset, ProductStatus.APPROVED)

    @admin.action(description="Reject selected media")
    def reject_selected(self, request, queryset):
        _set_nested_resource_status(self, request, queryset, ProductStatus.REJECTED)


@admin.register(ProductDocument)
class ProductDocumentAdmin(ManagerOrAdminOnlyMixin, DefaultPendingStatusFilterMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "product",
        "seller_email",
        "document_type",
        "name",
        "sort_order",
        "status",
    )
    list_filter = ("document_type", "status")
    search_fields = ("product__name", "name", "file", "product__seller__user__email")
    autocomplete_fields = ("product",)
    actions = ["approve_selected", "reject_selected"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("product__seller__user")

    @admin.display(description="Seller")
    def seller_email(self, obj: ProductDocument) -> str:
        return obj.product.seller.user.email

    @admin.action(description="Approve selected documents")
    def approve_selected(self, request, queryset):
        _set_nested_resource_status(self, request, queryset, ProductStatus.APPROVED)

    @admin.action(description="Reject selected documents")
    def reject_selected(self, request, queryset):
        _set_nested_resource_status(self, request, queryset, ProductStatus.REJECTED)


class CategoryAttributeOptionInline(admin.TabularInline):
    model = CategoryAttributeOption
    extra = 0
    fields = ("value", "label", "sort_order", "is_active")


@admin.register(CategoryAttributeDefinition)
class CategoryAttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "code", "name", "data_type", "is_required", "is_filterable", "is_active")
    list_filter = ("data_type", "is_required", "is_filterable", "is_active")
    search_fields = ("category__name", "code", "name")
    autocomplete_fields = ("category",)
    inlines = [CategoryAttributeOptionInline]


@admin.register(CategoryAttributeOption)
class CategoryAttributeOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "attribute_definition", "value", "label", "sort_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("attribute_definition__code", "value", "label")
    autocomplete_fields = ("attribute_definition",)


@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    form = ProductAttributeValueAdminForm
    list_display = ("id", "product", "attribute_definition", "source")
    list_filter = ("attribute_definition__data_type", "source")
    search_fields = ("product__name", "attribute_definition__code", "value_text")
    autocomplete_fields = ("product", "attribute_definition", "value_option")


@admin.register(ProductParameter)
class ProductParameterAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "name", "value")
    search_fields = ["product__name", "name", "value"]


admin.site.register(LicenseFile)
