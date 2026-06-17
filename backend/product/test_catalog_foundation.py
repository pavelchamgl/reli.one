from __future__ import annotations

import importlib
import io
import shutil
import tempfile
from decimal import Decimal

from django.apps import apps as django_apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from PIL import Image

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.compat import get_product_cover_image
from product.models import (
    BaseProduct,
    BaseProductImage,
    Brand,
    ProductDocument,
    ProductExternalIdentifier,
    ProductMedia,
    ProductStatus,
)
from sellers.models import SellerProfile


def _png_upload(name: str, color: tuple[int, int, int]) -> SimpleUploadedFile:
    image = Image.new("RGB", (4, 4), color)
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    return SimpleUploadedFile(name, stream.getvalue(), content_type="image/png")


def _file_upload(name: str = "asset.bin") -> SimpleUploadedFile:
    return SimpleUploadedFile(name, b"catalog-foundation", content_type="application/octet-stream")


class CatalogFoundationTestCase(TestCase):
    def setUp(self):
        self._media_root = tempfile.mkdtemp()
        self._override = override_settings(MEDIA_ROOT=self._media_root)
        self._override.enable()

        self.seller_user = CustomUser.objects.create_user(
            email="catalog-foundation-seller@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Foundation",
            role=UserRole.SELLER,
            phone_number="+420730111333",
        )
        self.seller_profile = SellerProfile.objects.get(user=self.seller_user)
        self.product = BaseProduct.objects.create(
            name="Foundation Product",
            product_description="Foundation product.",
            seller=self.seller_profile,
            barcode="1234567890123",
            article="4000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )

    def tearDown(self):
        self._override.disable()
        shutil.rmtree(self._media_root, ignore_errors=True)

    def test_brand_can_be_attached_without_requiring_public_contract_changes(self):
        brand = Brand.objects.create(name="Foundation Brand", slug="foundation-brand", status=ProductStatus.APPROVED)

        self.product.brand = brand
        self.product.save(update_fields=["brand"])

        self.assertEqual(BaseProduct.objects.get(pk=self.product.pk).brand, brand)

    def test_only_one_main_media_is_allowed_per_product(self):
        ProductMedia.objects.create(
            product=self.product,
            file=_file_upload("main-one.bin"),
            is_main=True,
            status=ProductStatus.APPROVED,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductMedia.objects.create(
                    product=self.product,
                    file=_file_upload("main-two.bin"),
                    is_main=True,
                    status=ProductStatus.APPROVED,
                )

    def test_external_identifier_type_value_is_unique_case_insensitive(self):
        ProductExternalIdentifier.objects.create(
            product=self.product,
            identifier_type=ProductExternalIdentifier.IdentifierType.GTIN,
            value="ABC123",
            is_primary=True,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductExternalIdentifier.objects.create(
                    product=self.product,
                    identifier_type=ProductExternalIdentifier.IdentifierType.GTIN,
                    value="abc123",
                )

    def test_only_one_primary_identifier_per_product_and_type(self):
        ProductExternalIdentifier.objects.create(
            product=self.product,
            identifier_type=ProductExternalIdentifier.IdentifierType.MPN,
            value="MPN-1",
            is_primary=True,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductExternalIdentifier.objects.create(
                    product=self.product,
                    identifier_type=ProductExternalIdentifier.IdentifierType.MPN,
                    value="MPN-2",
                    is_primary=True,
                )

    def test_product_document_defaults_to_pending_foundation_resource(self):
        document = ProductDocument.objects.create(
            product=self.product,
            file=_file_upload("manual.pdf"),
            name="Manual",
            document_type=ProductDocument.DocumentType.INSTRUCTION,
            file_size=1024,
            content_type="application/pdf",
        )

        self.assertEqual(document.status, ProductStatus.PENDING)
        self.assertEqual(document.sort_order, 0)

    def test_legacy_image_migration_marks_min_id_as_main_and_preserves_id_order(self):
        first_image = BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload("first.png", (255, 0, 0)),
        )
        second_image = BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload("second.png", (0, 255, 0)),
        )
        migration = importlib.import_module("product.migrations.0005_migrate_legacy_images_to_product_media")

        migration.migrate_legacy_images_to_product_media(django_apps, None)

        migrated_media = list(ProductMedia.objects.filter(product=self.product).order_by("sort_order", "id"))
        self.assertEqual([media.legacy_image_id for media in migrated_media], [first_image.id, second_image.id])
        self.assertEqual([media.sort_order for media in migrated_media], [0, 1])
        self.assertTrue(migrated_media[0].is_main)
        self.assertFalse(migrated_media[1].is_main)
        self.assertEqual(ProductMedia.objects.get(is_main=True).legacy_image_id, min(first_image.id, second_image.id))

        migration.reverse_legacy_images_to_product_media(django_apps, None)

        self.assertFalse(ProductMedia.objects.filter(legacy_image__isnull=False).exists())
        self.assertEqual(BaseProductImage.objects.filter(product=self.product).count(), 2)

    def test_legacy_image_migration_preserves_existing_manual_main_media(self):
        first_image = BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload("first.png", (255, 0, 0)),
        )
        second_image = BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload("second.png", (0, 255, 0)),
        )
        manual_main = ProductMedia.objects.create(
            product=self.product,
            file=_file_upload("manual-main.bin"),
            is_main=True,
            status=ProductStatus.APPROVED,
        )
        migration = importlib.import_module("product.migrations.0005_migrate_legacy_images_to_product_media")

        migration.migrate_legacy_images_to_product_media(django_apps, None)

        legacy_media = list(ProductMedia.objects.filter(legacy_image__isnull=False).order_by("sort_order", "id"))
        self.assertEqual([media.legacy_image_id for media in legacy_media], [first_image.id, second_image.id])
        self.assertEqual([media.sort_order for media in legacy_media], [0, 1])
        self.assertFalse(any(media.is_main for media in legacy_media))
        manual_main.refresh_from_db()
        self.assertTrue(manual_main.is_main)
        self.assertIsNone(manual_main.legacy_image_id)

        migration.reverse_legacy_images_to_product_media(django_apps, None)

        self.assertFalse(ProductMedia.objects.filter(legacy_image__isnull=False).exists())
        self.assertTrue(ProductMedia.objects.filter(pk=manual_main.pk, is_main=True).exists())
        self.assertEqual(BaseProductImage.objects.filter(product=self.product).count(), 2)

    def test_legacy_cover_helper_still_uses_oldest_base_product_image(self):
        first_image = BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload("first.png", (255, 0, 0)),
        )
        second_image = BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload("second.png", (0, 255, 0)),
        )
        ProductMedia.objects.create(
            product=self.product,
            file=second_image.image.name,
            legacy_image=second_image,
            is_main=True,
            status=ProductStatus.APPROVED,
        )

        self.assertEqual(get_product_cover_image(self.product), first_image)
