from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.models import (
    OnboardingStatus,
    SellerBankAccount,
    SellerCompanyInfo,
    SellerOnboardingApplication,
    SellerType,
)
from sellers.services_onboarding import (
    approve_application,
    get_expected_company_account_holder,
    reject_application,
    submit_application,
    validate_before_submit,
)


class CompanyAccountHolderValidationTests(TestCase):
    def test_expected_holder_uses_company_name_and_clean_legal_form(self):
        expected_holder = get_expected_company_account_holder(
            "Reli",
            "s.r.o. (Czech Republic / Slovakia)",
        )

        self.assertEqual(expected_holder, "Reli s.r.o.")

    def test_company_holder_accepts_cleaned_legal_form(self):
        app = self._create_company_application("Reli s.r.o.")

        try:
            validate_before_submit(app)
        except ValidationError as exc:
            self.assertNotIn("account_holder", exc.detail)

    def test_company_holder_rejects_company_name_without_legal_form(self):
        app = self._create_company_application("Reli")

        with self.assertRaises(ValidationError) as ctx:
            validate_before_submit(app)

        self.assertEqual(
            str(ctx.exception.detail["account_holder"]),
            "For company, account holder must match company name and legal form.",
        )

    def _create_company_application(self, account_holder):
        user = CustomUser.objects.create_user(
            email="seller@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Pavel",
            last_name="Ivanov",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.COMPANY
        app.save(update_fields=["seller_type"])
        SellerCompanyInfo.objects.create(
            application=app,
            company_name="Reli",
            legal_form="s.r.o. (Czech Republic / Slovakia)",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder=account_holder,
        )
        return app


class SelfEmployedPersonalEndpointTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="self-employed@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Jan",
            last_name="Kowalski",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse("seller-onboarding-se-personal")

    def test_get_returns_account_name_fields_when_personal_block_is_empty(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Jan")
        self.assertEqual(response.data["last_name"], "Kowalski")

    def test_put_returns_account_name_fields_with_saved_personal_details(self):
        response = self.client.put(
            self.url,
            {
                "date_of_birth": "1990-05-12",
                "nationality": "PL",
                "personal_phone": "+48123123123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Jan")
        self.assertEqual(response.data["last_name"], "Kowalski")
        self.assertEqual(response.data["nationality"], "PL")


# ---------------------------------------------------------------------------
# Onboarding state transitions: submit / approve / reject
# ---------------------------------------------------------------------------


class _OnboardingTransitionMixin:
    """Shared setup for state-transition tests."""

    def _make_seller(self, email, phone):
        return CustomUser.objects.create_user(
            email=email,
            password="password",
            role=UserRole.SELLER,
            first_name="Jan",
            last_name="Prodavac",
            phone_number=phone,
        )

    def _make_manager(self, email, phone):
        return CustomUser.objects.create_user(
            email=email,
            password="password",
            role=UserRole.MANAGER,
            first_name="Anna",
            last_name="Managerova",
            phone_number=phone,
            is_staff=True,
        )

    def _get_application(self, user):
        return SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)

    def _force_status(self, app, new_status):
        app.status = new_status
        app.save(update_fields=["status"])


class OnboardingSubmitTests(_OnboardingTransitionMixin, TestCase):
    """submit_application() state transitions and guard checks."""

    def setUp(self):
        self.seller = self._make_seller(
            "submit-seller@example.com", "+420777002001"
        )
        self.app = self._get_application(self.seller)

    @patch("sellers.services_onboarding.log_onboarding_event")
    @patch("sellers.services_onboarding.validate_before_submit")
    def test_submit_draft_transitions_to_pending_verification(self, mock_validate, mock_log):
        self.assertEqual(self.app.status, OnboardingStatus.DRAFT)

        submit_application(self.app)

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.PENDING_VERIFICATION)

    @patch("sellers.services_onboarding.log_onboarding_event")
    @patch("sellers.services_onboarding.validate_before_submit")
    def test_submit_rejected_transitions_to_pending_verification(self, mock_validate, mock_log):
        self._force_status(self.app, OnboardingStatus.REJECTED)

        submit_application(self.app)

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.PENDING_VERIFICATION)

    @patch("sellers.services_onboarding.log_onboarding_event")
    @patch("sellers.services_onboarding.validate_before_submit")
    def test_submit_sets_submitted_at(self, mock_validate, mock_log):
        self.assertIsNone(self.app.submitted_at)

        submit_application(self.app)

        self.app.refresh_from_db()
        self.assertIsNotNone(self.app.submitted_at)

    def test_submit_already_pending_raises_validation_error(self):
        self._force_status(self.app, OnboardingStatus.PENDING_VERIFICATION)

        with self.assertRaises(ValidationError) as ctx:
            submit_application(self.app)

        self.assertIn("detail", ctx.exception.detail)

    def test_submit_already_approved_raises_validation_error(self):
        self._force_status(self.app, OnboardingStatus.APPROVED)

        with self.assertRaises(ValidationError):
            submit_application(self.app)

    @patch("sellers.services_onboarding.log_onboarding_event")
    @patch("sellers.services_onboarding.validate_before_submit")
    def test_submit_clears_rejected_reason(self, mock_validate, mock_log):
        self.app.rejected_reason = "Old rejection reason"
        self.app.save(update_fields=["rejected_reason"])
        self._force_status(self.app, OnboardingStatus.REJECTED)

        submit_application(self.app)

        self.app.refresh_from_db()
        self.assertIsNone(self.app.rejected_reason)


