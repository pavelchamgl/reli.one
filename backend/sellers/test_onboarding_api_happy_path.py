"""
Полные REST happy-path цепочки seller onboarding (Task 008, шаг 5).

Публичные эндпоинты; без мока serializers/views и без внешних сервисов.
"""
from __future__ import annotations

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from sellers.models import (
    OnboardingStatus,
    SellerOnboardingApplication,
)


def _minimal_pdf(name: str = "doc.pdf") -> SimpleUploadedFile:
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
        b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj "
        b"trailer<</Size 4/Root 1 0 R>>\n%%EOF"
    )
    return SimpleUploadedFile(name, pdf, content_type="application/pdf")


class SelfEmployedOnboardingAPIHappyPathTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="api-se-happy@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Jan",
            last_name="Novak",
            phone_number="+420777040001",
        )
        self.app = SellerOnboardingApplication.objects.get(seller_profile=self.user.seller_profile)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_full_rest_chain_submits_pending_verification(self):
        c = self.client
        r0 = c.post(reverse("seller-onboarding-set-type"), {"seller_type": "self_employed"}, format="json")
        self.assertEqual(r0.status_code, status.HTTP_200_OK, r0.data)

        r1 = c.put(
            reverse("seller-onboarding-se-personal"),
            {"date_of_birth": "1990-01-15", "nationality": "CZ", "personal_phone": "+420601000001"},
            format="json",
        )
        self.assertEqual(r1.status_code, status.HTTP_200_OK, r1.data)

        r2 = c.put(
            reverse("seller-onboarding-se-tax"),
            {"tax_country": "CZ", "tin": "TIN123456"},
            format="json",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK, r2.data)

        r3 = c.put(
            reverse("seller-onboarding-se-address"),
            {
                "street": "Main 1",
                "city": "Praha",
                "zip_code": "12000",
                "country": "CZ",
            },
            format="json",
        )
        self.assertEqual(r3.status_code, status.HTTP_200_OK, r3.data)

        r4 = c.put(
            reverse("seller-onboarding-bank"),
            {
                "iban": "CZ94550000000005003011074",
                "swift_bic": "RZBCCZPP",
                "account_holder": "Jan Novak",
            },
            format="json",
        )
        self.assertEqual(r4.status_code, status.HTTP_200_OK, r4.data)

        r5 = c.put(
            reverse("seller-onboarding-warehouse"),
            {
                "street": "Wh 2",
                "city": "Brno",
                "zip_code": "60200",
                "country": "CZ",
                "contact_phone": "+420602000002",
            },
            format="json",
        )
        self.assertEqual(r5.status_code, status.HTTP_200_OK, r5.data)

        r6 = c.put(reverse("seller-onboarding-return"), {"same_as_warehouse": True}, format="json")
        self.assertEqual(r6.status_code, status.HTTP_200_OK, r6.data)

        doc_url = reverse("seller-onboarding-documents")
        uploads = (
            {"doc_type": "identity_document", "scope": "self_employed_personal", "file": _minimal_pdf("id.pdf")},
            {"doc_type": "proof_of_address", "scope": "self_employed_address", "file": _minimal_pdf("p_se.pdf")},
            {"doc_type": "proof_of_address", "scope": "warehouse_address", "file": _minimal_pdf("p_wh.pdf")},
        )
        for payload in uploads:
            rd = c.post(doc_url, payload, format="multipart")
            self.assertEqual(rd.status_code, status.HTTP_201_CREATED, rd.data)

        st = c.get(reverse("seller-onboarding-state"))
        self.assertEqual(st.status_code, status.HTTP_200_OK)
        self.assertTrue(st.data["completeness"]["is_submittable"])
        self.assertTrue(st.data["can_submit"])
        self.assertEqual(st.data["next_step"], "review")

        rv = c.get(reverse("seller-onboarding-review"))
        self.assertEqual(rv.status_code, status.HTTP_200_OK)
        self.assertTrue(rv.data["is_submittable"])
        self.assertTrue(rv.data["completeness"]["documents_complete"])

        sub = c.post(reverse("seller-onboarding-submit"))
        self.assertEqual(sub.status_code, status.HTTP_200_OK, sub.data)
        self.assertEqual(sub.data["status"], "pending_verification")
        self.assertIsNotNone(sub.data.get("submitted_at"))

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.PENDING_VERIFICATION)


