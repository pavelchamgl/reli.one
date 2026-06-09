from __future__ import annotations

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.test import TestCase

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.constants import ACQUIRING_RATE
from product.models import (
    BaseProduct,
    Brand,
    Category,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
    ProductAttributeValue,
    ProductParameter,
    ProductStatus,
    ProductVariant,
)
from sellers.models import SellerProfile
from warehouses.models import Warehouse, WarehouseItem


class PublicFiltersFacetsSearchTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.client = APIClient()
        cls.seller_user = CustomUser.objects.create_user(
            email="public-filters-seller@example.com",
            password="pass12345",
            first_name="Public",
            last_name="Filters",
            role=UserRole.SELLER,
            phone_number="+420730555777",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.warehouse = Warehouse.objects.create(
            name="Public Filters WH",
            street="Facet 1",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_profile.default_warehouse = cls.warehouse
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.root = Category.objects.create(name="Public Filters Root")
        cls.leaf = Category.objects.create(name="Public Filters Leaf", parent=cls.root)

        cls.width_definition = CategoryAttributeDefinition.objects.create(
            category=cls.root,
            code="width_cm",
            name="Width",
            data_type=CategoryAttributeDefinition.DataType.NUMBER,
            unit="cm",
            is_filterable=True,
            is_public=True,
            sort_order=10,
        )
        cls.material_definition = CategoryAttributeDefinition.objects.create(
            category=cls.leaf,
            code="door_material",
            name="Door material",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
            is_filterable=True,
            is_public=True,
            sort_order=20,
        )
        cls.steel_option = CategoryAttributeOption.objects.create(
            attribute_definition=cls.material_definition,
            value="steel",
            label="Steel",
        )
        cls.wood_option = CategoryAttributeOption.objects.create(
            attribute_definition=cls.material_definition,
            value="wood",
            label="Wood",
        )
        cls.recyclable_definition = CategoryAttributeDefinition.objects.create(
            category=cls.leaf,
            code="recyclable",
            name="Recyclable",
            data_type=CategoryAttributeDefinition.DataType.BOOLEAN,
            is_filterable=True,
            is_public=True,
            sort_order=30,
        )
        cls.finish_definition = CategoryAttributeDefinition.objects.create(
            category=cls.leaf,
            code="finish_note",
            name="Finish note",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_filterable=True,
            is_public=True,
            sort_order=40,
        )
        CategoryAttributeDefinition.objects.create(
            category=cls.leaf,
            code="private_note",
            name="Private note",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_filterable=True,
            is_public=False,
            sort_order=50,
        )
        CategoryAttributeDefinition.objects.create(
            category=cls.leaf,
            code="internal_code",
            name="Internal code",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_filterable=False,
            is_public=True,
            sort_order=60,
        )

        cls.approved_brand = Brand.objects.create(
            name="Approved Facet Brand",
            slug="approved-facet-brand",
            status=ProductStatus.APPROVED,
        )
        cls.pending_brand = Brand.objects.create(
            name="Pending Facet Brand",
            slug="pending-facet-brand",
            status=ProductStatus.PENDING,
        )

        cls.product_steel = cls._create_product(
            name="Steel Facet Door",
            article="9100000001",
            brand=cls.approved_brand,
            price="100.00",
            rating="4.5",
            stock=10,
            reserved=2,
        )
        cls._set_attributes(
            cls.product_steel,
            material=cls.steel_option,
            width="80.0",
            recyclable=True,
            finish="typed velvet finish",
        )
        ProductParameter.objects.create(
            product=cls.product_steel,
            name="LegacyPublicFilterKey",
            value="LegacyPublicFilterValue",
        )

        cls.product_wood = cls._create_product(
            name="Wood Facet Door",
            article="9100000002",
            brand=cls.pending_brand,
            price="200.00",
            rating="3.0",
            stock=0,
            reserved=0,
        )
        cls._set_attributes(
            cls.product_wood,
            material=cls.wood_option,
            width="100.0",
            recyclable=False,
            finish="matte finish",
        )

        cls.product_without_typed_attrs = cls._create_product(
            name="Old Product Without Typed Attrs",
            article="9100000003",
            brand=None,
            price="50.00",
            rating="5.0",
            stock=None,
            reserved=0,
        )

        cls.pending_product = cls._create_product(
            name="Pending Hidden Product",
            article="9100000004",
            brand=cls.approved_brand,
            price="120.00",
            rating="4.9",
            stock=20,
            reserved=0,
            product_status=ProductStatus.PENDING,
        )
        cls._set_attributes(
            cls.pending_product,
            material=cls.steel_option,
            width="75.0",
            recyclable=True,
            finish="hidden finish",
        )

    @classmethod
    def _create_product(
        cls,
        *,
        name,
        article,
        brand,
        price,
        rating,
        stock,
        reserved,
        product_status=ProductStatus.APPROVED,
    ):
        product = BaseProduct.objects.create(
            name=name,
            product_description=f"{name} description.",
            seller=cls.seller_profile,
            category=cls.leaf,
            brand=brand,
            article=article,
            vat_rate=Decimal("21.00"),
            status=product_status,
            is_active=True,
            rating=Decimal(rating),
        )
        variant = ProductVariant.objects.create(
            product=product,
            name="Default",
            text="one",
            price=Decimal(price),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        if stock is not None:
            WarehouseItem.objects.create(
                warehouse=cls.warehouse,
                product_variant=variant,
                quantity_in_stock=stock,
                reserved_quantity=reserved,
            )
        return product

    @classmethod
    def _set_attributes(cls, product, *, material, width, recyclable, finish):
        ProductAttributeValue.objects.create(
            product=product,
            attribute_definition=cls.material_definition,
            value_option=material,
        )
        ProductAttributeValue.objects.create(
            product=product,
            attribute_definition=cls.width_definition,
            value_number=Decimal(width),
        )
        ProductAttributeValue.objects.create(
            product=product,
            attribute_definition=cls.recyclable_definition,
            value_boolean=recyclable,
        )
        ProductAttributeValue.objects.create(
            product=product,
            attribute_definition=cls.finish_definition,
            value_text=finish,
        )

    def _category_url(self):
        return reverse("category-products", kwargs={"category_id": self.leaf.id})

    def _facets_url(self):
        return reverse("category-facets", kwargs={"category_id": self.leaf.id})

    def _category_ids(self, params=None):
        response = self.client.get(self._category_url(), params or {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return {item["id"] for item in response.data["results"]}, response

    def test_facets_return_public_filterable_effective_schema_and_values(self):
        response = self.client.get(self._facets_url(), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["category"]["id"], self.leaf.id)
        self.assertEqual(Decimal(response.data["price"]["min"]), Decimal("50.00") * ACQUIRING_RATE)
        self.assertEqual(Decimal(response.data["price"]["max"]), Decimal("200.00") * ACQUIRING_RATE)

        brand_names = {item["name"] for item in response.data["brands"]}
        self.assertIn(self.approved_brand.name, brand_names)
        self.assertNotIn(self.pending_brand.name, brand_names)

        attributes_by_code = {item["code"]: item for item in response.data["attributes"]}
        self.assertIn("width_cm", attributes_by_code)
        self.assertTrue(attributes_by_code["width_cm"]["is_inherited"])
        self.assertEqual(Decimal(attributes_by_code["width_cm"]["min"]), Decimal("80"))
        self.assertEqual(Decimal(attributes_by_code["width_cm"]["max"]), Decimal("100"))
        self.assertIn("door_material", attributes_by_code)
        self.assertEqual(
            {item["value"] for item in attributes_by_code["door_material"]["options"]},
            {"steel", "wood"},
        )
        self.assertIn("recyclable", attributes_by_code)
        self.assertNotIn("private_note", attributes_by_code)
        self.assertNotIn("internal_code", attributes_by_code)

    def test_category_listing_filters_by_brand_price_stock_rating_and_attributes(self):
        ids, response = self._category_ids()
        self.assertIn(self.product_steel.id, ids)
        self.assertIn(self.product_wood.id, ids)
        self.assertIn(self.product_without_typed_attrs.id, ids)
        self.assertNotIn(self.pending_product.id, ids)
        for row in response.data["results"]:
            self.assertNotIn("reserved_quantity", row)

        ids, _ = self._category_ids({"brand_id": self.approved_brand.id})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"brand": self.approved_brand.slug})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"brand_id": self.pending_brand.id})
        self.assertEqual(ids, set())

        ids, _ = self._category_ids({"brand_id": "abc"})
        self.assertEqual(ids, set())

        ids, _ = self._category_ids({"min_price": "90", "max_price": "150"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"min_rating": "4.8"})
        self.assertEqual(ids, {self.product_without_typed_attrs.id})

        ids, _ = self._category_ids({"in_stock": "true"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"stock_status": "out_of_stock"})
        self.assertEqual(ids, {self.product_wood.id, self.product_without_typed_attrs.id})

        ids, _ = self._category_ids({"attr[door_material]": "steel"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"attr[door_material]": str(self.wood_option.id)})
        self.assertEqual(ids, {self.product_wood.id})

        ids, _ = self._category_ids({"attr[door_material]": "Steel"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"attr[recyclable]": "true"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"attr[recyclable]": "false"})
        self.assertEqual(ids, {self.product_wood.id})

        ids, _ = self._category_ids({"attr[width_cm]": "80"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"attr[width_cm_min]": "70", "attr[width_cm_max]": "90"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids({"attr[finish_note]": "typed velvet finish"})
        self.assertEqual(ids, {self.product_steel.id})

        ids, _ = self._category_ids(
            {
                "brand_id": self.approved_brand.id,
                "in_stock": "true",
                "attr[door_material]": "steel",
                "attr[width_cm_min]": "70",
                "attr[width_cm_max]": "90",
            }
        )
        self.assertEqual(ids, {self.product_steel.id})

    def test_search_keeps_legacy_parameter_fallback_and_adds_public_typed_values(self):
        legacy_response = self.client.get(reverse("search"), {"q": "LegacyPublicFilterValue"}, format="json")
        self.assertEqual(legacy_response.status_code, status.HTTP_200_OK)
        legacy_ids = {item["id"] for item in legacy_response.data["results"]["products"]}
        self.assertIn(self.product_steel.id, legacy_ids)

        typed_response = self.client.get(reverse("search"), {"q": "velvet"}, format="json")
        self.assertEqual(typed_response.status_code, status.HTTP_200_OK)
        typed_ids = {item["id"] for item in typed_response.data["results"]["products"]}
        self.assertIn(self.product_steel.id, typed_ids)
        self.assertNotIn(self.pending_product.id, typed_ids)
