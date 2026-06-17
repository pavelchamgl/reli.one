from __future__ import annotations

from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import (
    BaseProduct,
    Category,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
    ProductAttributeValue,
    ProductStatus,
)
from sellers.models import SellerProfile


class SellerCategoryAttributeApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-category-attrs@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Attrs",
            role=UserRole.SELLER,
            phone_number="+420730333444",
        )
        cls.other_seller_user = CustomUser.objects.create_user(
            email="seller-category-attrs-other@example.com",
            password="pass12345",
            first_name="Other",
            last_name="Seller",
            role=UserRole.SELLER,
            phone_number="+420730333445",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.other_seller_profile = SellerProfile.objects.get(user=cls.other_seller_user)

        cls.parent = Category.objects.create(name="Seller Attr Parent")
        cls.leaf = Category.objects.create(name="Seller Attr Leaf", parent=cls.parent)
        cls.parent_definition = CategoryAttributeDefinition.objects.create(
            category=cls.parent,
            code="material",
            name="Material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_required=True,
            sort_order=10,
        )
        cls.enum_definition = CategoryAttributeDefinition.objects.create(
            category=cls.leaf,
            code="color",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
            is_filterable=True,
            sort_order=20,
        )
        cls.red_option = CategoryAttributeOption.objects.create(
            attribute_definition=cls.enum_definition,
            value="red",
            label="Red",
        )
        cls.product = BaseProduct.objects.create(
            name="Seller Typed Product",
            product_description="Typed product.",
            seller=cls.seller_profile,
            category=cls.leaf,
            article="6000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        cls.other_product = BaseProduct.objects.create(
            name="Other Seller Typed Product",
            product_description="Other typed product.",
            seller=cls.other_seller_profile,
            category=cls.leaf,
            article="6000000002",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.seller_user)

    def test_category_schema_endpoint_returns_effective_schema_for_seller_forms(self):
        url = reverse("seller-category-attribute-schema", kwargs={"category_id": self.leaf.id})

        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["category_id"], self.leaf.id)
        self.assertTrue(response.data["category_allows_products"])
        codes = [row["code"] for row in response.data["attributes"]]
        self.assertEqual(codes, ["material", "color"])
        material = response.data["attributes"][0]
        color = response.data["attributes"][1]
        self.assertTrue(material["is_inherited"])
        self.assertTrue(material["is_required"])
        self.assertFalse(color["is_inherited"])
        self.assertEqual(color["options"][0]["value"], "red")

    def test_product_attributes_put_validates_required_and_type_then_replaces_values(self):
        url = reverse("seller-product-attributes", kwargs={"product_id": self.product.id})

        missing_required = self.client.put(
            url,
            [{"attribute_definition": self.enum_definition.id, "value_option": self.red_option.id}],
            format="json",
        )
        self.assertEqual(missing_required.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.put(
            url,
            [
                {"attribute_definition": self.parent_definition.id, "value_text": "Cotton"},
                {"attribute_definition": self.enum_definition.id, "value_option": self.red_option.id},
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(ProductAttributeValue.objects.filter(product=self.product).count(), 2)

        replacement = self.client.put(
            url,
            [{"attribute_definition": self.parent_definition.id, "value_text": "Wool"}],
            format="json",
        )
        self.assertEqual(replacement.status_code, status.HTTP_200_OK)
        self.assertEqual(ProductAttributeValue.objects.filter(product=self.product).count(), 1)
        self.assertEqual(ProductAttributeValue.objects.get(product=self.product).value_text, "Wool")

    def test_product_attributes_reject_foreign_product(self):
        url = reverse("seller-product-attributes", kwargs={"product_id": self.other_product.id})

        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_product_attributes_reject_attribute_outside_effective_schema(self):
        other_category = Category.objects.create(name="Seller Attr Other Leaf", parent=self.parent)
        outside_definition = CategoryAttributeDefinition.objects.create(
            category=other_category,
            code="outside",
            name="Outside",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
        )
        url = reverse("seller-product-attributes", kwargs={"product_id": self.product.id})

        response = self.client.put(
            url,
            [
                {"attribute_definition": self.parent_definition.id, "value_text": "Cotton"},
                {"attribute_definition": outside_definition.id, "value_text": "Nope"},
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
