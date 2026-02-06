from __future__ import annotations

import threading
from typing import Iterable

from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver

from .models import (
    SellerProfile,
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
    OnboardingEventType,
)
from .services_onboarding_audit import log_onboarding_event


# -----------------------------
# dedupe for section_updated
# -----------------------------
_local = threading.local()


def _dedupe_key(instance, section: str, changed_fields: list[str]) -> str:
    # stable key per save cycle
    return f"{instance.__class__.__name__}:{instance.pk}:{section}:{','.join(sorted(changed_fields))}"


def _seen(key: str) -> bool:
    seen = getattr(_local, "seen_keys", None)
    if seen is None:
        seen = set()
        _local.seen_keys = seen
    if key in seen:
        return True
    seen.add(key)
    return False


@receiver(post_save, sender=SellerProfile)
def ensure_onboarding_application(sender, instance: SellerProfile, created: bool, **kwargs):
    """
    Гарантируем, что у каждого SellerProfile есть draft onboarding application.
    """
    # КЛЮЧЕВОЕ: позволяет игнорировать loaddata
    if kwargs.get("raw", False):
        return

    if not SellerOnboardingApplication.objects.filter(seller_profile=instance).exists():
        SellerOnboardingApplication.objects.create(seller_profile=instance)


_EXCLUDE_FIELDS = {"id", "application", "created_at", "updated_at"}


def _is_blank(value) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def _model_field_names(instance) -> list[str]:
    names: list[str] = []
    for f in instance._meta.fields:
        if f.name in _EXCLUDE_FIELDS:
            continue
        names.append(f.name)
    return names


def _diff_fields(old_obj, new_obj, fields: Iterable[str]) -> list[str]:
    changed: list[str] = []
    for name in fields:
        if getattr(old_obj, name) != getattr(new_obj, name):
            changed.append(name)
    return changed


def _log_section_update(instance, section: str, changed_fields: list[str]) -> None:
    if not changed_fields:
        return
    app = getattr(instance, "application", None)
    if not app:
        return

    # dedupe within one request/process cycle
    key = _dedupe_key(instance, section, changed_fields)
    if _seen(key):
        return

    log_onboarding_event(
        application=app,
        event_type=OnboardingEventType.SECTION_UPDATED,
        payload={"section": section, "changed_fields": changed_fields},
    )


def _section_pre_save(sender, instance, section: str):
    fields = _model_field_names(instance)

    # CREATE: log only non-blank fields
    if not instance.pk:
        non_blank = [f for f in fields if not _is_blank(getattr(instance, f, None))]
        _log_section_update(instance, section, non_blank)
        return

    # UPDATE: diff
    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        non_blank = [f for f in fields if not _is_blank(getattr(instance, f, None))]
        _log_section_update(instance, section, non_blank)
        return

    changed = _diff_fields(old, instance, fields)
    _log_section_update(instance, section, changed)


# ---- section signals

@receiver(pre_save, sender=SellerSelfEmployedPersonalDetails)
def se_personal_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "self_employed_personal")


@receiver(pre_save, sender=SellerSelfEmployedTaxInfo)
def se_tax_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "self_employed_tax")


@receiver(pre_save, sender=SellerSelfEmployedAddress)
def se_address_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "self_employed_address")


@receiver(pre_save, sender=SellerCompanyInfo)
def company_info_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "company_info")


@receiver(pre_save, sender=SellerCompanyRepresentative)
def company_rep_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "company_representative")


@receiver(pre_save, sender=SellerCompanyAddress)
def company_address_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "company_address")


@receiver(pre_save, sender=SellerBankAccount)
def bank_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "bank_account")


@receiver(pre_save, sender=SellerWarehouseAddress)
def wh_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "warehouse_address")


@receiver(pre_save, sender=SellerReturnAddress)
def return_pre_save(sender, instance, **kwargs):
    _section_pre_save(sender, instance, "return_address")


# ---- document events

@receiver(post_save, sender=SellerDocument)
def document_saved(sender, instance: SellerDocument, created: bool, **kwargs):
    event = OnboardingEventType.DOCUMENT_UPLOADED if created else OnboardingEventType.DOCUMENT_REPLACED
    log_onboarding_event(
        application=instance.application,
        event_type=event,
        payload={"doc_type": instance.doc_type, "scope": instance.scope, "side": instance.side},
    )


@receiver(post_delete, sender=SellerDocument)
def document_deleted(sender, instance: SellerDocument, **kwargs):
    log_onboarding_event(
        application=instance.application,
        event_type=OnboardingEventType.DOCUMENT_DELETED,
        payload={"doc_type": instance.doc_type, "scope": instance.scope, "side": instance.side},
    )
