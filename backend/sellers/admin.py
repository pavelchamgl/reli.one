from __future__ import annotations

from dataclasses import asdict
from typing import Any

from django import forms
from django.contrib import admin, messages
from django.db.models import Count
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.timesince import timesince
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from accounts.models import CustomUser

from .models import (
    OnboardingStatus,
    SellerType,
    SellerBankAccount,
    SellerCompanyAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
    SellerDocument,
    SellerLegalInfo,
    SellerOnboardingApplication,
    SellerProfile,
    SellerReturnAddress,
    SellerSelfEmployedAddress,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
    SellerWarehouseAddress,
)
from .services_onboarding import (
    approve_application,
    compute_completeness,
    reject_application,
    validate_before_submit,
)


# ==========================================================
# Permissions helpers
# ==========================================================

def _is_manager_or_admin(user: Any) -> bool:
    return getattr(user, "role", None) in (UserRole.MANAGER, UserRole.ADMIN)


class ManagerOrAdminOnlyMixin:
    def has_module_permission(self, request: HttpRequest) -> bool:
        return _is_manager_or_admin(request.user)

    def has_view_permission(self, request: HttpRequest, obj: Any | None = None) -> bool:
        return _is_manager_or_admin(request.user)

    def has_add_permission(self, request: HttpRequest) -> bool:
        return _is_manager_or_admin(request.user)

    def has_change_permission(self, request: HttpRequest, obj: Any | None = None) -> bool:
        return _is_manager_or_admin(request.user)

    def has_delete_permission(self, request: HttpRequest, obj: Any | None = None) -> bool:
        return _is_manager_or_admin(request.user)


# ==========================================================
# Forms
# ==========================================================

class RejectForm(forms.Form):
    rejected_reason = forms.CharField(
        label="Причина отклонения",
        widget=forms.Textarea(attrs={"rows": 6}),
        required=True,
        help_text="Будет показано продавцу.",
    )


# ==========================================================
# Base read-only inline
# ==========================================================

class ReadOnlyInline(admin.StackedInline):
    extra = 0
    can_delete = False
    show_change_link = False

    def has_add_permission(self, request: HttpRequest, obj: Any | None = None) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: Any | None = None) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj: Any | None = None) -> bool:
        return False


# ==========================================================
# Inlines — Self-employed
# ==========================================================

class SellerSelfEmployedPersonalInline(ReadOnlyInline):
    model = SellerSelfEmployedPersonalDetails
    fk_name = "application"
    verbose_name_plural = "Self-employed — Personal details"
    fields = ("date_of_birth", "nationality", "personal_phone")
    readonly_fields = fields


class SellerSelfEmployedTaxInline(ReadOnlyInline):
    model = SellerSelfEmployedTaxInfo
    fk_name = "application"
    verbose_name_plural = "Self-employed — Tax info"
    fields = ("tax_country", "tin", "ico", "vat_id")
    readonly_fields = fields


class SellerSelfEmployedAddressInline(ReadOnlyInline):
    model = SellerSelfEmployedAddress
    fk_name = "application"
    verbose_name_plural = "Self-employed — Address"
    fields = ("country", "city", "street", "zip_code", "proof_document_issue_date")
    readonly_fields = fields


# ==========================================================
# Inlines — Company
# ==========================================================

class SellerCompanyInfoInline(ReadOnlyInline):
    model = SellerCompanyInfo
    fk_name = "application"
    verbose_name_plural = "Company — Info"
    fields = (
        "company_name",
        "legal_form",
        "country_of_registration",
        "business_id",
        "ico",
        "tin",
        "vat_id",
        "imports_to_eu",
        "eori_number",
        "company_phone",
        "certificate_issue_date",
    )
    readonly_fields = fields


class SellerCompanyRepresentativeInline(ReadOnlyInline):
    model = SellerCompanyRepresentative
    fk_name = "application"
    verbose_name_plural = "Company — Representative"
    fields = ("first_name", "last_name", "role", "date_of_birth", "nationality")
    readonly_fields = fields


