from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from .models import (
    SellerOnboardingApplication,
    SellerType,
    OnboardingStatus,
    SellerLegalInfo,
    LegalInfoStatus,
)


IBAN_RE = re.compile(r"^[A-Z0-9]{15,34}$")
SWIFT_RE = re.compile(r"^[A-Z0-9]{8,11}$")


def get_or_create_application_for_user(user) -> SellerOnboardingApplication:
    if not hasattr(user, "seller_profile"):
        raise ValidationError({"detail": "User is not a seller."})
    app, _ = SellerOnboardingApplication.objects.get_or_create(seller_profile=user.seller_profile)
    return app


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


@dataclass
class Completeness:
    seller_type_selected: bool
    personal_complete: bool
    tax_complete: bool
    address_complete: bool
    bank_complete: bool
    warehouse_complete: bool
    return_complete: bool
    documents_complete: bool

    @property
    def is_submittable(self) -> bool:
        return all([
            self.seller_type_selected,
            self.personal_complete,
            self.tax_complete,
            self.address_complete,
            self.bank_complete,
            self.warehouse_complete,
            self.return_complete,
            self.documents_complete,
        ])


def compute_completeness(app: SellerOnboardingApplication) -> Completeness:
    """
    Упрощённая completeness: наличие ключевых полей.
    Более строгую валидацию делаем в validate_before_submit.
    """
    seller_type_selected = not _is_blank(app.seller_type)

    personal_complete = tax_complete = address_complete = True

    if app.seller_type == SellerType.SELF_EMPLOYED:
        p = getattr(app, "self_employed_personal", None)
        personal_complete = bool(p and p.date_of_birth and p.nationality)

        t = getattr(app, "self_employed_tax", None)
        tax_complete = bool(t and t.tax_country and t.tin)

        a = getattr(app, "self_employed_address", None)
        address_complete = bool(a and a.street and a.city and a.zip_code and a.country)

    if app.seller_type == SellerType.COMPANY:
        ci = getattr(app, "company_info", None)
        personal_complete = bool(ci and ci.company_name and ci.legal_form and ci.country_of_registration and ci.tin and ci.company_phone)

        rep = getattr(app, "company_representative", None)
        tax_complete = bool(rep and rep.first_name and rep.last_name and rep.role and rep.date_of_birth and rep.nationality)

        ca = getattr(app, "company_address", None)
        address_complete = bool(ca and ca.street and ca.city and ca.zip_code and ca.country)

    bank = getattr(app, "bank_account", None)
    bank_complete = bool(bank and bank.iban and bank.swift_bic and bank.account_holder)

    wh = getattr(app, "warehouse_address", None)
    warehouse_complete = bool(wh and wh.street and wh.city and wh.zip_code and wh.country and wh.contact_phone)

    ra = getattr(app, "return_address", None)
    if not ra:
        return_complete = False
    else:
        if ra.same_as_warehouse:
            return_complete = True
        else:
            return_complete = bool(ra.street and ra.city and ra.zip_code and ra.country and ra.contact_phone)

    # Документы минимально:
    # self-employed: identity + proof_of_address (address)
    # company: registration_certificate + identity(rep) + proof_of_address(company address)
    docs = list(app.documents.all())
    docs_types_scopes = {(d.doc_type, d.scope) for d in docs}

    if app.seller_type == SellerType.SELF_EMPLOYED:
        documents_complete = (
            ("identity_document", "self_employed_personal") in docs_types_scopes and
            ("proof_of_address", "self_employed_address") in docs_types_scopes
        )
    elif app.seller_type == SellerType.COMPANY:
        documents_complete = (
            ("registration_certificate", "company_info") in docs_types_scopes and
            ("identity_document", "company_representative") in docs_types_scopes and
            ("proof_of_address", "company_address") in docs_types_scopes
        )
    else:
        documents_complete = False

    return Completeness(
        seller_type_selected=seller_type_selected,
        personal_complete=personal_complete,
        tax_complete=tax_complete,
        address_complete=address_complete,
        bank_complete=bank_complete,
        warehouse_complete=warehouse_complete,
        return_complete=return_complete,
        documents_complete=documents_complete,
    )


