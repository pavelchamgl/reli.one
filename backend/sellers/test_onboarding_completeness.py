"""
Целевые регрессии для compute_completeness / compute_next_step /
compute_documents_summary_and_missing (Task 008).

Страна в ISO-полях не задаёт отдельных веток в этих функциях — см. ComputeCompletenessCountryInvariantTests.
"""
from __future__ import annotations

from datetime import date

from django.core.files.base import ContentFile
from django.test import TestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.models import (
    SellerBankAccount,
    SellerCompanyAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
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
    compute_completeness,
    compute_documents_summary_and_missing,
    compute_next_step,
)


def _minimal_pdf_file(name: str = "doc.pdf") -> ContentFile:
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
        b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj "
        b"trailer<</Size 4/Root 1 0 R>>\n%%EOF"
    )
    return ContentFile(pdf, name=name)


class ComputeCompletenessEmptyApplicationTests(TestCase):
    def test_no_seller_type_all_blocks_false_next_step_seller_type(self):
        user = CustomUser.objects.create_user(
            email="comp-empty-type@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="A",
            last_name="B",
            phone_number="+420777020001",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = None
        app.save(update_fields=["seller_type"])

        c = compute_completeness(app)
        self.assertFalse(c.seller_type_selected)
        self.assertFalse(any([
            c.personal_complete,
            c.tax_complete,
            c.address_complete,
            c.bank_complete,
            c.warehouse_complete,
            c.return_complete,
            c.documents_complete,
        ]))
        self.assertFalse(c.is_submittable)
        self.assertEqual(compute_next_step(app, c), "seller_type")

    def test_self_employed_selected_but_blocks_missing_next_step_personal(self):
        user = CustomUser.objects.create_user(
            email="comp-se-empty-blocks@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="A",
            last_name="B",
            phone_number="+420777020002",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])

        c = compute_completeness(app)
        self.assertTrue(c.seller_type_selected)
        self.assertFalse(c.personal_complete)
        self.assertFalse(c.is_submittable)
        self.assertEqual(compute_next_step(app, c), "personal")


class ComputeCompletenessSelfEmployedTests(TestCase):
    def _app(self, email: str) -> SellerOnboardingApplication:
        user = CustomUser.objects.create_user(
            email=email,
            password="password",
            role=UserRole.SELLER,
            first_name="Jan",
            last_name="Novak",
            phone_number="+420777020010",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])
        return app

    def test_partial_only_personal_complete_next_tax(self):
        app = self._app("comp-se-partial@example.com")
        SellerSelfEmployedPersonalDetails.objects.create(
            application=app,
            date_of_birth=date(1990, 1, 15),
            nationality="CZ",
        )

        c = compute_completeness(app)
        self.assertTrue(c.personal_complete)
        self.assertFalse(c.tax_complete)
        self.assertFalse(c.is_submittable)
        self.assertEqual(compute_next_step(app, c), "tax")

        _, missing = compute_documents_summary_and_missing(app)
        self.assertTrue(len(missing) > 0)

    def test_complete_all_blocks_and_documents_submittable_missing_docs_empty(self):
        app = self._app("comp-se-full@example.com")

        SellerSelfEmployedPersonalDetails.objects.create(
            application=app,
            date_of_birth=date(1990, 1, 15),
            nationality="CZ",
        )
        SellerSelfEmployedTaxInfo.objects.create(
            application=app,
            tax_country="CZ",
            tin="TIN123",
        )
        SellerSelfEmployedAddress.objects.create(
            application=app,
            street="Main 1",
            city="Praha",
            zip_code="12000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="Jan Novak",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="Wh 2",
            city="Brno",
            zip_code="60200",
            country="CZ",
            contact_phone="+420601000001",
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
                file=_minimal_pdf_file(f"{spec[0]}_{spec[1]}.pdf"),
            )

        c = compute_completeness(app)
        self.assertTrue(c.is_submittable)
        self.assertEqual(compute_next_step(app, c), "review")

        _, missing = compute_documents_summary_and_missing(app)
        self.assertEqual(missing, [])