class SellerCompanyAddressInline(ReadOnlyInline):
    model = SellerCompanyAddress
    fk_name = "application"
    verbose_name_plural = "Company — Address"
    fields = ("country", "city", "street", "zip_code", "proof_document_issue_date")
    readonly_fields = fields


# ==========================================================
# Inlines — Common blocks
# ==========================================================

class SellerBankAccountInline(ReadOnlyInline):
    model = SellerBankAccount
    fk_name = "application"
    verbose_name_plural = "Bank account"
    fields = ("account_holder", "iban", "swift_bic", "bank_code", "local_account_number")
    readonly_fields = fields


class SellerWarehouseAddressInline(ReadOnlyInline):
    model = SellerWarehouseAddress
    fk_name = "application"
    verbose_name_plural = "Warehouse address"
    fields = ("country", "city", "street", "zip_code", "contact_phone", "proof_document_issue_date")
    readonly_fields = fields


class SellerReturnAddressInline(ReadOnlyInline):
    model = SellerReturnAddress
    fk_name = "application"
    verbose_name_plural = "Return address"
    fields = (
        "same_as_warehouse",
        "country",
        "city",
        "street",
        "zip_code",
        "contact_phone",
        "proof_document_issue_date",
    )
    readonly_fields = fields


# ==========================================================
# Documents
# ==========================================================

class SellerDocumentInline(ReadOnlyInline):
    model = SellerDocument
    fk_name = "application"
    verbose_name_plural = "Documents"
    fields = ("uploaded_at", "doc_type", "scope", "side", "file_link")
    readonly_fields = fields
    ordering = ("scope", "doc_type", "side", "-uploaded_at")

    @admin.display(description="File")
    def file_link(self, obj: SellerDocument) -> str:
        if not obj.file:
            return "—"

        relevant = (
            obj.application.seller_type == "company" and obj.scope.startswith("company")
        ) or (
            obj.application.seller_type != "company" and obj.scope.startswith("self_employed")
        )
        badge = "RELEVANT" if relevant else "OTHER"
        cls = "ok" if relevant else "bad"

        return format_html(
            '<span class="onb-pill {}">{}</span> <a href="{}" target="_blank" rel="noopener">Open</a>',
            cls,
            badge,
            obj.file.url,
        )


@admin.register(SellerDocument)
class SellerDocumentAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    list_display = ("id", "application", "doc_type", "scope", "side", "uploaded_at", "file_link")
    list_filter = ("doc_type", "scope", "side")
    search_fields = ("application__seller_profile__user__email",)
    readonly_fields = ("uploaded_at",)

    @admin.display(description="File")
    def file_link(self, obj: SellerDocument) -> str:
        if not obj.file:
            return "—"
        return format_html('<a href="{}" target="_blank" rel="noopener">Open</a>', obj.file.url)

    def save_model(self, request: HttpRequest, obj: SellerDocument, form: forms.ModelForm, change: bool) -> None:
        if change:
            old = SellerDocument.objects.filter(pk=obj.pk).only("file").first()
            if old and old.file and old.file.name and old.file.name != getattr(obj.file, "name", None):
                try:
                    old.file.delete(save=False)
                except Exception:
                    pass
        super().save_model(request, obj, form, change)

    def delete_model(self, request: HttpRequest, obj: SellerDocument) -> None:
        if obj.file:
            try:
                obj.file.delete(save=False)
            except Exception:
                pass
        super().delete_model(request, obj)


# ==========================================================
# SellerOnboardingApplication — MAIN
# ==========================================================