class OnboardingApproveTests(_OnboardingTransitionMixin, TestCase):
    """approve_application() state transitions and permission guard."""

    def setUp(self):
        self.seller = self._make_seller(
            "approve-seller@example.com", "+420777002002"
        )
        self.app = self._get_application(self.seller)
        self._force_status(self.app, OnboardingStatus.PENDING_VERIFICATION)

        self.manager = self._make_manager(
            "approve-manager@example.com", "+420777002003"
        )

    @patch("sellers.services_onboarding.log_onboarding_event")
    @patch("sellers.services_onboarding.sync_legal_info_from_application")
    def test_approve_by_manager_transitions_to_approved(self, mock_sync, mock_log):
        approve_application(self.app, reviewer=self.manager)

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.APPROVED)

    @patch("sellers.services_onboarding.log_onboarding_event")
    @patch("sellers.services_onboarding.sync_legal_info_from_application")
    def test_approve_sets_reviewed_by_and_reviewed_at(self, mock_sync, mock_log):
        approve_application(self.app, reviewer=self.manager)

        self.app.refresh_from_db()
        self.assertEqual(self.app.reviewed_by, self.manager)
        self.assertIsNotNone(self.app.reviewed_at)

    def test_approve_by_seller_raises_validation_error(self):
        with self.assertRaises(ValidationError) as ctx:
            approve_application(self.app, reviewer=self.seller)

        self.assertIn("detail", ctx.exception.detail)

    def test_approve_by_customer_raises_validation_error(self):
        customer = CustomUser.objects.create_user(
            email="approve-customer@example.com",
            password="password",
            role=UserRole.CUSTOMER,
            phone_number="+420777002004",
            first_name="X",
            last_name="Y",
        )
        with self.assertRaises(ValidationError):
            approve_application(self.app, reviewer=customer)


class OnboardingRejectTests(_OnboardingTransitionMixin, TestCase):
    """reject_application() state transitions and guard checks."""

    def setUp(self):
        self.seller = self._make_seller(
            "reject-seller@example.com", "+420777002010"
        )
        self.app = self._get_application(self.seller)
        self._force_status(self.app, OnboardingStatus.PENDING_VERIFICATION)

        self.manager = self._make_manager(
            "reject-manager@example.com", "+420777002011"
        )

    @patch("sellers.services_onboarding.send_mail")
    @patch("sellers.services_onboarding.log_onboarding_event")
    def test_reject_by_manager_transitions_to_rejected(self, mock_log, mock_mail):
        reject_application(self.app, reviewer=self.manager, reason="Documents missing.")

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.REJECTED)

    @patch("sellers.services_onboarding.send_mail")
    @patch("sellers.services_onboarding.log_onboarding_event")
    def test_reject_stores_reason(self, mock_log, mock_mail):
        reject_application(self.app, reviewer=self.manager, reason="Incomplete IBAN.")

        self.app.refresh_from_db()
        self.assertEqual(self.app.rejected_reason, "Incomplete IBAN.")

    @patch("sellers.services_onboarding.send_mail")
    @patch("sellers.services_onboarding.log_onboarding_event")
    def test_reject_sets_reviewed_by_and_reviewed_at(self, mock_log, mock_mail):
        reject_application(self.app, reviewer=self.manager, reason="reason")

        self.app.refresh_from_db()
        self.assertEqual(self.app.reviewed_by, self.manager)
        self.assertIsNotNone(self.app.reviewed_at)

    def test_reject_without_reason_raises_validation_error(self):
        with self.assertRaises(ValidationError) as ctx:
            reject_application(self.app, reviewer=self.manager, reason="")

        self.assertIn("rejected_reason", ctx.exception.detail)

    def test_reject_by_seller_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            reject_application(self.app, reviewer=self.seller, reason="reason")

    def test_reject_by_customer_raises_validation_error(self):
        customer = CustomUser.objects.create_user(
            email="reject-customer@example.com",
            password="password",
            role=UserRole.CUSTOMER,
            phone_number="+420777002012",
            first_name="X",
            last_name="Y",
        )
        with self.assertRaises(ValidationError):
            reject_application(self.app, reviewer=customer, reason="reason")
