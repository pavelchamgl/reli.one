"""
Регрессии OnboardingAuditLog без мока log_onboarding_event (Task 008 шаг 4).

При сборке полной заявки ORM-сигналы отключены через audit_disabled(),
чтобы изолировать записи от submit/approve/reject.
"""
from __future__ import annotations

from datetime import date
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.audit_context import audit_disabled
from sellers.models import (
    OnboardingActorType,
    OnboardingAuditLog,
    OnboardingEventType,
    OnboardingStatus,
    SellerBankAccount,
    SellerDocument,
    SellerOnboardingApplication,
    SellerReturnAddress,
    SellerSelfEmployedAddress,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
    SellerType,
    SellerWarehouseAddress,
)
from sellers.services_onboarding import (
    approve_application,
    reject_application,
    submit_application,
    validate_before_submit,
)
from sellers.services_onboarding_audit import log_onboarding_event


def _minimal_pdf(name: str = "doc.pdf") -> ContentFile:
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
        b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj "
        b"trailer<</Size 4/Root 1 0 R>>\n%%EOF"
    )
    return ContentFile(pdf, name=name)


def _build_submittable_self_employed(email: str, phone: str) -> tuple[CustomUser, SellerOnboardingApplication]:
    user = CustomUser.objects.create_user(
        email=email,
        password="password",
        role=UserRole.SELLER,
        first_name="Audit",
        last_name="Seller",
        phone_number=phone,
    )
    app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
    app.seller_type = SellerType.SELF_EMPLOYED
    app.save(update_fields=["seller_type", "updated_at"])

    with audit_disabled():
        SellerSelfEmployedPersonalDetails.objects.create(
            application=app,
            date_of_birth=date(1990, 5, 5),
            nationality="CZ",
        )
        SellerSelfEmployedTaxInfo.objects.create(
            application=app,
            tax_country="CZ",
            tin="TINAUDIT",
        )
        SellerSelfEmployedAddress.objects.create(
            application=app,
            street="Audit 1",
            city="Praha",
            zip_code="15000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="Audit Seller",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="WH-A",
            city="Brno",
            zip_code="60200",
            country="CZ",
            contact_phone="+420611000099",
        )
        SellerReturnAddress.objects.create(application=app, same_as_warehouse=True)
        for spec in (
            ("identity_document", "self_employed_personal", None),
            ("proof_of_address", "self_employed_address", None),
            ("proof_of_address", "warehouse_address", None),
        ):
            SellerDocument.objects.create(
                application=app,
                doc_type=spec[0],
                scope=spec[1],
                side=spec[2],
                file=_minimal_pdf(f"a_{spec[0]}_{spec[1]}.pdf"),
            )

    return user, app


class LogOnboardingEventDirectTests(TestCase):
    def test_creates_row_with_application_actor_payload_snapshot(self):
        user = CustomUser.objects.create_user(
            email="audit-direct@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="D",
            last_name="U",
            phone_number="+420777030001",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)

        log_onboarding_event(
            application=app,
            event_type=OnboardingEventType.SECTION_UPDATED,
            payload={"section": "test_section", "changed_fields": ["x"]},
            actor=user,
        )

        log = OnboardingAuditLog.objects.get(application=app)
        self.assertEqual(log.event_type, OnboardingEventType.SECTION_UPDATED)
        self.assertEqual(log.actor_id, user.id)
        self.assertEqual(log.actor_type, OnboardingActorType.SELLER)
        self.assertEqual(log.payload["section"], "test_section")
        self.assertEqual(log.actor_snapshot.get("email"), user.email)
        self.assertEqual(log.actor_snapshot.get("role"), UserRole.SELLER)
        self.assertIsNotNone(log.pk)
        self.assertIsNotNone(log.created_at)

    def test_accepts_application_primary_key_int(self):
        user = CustomUser.objects.create_user(
            email="audit-intpk@example.com",
            password="password",
            role=UserRole.SELLER,
            phone_number="+420777030002",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)

        log_onboarding_event(
            application=app.pk,
            event_type=OnboardingEventType.DOCUMENT_UPLOADED,
            payload={"doc_type": "proof_of_address"},
            actor=user,
        )

        row = OnboardingAuditLog.objects.get(application_id=app.pk)
        self.assertEqual(row.event_type, OnboardingEventType.DOCUMENT_UPLOADED)

    def test_audit_disabled_skips_persist(self):
        user = CustomUser.objects.create_user(
            email="audit-skip@example.com",
            password="password",
            role=UserRole.SELLER,
            phone_number="+420777030003",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)

        with audit_disabled():
            log_onboarding_event(
                application=app,
                event_type=OnboardingEventType.REVIEW_REQUESTED,
                payload={},
                actor=user,
            )

        self.assertEqual(OnboardingAuditLog.objects.filter(application=app).count(), 0)


