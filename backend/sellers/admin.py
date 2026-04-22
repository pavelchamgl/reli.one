from __future__ import annotations

from typing import Any
from collections import defaultdict

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
    OnboardingAuditLog,
)
from .services_onboarding import (
    approve_application,
    compute_completeness,
    compute_documents_summary_and_missing,
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
    max_num = 0
    can_delete = False
    show_change_link = False
    classes = ("collapse",)
    template = "admin/sellers/selleronboardingapplication/readonly_stacked.html"

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
    fields = ("tax_country", "business_id", "tin", "vat_id")
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
    fields = ("uploaded_at", "doc_type", "identity_document_subtype", "scope", "side", "file_link")
    readonly_fields = fields
    ordering = ("scope", "doc_type", "side", "-uploaded_at")

    @admin.display(description="File")
    def file_link(self, obj: SellerDocument) -> str:
        if not obj.file:
            return "—"
        return format_html(
            '<a href="{}" target="_blank" rel="noopener">Open</a>',
            obj.file.url,
        )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.exclude(
            doc_type="identity_document",
            scope="company_representative",
        )


@admin.register(SellerDocument)
class SellerDocumentAdmin(ManagerOrAdminOnlyMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "application",
        "doc_type",
        "identity_document_subtype",
        "scope",
        "side",
        "uploaded_at",
        "file_link",
    )
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


class OnboardingAuditLogInline(ReadOnlyInline):
    model = OnboardingAuditLog
    fk_name = "application"
    verbose_name_plural = "Audit log"
    extra = 0
    can_delete = False
    show_change_link = False
    classes = ("collapse",)

    fields = ("created_at", "actor_type", "actor", "event_type", "payload")
    readonly_fields = fields
    ordering = ("-created_at",)

    def has_add_permission(self, request, obj=None):
        return False


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
        "review_decision_badge",
        "submitted_at",
        "queue_age",
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
        "reviewed_at",
        "rejected_reason",
        "review_snapshot",
        "completeness_panel",
        "documents_panel",
        "recent_activity_panel",
        "moderation_tools",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Seller / Application",
            {
                "fields": (
                    "seller_block",
                    "status",
                    "seller_type",
                    "submitted_at",
                    "reviewed_at",
                    "rejected_reason",
                )
            },
        ),
        (
            "Moderation review",
            {
                "fields": (
                    "review_snapshot",
                    "completeness_panel",
                    "documents_panel",
                    "recent_activity_panel",
                )
            },
        ),
        (
            "Moderation actions",
            {
                "fields": ("moderation_tools",)
            },
        ),
        (
            "Technical",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

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
        OnboardingAuditLogInline,
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
        if not obj:
            return []

        inlines = []

        if obj.seller_type == SellerType.SELF_EMPLOYED:
            inlines.extend(self.SELF_EMPLOYED_INLINES)
        elif obj.seller_type == SellerType.COMPANY:
            inlines.extend(self.COMPANY_INLINES)

        inlines.extend(self.COMMON_INLINES)
        return [inline(self.model, self.admin_site) for inline in inlines]

    # =========================
    # Strict review helpers
    # =========================

    def _passes_strict_review(self, obj: SellerOnboardingApplication) -> tuple[bool, dict | None]:
        try:
            validate_before_submit(obj)
            return True, None
        except ValidationError as exc:
            return False, exc.detail

    def _flatten_errors(self, value, prefix="") -> list[str]:
        result: list[str] = []

        if isinstance(value, dict):
            for key, nested in value.items():
                new_prefix = f"{prefix}.{key}" if prefix else str(key)
                result.extend(self._flatten_errors(nested, new_prefix))
            return result

        if isinstance(value, list):
            if all(not isinstance(item, (dict, list)) for item in value):
                joined = ", ".join(str(item) for item in value)
                result.append(f"{prefix}: {joined}" if prefix else joined)
                return result

            for idx, nested in enumerate(value):
                new_prefix = f"{prefix}[{idx}]" if prefix else f"[{idx}]"
                result.extend(self._flatten_errors(nested, new_prefix))
            return result

        result.append(f"{prefix}: {value}" if prefix else str(value))
        return result

    def _humanize_error_label(self, path: str) -> str:
        mapping = {
            "seller_type": "Seller type",
            "bank_account": "Bank account",
            "iban": "IBAN",
            "swift_bic": "SWIFT / BIC",
            "account_holder": "Account holder",
            "warehouse_address": "Warehouse address",
            "return_address": "Return address",
            "completeness.personal_complete": "Personal details",
            "completeness.tax_complete": "Tax information",
            "completeness.address_complete": "Address",
            "completeness.bank_complete": "Bank account",
            "completeness.warehouse_complete": "Warehouse address",
            "completeness.return_complete": "Return address",
            "completeness.documents_complete": "Documents",
        }
        return mapping.get(path, path.replace("_", " ").capitalize())

    def _requirement_title(self, doc_type: str, scope: str) -> str:
        mapping = {
            ("identity_document", "self_employed_personal"): "Identity document — personal",
            ("identity_document", "company_representative"): "Identity document — representative",
            ("proof_of_address", "self_employed_address"): "Proof of address — personal address",
            ("proof_of_address", "self_employed_personal"): "Proof of address — personal",
            ("proof_of_address", "company_address"): "Proof of address — company address",
            ("proof_of_address", "warehouse_address"): "Proof of address — warehouse",
            ("proof_of_address", "return_address"): "Proof of address — return address",
            ("registration_certificate", "company_info"): "Registration certificate",
        }
        return mapping.get((doc_type, scope), f"{doc_type} / {scope}")

    def _document_subtype_label(self, subtype: str | None) -> str:
        mapping = {
            "passport": "Passport",
            "id_card": "National ID",
            "driving_license": "Driver’s license",
        }
        return mapping.get(subtype, subtype or "—")

    def _document_item_label(self, doc: SellerDocument) -> str:
        if doc.doc_type == "identity_document":
            subtype = self._document_subtype_label(getattr(doc, "identity_document_subtype", None))
            side = doc.side or "single"
            return f"{subtype} • {side}"

        if doc.doc_type == "proof_of_address":
            return "Proof of address • single"

        if doc.doc_type == "registration_certificate":
            return "Registration certificate • single"

        return f"{doc.doc_type} • {doc.side or 'single'}"

    def _normalize_side_label(self, side: str | None) -> str:
        return "single" if side is None else str(side)

    def _activity_actor_label(self, log: OnboardingAuditLog) -> str:
        actor_obj = getattr(log, "actor", None)

        if actor_obj is not None:
            email = getattr(actor_obj, "email", None)
            if email:
                return f"{log.actor_type.title()} — {email}"

        actor_text = str(getattr(log, "actor", "") or "").strip()
        if not actor_text:
            return log.actor_type.title()

        if "E-mail:" in actor_text:
            try:
                email_part = actor_text.split("E-mail:", 1)[1]
                email = email_part.split(".", 1)[0].strip()
                if email:
                    return f"{log.actor_type.title()} — {email}"
            except Exception:
                pass

        return f"{log.actor_type.title()} — {actor_text}"

    def _display_review_errors(self, errors: dict | None) -> list[str]:
        flattened = self._flatten_errors(errors or {})
        cleaned: list[str] = []

        for item in flattened:
            lower_item = item.lower()

            # Убираем технический шум completeness.*, потому что он уже
            # отдельно показан в таблице completeness выше.
            if lower_item.startswith("completeness."):
                continue

            # Убираем булевы дубли, которые не несут пользы модератору
            if lower_item.endswith(": true") or lower_item.endswith(": false"):
                continue

            cleaned.append(item)

        return cleaned

    # =========================
    # List helpers
    # =========================

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

    @admin.display(description="Review")
    def review_decision_badge(self, obj: SellerOnboardingApplication) -> str:
        if obj.status == OnboardingStatus.DRAFT:
            return format_html('<span class="onb-pill bad">Not submitted</span>')

        if obj.status == OnboardingStatus.APPROVED:
            return format_html('<span class="onb-pill ok">Approved</span>')

        if obj.status == OnboardingStatus.REJECTED:
            strict_ok, _ = self._passes_strict_review(obj)
            if strict_ok:
                return format_html('<span class="onb-pill ok">Rejected / now valid</span>')
            return format_html('<span class="onb-pill bad">Rejected / still blocked</span>')

        strict_ok, _ = self._passes_strict_review(obj)
        if strict_ok:
            return format_html('<span class="onb-pill ok">Ready for review</span>')
        return format_html('<span class="onb-pill bad">Blocked</span>')

    @admin.display(description="Queue age")
    def queue_age(self, obj: SellerOnboardingApplication) -> str:
        if not obj.submitted_at:
            return "—"
        return timesince(obj.submitted_at) + " ago"

    @admin.display(description="Docs")
    def documents_count(self, obj: SellerOnboardingApplication) -> int:
        return getattr(obj, "_documents_count", obj.documents.count())

    # =========================
    # Change page helpers
    # =========================

    @admin.display(description="Seller")
    def seller_block(self, obj: SellerOnboardingApplication) -> str:
        user: CustomUser = obj.seller_profile.user
        name = f"{user.first_name} {user.last_name}".strip() or "—"

        return mark_safe(
            "<div class='onb-panel'>"
            f"<div><strong>{user.email}</strong></div>"
            f"<div class='help'>Name: {name}</div>"
            f"<div class='help'>SellerProfile #{obj.seller_profile_id} • active={obj.seller_profile.is_active}</div>"
            "</div>"
        )

    @admin.display(description="Review snapshot")
    def review_snapshot(self, obj: SellerOnboardingApplication) -> str:
        strict_ok, errors = self._passes_strict_review(obj)
        c = compute_completeness(obj)

        blocks_total = 7
        blocks_done = sum(
            [
                int(c.personal_complete),
                int(c.tax_complete),
                int(c.address_complete),
                int(c.bank_complete),
                int(c.warehouse_complete),
                int(c.return_complete),
                int(c.documents_complete),
            ]
        )

        if obj.status == OnboardingStatus.DRAFT:
            if strict_ok:
                next_step = "All required data is complete. Seller can submit the application for moderation."
                tone_cls = "onb-decision-good"
                title = "Draft application — ready to submit"
            else:
                display_errors = self._display_review_errors(errors)
                first_issue = display_errors[0] if display_errors else "Validation issues must be fixed before submission."
                next_step = f"Seller must fix validation issues before submitting. First issue: {first_issue}"
                tone_cls = "onb-decision-warn"
                title = "Draft application"

            return mark_safe(
                f"<div class='onb-decision {tone_cls}'>"
                f"<div class='onb-decision-title'>{title}</div>"
                "<div class='onb-decision-text'>Seller has not submitted this application for moderation yet.</div>"
                f"<div class='onb-decision-text'><strong>Progress:</strong> {blocks_done}/{blocks_total} required blocks complete.</div>"
                f"<div class='onb-decision-text'><strong>Next step:</strong> {next_step}</div>"
                "</div>"
            )

        if obj.status == OnboardingStatus.APPROVED:
            return mark_safe(
                "<div class='onb-decision onb-decision-good'>"
                "<div class='onb-decision-title'>Approved ✅</div>"
                "<div class='onb-decision-text'>Application has already been approved.</div>"
                "</div>"
            )

        if obj.status == OnboardingStatus.REJECTED:
            reason = obj.rejected_reason or "—"

            if strict_ok:
                current_state = (
                    "All current validations pass now. "
                    "This usually means the seller fixed the application after rejection."
                )
                recommendation = "Recommendation: seller can resubmit the application for moderation."
                tone_cls = "onb-decision-warn"
                state_badge = "<span class='onb-pill ok'>Now valid</span>"
            else:
                current_state = "The application is still not review-ready."
                recommendation = "Recommendation: keep rejected status until seller fixes the remaining issues."
                tone_cls = "onb-decision-bad"
                state_badge = "<span class='onb-pill bad'>Still blocked</span>"

            return mark_safe(
                f"<div class='onb-decision {tone_cls}'>"
                f"<div class='onb-decision-title'>Rejected ❌ {state_badge}</div>"
                f"<div class='onb-decision-text'><strong>Reason:</strong> {reason}</div>"
                f"<div class='onb-decision-text'><strong>Current state:</strong> {current_state}</div>"
                f"<div class='onb-decision-text'><strong>{recommendation}</strong></div>"
                f"</div>"
            )

        if strict_ok:
            decision_cls = "onb-decision-good"
            decision_title = "Ready for approval ✅"
            decision_text = "The application passes strict review and can be approved."
            recommendation = "Recommendation: approve application."
        else:
            decision_cls = "onb-decision-bad"
            decision_title = "Blocked ⚠"
            display_errors = self._display_review_errors(errors)
            first_issue = display_errors[0] if display_errors else "Review issues found."
            decision_text = f"Approval is blocked. First issue: {first_issue}"
            recommendation = "Recommendation: reject or wait for seller fixes."

        return mark_safe(
            f"<div class='onb-decision {decision_cls}'>"
            f"<div class='onb-decision-title'>{decision_title}</div>"
            f"<div class='onb-decision-text'>{decision_text}</div>"
            f"<div class='onb-decision-text'><strong>{recommendation}</strong></div>"
            f"<div class='onb-decision-meta'>Completeness: {blocks_done}/{blocks_total} required blocks complete</div>"
            f"</div>"
        )

    @admin.display(description="Completeness / validation")
    def completeness_panel(self, obj: SellerOnboardingApplication) -> str:
        c = compute_completeness(obj)
        strict_ok, errors = self._passes_strict_review(obj)

        def row(label: str, ok: bool) -> str:
            cls = "ok" if ok else "bad"
            text = "OK" if ok else "Missing"
            return (
                f"<tr>"
                f"<td>{label}</td>"
                f"<td><span class='onb-pill {cls}'>{text}</span></td>"
                f"</tr>"
            )

        html = [
            "<div class='onb-panel'>",
            "<table class='onb-table'><tbody>",
            row("Seller type selected", c.seller_type_selected),
            row("Personal details", c.personal_complete),
            row("Tax information", c.tax_complete),
            row("Address", c.address_complete),
            row("Bank account", c.bank_complete),
            row("Warehouse address", c.warehouse_complete),
            row("Return address", c.return_complete),
            row("Documents", c.documents_complete),
            "</tbody></table>",
        ]

        if obj.status == OnboardingStatus.DRAFT:
            html.append("<div class='onb-summary warn'>Submission requirements not yet met</div>")
        elif strict_ok:
            html.append("<div class='onb-summary good'>Strict review passed</div>")
        else:
            html.append("<div class='onb-summary warn'>Strict review failed</div>")

        display_errors = self._display_review_errors(errors)
        if display_errors:
            html.append("<ul class='onb-reasons'>")
            for item in display_errors:
                if ": " in item:
                    key, value = item.split(": ", 1)
                    html.append(
                        f"<li><strong>{self._humanize_error_label(key)}</strong>: {value}</li>"
                    )
                else:
                    html.append(f"<li>{item}</li>")
            html.append("</ul>")

        html.append("</div>")
        return mark_safe("".join(html))

    @admin.display(description="Documents review")
    def documents_panel(self, obj: SellerOnboardingApplication) -> str:
        documents_summary, documents_missing = compute_documents_summary_and_missing(obj)
        docs_qs = obj.documents.all()
        if obj.seller_type == SellerType.COMPANY:
            docs_qs = docs_qs.exclude(
                doc_type="identity_document",
                scope="company_representative",
            )
        docs = list(docs_qs.order_by("scope", "doc_type", "side", "-uploaded_at"))

        docs_by_key: dict[tuple[str, str], list[SellerDocument]] = defaultdict(list)
        for doc in docs:
            docs_by_key[(doc.doc_type, doc.scope)].append(doc)

        html: list[str] = ["<div class='onb-panel'>"]

        requirements = documents_summary.get("requirements", [])
        counts = documents_summary.get("counts", {})

        html.append("<div class='onb-section-title'>Requirements</div>")

        if not requirements:
            html.append("<div class='help'>No document requirements found.</div>")
        else:
            for req in requirements:
                req_key = (req["doc_type"], req["scope"])
                title = self._requirement_title(req["doc_type"], req["scope"])
                status_cls = "ok" if req.get("status") == "satisfied" else "bad"
                status_text = "Satisfied" if req.get("status") == "satisfied" else "Missing"

                selected_ids = set(req.get("document_ids", []))
                all_related_docs = docs_by_key.get(req_key, [])
                selected_docs = [doc for doc in all_related_docs if doc.id in selected_ids]
                alternative_docs = [doc for doc in all_related_docs if doc.id not in selected_ids]

                html.append("<div class='onb-doc-group'>")
                html.append(
                    f"<div class='onb-doc-group-title'>{title} "
                    f"<span class='onb-pill {status_cls}'>{status_text}</span></div>"
                )

                satisfied_by = req.get("satisfied_by")
                if satisfied_by:
                    html.append(
                        f"<div class='help' style='margin-bottom:8px;'>"
                        f"Requirement type: {satisfied_by.replace('_', ' ').capitalize()}"
                        f"</div>"
                    )

                if selected_docs:
                    html.append("<div class='onb-subsection-title'>Selected documents</div>")
                    html.append("<table class='onb-table'><tbody>")
                    for doc in selected_docs:
                        link = (
                            format_html('<a href="{}" target="_blank" rel="noopener">Open</a>', doc.file.url)
                            if doc.file else "—"
                        )
                        html.append(
                            "<tr>"
                            f"<td><strong>{self._document_item_label(doc)}</strong>"
                            f"<br><small>Uploaded: {doc.uploaded_at:%Y-%m-%d %H:%M}</small></td>"
                            f"<td><span class='onb-pill ok'>Used</span><br>{link}</td>"
                            "</tr>"
                        )
                    html.append("</tbody></table>")

                if alternative_docs:
                    html.append("<div class='onb-subsection-title'>Alternative uploaded documents</div>")
                    html.append("<table class='onb-table'><tbody>")
                    for doc in alternative_docs:
                        link = (
                            format_html('<a href="{}" target="_blank" rel="noopener">Open</a>', doc.file.url)
                            if doc.file else "—"
                        )
                        html.append(
                            "<tr>"
                            f"<td><strong>{self._document_item_label(doc)}</strong>"
                            f"<br><small>Uploaded: {doc.uploaded_at:%Y-%m-%d %H:%M}</small></td>"
                            f"<td><span class='onb-pill bad'>Unused</span><br>{link}</td>"
                            "</tr>"
                        )
                    html.append("</tbody></table>")

                missing_for_req = [
                    item for item in documents_missing
                    if item["doc_type"] == req["doc_type"] and item["scope"] == req["scope"]
                ]
                if missing_for_req:
                    html.append("<div class='onb-subsection-title'>Missing state</div>")
                    html.append("<ul class='onb-reasons'>")
                    for item in missing_for_req:
                        missing_sides = ", ".join(
                            self._normalize_side_label(s) for s in item.get("missing_sides", [])
                        )
                        accepts_single = item.get("accepts_single_side")
                        suffix = " (single side also accepted)" if accepts_single else ""
                        html.append(f"<li>Missing: {missing_sides}{suffix}</li>")
                    html.append("</ul>")

                html.append("</div>")

        requirement_pairs = {(req["doc_type"], req["scope"]) for req in requirements}
        other_docs = [doc for doc in docs if (doc.doc_type, doc.scope) not in requirement_pairs]

        if other_docs:
            html.append("<div class='onb-section-title'>Other uploaded documents</div>")
            html.append("<div class='help'>These files do not belong to the current onboarding requirements.</div>")
            html.append("<table class='onb-table'><tbody>")
            for doc in other_docs:
                link = (
                    format_html('<a href="{}" target="_blank" rel="noopener">Open</a>', doc.file.url)
                    if doc.file else "—"
                )
                html.append(
                    "<tr>"
                    f"<td><strong>{self._requirement_title(doc.doc_type, doc.scope)}</strong>"
                    f"<br><small>{self._document_item_label(doc)}</small></td>"
                    f"<td><span class='onb-pill bad'>Unused</span><br>{link}</td>"
                    "</tr>"
                )
            html.append("</tbody></table>")

        html.append(
            "<div class='help' style='margin-top:10px;'>"
            f"Uploaded: {counts.get('total_uploaded', 0)} • "
            f"Used for requirements: {counts.get('used_for_requirements', 0)} • "
            f"Extra unused: {counts.get('extra_unused', 0)}"
            "</div>"
        )

        html.append("</div>")
        return mark_safe("".join(html))

    @admin.display(description="Recent activity")
    def recent_activity_panel(self, obj: SellerOnboardingApplication) -> str:
        logs = list(obj.audit_logs.all().order_by("-created_at")[:8])

        if not logs:
            return mark_safe(
                "<div class='onb-panel'>"
                "<div class='help'>No recent activity.</div>"
                "</div>"
            )

        html = [
            "<div class='onb-panel'>",
            "<ul class='onb-activity-list'>",
        ]

        for log in logs:
            event_label = (
                log.get_event_type_display()
                if hasattr(log, "get_event_type_display")
                else log.event_type
            )
            actor_label = self._activity_actor_label(log)

            html.append(
                "<li>"
                f"<strong>{log.created_at:%Y-%m-%d %H:%M}</strong> — {event_label}"
                f"<br><small>{actor_label}</small>"
                "</li>"
            )

        html.append("</ul>")
        html.append(
            "<div class='help'>Full audit history is available below in the collapsed Audit log section.</div>"
        )
        html.append("</div>")
        return mark_safe("".join(html))

    @admin.display(description="Moderation")
    def moderation_tools(self, obj: SellerOnboardingApplication) -> str:
        approve_url = reverse("admin:sellers_onboarding_approve", args=[obj.pk])
        reject_url = reverse("admin:sellers_onboarding_reject", args=[obj.pk])

        strict_ok, errors = self._passes_strict_review(obj)

        approve_allowed = (
            obj.status in (OnboardingStatus.SUBMITTED, OnboardingStatus.PENDING_VERIFICATION)
            and strict_ok
        )
        reject_allowed = obj.status in (
            OnboardingStatus.SUBMITTED,
            OnboardingStatus.PENDING_VERIFICATION,
            OnboardingStatus.APPROVED,
        )

        if obj.status == OnboardingStatus.DRAFT:
            return mark_safe(
                "<div style='width:100%; max-width:980px;'>"
                "<div style='padding:12px 14px; border-radius:12px; background:#fff3cd; color:#664d03; font-weight:600;'>"
                "No moderation actions available for draft application."
                "</div>"
                "<div style='margin-top:8px; color:#666;'>"
                "The seller must submit the application before approve/reject actions become available."
                "</div>"
                "</div>"
            )

        if obj.status == OnboardingStatus.REJECTED:
            return mark_safe(
                "<div style='width:100%; max-width:980px;'>"
                "<div style='padding:12px 14px; border-radius:12px; background:#fff3cd; color:#664d03; font-weight:600;'>"
                "No moderation actions available for rejected application."
                "</div>"
                "<div style='margin-top:8px; color:#666;'>"
                "If the seller fixed the data, they should resubmit the application first."
                "</div>"
                "</div>"
            )

        if approve_allowed:
            approve_state = (
                "<span style='display:inline-block;padding:3px 10px;border-radius:999px;"
                "background:#e7f6ec;color:#0f5132;font-weight:700;font-size:12px;'>Available</span>"
            )
            approve_reason = "Application passes strict review."
            approve_href = approve_url
            approve_opacity = "1"
            approve_pointer = "auto"
        else:
            approve_state = (
                "<span style='display:inline-block;padding:3px 10px;border-radius:999px;"
                "background:#f8d7da;color:#842029;font-weight:700;font-size:12px;'>Blocked</span>"
            )
            if obj.status not in (OnboardingStatus.SUBMITTED, OnboardingStatus.PENDING_VERIFICATION):
                approve_reason = "Available only for Submitted / Pending verification."
            else:
                display_errors = self._display_review_errors(errors)
                approve_reason = display_errors[0] if display_errors else "Validation issues found."
            approve_href = "#"
            approve_opacity = "0.5"
            approve_pointer = "none"

        if reject_allowed:
            reject_state = (
                "<span style='display:inline-block;padding:3px 10px;border-radius:999px;"
                "background:#e7f6ec;color:#0f5132;font-weight:700;font-size:12px;'>Available</span>"
            )
            reject_reason = "Reject is available for this status."
            reject_href = reject_url
            reject_opacity = "1"
            reject_pointer = "auto"
        else:
            reject_state = (
                "<span style='display:inline-block;padding:3px 10px;border-radius:999px;"
                "background:#f8d7da;color:#842029;font-weight:700;font-size:12px;'>Blocked</span>"
            )
            reject_reason = "Not allowed for current status."
            reject_href = "#"
            reject_opacity = "0.5"
            reject_pointer = "none"

        return mark_safe(
            "<div class='onb-moderation-force-root' "
            "style='width:100%; max-width:980px; box-sizing:border-box;'>"
            "<div class='onb-moderation-force-grid' "
            "style='display:grid; grid-template-columns:repeat(2,minmax(280px,1fr)); gap:16px; width:100%;'>"

            # Approve card
            "<div style='border:1px solid #dfe5ea; border-left:4px solid #198754; "
            "border-radius:14px; background:#fff; padding:16px; min-height:210px; "
            "box-sizing:border-box; display:flex; flex-direction:column;'>"
            "<div style='font-size:16px; font-weight:700; margin-bottom:10px;'>Approve</div>"
            f"<div style='margin-bottom:10px;'>{approve_state}</div>"
            f"<div style='font-size:13px; line-height:1.45; color:#505a64; margin-bottom:16px; flex:1;'>{approve_reason}</div>"
            f"<a href='{approve_href}' "
            f"style='display:flex; align-items:center; justify-content:center; width:100%; "
            f"padding:10px 12px; box-sizing:border-box; border-radius:10px; "
            f"background:#198754; color:#fff; text-decoration:none; font-weight:700; "
            f"opacity:{approve_opacity}; pointer-events:{approve_pointer};'>"
            "Approve application"
            "</a>"
            "</div>"

            # Reject card
            "<div style='border:1px solid #dfe5ea; border-left:4px solid #dc3545; "
            "border-radius:14px; background:#fff; padding:16px; min-height:210px; "
            "box-sizing:border-box; display:flex; flex-direction:column;'>"
            "<div style='font-size:16px; font-weight:700; margin-bottom:10px;'>Reject</div>"
            f"<div style='margin-bottom:10px;'>{reject_state}</div>"
            f"<div style='font-size:13px; line-height:1.45; color:#505a64; margin-bottom:16px; flex:1;'>{reject_reason}</div>"
            f"<a href='{reject_href}' "
            f"style='display:flex; align-items:center; justify-content:center; width:100%; "
            f"padding:10px 12px; box-sizing:border-box; border-radius:10px; "
            f"background:#dc3545; color:#fff; text-decoration:none; font-weight:700; "
            f"opacity:{reject_opacity}; pointer-events:{reject_pointer};'>"
            "Reject application"
            "</a>"
            "</div>"

            "</div>"
            "</div>"
        )

    # =========================
    # Custom URLs
    # =========================

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<int:application_id>/approve/",
                self.admin_site.admin_view(self.approve_view),
                name="sellers_onboarding_approve",
            ),
            path(
                "<int:application_id>/reject/",
                self.admin_site.admin_view(self.reject_view),
                name="sellers_onboarding_reject",
            ),
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

        if app.status not in (
            OnboardingStatus.SUBMITTED,
            OnboardingStatus.PENDING_VERIFICATION,
            OnboardingStatus.APPROVED,
        ):
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
