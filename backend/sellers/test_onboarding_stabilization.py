"""
Регрессия onboarding API: форма ответов state/review, замена документа, warehouse/return PUT.

Детальная бизнес-логика модерации — см. sellers.tests (submit/approve/reject на сервисах).
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
    SellerDocument,
    SellerOnboardingApplication,
    SellerType,
)
from sellers.services_onboarding import build_seller_onboarding_state_response


class BuildSellerOnboardingStateResponseTests(TestCase):
    """Сервисный ответ state совпадает по ключам с ожиданиями фронта."""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="state-shape@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="A",
            last_name="B",
            phone_number="+420777010020",
        )
        self.app = SellerOnboardingApplication.objects.get(seller_profile=self.user.seller_profile)

    def test_response_contains_document_and_flag_blocks(self):
        data = build_seller_onboarding_state_response(self.app)

        self.assertIn("completeness", data)
        self.assertIn("is_submittable", data["completeness"])
        for key in (
            "is_editable",
            "can_submit",
            "requires_onboarding",
            "next_step",
            "documents_summary",
            "documents_missing",
        ):
            self.assertIn(key, data, msg=f"missing {key}")
        self.assertIn("requirements", data["documents_summary"])
        self.assertIn("counts", data["documents_summary"])


class OnboardingStateAndReviewHTTPTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="http-onb@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="X",
            last_name="Y",
            phone_number="+420777010021",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_state_200_and_core_keys(self):
        r = self.client.get(reverse("seller-onboarding-state"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("status", r.data)
        self.assertIn("completeness", r.data)
        self.assertIn("documents_summary", r.data)

    def test_get_review_200_and_core_keys(self):
        r = self.client.get(reverse("seller-onboarding-review"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("application", r.data)
        self.assertIn("is_submittable", r.data)
        self.assertIn("completeness", r.data)


class CompanyDocumentReplaceTests(TestCase):
    """Повторная загрузка с тем же (doc_type, scope, side) обновляет ту же запись."""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="doc-replace@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Co",
            last_name="Mpany",
            phone_number="+420777010022",
        )
        self.app = SellerOnboardingApplication.objects.get(seller_profile=self.user.seller_profile)
        self.app.seller_type = SellerType.COMPANY
        self.app.save(update_fields=["seller_type"])

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse("seller-onboarding-documents")

    def test_second_post_reuses_primary_key(self):
        pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
            b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
            b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj "
            b"trailer<</Size 4/Root 1 0 R>>\n%%EOF"
        )
        f1 = SimpleUploadedFile("first.pdf", pdf, content_type="application/pdf")
        r1 = self.client.post(
            self.url,
            {"doc_type": "registration_certificate", "scope": "company_info", "file": f1},
            format="multipart",
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED, r1.data)
        doc_id = r1.data["id"]

        f2 = SimpleUploadedFile("second.pdf", pdf + b"\n", content_type="application/pdf")
        r2 = self.client.post(
            self.url,
            {"doc_type": "registration_certificate", "scope": "company_info", "file": f2},
            format="multipart",
        )
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)
        self.assertEqual(r2.data["id"], doc_id)
        self.assertEqual(SellerDocument.objects.filter(application=self.app).count(), 1)


class WarehouseAndReturnAddressHTTPTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="wh-ret@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="W",
            last_name="H",
            phone_number="+420777010023",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_put_warehouse_then_return_same_as_warehouse(self):
        wh_url = reverse("seller-onboarding-warehouse")
        payload = {
            "street": "Industrial 1",
            "city": "Praha",
            "zip_code": "10000",
            "country": "CZ",
            "contact_phone": "+420601000000",
        }
        r = self.client.put(wh_url, payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        self.assertEqual(r.data["city"], "Praha")

        ret_url = reverse("seller-onboarding-return")
        r2 = self.client.put(ret_url, {"same_as_warehouse": True}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_200_OK, r2.data)
        self.assertTrue(r2.data.get("same_as_warehouse"))
