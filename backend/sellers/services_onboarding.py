from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from django.db import transaction
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from .models import (
    SellerOnboardingApplication,
    SellerType,
    OnboardingStatus,
    SellerLegalInfo,
    LegalInfoStatus,
    OnboardingEventType,
)
from .services_onboarding_audit import log_onboarding_event


IBAN_RE = re.compile(r"^[A-Z0-9]{15,34}$")
SWIFT_RE = re.compile(r"^[A-Z0-9]{8,11}$")


def ensure_application_editable(app: SellerOnboardingApplication) -> None:
    """
    Разрешаем редактирование только в draft/rejected.
    Используем ValidationError (400).
    """
    if app.status not in [OnboardingStatus.DRAFT, OnboardingStatus.REJECTED]:
        raise ValidationError({"detail": "Only draft/rejected applications can be edited."})


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
    Финальная completeness-логика onboarding.
    Поддерживает:
    - passport (1 сторона)
    - ID / residence (2 стороны)
    """

    # SELLER TYPE
    seller_type_selected = bool(app.seller_type)

    if not seller_type_selected:
        return Completeness(
            seller_type_selected=False,
            personal_complete=False,
            tax_complete=False,
            address_complete=False,
            bank_complete=False,
            warehouse_complete=False,
            return_complete=False,
            documents_complete=False,
        )

    # DATA BLOCKS
    personal_complete = tax_complete = address_complete = False

    if app.seller_type == SellerType.SELF_EMPLOYED:
        p = getattr(app, "self_employed_personal", None)
        personal_complete = bool(
            p and p.date_of_birth and p.nationality
        )

        t = getattr(app, "self_employed_tax", None)
        tax_complete = bool(
            t and t.tax_country and t.tin
        )

        a = getattr(app, "self_employed_address", None)
        address_complete = bool(
            a and a.street and a.city and a.zip_code and a.country
        )

    elif app.seller_type == SellerType.COMPANY:
        ci = getattr(app, "company_info", None)
        personal_complete = bool(
            ci and
            ci.company_name and
            ci.legal_form and
            ci.country_of_registration and
            ci.tin and
            ci.company_phone
        )

        rep = getattr(app, "company_representative", None)
        tax_complete = bool(
            rep and
            rep.first_name and
            rep.last_name and
            rep.role and
            rep.date_of_birth and
            rep.nationality
        )

        ca = getattr(app, "company_address", None)
        address_complete = bool(
            ca and ca.street and ca.city and ca.zip_code and ca.country
        )

    # BANK
    bank = getattr(app, "bank_account", None)
    bank_complete = bool(
        bank and bank.iban and bank.swift_bic and bank.account_holder
    )

    # WAREHOUSE
    wh = getattr(app, "warehouse_address", None)
    warehouse_complete = bool(
        wh and wh.street and wh.city and wh.zip_code and wh.country and wh.contact_phone
    )

    # RETURN ADDRESS
    ra = getattr(app, "return_address", None)
    if not ra:
        return_complete = False
    elif ra.same_as_warehouse:
        return_complete = warehouse_complete
    else:
        return_complete = bool(
            ra.street and ra.city and ra.zip_code and ra.country and ra.contact_phone
        )

    # DOCUMENTS
    docs: Set[Tuple[str, str, str | None]] = {
        (d.doc_type, d.scope, d.side)
        for d in app.documents.all()
    }

    def has_single_sided(doc_type: str, scope: str) -> bool:
        """
        Проверка одностороннего документа (passport, proof_of_address).
        """
        return (
            (doc_type, scope, None) in docs or
            (doc_type, scope, "front") in docs
        )

    def has_double_sided(doc_type: str, scope: str) -> bool:
        """
        Проверка двустороннего документа (ID / residence).
        """
        return (
            (doc_type, scope, "front") in docs and
            (doc_type, scope, "back") in docs
        )

    def has_identity_document(scope: str) -> bool:
        """
        Identity document может быть:
        - passport (1 сторона)
        - ID / residence (2 стороны)
        """
        return (
            has_single_sided("identity_document", scope) or
            has_double_sided("identity_document", scope)
        )

    if app.seller_type == SellerType.SELF_EMPLOYED:
        documents_complete = (
            has_identity_document("self_employed_personal") and
            has_single_sided("proof_of_address", "self_employed_address")
        )

    elif app.seller_type == SellerType.COMPANY:
        documents_complete = (
            has_single_sided("registration_certificate", "company_info") and
            has_identity_document("company_representative") and
            has_single_sided("proof_of_address", "company_address")
        )

    else:
        documents_complete = False

    # RESULT
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


def compute_next_step(app: SellerOnboardingApplication, completeness: Completeness) -> str:
    """
    Куда вернуть продавца при продолжении онбординга.

    Унифицированный порядок шагов:
    seller_type -> personal -> tax -> address -> bank -> warehouse -> return -> documents -> review
    """
    if not completeness.seller_type_selected:
        return "seller_type"
    if not completeness.personal_complete:
        return "personal"
    if not completeness.tax_complete:
        return "tax"
    if not completeness.address_complete:
        return "address"
    if not completeness.bank_complete:
        return "bank"
    if not completeness.warehouse_complete:
        return "warehouse"
    if not completeness.return_complete:
        return "return"
    if not completeness.documents_complete:
        return "documents"
    return "review"


def compute_documents_summary_and_missing(app: SellerOnboardingApplication) -> tuple[dict, list[dict]]:
    """
    Возвращает:
    - documents_summary: "нормализованная" сводка по требованиям (не raw dump документов)
    - documents_missing: список требований, которые ещё не выполнены (как и раньше)

    ВАЖНО: логика требований 1-в-1 соответствует compute_completeness() в этом файле:
      - identity_document допускает:
          passport (1 сторона: side=None или side="front")
          или ID/residence (2 стороны: front+back)
      - proof_of_address / registration_certificate: 1 сторона (None или front)

    Формат documents_summary:

    {
      "requirements": [
        {
          "doc_type": "...",
          "scope": "...",
          "status": "satisfied" | "missing",
          "satisfied_by": "double_sided" | "single_sided" | None,
          "uploaded_sides": ["front","back"] | [null] | [],
          "document_ids": [1,2] | []
        }
      ],
      "counts": {
        "total_uploaded": 5,
        "used_for_requirements": 3,
        "extra_unused": 2
      }
    }
    """

    uploaded_docs = list(app.documents.all())
    total_uploaded = len(uploaded_docs)

    # Индекс по ключу (doc_type, scope, side) -> document_id
    doc_id_by_key: dict[tuple[str, str, str | None], int] = {
        (d.doc_type, d.scope, d.side): d.id for d in uploaded_docs
    }

    uploaded_keys = set(doc_id_by_key.keys())

    def has_key(doc_type: str, scope: str, side: str | None) -> bool:
        return (doc_type, scope, side) in uploaded_keys

    def pick_single_sided(doc_type: str, scope: str) -> tuple[bool, list[str | None], list[int]]:
        """
        single-sided = (None) OR ("front")
        Возвращает:
          (is_present, uploaded_sides, document_ids_used)
        """
        if has_key(doc_type, scope, None):
            return True, [None], [doc_id_by_key[(doc_type, scope, None)]]
        if has_key(doc_type, scope, "front"):
            return True, ["front"], [doc_id_by_key[(doc_type, scope, "front")]]
        return False, [], []

    def pick_double_sided(doc_type: str, scope: str) -> tuple[bool, list[str], list[int]]:
        """
        double-sided = ("front" AND "back")
        """
        if has_key(doc_type, scope, "front") and has_key(doc_type, scope, "back"):
            return (
                True,
                ["front", "back"],
                [
                    doc_id_by_key[(doc_type, scope, "front")],
                    doc_id_by_key[(doc_type, scope, "back")],
                ],
            )
        return False, [], []

    def pick_identity(scope: str) -> tuple[str | None, list[str | None], list[int]]:
        """
        identity_document:
          - предпочтение double-sided (ID/residence), если есть front+back
          - иначе single-sided (passport), если есть side=None или front
        Возвращает:
          (satisfied_by, uploaded_sides, document_ids_used)
        """
        ok2, sides2, ids2 = pick_double_sided("identity_document", scope)
        if ok2:
            return "double_sided", sides2, ids2

        ok1, sides1, ids1 = pick_single_sided("identity_document", scope)
        if ok1:
            return "single_sided", sides1, ids1

        return None, [], []

    def requirement_entry(
        doc_type: str,
        scope: str,
        satisfied_by: str | None,
        uploaded_sides: list[str | None],
        document_ids: list[int],
    ) -> dict:
        return {
            "doc_type": doc_type,
            "scope": scope,
            "status": "satisfied" if satisfied_by else "missing",
            "satisfied_by": satisfied_by,
            "uploaded_sides": uploaded_sides,
            "document_ids": document_ids,
        }

    requirements: list[dict] = []
    used_doc_ids: set[int] = set()

    missing: list[dict] = []

    if app.seller_type == SellerType.SELF_EMPLOYED:
        # identity_document for self-employed personal
        satisfied_by, sides, ids = pick_identity("self_employed_personal")
        requirements.append(
            requirement_entry(
                "identity_document",
                "self_employed_personal",
                satisfied_by,
                sides,
                ids,
            )
        )
        used_doc_ids.update(ids)

        if not satisfied_by:
            missing.append({
                "doc_type": "identity_document",
                "scope": "self_employed_personal",
                "rule": "identity_document",
                "missing_sides": ["front", "back"],
                "accepts_single_side": True,
            })

        # proof_of_address for self-employed address (single-sided)
        ok, sides, ids = pick_single_sided("proof_of_address", "self_employed_address")
        requirements.append(
            requirement_entry(
                "proof_of_address",
                "self_employed_address",
                "single_sided" if ok else None,
                sides,
                ids,
            )
        )
        used_doc_ids.update(ids)

        if not ok:
            missing.append({
                "doc_type": "proof_of_address",
                "scope": "self_employed_address",
                "rule": "single_sided",
                "missing_sides": [None],
            })

    elif app.seller_type == SellerType.COMPANY:
        # registration_certificate for company_info (single-sided)
        ok, sides, ids = pick_single_sided("registration_certificate", "company_info")
        requirements.append(
            requirement_entry(
                "registration_certificate",
                "company_info",
                "single_sided" if ok else None,
                sides,
                ids,
            )
        )
        used_doc_ids.update(ids)

        if not ok:
            missing.append({
                "doc_type": "registration_certificate",
                "scope": "company_info",
                "rule": "single_sided",
                "missing_sides": [None],
            })

        # identity_document for company_representative
        satisfied_by, sides, ids = pick_identity("company_representative")
        requirements.append(
            requirement_entry(
                "identity_document",
                "company_representative",
                satisfied_by,
                sides,
                ids,
            )
        )
        used_doc_ids.update(ids)

        if not satisfied_by:
            missing.append({
                "doc_type": "identity_document",
                "scope": "company_representative",
                "rule": "identity_document",
                "missing_sides": ["front", "back"],
                "accepts_single_side": True,
            })

        # proof_of_address for company_address (single-sided)
        ok, sides, ids = pick_single_sided("proof_of_address", "company_address")
        requirements.append(
            requirement_entry(
                "proof_of_address",
                "company_address",
                "single_sided" if ok else None,
                sides,
                ids,
            )
        )
        used_doc_ids.update(ids)

        if not ok:
            missing.append({
                "doc_type": "proof_of_address",
                "scope": "company_address",
                "rule": "single_sided",
                "missing_sides": [None],
            })

    # counts
    used_for_requirements = len(used_doc_ids)
    extra_unused = max(total_uploaded - used_for_requirements, 0)

    documents_summary = {
        "requirements": requirements,
        "counts": {
            "total_uploaded": total_uploaded,
            "used_for_requirements": used_for_requirements,
            "extra_unused": extra_unused,
        },
    }

    return documents_summary, missing


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
    log_onboarding_event(
        application=app,
        event_type=OnboardingEventType.REVIEW_REQUESTED,
        payload={},
        actor=app.seller_profile.user,  # seller
    )
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
    log_onboarding_event(
        application=app,
        event_type=OnboardingEventType.MODERATION_APPROVED,
        payload={},
        actor=reviewer,
    )
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
    log_onboarding_event(
        application=app,
        event_type=OnboardingEventType.MODERATION_REJECTED,
        payload={"reason": reason},
        actor=reviewer,
    )

    # email to seller
    seller_email = app.seller_profile.user.email
    subject = "Your seller onboarding was rejected"
    message = (
        "Hello,\n\n"
        "Your seller onboarding application was rejected.\n\n"
        f"Reason:\n{reason}\n\n"
        "Please log in to your account, fix the issues and resubmit.\n\n"
        "— Support Team\n"
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        recipient_list=[seller_email],
        fail_silently=True,  # минимальная версия: не ломаем reject из-за почты
    )
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