class ComputeCompletenessCompanyTests(TestCase):
    def _app(self, email: str) -> SellerOnboardingApplication:
        user = CustomUser.objects.create_user(
            email=email,
            password="password",
            role=UserRole.SELLER,
            first_name="X",
            last_name="Y",
            phone_number="+420777020020",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.COMPANY
        app.save(update_fields=["seller_type"])
        return app

    def test_partial_only_company_info_incomplete_blocks(self):
        app = self._app("comp-co-partial@example.com")
        SellerCompanyInfo.objects.create(
            application=app,
            company_name="Acme",
            legal_form=None,
            country_of_registration=None,
            tin=None,
            company_phone=None,
        )

        c = compute_completeness(app)
        self.assertFalse(c.personal_complete)
        self.assertFalse(c.tax_complete)
        self.assertFalse(c.bank_complete)
        self.assertFalse(c.is_submittable)

        _, missing = compute_documents_summary_and_missing(app)
        scopes = {m["scope"] for m in missing}
        self.assertIn("company_info", scopes)

    def test_complete_company_submittable(self):
        app = self._app("comp-co-full@example.com")

        SellerCompanyInfo.objects.create(
            application=app,
            company_name="Acme",
            legal_form="s.r.o.",
            country_of_registration="CZ",
            tin="CZ12345678",
            company_phone="+420222333444",
        )
        SellerCompanyRepresentative.objects.create(
            application=app,
            first_name="Pat",
            last_name="Rep",
            role="CEO",
            date_of_birth=date(1985, 6, 1),
            nationality="SK",
        )
        SellerCompanyAddress.objects.create(
            application=app,
            street="Corp 5",
            city="Praha",
            zip_code="11000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="Acme s.r.o.",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="Ind 9",
            city="Brno",
            zip_code="60200",
            country="CZ",
            contact_phone="+420602000002",
        )
        SellerReturnAddress.objects.create(application=app, same_as_warehouse=True)

        for spec in (
            ("registration_certificate", "company_info", None),
            ("proof_of_address", "company_address", None),
            ("proof_of_address", "warehouse_address", None),
        ):
            SellerDocument.objects.create(
                application=app,
                doc_type=spec[0],
                scope=spec[1],
                side=spec[2],
                file=_minimal_pdf_file(f"{spec[0]}_{spec[1]}.pdf"),
            )

        c = compute_completeness(app)
        self.assertTrue(c.is_submittable)
        _, missing = compute_documents_summary_and_missing(app)
        self.assertEqual(missing, [])


class ComputeCompletenessDocumentsTests(TestCase):
    """Правила сторон — только как в compute_completeness (ключи doc_type/scope/side)."""

    def _base_self_employed_app(self, email: str) -> SellerOnboardingApplication:
        user = CustomUser.objects.create_user(
            email=email,
            password="password",
            role=UserRole.SELLER,
            first_name="Doc",
            last_name="Tester",
            phone_number="+420777020030",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])

        SellerSelfEmployedPersonalDetails.objects.create(
            application=app,
            date_of_birth=date(1991, 2, 2),
            nationality="CZ",
        )
        SellerSelfEmployedTaxInfo.objects.create(
            application=app,
            tax_country="CZ",
            tin="TIN999",
        )
        SellerSelfEmployedAddress.objects.create(
            application=app,
            street="S1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="Doc Tester",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="W1",
            city="Brno",
            zip_code="60200",
            country="CZ",
            contact_phone="+420603000003",
        )
        SellerReturnAddress.objects.create(application=app, same_as_warehouse=True)
        return app

    def test_identity_only_back_side_incomplete_until_front_added(self):
        app = self._base_self_employed_app("comp-doc-backonly@example.com")
        SellerDocument.objects.create(
            application=app,
            doc_type="identity_document",
            scope="self_employed_personal",
            side="back",
            file=_minimal_pdf_file("id_back.pdf"),
        )
        SellerDocument.objects.create(
            application=app,
            doc_type="proof_of_address",
            scope="self_employed_address",
            side=None,
            file=_minimal_pdf_file("p_se.pdf"),
        )
        SellerDocument.objects.create(
            application=app,
            doc_type="proof_of_address",
            scope="warehouse_address",
            side=None,
            file=_minimal_pdf_file("p_wh.pdf"),
        )

        c = compute_completeness(app)
        self.assertFalse(c.documents_complete)
        self.assertFalse(c.is_submittable)

        SellerDocument.objects.create(
            application=app,
            doc_type="identity_document",
            scope="self_employed_personal",
            side="front",
            file=_minimal_pdf_file("id_front.pdf"),
        )

        c2 = compute_completeness(app)
        self.assertTrue(c2.documents_complete)
        self.assertTrue(c2.is_submittable)


