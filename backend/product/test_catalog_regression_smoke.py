from __future__ import annotations

import io
import shutil
import tempfile
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.compat import get_product_cover_image
from product.models import (
    BaseProduct,
    BaseProductImage,
    Brand,
    Category,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
    ProductAttributeValue,
    ProductDocument,
    ProductExternalIdentifier,
    ProductMedia,
    ProductParameter,
    ProductStatus,
    ProductVariant,
)
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem
from warehouses.services.reservation import StockReservationService


def _png_upload(name: str, color: tuple[int, int, int]) -> SimpleUploadedFile:
    image = Image.new("RGB", (4, 4), color)
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    return SimpleUploadedFile(name, stream.getvalue(), content_type="image/png")


def _file_upload(name: str) -> SimpleUploadedFile:
    return SimpleUploadedFile(name, b"catalog-regression-smoke", content_type="application/octet-stream")


class CatalogRegressionSmokeTestCase(TestCase):
    def setUp(self):
        self._media_root = tempfile.mkdtemp()
        self._override = override_settings(MEDIA_ROOT=self._media_root)
        self._override.enable()

    def tearDown(self):
        self._override.disable()
        shutil.rmtree(self._media_root, ignore_errors=True)

    def test_catalog_seller_foundation_backend_smoke(self):
        seller_user = CustomUser.objects.create_user(
            email="catalog-smoke-seller@example.com",
            password="pass12345",
            first_name="Catalog",
            last_name="Smoke",
            role=UserRole.SELLER,
            phone_number="+420730555001",
        )
        seller_profile = SellerProfile.objects.get(user=seller_user)
        default_warehouse = Warehouse.objects.create(
            name="Catalog Smoke Default WH",
            street="Smoke 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        seller_profile.default_warehouse = default_warehouse
        seller_profile.save(update_fields=["default_warehouse"])

        root = Category.objects.create(name="Smoke Root")
        child = Category.objects.create(name="Smoke Child", parent=root)
        leaf = Category.objects.create(name="Smoke Leaf", parent=child)
        weight_definition = CategoryAttributeDefinition.objects.create(
            category=root,
            code="weight",
            name="Weight",
            data_type=CategoryAttributeDefinition.DataType.NUMBER,
            unit="kg",
            is_filterable=True,
            sort_order=5,
        )
        parent_material_definition = CategoryAttributeDefinition.objects.create(
            category=root,
            code="material",
            name="Parent material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_required=True,
            sort_order=10,
        )
        material_definition = CategoryAttributeDefinition.objects.create(
            category=leaf,
            code="material",
            name="Leaf material",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
            is_required=True,
            sort_order=10,
        )
        cotton_option = CategoryAttributeOption.objects.create(
            attribute_definition=material_definition,
            value="cotton",
            label="Cotton",
        )

        brand = Brand.objects.create(
            name="Smoke Brand",
            slug="smoke-brand",
            status=ProductStatus.APPROVED,
            created_by=seller_user,
        )
        product = BaseProduct.objects.create(
            name="Catalog Smoke Product",
            product_description="Smoke product for catalog regression.",
            additional_details="Legacy-compatible details.",
            seller=seller_profile,
            category=leaf,
            brand=brand,
            barcode="5901234123457",
            article="7000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        variant = ProductVariant.objects.create(
            product=product,
            name="Size",
            text="M",
            price=Decimal("25.00"),
            weight_grams=500,
            length_mm=200,
            width_mm=150,
            height_mm=100,
        )
        legacy_image = BaseProductImage.objects.create(
            product=product,
            image=_png_upload("legacy-cover.png", (10, 20, 30)),
        )
        ProductParameter.objects.create(
            product=product,
            name="LegacySmokeKey",
            value="LegacySmokeValue",
        )
        ProductExternalIdentifier.objects.create(
            product=product,
            identifier_type=ProductExternalIdentifier.IdentifierType.GTIN,
            value="5901234123457",
            is_primary=True,
        )
        ProductMedia.objects.create(
            product=product,
            file=_file_upload("media.bin"),
            media_type=ProductMedia.MediaType.IMAGE,
            status=ProductStatus.APPROVED,
            is_main=True,
        )
        ProductDocument.objects.create(
            product=product,
            file=_file_upload("manual.pdf"),
            name="Manual",
            document_type=ProductDocument.DocumentType.INSTRUCTION,
            status=ProductStatus.APPROVED,
        )

        seller_client = APIClient()
        seller_client.force_authenticate(seller_user)

        schema_response = seller_client.get(
            reverse("seller-category-attribute-schema", kwargs={"category_id": leaf.id}),
            format="json",
        )
        self.assertEqual(schema_response.status_code, status.HTTP_200_OK)
        attributes = schema_response.data["attributes"]
        self.assertEqual([item["code"] for item in attributes], ["weight", "material"])
        self.assertTrue(attributes[0]["is_inherited"])
        self.assertFalse(attributes[1]["is_inherited"])
        self.assertEqual(attributes[1]["inherited_from_id"], parent_material_definition.id)
        self.assertEqual(attributes[1]["options"][0]["value"], "cotton")

        stock_response = seller_client.put(
            f"/api/sellers/products/{product.id}/variants/{variant.id}/stock/",
            {"quantity_in_stock": 11},
            format="json",
        )
        self.assertEqual(stock_response.status_code, status.HTTP_200_OK)
        self.assertEqual(stock_response.data["quantity_in_stock"], 11)
        self.assertEqual(stock_response.data["reserved_quantity"], 0)

        attributes_response = seller_client.put(
            reverse("seller-product-attributes", kwargs={"product_id": product.id}),
            [
                {"attribute_definition": weight_definition.id, "value_number": "0.5"},
                {"attribute_definition": material_definition.id, "value_option": cotton_option.id},
            ],
            format="json",
        )
        self.assertEqual(attributes_response.status_code, status.HTTP_200_OK)
        self.assertEqual(ProductAttributeValue.objects.filter(product=product).count(), 2)
        self.assertEqual(
            ProductAttributeValue.objects.get(attribute_definition=material_definition).value_option,
            cotton_option,
        )

        self.assertEqual(get_product_cover_image(product), legacy_image)

        public_client = APIClient()
        category_response = public_client.get(
            reverse("category-products", kwargs={"category_id": leaf.id}),
            format="json",
        )
        self.assertEqual(category_response.status_code, status.HTTP_200_OK)
        row = next(item for item in category_response.data["results"] if item["id"] == product.id)
        self.assertEqual(row["total_available_quantity"], 11)
        self.assertTrue(row["is_available"])
        self.assertNotIn("reserved_quantity", row)
        self.assertIn("product_parameters", row)

        detail_response = public_client.get(reverse("product-detail", kwargs={"id": product.id}), format="json")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["id"], product.id)
        self.assertIn("images", detail_response.data)
        self.assertIn("product_parameters", detail_response.data)
        self.assertIn("variants", detail_response.data)
        self.assertNotIn("reserved_quantity", detail_response.data["variants"][0])
        self.assertEqual(detail_response.data["variants"][0]["available_quantity"], 11)

        search_response = public_client.get(reverse("search"), {"q": "LegacySmokeValue"}, format="json")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        found_ids = {item["id"] for item in search_response.data["results"]["products"]}
        self.assertIn(product.id, found_ids)

        StockReservationService.create_reservation(
            session_key="catalog-regression-smoke",
            payment_system="stripe",
            groups=[{"products": [{"sku": variant.sku, "quantity": 3}]}],
            variant_map={variant.sku: variant},
        )
        warehouse_item = WarehouseItem.objects.get(warehouse=default_warehouse, product_variant=variant)
        self.assertEqual(warehouse_item.quantity_in_stock, 11)
        self.assertEqual(warehouse_item.reserved_quantity, 3)

        category_after_reservation = public_client.get(
            reverse("category-products", kwargs={"category_id": leaf.id}),
            format="json",
        )
        row_after_reservation = next(
            item for item in category_after_reservation.data["results"] if item["id"] == product.id
        )
        self.assertEqual(row_after_reservation["total_available_quantity"], 8)
        self.assertNotIn("reserved_quantity", row_after_reservation)