class SubmitApplicationAuditTests(TestCase):
    def test_success_writes_review_requested_audit(self):
        user, app = _build_submittable_self_employed(
            "audit-submit-ok@example.com",
            "+420777030010",
        )
        self.assertEqual(OnboardingAuditLog.objects.filter(application=app).count(), 0)

        submit_application(app)

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.PENDING_VERIFICATION)

        logs = list(OnboardingAuditLog.objects.filter(application=app))
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].event_type, OnboardingEventType.REVIEW_REQUESTED)
        self.assertEqual(logs[0].actor_id, user.id)
        self.assertEqual(logs[0].payload, {})

    def test_validate_failure_does_not_write_review_requested(self):
        user = CustomUser.objects.create_user(
            email="audit-submit-fail@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="X",
            last_name="Y",
            phone_number="+420777030011",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])

        with self.assertRaises(ValidationError):
            submit_application(app)

        self.assertEqual(
            OnboardingAuditLog.objects.filter(
                application=app,
                event_type=OnboardingEventType.REVIEW_REQUESTED,
            ).count(),
            0,
        )

    def test_wrong_status_guard_no_audit(self):
        user, app = _build_submittable_self_employed(
            "audit-submit-guard@example.com",
            "+420777030012",
        )
        app.status = OnboardingStatus.PENDING_VERIFICATION
        app.save(update_fields=["status", "updated_at"])

        with self.assertRaises(ValidationError):
            submit_application(app)

        self.assertEqual(OnboardingAuditLog.objects.filter(application=app).count(), 0)


class ApproveRejectApplicationAuditTests(TestCase):
    def _pending_app_with_manager(self):
        seller_user, app = _build_submittable_self_employed(
            "audit-flow-seller@example.com",
            "+420777030020",
        )
        submit_application(app)

        manager = CustomUser.objects.create_user(
            email="audit-flow-mgr@example.com",
            password="password",
            role=UserRole.MANAGER,
            phone_number="+420777030021",
            is_staff=True,
        )
        return app, seller_user, manager

    @patch("sellers.services_onboarding.sync_legal_info_from_application")
    def test_approve_writes_moderation_approved(self, _mock_sync):
        app, _seller, manager = self._pending_app_with_manager()

        before = OnboardingAuditLog.objects.filter(application=app).count()

        approve_application(app, reviewer=manager)

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.APPROVED)

        logs = OnboardingAuditLog.objects.filter(application=app).order_by("id")
        self.assertEqual(logs.count(), before + 1)
        last = logs.last()
        self.assertEqual(last.event_type, OnboardingEventType.MODERATION_APPROVED)
        self.assertEqual(last.actor_id, manager.id)
        self.assertEqual(last.actor_type, OnboardingActorType.ADMIN)
        self.assertEqual(last.payload, {})

    @patch("sellers.services_onboarding.send_mail")
    def test_reject_writes_moderation_rejected_with_reason_payload(self, _mock_mail):
        app, _seller, manager = self._pending_app_with_manager()

        before = OnboardingAuditLog.objects.filter(application=app).count()

        reject_application(app, reviewer=manager, reason="Missing docs.")

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.REJECTED)
        self.assertEqual(app.rejected_reason, "Missing docs.")

        logs = OnboardingAuditLog.objects.filter(application=app).order_by("id")
        self.assertEqual(logs.count(), before + 1)
        last = logs.last()
        self.assertEqual(last.event_type, OnboardingEventType.MODERATION_REJECTED)
        self.assertEqual(last.actor_id, manager.id)
        self.assertEqual(last.payload.get("reason"), "Missing docs.")

    def test_reject_empty_reason_no_audit_row(self):
        app, _seller, manager = self._pending_app_with_manager()
        before = OnboardingAuditLog.objects.filter(application=app).count()

        with self.assertRaises(ValidationError):
            reject_application(app, reviewer=manager, reason="   ")

        self.assertEqual(OnboardingAuditLog.objects.filter(application=app).count(), before)

    def test_approve_non_manager_no_audit(self):
        app, seller, _mgr = self._pending_app_with_manager()
        before = OnboardingAuditLog.objects.filter(application=app).count()

        with self.assertRaises(ValidationError):
            approve_application(app, reviewer=seller)

        self.assertEqual(OnboardingAuditLog.objects.filter(application=app).count(), before)


class ValidateBeforeSubmitNegativeAuditTests(TestCase):
    """validate_before_submit не вызывает audit — только фиксация."""

    def test_incomplete_app_raises_without_audit_side_effect(self):
        user = CustomUser.objects.create_user(
            email="audit-val@example.com",
            password="password",
            role=UserRole.SELLER,
            phone_number="+420777030030",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])

        with self.assertRaises(ValidationError):
            validate_before_submit(app)

        self.assertEqual(OnboardingAuditLog.objects.filter(application=app).count(), 0)