def validate_before_submit(app: SellerOnboardingApplication) -> None:
    """
    Строгая валидация перед submit. Возвращаем ValidationError с детальным словарём.
    """
    errors: dict[str, Any] = {}

    if _is_blank(app.seller_type):
        errors["seller_type"] = "Seller type is required."

    bank = getattr(app, "bank_account", None)
    if not bank:
        errors["bank_account"] = "Bank account is required."
    else:
        if not bank.iban or not IBAN_RE.match(bank.iban.replace(" ", "").upper()):
            errors["iban"] = "Invalid IBAN."
        if not bank.swift_bic or not SWIFT_RE.match(bank.swift_bic.replace(" ", "").upper()):
            errors["swift_bic"] = "Invalid SWIFT/BIC."
        if _is_blank(bank.account_holder):
            errors["account_holder"] = "Account holder is required."

    # account_holder rule from TZ:
    # - self-employed: holder должен совпадать с ФИО
    # - company: holder должен совпадать с названием компании
    if bank and app.seller_type == SellerType.SELF_EMPLOYED:
        full_name = f"{app.seller_profile.user.first_name} {app.seller_profile.user.last_name}".strip()
        if full_name and bank.account_holder and bank.account_holder.strip() != full_name:
            errors["account_holder"] = "For self-employed, account holder must match seller full name."

    if bank and app.seller_type == SellerType.COMPANY:
        ci = getattr(app, "company_info", None)
        if ci and ci.company_name and bank.account_holder and bank.account_holder.strip() != ci.company_name.strip():
            errors["account_holder"] = "For company, account holder must match company name."

    wh = getattr(app, "warehouse_address", None)
    if not wh or _is_blank(wh.street) or _is_blank(wh.city) or _is_blank(wh.zip_code) or _is_blank(wh.country) or _is_blank(wh.contact_phone):
        errors["warehouse_address"] = "Warehouse address is incomplete."

    ra = getattr(app, "return_address", None)
    if not ra:
        errors["return_address"] = "Return address is required."
    else:
        if not ra.same_as_warehouse:
            missing = []
            for fld in ["street", "city", "zip_code", "country", "contact_phone"]:
                if _is_blank(getattr(ra, fld)):
                    missing.append(fld)
            if missing:
                errors["return_address"] = {"missing_fields": missing}

    completeness = compute_completeness(app)
    if not completeness.is_submittable:
        errors["completeness"] = {
            "seller_type_selected": completeness.seller_type_selected,
            "personal_complete": completeness.personal_complete,
            "tax_complete": completeness.tax_complete,
            "address_complete": completeness.address_complete,
            "bank_complete": completeness.bank_complete,
            "warehouse_complete": completeness.warehouse_complete,
            "return_complete": completeness.return_complete,
            "documents_complete": completeness.documents_complete,
        }

    if errors:
        raise ValidationError(errors)


@transaction.atomic
def submit_application(app: SellerOnboardingApplication) -> SellerOnboardingApplication:
    if app.status not in [OnboardingStatus.DRAFT, OnboardingStatus.REJECTED]:
        raise ValidationError({"detail": "Only draft/rejected applications can be submitted."})

    validate_before_submit(app)
    app.status = OnboardingStatus.PENDING_VERIFICATION
    app.submitted_at = timezone.now()
    app.rejected_reason = None
    app.save(update_fields=["status", "submitted_at", "rejected_reason", "updated_at"])
    return app


@transaction.atomic
def approve_application(app: SellerOnboardingApplication, reviewer: CustomUser) -> SellerOnboardingApplication:
    if reviewer.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise ValidationError({"detail": "Only manager/admin can approve."})

    app.status = OnboardingStatus.APPROVED
    app.reviewed_by = reviewer
    app.reviewed_at = timezone.now()
    app.rejected_reason = None
    app.save(update_fields=["status", "reviewed_by", "reviewed_at", "rejected_reason", "updated_at"])

    sync_legal_info_from_application(app, reviewer)
    return app


@transaction.atomic
def reject_application(app: SellerOnboardingApplication, reviewer: CustomUser, reason: str) -> SellerOnboardingApplication:
    if reviewer.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise ValidationError({"detail": "Only manager/admin can reject."})
    if _is_blank(reason):
        raise ValidationError({"rejected_reason": "Rejected reason is required."})

    app.status = OnboardingStatus.REJECTED
    app.reviewed_by = reviewer
    app.reviewed_at = timezone.now()
    app.rejected_reason = reason
    app.save(update_fields=["status", "reviewed_by", "reviewed_at", "rejected_reason", "updated_at"])
    return app


def sync_legal_info_from_application(app: SellerOnboardingApplication, reviewer: CustomUser) -> SellerLegalInfo:
    """
    НЕ ломаем старую SellerLegalInfo: просто поддерживаем её актуальной после approve.
    """
    seller_profile = app.seller_profile

    company_name = ""
    legal_address = ""
    bank_details = ""

    if app.seller_type == SellerType.SELF_EMPLOYED:
        company_name = f"{seller_profile.user.first_name} {seller_profile.user.last_name}".strip()
        addr = getattr(app, "self_employed_address", None)
        if addr:
            legal_address = f"{addr.street}, {addr.city}, {addr.zip_code}, {addr.country}"
    elif app.seller_type == SellerType.COMPANY:
        ci = getattr(app, "company_info", None)
        if ci:
            company_name = ci.company_name or ""
        addr = getattr(app, "company_address", None)
        if addr:
            legal_address = f"{addr.street}, {addr.city}, {addr.zip_code}, {addr.country}"

    bank = getattr(app, "bank_account", None)
    if bank:
        bank_details = f"IBAN: {bank.iban}; SWIFT: {bank.swift_bic}; HOLDER: {bank.account_holder}"

    legal_info, _ = SellerLegalInfo.objects.get_or_create(
        seller_profile=seller_profile,
        defaults={
            "company_name": company_name or "N/A",
            "legal_address": legal_address or None,
            "bank_details": bank_details or None,
            "status": LegalInfoStatus.APPROVED,
            "approved_by": reviewer,
            "approved_at": timezone.now(),
        },
    )
    legal_info.company_name = company_name or legal_info.company_name
    legal_info.legal_address = legal_address or legal_info.legal_address
    legal_info.bank_details = bank_details or legal_info.bank_details
    legal_info.status = LegalInfoStatus.APPROVED
    legal_info.approved_by = reviewer
    legal_info.approved_at = timezone.now()
    legal_info.rejected_reason = None
    legal_info.save()

    return legal_info
