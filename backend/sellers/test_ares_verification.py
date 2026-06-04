from __future__ import annotations

from datetime import date
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.test import TestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.audit_context import audit_disabled
from sellers.models import (
    OnboardingAuditLog,
    OnboardingEventType,
    OnboardingStatus,
    SellerAresVerification,
    SellerBankAccount,
    SellerCompanyAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
    SellerDocument,
    SellerOnboardingApplication,
    SellerReturnAddress,
    SellerType,
    SellerWarehouseAddress,
)
from sellers.providers.ares.errors import AresNotFound, AresUnavailable
from sellers.services_onboarding import submit_application


def _minimal_pdf(name: str = "doc.pdf") -> ContentFile:
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
        b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj "
        b"trailer<</Size 4/Root 1 0 R>>\n%%EOF"
    )
    return ContentFile(pdf, name=name)


def _ares_success(**overrides) -> dict:
    payload = {
        "found": True,
        "ico": "25596641",
        "business_id": "25596641",
        "company_name": "Entry Assist s.r.o.",
        "legal_form_code": "112",
        "legal_form": "s.r.o. (Czech Republic / Slovakia)",
        "registered_address": {
            "street": "Dlouhá 12",
            "city": "Praha",
            "zip_code": "11000",
            "country": "CZ",
        },
        "dic_hint": "CZ25596641",
        "dic_hint_source": "ares",
        "is_active": True,
        "representatives": [
            {
                "first_name": "Do Not",
                "last_name": "Persist",
                "birth_date_hint": "1970-01-01",
            }
        ],
        "warnings": [],
        "raw_response": {"must": "not be stored"},
    }
    payload.update(overrides)
    return payload


def _build_submittable_company(email: str = "ares-submit@example.com") -> tuple[CustomUser, SellerOnboardingApplication]:
    user = CustomUser.objects.create_user(
        email=email,
        password="password",
        role=UserRole.SELLER,
        first_name="Company",
        last_name="Seller",
        phone_number="+420777070001",
    )
    app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
    app.seller_type = SellerType.COMPANY
    app.save(update_fields=["seller_type", "updated_at"])

    with audit_disabled():
        SellerCompanyInfo.objects.create(
            application=app,
            company_name="Entry Assist s.r.o.",
            legal_form="s.r.o. (Czech Republic / Slovakia)",
            country_of_registration="CZ",
            business_id="25596641",
            tin="CZ25596641",
            company_phone="+420777070002",
            certificate_issue_date=date(2025, 1, 1),
        )
        SellerCompanyRepresentative.objects.create(
            application=app,
            first_name="Jan",
            last_name="Novak",
            role="Managing Director",
            date_of_birth=date(1990, 1, 1),
            nationality="CZ",
        )
        SellerCompanyAddress.objects.create(
            application=app,
            street="Dlouhá 12",
            city="Praha",
            zip_code="11000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="Entry Assist s.r.o.",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="Dlouhá 12",
            city="Praha",
            zip_code="11000",
            country="CZ",
            contact_phone="+420777070003",
            same_as_primary_address=True,
        )
        SellerReturnAddress.objects.create(application=app, same_as_warehouse=True)
        for doc_type, scope in (
            ("registration_certificate", "company_info"),
            ("proof_of_address", "company_address"),
        ):
            SellerDocument.objects.create(
                application=app,
                doc_type=doc_type,
                scope=scope,
                side=None,
                file=_minimal_pdf(f"{doc_type}_{scope}.pdf"),
            )

    return user, app


