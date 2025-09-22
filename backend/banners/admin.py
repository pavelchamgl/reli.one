from django.contrib import admin
from django.utils.html import format_html

from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "is_active", "sort_order",
        "preview_webp", "preview_webp_mobile", "seller_display", "updated_at"
    )
    list_editable = ("is_active", "sort_order")
    readonly_fields = ("image_webp", "preview_webp", "image_webp_mobile", "preview_webp_mobile")
    search_fields = ("title", "alt", "seller__company_name", "seller__user__email")
    list_filter = ("is_active", "seller")
    ordering = ("sort_order", "-created_at")

    fieldsets = (
        (None, {
            "fields": ("title", "alt", "link_url", "is_active", "sort_order", "seller")
        }),
        ("Images / Изображения", {
            "fields": (
                "image_original",
                "image_webp",
                "preview_webp",
                "image_original_mobile",
                "image_webp_mobile",
                "preview_webp_mobile",
            ),
            "description": "Upload original images (JPG/PNG/WebP). The system will generate WebP versions."
        }),
        ("Audit / Служебные", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
    readonly_fields += ("created_at", "updated_at")

    # --------- previews ----------
    @admin.display(description="Desktop preview")
    def preview_webp(self, obj: Banner):
        if obj.image_webp:
            return format_html(
                '<img src="{}" style="height:80px;border-radius:6px;" />',
                obj.image_webp.url
            )
        return "—"

    @admin.display(description="Mobile preview")
    def preview_webp_mobile(self, obj: Banner):
        if obj.image_webp_mobile:
            return format_html(
                '<img src="{}" style="height:80px;border-radius:6px;" />',
                obj.image_webp_mobile.url
            )
        return "—"

    @admin.display(description="Seller")
    def seller_display(self, obj: Banner):
        if obj.seller:
            # adjust fields according to your SellerProfile model
            return format_html("{} (id:{})", getattr(obj.seller, "company_name", str(obj.seller)), obj.seller_id)
        return "—"

    # --------- actions ----------
    actions = ["regenerate_selected"]

    @admin.action(description="Regenerate WebP for selected banners (desktop + mobile)")
    def regenerate_selected(self, request, queryset):
        count = 0
        for banner in queryset:
            # Generate both versions if originals exist
            updated = banner.generate_webp()
            # Save only fields that were updated (generate_webp возвращает список имён полей)
            if updated:
                update_fields = list(set(updated + ["updated_at"]))
                banner.save(update_fields=update_fields)
            count += 1
        self.message_user(request, f"Regenerated banners: {count}")