@admin.register(SellerOnboardingApplication)
class SellerOnboardingApplicationAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    change_form_template = "admin/sellers/selleronboardingapplication/change_form.html"

    list_display = (
        "id",
        "seller_email",
        "seller_type",
        "status_badge",
        "submitted_at",
        "queue_age",
        "completeness_short",
        "documents_count",
        "reviewed_by",
        "reviewed_at",
    )
    list_filter = ("status", "seller_type", "created_at", "reviewed_at")
    search_fields = (
        "seller_profile__user__email",
        "seller_profile__user__first_name",
        "seller_profile__user__last_name",
    )
    date_hierarchy = "submitted_at"
    ordering = ("-submitted_at", "-created_at")

    readonly_fields = (
        "seller_block",
        "status",
        "seller_type",
        "submitted_at",
        "reviewed_by",
        "reviewed_at",
        "rejected_reason",
        "completeness_panel",
        "moderation_tools",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Seller", {"fields": ("seller_block",)}),
        ("Application status", {"fields": ("status", "seller_type", "submitted_at", "reviewed_by", "reviewed_at", "rejected_reason")}),
        ("Completeness / Review", {"fields": ("completeness_panel",)}),
        ("Moderation", {"fields": ("moderation_tools",)}),
        ("Technical", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    # --- Inline groups ---

    SELF_EMPLOYED_INLINES = (
        SellerSelfEmployedPersonalInline,
        SellerSelfEmployedTaxInline,
        SellerSelfEmployedAddressInline,
    )

    COMPANY_INLINES = (
        SellerCompanyInfoInline,
        SellerCompanyRepresentativeInline,
        SellerCompanyAddressInline,
    )

    COMMON_INLINES = (
        SellerBankAccountInline,
        SellerWarehouseAddressInline,
        SellerReturnAddressInline,
        SellerDocumentInline,
    )

    class Media:
        css = {"all": ("sellers/admin/onboarding.css",)}

    def get_queryset(self, request: HttpRequest):
        return (
            super()
            .get_queryset(request)
            .select_related("seller_profile__user", "reviewed_by")
            .annotate(_documents_count=Count("documents"))
        )

    def get_inline_instances(self, request, obj=None):
        """
        Показываем только релевантные блоки
        в зависимости от seller_type.
        """
        if not obj:
            return []

        inlines = []

        if obj.seller_type == SellerType.SELF_EMPLOYED:
            inlines.extend(self.SELF_EMPLOYED_INLINES)

        elif obj.seller_type == SellerType.COMPANY:
            inlines.extend(self.COMPANY_INLINES)

        # Общие блоки — всегда
        inlines.extend(self.COMMON_INLINES)

        return [inline(self.model, self.admin_site) for inline in inlines]

    # ---------------- Strict review helper ----------------

    def _passes_strict_review(self, obj: SellerOnboardingApplication) -> tuple[bool, dict | None]:
        """
        True если validate_before_submit проходит без ошибок.
        Возвращает (ok, errors_dict).
        """
        try:
            validate_before_submit(obj)
            return True, None
        except ValidationError as exc:
            return False, exc.detail

    # ---------------- List helpers ----------------

    @admin.display(description="Seller")
    def seller_email(self, obj: SellerOnboardingApplication) -> str:
        return obj.seller_profile.user.email

    @admin.display(description="Status")
    def status_badge(self, obj: SellerOnboardingApplication) -> str:
        colors = {
            OnboardingStatus.DRAFT: "#6c757d",
            OnboardingStatus.SUBMITTED: "#0d6efd",
            OnboardingStatus.PENDING_VERIFICATION: "#0dcaf0",
            OnboardingStatus.APPROVED: "#198754",
            OnboardingStatus.REJECTED: "#dc3545",
        }
        return format_html(
            '<span class="onb-badge" style="background:{}">{}</span>',
            colors.get(obj.status, "#6c757d"),
            obj.get_status_display(),
        )

    @admin.display(description="Queue age")
    def queue_age(self, obj: SellerOnboardingApplication) -> str:
        if not obj.submitted_at:
            return "—"
        return timesince(obj.submitted_at) + " ago"

    @admin.display(description="Completeness")
    def completeness_short(self, obj: SellerOnboardingApplication) -> str:
        if obj.status == OnboardingStatus.DRAFT:
            return "Draft"

        if obj.status in (OnboardingStatus.APPROVED, OnboardingStatus.REJECTED):
            return obj.get_status_display()

        ok, _ = self._passes_strict_review(obj)
        c = compute_completeness(obj)

        blocks = [k for k in asdict(c).keys() if k.endswith("_complete")]
        done = sum(1 for k in blocks if getattr(c, k))
        total = len(blocks)

        icon = "✅" if ok else "⚠️"
        return f"{icon} {done}/{total}"

    @admin.display(description="Docs")
    def documents_count(self, obj: SellerOnboardingApplication) -> int:
        return getattr(obj, "_documents_count", obj.documents.count())

    # ---------------- Change helpers ----------------

    @admin.display(description="Seller")
    def seller_block(self, obj: SellerOnboardingApplication) -> str:
        user: CustomUser = obj.seller_profile.user
        name = f"{user.first_name} {user.last_name}".strip()
        return mark_safe(
            f"<div><strong>{user.email}</strong></div>"
            f"<div class='help'>{name or '—'}</div>"
            f"<div class='help'>SellerProfile #{obj.seller_profile_id} • active={obj.seller_profile.is_active}</div>"
        )

    @admin.display(description="Completeness / Review")
    def completeness_panel(self, obj: SellerOnboardingApplication) -> str:
        # Draft / Approved / Rejected — выводим итог, без таблицы
        if obj.status == OnboardingStatus.DRAFT:
            return mark_safe("<div class='onb-summary warn'>Seller has not submitted the application yet.</div>")

        if obj.status == OnboardingStatus.APPROVED:
            return mark_safe("<div class='onb-summary good'>Application approved ✅</div>")

        if obj.status == OnboardingStatus.REJECTED:
            reason = obj.rejected_reason or "—"
            return mark_safe(f"<div class='onb-summary bad'>Application rejected ❌<br><small>{reason}</small></div>")

        # Pending / Submitted — показываем формальную полноту + строгие ошибки review
        c = compute_completeness(obj)

        def row(label: str, ok: bool) -> str:
            cls = "ok" if ok else "bad"
            text = "OK" if ok else "Missing"
            return f"<tr><td>{label}</td><td><span class='onb-pill {cls}'>{text}</span></td></tr>"

        html: list[str] = [
            "<div class='onb-panel'>",
            "<table class='onb-table'><tbody>",
            row("Seller type selected", c.seller_type_selected),
            row("Personal details", c.personal_complete),
            row("Tax info", c.tax_complete),
            row("Address", c.address_complete),
            row("Bank", c.bank_complete),
            row("Warehouse", c.warehouse_complete),
            row("Return", c.return_complete),
            row("Documents", c.documents_complete),
            "</tbody></table>",
        ]

        strict_ok, errors = self._passes_strict_review(obj)

        if strict_ok:
            html.append("<div class='onb-summary good'>READY FOR REVIEW ✅</div>")
        else:
            html.append("<div class='onb-summary warn'>ISSUES FOUND ⚠</div>")
            if errors:
                html.append("<ul class='onb-errors'>")
                for field, reason in errors.items():
                    html.append(f"<li><strong>{field}:</strong> {reason}</li>")
                html.append("</ul>")

        html.append("</div>")
        return mark_safe("".join(html))

    @admin.display(description="Moderation")
    def moderation_tools(self, obj: SellerOnboardingApplication) -> str:
        approve_url = reverse("admin:sellers_onboarding_approve", args=[obj.pk])
        reject_url = reverse("admin:sellers_onboarding_reject", args=[obj.pk])

        strict_ok, _ = self._passes_strict_review(obj)

        approve_allowed = (
            obj.status in (OnboardingStatus.SUBMITTED, OnboardingStatus.PENDING_VERIFICATION)
            and strict_ok
        )
        reject_allowed = obj.status in (OnboardingStatus.SUBMITTED, OnboardingStatus.PENDING_VERIFICATION, OnboardingStatus.APPROVED)

        approve_cls = "" if approve_allowed else "disabled"
        reject_cls = "" if reject_allowed else "disabled"

        hint = (
            "<div class='help'>"
            "Approve: Submitted / Pending verification (only if review passes) • "
            "Reject: Submitted / Pending verification / Approved"
            "</div>"
        )

        return mark_safe(
            f"<div class='onb-actions'>"
            f"<a class='button onb-btn onb-approve {approve_cls}' href='{approve_url}'>Approve</a> "
            f"<a class='button onb-btn onb-reject {reject_cls}' href='{reject_url}'>Reject</a>"
            f"{hint}"
            f"</div>"
        )

    # ---------------- Custom URLs ----------------

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path("<int:application_id>/approve/", self.admin_site.admin_view(self.approve_view), name="sellers_onboarding_approve"),
            path("<int:application_id>/reject/", self.admin_site.admin_view(self.reject_view), name="sellers_onboarding_reject"),
        ]
        return custom + urls

    def approve_view(self, request: HttpRequest, application_id: int) -> HttpResponse:
        app = get_object_or_404(SellerOnboardingApplication, pk=application_id)

        if app.status not in (OnboardingStatus.SUBMITTED, OnboardingStatus.PENDING_VERIFICATION):
            messages.warning(request, "Approve доступен только для Submitted / Pending verification.")
            return redirect("admin:sellers_selleronboardingapplication_change", app.pk)

        strict_ok, _ = self._passes_strict_review(app)
        if not strict_ok:
            messages.error(request, "Нельзя approve: заявка не проходит review (validate_before_submit).")
            return redirect("admin:sellers_selleronboardingapplication_change", app.pk)

        if request.method == "POST":
            try:
                approve_application(app, request.user)
            except Exception as e:
                messages.error(request, f"Не удалось approve: {e}")
            else:
                messages.success(request, "Заявка одобрена.")
            return redirect("admin:sellers_selleronboardingapplication_change", app.pk)

        ctx = dict(
            self.admin_site.each_context(request),
            title=f"Approve onboarding application #{app.pk}",
            application=app,
            opts=self.model._meta,
            original=app,
        )
        return render(request, "admin/sellers/selleronboardingapplication/approve.html", ctx)

    def reject_view(self, request: HttpRequest, application_id: int) -> HttpResponse:
        app = get_object_or_404(SellerOnboardingApplication, pk=application_id)

        if app.status not in (OnboardingStatus.SUBMITTED, OnboardingStatus.PENDING_VERIFICATION, OnboardingStatus.APPROVED):
            messages.warning(request, "Reject доступен только для Submitted / Pending verification / Approved.")
            return redirect("admin:sellers_selleronboardingapplication_change", app.pk)

        form = RejectForm(request.POST or None, initial={"rejected_reason": app.rejected_reason or ""})

        if request.method == "POST" and form.is_valid():
            try:
                reject_application(app, request.user, form.cleaned_data["rejected_reason"])
            except Exception as e:
                messages.error(request, f"Не удалось reject: {e}")
            else:
                messages.success(request, "Заявка отклонена.")
            return redirect("admin:sellers_selleronboardingapplication_change", app.pk)

        ctx = dict(
            self.admin_site.each_context(request),
            title=f"Reject onboarding application #{app.pk}",
            application=app,
            form=form,
            opts=self.model._meta,
            original=app,
        )
        return render(request, "admin/sellers/selleronboardingapplication/reject.html", ctx)


# ==========================================================
# Extra admins
# ==========================================================

@admin.register(SellerProfile)
class SellerProfileAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    list_display = ("id", "user", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("user__email", "user__first_name", "user__last_name")


@admin.register(SellerLegalInfo)
class SellerLegalInfoAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    list_display = ("id", "seller_profile", "status", "approved_by", "approved_at")
    list_filter = ("status",)
    search_fields = ("seller_profile__user__email",)