class ComputeCompletenessReturnAddressTests(TestCase):
    def test_same_as_warehouse_true_no_custom_return_fields_required(self):
        user = CustomUser.objects.create_user(
            email="comp-ret-same@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="R",
            last_name="T",
            phone_number="+420777020040",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])

        SellerSelfEmployedPersonalDetails.objects.create(
            application=app,
            date_of_birth=date(1988, 3, 3),
            nationality="CZ",
        )
        SellerSelfEmployedTaxInfo.objects.create(
            application=app,
            tax_country="CZ",
            tin="TINRET",
        )
        SellerSelfEmployedAddress.objects.create(
            application=app,
            street="A1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="R T",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="W9",
            city="Brno",
            zip_code="60200",
            country="CZ",
            contact_phone="+420604000004",
        )
        SellerReturnAddress.objects.create(
            application=app,
            same_as_warehouse=True,
            street=None,
            city=None,
            zip_code=None,
            country=None,
            contact_phone=None,
        )

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
                file=_minimal_pdf_file(f"{spec[1]}.pdf"),
            )

        c = compute_completeness(app)
        self.assertTrue(c.return_complete)
        self.assertTrue(c.is_submittable)

    def test_distinct_return_requires_proof_for_return_scope(self):
        user = CustomUser.objects.create_user(
            email="comp-ret-distinct@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="U",
            last_name="V",
            phone_number="+420777020041",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        app.seller_type = SellerType.SELF_EMPLOYED
        app.save(update_fields=["seller_type"])

        SellerSelfEmployedPersonalDetails.objects.create(
            application=app,
            date_of_birth=date(1988, 3, 3),
            nationality="CZ",
        )
        SellerSelfEmployedTaxInfo.objects.create(
            application=app,
            tax_country="CZ",
            tin="TINRET2",
        )
        SellerSelfEmployedAddress.objects.create(
            application=app,
            street="A1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        SellerBankAccount.objects.create(
            application=app,
            iban="CZ94550000000005003011074",
            swift_bic="RZBCCZPP",
            account_holder="U V",
        )
        SellerWarehouseAddress.objects.create(
            application=app,
            street="W9",
            city="Brno",
            zip_code="60200",
            country="CZ",
            contact_phone="+420604000005",
        )
        SellerReturnAddress.objects.create(
            application=app,
            same_as_warehouse=False,
            street="Ret 1",
            city="Olomouc",
            zip_code="77900",
            country="CZ",
            contact_phone="+420605000005",
        )

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
                file=_minimal_pdf_file(f"d_{spec[1]}.pdf"),
            )

        c = compute_completeness(app)
        self.assertTrue(c.return_complete)
        self.assertFalse(c.documents_complete)

        SellerDocument.objects.create(
            application=app,
            doc_type="proof_of_address",
            scope="return_address",
            side=None,
            file=_minimal_pdf_file("p_ret.pdf"),
        )
        c2 = compute_completeness(app)
        self.assertTrue(c2.documents_complete)


class ComputeCompletenessCountryInvariantTests(TestCase):
    """
    compute_completeness не содержит ветвления по стране: достаточно ISO-2 строк в полях.
    """

    def test_tax_country_cz_vs_at_same_completeness_flags_when_other_fields_equal(self):
        def build_app(email: str, tax_country: str, phone: str) -> SellerOnboardingApplication:
            user = CustomUser.objects.create_user(
                email=email,
                password="password",
                role=UserRole.SELLER,
                first_name="Eu",
                last_name="Seller",
                phone_number=phone,
            )
            app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
            app.seller_type = SellerType.SELF_EMPLOYED
            app.save(update_fields=["seller_type"])

            SellerSelfEmployedPersonalDetails.objects.create(
                application=app,
                date_of_birth=date(1992, 4, 4),
                nationality="DE",
            )
            SellerSelfEmployedTaxInfo.objects.create(
                application=app,
                tax_country=tax_country,
                tin="TINEU",
            )
            SellerSelfEmployedAddress.objects.create(
                application=app,
                street="Via 1",
                city="Wien",
                zip_code="1010",
                country="AT",
            )
            SellerBankAccount.objects.create(
                application=app,
                iban="CZ94550000000005003011074",
                swift_bic="RZBCCZPP",
                account_holder="Eu Seller",
            )
            SellerWarehouseAddress.objects.create(
                application=app,
                street="Lager",
                city="Wien",
                zip_code="1020",
                country="AT",
                contact_phone="+43676000000",
            )
            SellerReturnAddress.objects.create(application=app, same_as_warehouse=True)
            return app

        app_cz = build_app("comp-country-cz@example.com", "CZ", "+420777020051")
        app_at = build_app("comp-country-at@example.com", "AT", "+420777020052")

        cz = compute_completeness(app_cz)
        at = compute_completeness(app_at)

        self.assertEqual(
            (
                cz.seller_type_selected,
                cz.personal_complete,
                cz.tax_complete,
                cz.address_complete,
                cz.bank_complete,
                cz.warehouse_complete,
                cz.return_complete,
            ),
            (
                at.seller_type_selected,
                at.personal_complete,
                at.tax_complete,
                at.address_complete,
                at.bank_complete,
                at.warehouse_complete,
                at.return_complete,
            ),
        )
        self.assertEqual(cz.documents_complete, at.documents_complete)
