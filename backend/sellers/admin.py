from django.contrib import admin

from .models import (
    SellerProfile,
    SellerLegalInfo,
    SellerOnboardingApplication,
    SellerDocument,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
    SellerSelfEmployedAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
    SellerCompanyAddress,
    SellerBankAccount,
    SellerWarehouseAddress,
    SellerReturnAddress,
)

class SellerDocumentInline(admin.TabularInline):
    model = SellerDocument
    extra = 0
    readonly_fields = ("doc_type", "scope", "side", "file", "uploaded_at")
    can_delete = False


@admin.register(SellerOnboardingApplication)
class SellerOnboardingApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "seller_profile", "seller_type", "status", "submitted_at", "reviewed_at")
    list_filter = ("status", "seller_type")
    search_fields = ("seller_profile__user__email",)
    inlines = [SellerDocumentInline]


@admin.register(SellerDocument)
class SellerDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "application", "doc_type", "scope", "side", "uploaded_at")
    list_filter = ("doc_type", "scope")
    readonly_fields = ("application", "doc_type", "scope", "side", "file", "uploaded_at")


admin.site.register(SellerProfile)
admin.site.register(SellerLegalInfo)
admin.site.register(SellerSelfEmployedPersonalDetails)
admin.site.register(SellerSelfEmployedTaxInfo)
admin.site.register(SellerSelfEmployedAddress)
admin.site.register(SellerCompanyInfo)
admin.site.register(SellerCompanyRepresentative)
admin.site.register(SellerCompanyAddress)
admin.site.register(SellerBankAccount)
admin.site.register(SellerWarehouseAddress)
admin.site.register(SellerReturnAddress)
