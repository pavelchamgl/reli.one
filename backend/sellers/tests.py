from django.test import TestCase
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.models import (
    SellerBankAccount,
    SellerCompanyInfo,
    SellerOnboardingApplication,
    SellerType,
)
from sellers.services_onboarding import (
    get_expected_company_account_holder,
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
