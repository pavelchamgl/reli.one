from django.contrib import admin
from django.utils.html import format_html

from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "is_active", "sort_order", "preview_webp", "updated_at")
    list_editable = ("is_active", "sort_order")
    readonly_fields = ("image_webp", "preview_webp",)
    search_fields = ("title", "alt",)
    ordering = ("sort_order", "-created_at")

    fieldsets = (
        (None, {
            "fields": ("title", "alt", "link_url", "is_active", "sort_order")
        }),
        ("Изображения", {
            "fields": ("image_original", "image_webp", "preview_webp"),
            "description": "Загрузите исходник (JPG/PNG/WebP). Система сама создаст WebP 1230×400."
        }),
        ("Служебные", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
    readonly_fields += ("created_at", "updated_at")

    @admin.display(description="Превью")
    def preview_webp(self, obj: Banner):
        if obj.image_webp:
            return format_html('<img src="{}" style="height:80px;border-radius:6px;" />', obj.image_webp.url)
        return "—"

    actions = ["regenerate_selected"]

    @admin.action(description="Перегенерировать WebP для выбранных")
    def regenerate_selected(self, request, queryset):
        count = 0
        for banner in queryset:
            banner.generate_webp()
            banner.save(update_fields=["image_webp", "updated_at"])
            count += 1
        self.message_user(request, f"Перегенерировано баннеров: {count}")
