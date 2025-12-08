from django.contrib import admin

from .models import Contact, ContactMessage

class AdminContact(admin.ModelAdmin):
    list_display = ('email', 'address', 'company_name', 'message', 'phone')


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """
    Админка для просмотра обращений с контактной формы лендинга.
    Удобна для ежедневной работы менеджеров.
    """

    # Какие поля показывать в списке
    list_display = (
        "id",
        "first_name",
        "last_name",
        "email",
        "business_type",
        "short_message",
        "created_at",
        "is_processed",
    )

    # Фильтры справа
    list_filter = ("is_processed", "created_at", "business_type")

    # Поиск по ключевым полям
    search_fields = ("first_name", "last_name", "email", "message")

    # Новые сообщения сверху
    ordering = ("-created_at",)

    # Только чтение
    readonly_fields = ("created_at",)

    # Группировка полей внутри карточки обращения
    fieldsets = (
        ("User Information", {
            "fields": ("first_name", "last_name", "email", "business_type")
        }),
        ("Message", {
            "fields": ("message",)
        }),
        ("Status", {
            "fields": ("is_processed", "created_at")
        }),
    )

    # Массовые действия
    actions = ["mark_as_processed"]

    def short_message(self, obj):
        """
        Показывает первые ~30 символов сообщения в списке.
        """
        return (obj.message[:30] + "...") if len(obj.message) > 30 else obj.message

    short_message.short_description = "Message preview"

    def mark_as_processed(self, request, queryset):
        """
        Массовая отметка обращений как обработанных.
        """
        updated = queryset.update(is_processed=True)
        self.message_user(request, f"{updated} messages marked as processed.")

    mark_as_processed.short_description = "Mark selected as processed"


admin.site.register(Contact, AdminContact)
