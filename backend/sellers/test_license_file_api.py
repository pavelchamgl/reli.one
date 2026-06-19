from __future__ import annotations

import base64
from decimal import Decimal

from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.license_validators import (
    LICENSE_EMPTY_FILE_MESSAGE,
    LICENSE_UNSUPPORTED_TYPE_MESSAGE,
)
from product.models import BaseProduct, Category, LicenseFile, ProductStatus
from sellers.models import SellerProfile


def _minimal_pdf() -> bytes:
    return (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj "
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
        b"3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj "
        b"trailer<</Size 4/Root 1 0 R>>\n%%EOF"
    )


def _minimal_png() -> bytes:
    return (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde"
        b"\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def _minimal_jpeg() -> bytes:
    return bytes.fromhex(
        "ffd8ffe000104a46494600010100000100010000ffdb004300080606"
        "0607050608060707090908080a0c140d0c0b0b0c1912130f141d1a"
        "1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f2739"
        "3d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232"
        "3232323232323232323232323232323232323232323232323232323232"
        "323232ffc00011080001000103011100021100031101ffc40114000100"
        "00000000000000000000000000000008ffc41100020000000000000000"
        "0000000000000000ffd9"
    )


def _minimal_docx() -> bytes:
    return b"PK\x03\x04" + b"\x00" * 64


def _minimal_webp() -> bytes:
    return base64.b64decode(
        "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/vuUAAA="
    )


def _to_data_uri(content: bytes, mime: str) -> str:
    encoded = base64.b64encode(content).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def _response_file_error(response) -> str:
    file_error = response.data.get("file")
    if isinstance(file_error, list):
        return file_error[0]
    return file_error or ""


class LicenseFileApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="License Test Category")
        cls.seller_user = CustomUser.objects.create_user(
            email="license-seller@example.com",
            password="pass12345",
            first_name="License",
            last_name="Seller",
            role=UserRole.SELLER,
            phone_number="+420730444101",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.other_user = CustomUser.objects.create_user(
            email="license-other@example.com",
            password="pass12345",
            first_name="Other",
            last_name="Seller",
            role=UserRole.SELLER,
            phone_number="+420730444102",
        )
        cls.other_profile = SellerProfile.objects.get(user=cls.other_user)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.seller_user)

    def _create_product(self, *, seller: SellerProfile | None = None) -> BaseProduct:
        return BaseProduct.objects.create(
            name="License Product",
            product_description="Product for license upload tests.",
            seller=seller or self.seller_profile,
            category=self.category,
            article=f"8200000{BaseProduct.objects.count():03d}",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )

    def _license_url(self, product_id: int, license_id: int | None = None) -> str:
        if license_id is None:
            return f"/api/sellers/products/{product_id}/license/"
        return f"/api/sellers/products/{product_id}/license/{license_id}/"

    def _post_license(self, product_id: int, *, content: bytes, mime: str, name: str):
        return self.client.post(
            self._license_url(product_id),
            {
                "name": name,
                "file": _to_data_uri(content, mime),
            },
            format="json",
        )

    def test_post_valid_pdf(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=_minimal_pdf(),
            mime="application/pdf",
            name="license.pdf",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(LicenseFile.objects.filter(product=product).exists())

    def test_post_valid_jpeg(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=_minimal_jpeg(),
            mime="image/jpeg",
            name="license.jpg",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_post_valid_png(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=_minimal_png(),
            mime="image/png",
            name="license.png",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_post_valid_webp(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=_minimal_webp(),
            mime="image/webp",
            name="license.webp",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_post_webp_mismatched_bytes_rejected(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=b"not-a-valid-webp",
            mime="image/webp",
            name="license.webp",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn(LICENSE_UNSUPPORTED_TYPE_MESSAGE, _response_file_error(response))

    def test_post_docx_rejected(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=_minimal_docx(),
            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            name="license.docx",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn(LICENSE_UNSUPPORTED_TYPE_MESSAGE, str(response.data))

    def test_post_unsupported_bytes_rejected(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=b"not-a-real-image",
            mime="image/png",
            name="license.png",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn(LICENSE_UNSUPPORTED_TYPE_MESSAGE, str(response.data))

    def test_post_oversized_file_rejected(self):
        product = self._create_product()
        oversized = _minimal_pdf() + (b"0" * (settings.MAX_UPLOAD_SIZE + 1))
        response = self._post_license(
            product.id,
            content=oversized,
            mime="application/pdf",
            name="license.pdf",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn("File size exceeds", _response_file_error(response))

    def test_post_empty_file_rejected(self):
        product = self._create_product()
        response = self._post_license(
            product.id,
            content=b"",
            mime="application/pdf",
            name="license.pdf",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(_response_file_error(response), LICENSE_EMPTY_FILE_MESSAGE)

    def test_post_duplicate_license_rejected(self):
        product = self._create_product()
        first = self._post_license(
            product.id,
            content=_minimal_pdf(),
            mime="application/pdf",
            name="license.pdf",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED, first.data)

        second = self._post_license(
            product.id,
            content=_minimal_png(),
            mime="image/png",
            name="license.png",
        )
        self.assertEqual(second.status_code, status.HTTP_403_FORBIDDEN, second.data)
        self.assertIn("already exists", str(second.data))

    def test_post_other_sellers_product_rejected(self):
        product = self._create_product(seller=self.other_profile)
        response = self._post_license(
            product.id,
            content=_minimal_pdf(),
            mime="application/pdf",
            name="license.pdf",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_post_invalid_base64_data_uri_rejected(self):
        product = self._create_product()
        response = self.client.post(
            self._license_url(product.id),
            {
                "name": "license.pdf",
                "file": "data:application/pdf;base64,%%%invalid%%%",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn("Base64 decode error", str(response.data))

    def test_delete_existing_license(self):
        product = self._create_product()
        created = self._post_license(
            product.id,
            content=_minimal_pdf(),
            mime="application/pdf",
            name="license.pdf",
        )
        license_id = created.data["id"]
        response = self.client.delete(self._license_url(product.id, license_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(LicenseFile.objects.filter(pk=license_id).exists())
