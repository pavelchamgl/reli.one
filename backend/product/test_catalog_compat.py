from __future__ import annotations

import io
import shutil
import tempfile
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory
from PIL import Image

from accounts.choices import UserRole
from accounts.models import CustomUser
from order.serializers import BaseProductSerializer as OrderBaseProductSerializer
from product.compat import (
    cm_to_mm,
    get_gmc_product_identifiers,
    get_product_cover_image,
    grams_to_kg,
    kg_to_grams,
    mm_to_cm,
)
from product.models import BaseProduct, BaseProductImage, ProductStatus, ProductVariant
from product.serializers import BaseProductListSerializer
from sellers.models import SellerProfile
from sellers.serializers import ProductListSerializer as SellerProductListSerializer


def _png_upload(name: str, color: tuple[int, int, int]) -> SimpleUploadedFile:
    image = Image.new("RGB", (4, 4), color)
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    return SimpleUploadedFile(name, stream.getvalue(), content_type="image/png")


class CatalogCompatibilityTestCase(TestCase):
    def setUp(self):
        self._media_root = tempfile.mkdtemp()
        self._override = override_settings(
            MEDIA_ROOT=self._media_root,
            PUBLIC_DOMAIN="https://example.test",
            GMC_FEED_RELATIVE_PATH="feeds/google.xml",
        )
        self._override.enable()

        self.seller_user = CustomUser.objects.create_user(
            email="catalog-compat-seller@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Compat",
            role=UserRole.SELLER,
            phone_number="+420730111222",
        )
        self.seller_profile = SellerProfile.objects.get(user=self.seller_user)
        self.product = BaseProduct.objects.create(
            name="Compat Product",
            product_description="Compatibility product.",
            seller=self.seller_profile,
            barcode="1234567890123",
            article="3000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )

    def tearDown(self):
        self._override.disable()
        shutil.rmtree(self._media_root, ignore_errors=True)

    def _add_image(self, name: str, color: tuple[int, int, int]) -> BaseProductImage:
        return BaseProductImage.objects.create(
            product=self.product,
            image=_png_upload(name, color),
        )

    def _add_variant(self, *, text: str, price: str = "10.00") -> ProductVariant:
        return ProductVariant.objects.create(
            product=self.product,
            name="Size",
            text=text,
            price=Decimal(price),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )

    def test_cover_image_is_shared_by_public_seller_order_and_gmc_helpers(self):
        first_image = self._add_image("first.png", (255, 0, 0))
        self._add_image("second.png", (0, 255, 0))
        self.product.final_min_price = Decimal("10.00")
        self.product.min_price = Decimal("10.00")
        self.product.ordered_quantity = 0
        self.product.total_available_quantity = 0

        request = APIRequestFactory().get("/")
        request.user = AnonymousUser()
        public_data = BaseProductListSerializer(self.product, context={"request": request}).data
        seller_data = SellerProductListSerializer(self.product, context={"request": request}).data
        order_data = OrderBaseProductSerializer(self.product).data

        self.assertEqual(get_product_cover_image(self.product).id, first_image.id)
        self.assertEqual(public_data["image"], request.build_absolute_uri(first_image.image.url))
        self.assertEqual(seller_data["image"], request.build_absolute_uri(first_image.image.url))
        self.assertEqual(order_data["image"], first_image.image.url)

    def test_cover_image_uses_oldest_prefetched_image(self):
        first_image = self._add_image("first.png", (255, 0, 0))
        self._add_image("second.png", (0, 255, 0))

        product = BaseProduct.objects.prefetch_related("images").get(pk=self.product.pk)

        self.assertEqual(get_product_cover_image(product).id, first_image.id)

    def test_gmc_identifiers_preserve_legacy_fallbacks(self):
        with override_settings(GMC_STATIC_BRANDS={self.seller_profile.id: "CompatBrand"}):
            identifiers = get_gmc_product_identifiers(self.product)

        self.assertEqual(identifiers.gtin, "1234567890123")
        self.assertEqual(identifiers.mpn, "3000000001")
        self.assertEqual(identifiers.brand, "CompatBrand")
        self.assertTrue(identifiers.identifier_exists)

    def test_gmc_feed_keeps_one_item_per_variant_and_item_group_id(self):
        self._add_image("cover.png", (0, 0, 255))
        variant_a = self._add_variant(text="A", price="10.00")
        variant_b = self._add_variant(text="B", price="12.00")

        with override_settings(
            GMC_ONLY_SELLER_IDS=[self.seller_profile.id],
            GMC_STATIC_BRANDS={self.seller_profile.id: "CompatBrand"},
        ):
            call_command("generate_gmc_feed", limit=1)

        feed_path = f"{self._media_root}/feeds/google.xml"
        with open(feed_path, encoding="utf-8") as feed_file:
            xml = feed_file.read()

        self.assertEqual(xml.count("<item>"), 2)
        self.assertIn(f"<g:id>{variant_a.sku}</g:id>", xml)
        self.assertIn(f"<g:id>{variant_b.sku}</g:id>", xml)
        self.assertEqual(xml.count(f"<g:item_group_id>{self.product.id}</g:item_group_id>"), 2)
        self.assertEqual(xml.count("<g:brand>CompatBrand</g:brand>"), 2)
        self.assertEqual(xml.count("<g:gtin>1234567890123</g:gtin>"), 2)
        self.assertEqual(xml.count("<g:mpn>3000000001</g:mpn>"), 2)
        self.assertEqual(xml.count("<g:availability>in stock</g:availability>"), 2)

    def test_dimension_conversion_helpers_are_loss_safe_for_ui_units(self):
        self.assertEqual(cm_to_mm("12.3"), 123)
        self.assertEqual(mm_to_cm(123), Decimal("12.3"))
        self.assertEqual(kg_to_grams("1.250"), 1250)
        self.assertEqual(grams_to_kg(1250), Decimal("1.250"))