class SellerAresSubmitVerificationTests(TestCase):
    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_submit_creates_ares_verification_and_remains_pending(self, mock_lookup):
        user, app = _build_submittable_company()
        mock_lookup.return_value = _ares_success()

        submit_application(app)

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.PENDING_VERIFICATION)
        self.assertIsNone(app.reviewed_at)
        self.assertIsNone(app.reviewed_by)

        verification = SellerAresVerification.objects.get(application=app)
        self.assertEqual(verification.ico_queried, "25596641")
        self.assertEqual(verification.normalized["company_name"], "Entry Assist s.r.o.")
        self.assertTrue(verification.is_active)
        self.assertTrue(verification.field_matches["all_checked_fields_match"])
        self.assertNotIn("raw_response", verification.normalized)
        self.assertNotIn("representatives", verification.normalized)

        events = list(OnboardingAuditLog.objects.filter(application=app).values_list("event_type", flat=True))
        self.assertIn(OnboardingEventType.ARES_VERIFIED, events)
        self.assertIn(OnboardingEventType.REVIEW_REQUESTED, events)
        self.assertEqual(
            OnboardingAuditLog.objects.get(application=app, event_type=OnboardingEventType.ARES_VERIFIED).actor_type,
            "system",
        )
        self.assertEqual(app.seller_profile.user_id, user.id)

    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_submit_updates_existing_ares_verification(self, mock_lookup):
        _user, app = _build_submittable_company("ares-submit-update@example.com")
        mock_lookup.return_value = _ares_success(company_name="Old Snapshot s.r.o.")
        submit_application(app)
        first_verification = SellerAresVerification.objects.get(application=app)

        app.status = OnboardingStatus.REJECTED
        app.save(update_fields=["status", "updated_at"])
        mock_lookup.return_value = _ares_success()
        submit_application(app)

        verification = SellerAresVerification.objects.get(application=app)
        self.assertEqual(verification.pk, first_verification.pk)
        self.assertEqual(verification.normalized["company_name"], "Entry Assist s.r.o.")

    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_ares_unavailable_does_not_block_submit(self, mock_lookup):
        _user, app = _build_submittable_company("ares-submit-unavailable@example.com")
        mock_lookup.side_effect = AresUnavailable("ARES down")

        submit_application(app)

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.PENDING_VERIFICATION)
        self.assertFalse(SellerAresVerification.objects.filter(application=app).exists())

    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_ares_not_found_does_not_block_submit(self, mock_lookup):
        _user, app = _build_submittable_company("ares-submit-notfound@example.com")
        mock_lookup.side_effect = AresNotFound("not found")

        submit_application(app)

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.PENDING_VERIFICATION)
        self.assertFalse(SellerAresVerification.objects.filter(application=app).exists())

    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_mismatch_saves_field_matches_and_logs_mismatch(self, mock_lookup):
        _user, app = _build_submittable_company("ares-submit-mismatch@example.com")
        mock_lookup.return_value = _ares_success(
            company_name="Different Company s.r.o.",
            is_active=False,
            warnings=["company_inactive"],
        )

        submit_application(app)

        verification = SellerAresVerification.objects.get(application=app)
        self.assertFalse(verification.is_active)
        self.assertFalse(verification.field_matches["company_name"]["match"])
        self.assertFalse(verification.field_matches["is_active"]["match"])
        self.assertIn("company_name_mismatch", verification.field_matches["warnings"])
        self.assertIn("company_inactive", verification.field_matches["warnings"])

        self.assertTrue(
            OnboardingAuditLog.objects.filter(
                application=app,
                event_type=OnboardingEventType.ARES_MISMATCH,
            ).exists()
        )

    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_partial_ares_address_is_not_treated_as_blocking_mismatch(self, mock_lookup):
        _user, app = _build_submittable_company("ares-submit-partial-address@example.com")
        mock_lookup.return_value = _ares_success(
            registered_address={
                "street": None,
                "city": "Praha",
                "zip_code": "11000",
                "country": "CZ",
            },
            warnings=["registered_address_partial"],
        )

        submit_application(app)

        verification = SellerAresVerification.objects.get(application=app)
        self.assertFalse(verification.field_matches["registered_address"]["checked"])
        self.assertEqual(
            verification.field_matches["registered_address"]["reason"],
            "ares_address_partial",
        )
        self.assertTrue(verification.field_matches["all_checked_fields_match"])

    @patch("sellers.services_onboarding.lookup_by_ico")
    def test_no_auto_approve_happens_even_when_ares_matches(self, mock_lookup):
        _user, app = _build_submittable_company("ares-submit-no-autoapprove@example.com")
        mock_lookup.return_value = _ares_success()

        submit_application(app)

        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.PENDING_VERIFICATION)
        self.assertFalse(hasattr(app, "auto_approved"))