class SelfEmployedEUCountryPayloadTests(TestCase):
    """
    compute_completeness не имеет country branching (см. test_onboarding_completeness).

    Здесь только проверка, что API принимает ISO-3166-1 alpha-2 в типовых полях payload
    при полной цепочке (иная страна ЕС — DE).
    """

    def test_full_chain_with_de_country_fields(self):
        user = CustomUser.objects.create_user(
            email="api-se-de@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Max",
            last_name="Mustermann",
            phone_number="+49301234567",
        )
        app = SellerOnboardingApplication.objects.get(seller_profile=user.seller_profile)
        c = APIClient()
        c.force_authenticate(user=user)

        self.assertEqual(
            c.post(reverse("seller-onboarding-set-type"), {"seller_type": "self_employed"}, format="json").status_code,
            status.HTTP_200_OK,
        )
        c.put(
            reverse("seller-onboarding-se-personal"),
            {"date_of_birth": "1991-06-01", "nationality": "DE"},
            format="json",
        )
        c.put(reverse("seller-onboarding-se-tax"), {"tax_country": "DE", "tin": "DE123456789"}, format="json")
        c.put(
            reverse("seller-onboarding-se-address"),
            {"street": "Musterstr 1", "city": "Berlin", "zip_code": "10115", "country": "DE"},
            format="json",
        )
        c.put(
            reverse("seller-onboarding-bank"),
            {
                "iban": "DE89370400440532013000",
                "swift_bic": "COBADEFF",
                "account_holder": "Max Mustermann",
            },
            format="json",
        )
        c.put(
            reverse("seller-onboarding-warehouse"),
            {
                "street": "Lager 2",
                "city": "München",
                "zip_code": "80331",
                "country": "DE",
                "contact_phone": "+49891234567",
            },
            format="json",
        )
        c.put(reverse("seller-onboarding-return"), {"same_as_warehouse": True}, format="json")

        doc_url = reverse("seller-onboarding-documents")
        for meta, fname in (
            ({"doc_type": "identity_document", "scope": "self_employed_personal"}, "id_de.pdf"),
            ({"doc_type": "proof_of_address", "scope": "self_employed_address"}, "addr_de.pdf"),
            ({"doc_type": "proof_of_address", "scope": "warehouse_address"}, "wh_de.pdf"),
        ):
            r = c.post(doc_url, {**meta, "file": _minimal_pdf(fname)}, format="multipart")
            self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)

        sub = c.post(reverse("seller-onboarding-submit"))
        self.assertEqual(sub.status_code, status.HTTP_200_OK, sub.data)
        app.refresh_from_db()
        self.assertEqual(app.status, OnboardingStatus.PENDING_VERIFICATION)


class CompanyOnboardingAPIHappyPathTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="api-co-happy@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Pat",
            last_name="Rep",
            phone_number="+420777040002",
        )
        self.app = SellerOnboardingApplication.objects.get(seller_profile=self.user.seller_profile)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_full_rest_chain_submits_pending_verification(self):
        c = self.client
        self.assertEqual(
            c.post(reverse("seller-onboarding-set-type"), {"seller_type": "company"}, format="json").status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            c.put(
                reverse("seller-onboarding-company-info"),
                {
                    "company_name": "Acme",
                    "legal_form": "s.r.o.",
                    "country_of_registration": "CZ",
                    "tin": "CZ12345678",
                    "company_phone": "+420222333444",
                    "imports_to_eu": False,
                },
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            c.put(
                reverse("seller-onboarding-company-rep"),
                {
                    "first_name": "Pat",
                    "last_name": "Rep",
                    "role": "CEO",
                    "date_of_birth": "1985-06-01",
                    "nationality": "CZ",
                },
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            c.put(
                reverse("seller-onboarding-company-address"),
                {
                    "street": "Corp 5",
                    "city": "Praha",
                    "zip_code": "11000",
                    "country": "CZ",
                },
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            c.put(
                reverse("seller-onboarding-bank"),
                {
                    "iban": "CZ94550000000005003011074",
                    "swift_bic": "RZBCCZPP",
                    "account_holder": "Acme s.r.o.",
                },
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            c.put(
                reverse("seller-onboarding-warehouse"),
                {
                    "street": "Ind 9",
                    "city": "Brno",
                    "zip_code": "60200",
                    "country": "CZ",
                    "contact_phone": "+420602000002",
                },
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            c.put(reverse("seller-onboarding-return"), {"same_as_warehouse": True}, format="json").status_code,
            status.HTTP_200_OK,
        )

        doc_url = reverse("seller-onboarding-documents")
        for meta, fname in (
            ({"doc_type": "registration_certificate", "scope": "company_info"}, "reg.pdf"),
            ({"doc_type": "proof_of_address", "scope": "company_address"}, "p_co.pdf"),
            ({"doc_type": "proof_of_address", "scope": "warehouse_address"}, "p_wh.pdf"),
        ):
            r = c.post(doc_url, {**meta, "file": _minimal_pdf(fname)}, format="multipart")
            self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)

        st = c.get(reverse("seller-onboarding-state"))
        self.assertEqual(st.status_code, status.HTTP_200_OK)
        self.assertTrue(st.data["completeness"]["is_submittable"])
        self.assertTrue(st.data["can_submit"])
        self.assertEqual(st.data["next_step"], "review")

        rv = c.get(reverse("seller-onboarding-review"))
        self.assertEqual(rv.status_code, status.HTTP_200_OK)
        self.assertTrue(rv.data["is_submittable"])

        sub = c.post(reverse("seller-onboarding-submit"))
        self.assertEqual(sub.status_code, status.HTTP_200_OK, sub.data)
        self.assertEqual(sub.data["status"], "pending_verification")

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.PENDING_VERIFICATION)


class OnboardingAPINegativeTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="api-neg@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="X",
            last_name="Y",
            phone_number="+420777040003",
        )
        self.app = SellerOnboardingApplication.objects.get(seller_profile=self.user.seller_profile)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_submit_incomplete_returns_400_and_keeps_draft(self):
        r = self.client.post(reverse("seller-onboarding-set-type"), {"seller_type": "self_employed"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)

        sub = self.client.post(reverse("seller-onboarding-submit"))
        self.assertEqual(sub.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("completeness", sub.data)

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.DRAFT)

    def test_put_after_submit_returns_400(self):
        c = self.client
        c.post(reverse("seller-onboarding-set-type"), {"seller_type": "self_employed"}, format="json")
        c.put(
            reverse("seller-onboarding-se-personal"),
            {"date_of_birth": "1990-01-15", "nationality": "CZ"},
            format="json",
        )
        c.put(reverse("seller-onboarding-se-tax"), {"tax_country": "CZ", "tin": "TIN9"}, format="json")
        c.put(
            reverse("seller-onboarding-se-address"),
            {"street": "S", "city": "Praha", "zip_code": "10000", "country": "CZ"},
            format="json",
        )
        c.put(
            reverse("seller-onboarding-bank"),
            {
                "iban": "CZ94550000000005003011074",
                "swift_bic": "RZBCCZPP",
                "account_holder": "X Y",
            },
            format="json",
        )
        c.put(
            reverse("seller-onboarding-warehouse"),
            {
                "street": "W",
                "city": "Brno",
                "zip_code": "60200",
                "country": "CZ",
                "contact_phone": "+420700000000",
            },
            format="json",
        )
        c.put(reverse("seller-onboarding-return"), {"same_as_warehouse": True}, format="json")
        doc_url = reverse("seller-onboarding-documents")
        for meta, fname in (
            ({"doc_type": "identity_document", "scope": "self_employed_personal"}, "i.pdf"),
            ({"doc_type": "proof_of_address", "scope": "self_employed_address"}, "a.pdf"),
            ({"doc_type": "proof_of_address", "scope": "warehouse_address"}, "w.pdf"),
        ):
            self.assertEqual(
                c.post(doc_url, {**meta, "file": _minimal_pdf(fname)}, format="multipart").status_code,
                status.HTTP_201_CREATED,
            )

        self.assertEqual(c.post(reverse("seller-onboarding-submit")).status_code, status.HTTP_200_OK)
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingStatus.PENDING_VERIFICATION)

        r_edit = c.put(
            reverse("seller-onboarding-se-tax"),
            {"tax_country": "CZ", "tin": "OTHER"},
            format="json",
        )
        self.assertEqual(r_edit.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r_edit.data.get("detail"), "Only draft/rejected applications can be edited.")
