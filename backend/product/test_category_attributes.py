from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.admin import ProductAttributeValueAdminForm
from product.attribute_schema import (
    category_allows_products,
    get_effective_attribute_schema,
    replace_product_attribute_values,
)
from product.models import (
    BaseProduct,
    Category,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
    ProductAttributeValue,
    ProductParameter,
    ProductStatus,
    ProductVariant,
)
from sellers.models import SellerProfile


class CategoryAttributeSchemaTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.seller_user = CustomUser.objects.create_user(
            email="category-attrs-seller@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Attrs",
            role=UserRole.SELLER,
            phone_number="+420730222333",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.root = Category.objects.create(name="Attr Root")
        cls.child = Category.objects.create(name="Attr Child", parent=cls.root)
        cls.leaf = Category.objects.create(name="Attr Leaf", parent=cls.child)

    def _product(self, *, category=None, name="Typed Attr Product"):
        product = BaseProduct.objects.create(
            name=name,
            product_description="Typed attribute product.",
            seller=self.seller_profile,
            category=category,
            article="5000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
        )
        ProductVariant.objects.create(
            product=product,
            name="Size",
            text="One",
            price=Decimal("10.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        return product

    def test_effective_schema_for_leaf_inherits_parent_attributes(self):
        parent_definition = CategoryAttributeDefinition.objects.create(
            category=self.root,
            code="material",
            name="Material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            sort_order=10,
        )
        leaf_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
            sort_order=20,
        )

        schema = get_effective_attribute_schema(self.leaf)

        self.assertEqual([item.definition for item in schema], [parent_definition, leaf_definition])
        self.assertTrue(schema[0].is_inherited)
        self.assertFalse(schema[1].is_inherited)

    def test_child_override_by_code_replaces_parent_definition(self):
        parent_definition = CategoryAttributeDefinition.objects.create(
            category=self.root,
            code="size",
            name="Parent size",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_required=False,
        )
        child_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="size",
            name="Leaf size",
            data_type=CategoryAttributeDefinition.DataType.NUMBER,
            unit="cm",
            is_required=True,
        )

        schema = get_effective_attribute_schema(self.leaf)

        self.assertEqual(len(schema), 1)
        self.assertEqual(schema[0].definition, child_definition)
        self.assertEqual(schema[0].inherited_from_id, parent_definition.id)
        self.assertFalse(schema[0].is_inherited)

    def test_null_or_deleted_category_returns_empty_schema(self):
        product = self._product(category=self.leaf)

        self.leaf.delete()
        product.refresh_from_db()

        self.assertIsNone(product.category)
        self.assertEqual(get_effective_attribute_schema(product.category), [])
        self.assertEqual(get_effective_attribute_schema(None), [])

    def test_non_leaf_category_behavior_is_explicit(self):
        self.assertFalse(category_allows_products(self.root))

        self.root.allows_product_assignment = True
        self.root.save(update_fields=["allows_product_assignment"])

        self.assertTrue(category_allows_products(self.root))
        self.assertTrue(category_allows_products(self.leaf))

    def test_required_attribute_validation_runs_only_on_explicit_typed_write(self):
        required_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="material",
            name="Material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_required=True,
        )
        product = self._product(category=self.leaf)

        with self.assertRaises(DRFValidationError) as context:
            replace_product_attribute_values(product, [])

        self.assertIn("required", context.exception.detail)

        values = replace_product_attribute_values(
            product,
            [{"attribute_definition": required_definition.id, "value_text": "Cotton"}],
        )

        self.assertEqual(len(values), 1)
        self.assertEqual(values[0].value_text, "Cotton")

    def test_type_validation_for_text_number_boolean_and_enum(self):
        text_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="material",
            name="Material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
        )
        number_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="weight",
            name="Weight",
            data_type=CategoryAttributeDefinition.DataType.NUMBER,
        )
        boolean_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="recyclable",
            name="Recyclable",
            data_type=CategoryAttributeDefinition.DataType.BOOLEAN,
        )
        enum_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        option = CategoryAttributeOption.objects.create(
            attribute_definition=enum_definition,
            value="red",
            label="Red",
        )
        product = self._product(category=self.leaf)

        values = replace_product_attribute_values(
            product,
            [
                {"attribute_definition": text_definition.id, "value_text": "Cotton"},
                {"attribute_definition": number_definition.id, "value_number": "12.5"},
                {"attribute_definition": boolean_definition.id, "value_boolean": True},
                {"attribute_definition": enum_definition.id, "value_option": option.id},
            ],
        )

        self.assertEqual(len(values), 4)
        self.assertEqual(ProductAttributeValue.objects.get(attribute_definition=number_definition).value_number, Decimal("12.5000"))
        self.assertTrue(ProductAttributeValue.objects.get(attribute_definition=boolean_definition).value_boolean)
        self.assertEqual(ProductAttributeValue.objects.get(attribute_definition=enum_definition).value_option, option)

        with self.assertRaises(DRFValidationError):
            replace_product_attribute_values(product, [{"attribute_definition": number_definition.id, "value_number": "not-a-number"}])

        with self.assertRaises(DRFValidationError):
            replace_product_attribute_values(product, [{"attribute_definition": boolean_definition.id, "value_boolean": "yes"}])

    def test_enum_option_must_belong_to_definition(self):
        color_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        size_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="size",
            name="Size",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        wrong_option = CategoryAttributeOption.objects.create(
            attribute_definition=size_definition,
            value="large",
            label="Large",
        )
        product = self._product(category=self.leaf)

        with self.assertRaises(DRFValidationError):
            replace_product_attribute_values(
                product,
                [{"attribute_definition": color_definition.id, "value_option": wrong_option.id}],
            )

    def test_attribute_must_belong_to_effective_schema(self):
        sibling = Category.objects.create(name="Attr Sibling", parent=self.root)
        sibling_definition = CategoryAttributeDefinition.objects.create(
            category=sibling,
            code="sibling-only",
            name="Sibling only",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
        )
        product = self._product(category=self.leaf)

        with self.assertRaises(DRFValidationError):
            replace_product_attribute_values(
                product,
                [{"attribute_definition": sibling_definition.id, "value_text": "Nope"}],
            )

    def test_unique_product_attribute_definition_constraint(self):
        definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="material",
            name="Material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
        )
        product = self._product(category=self.leaf)
        ProductAttributeValue.objects.create(
            product=product,
            attribute_definition=definition,
            value_text="Cotton",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductAttributeValue.objects.create(
                    product=product,
                    attribute_definition=definition,
                    value_text="Wool",
                )

    def test_model_full_clean_rejects_enum_option_from_another_definition(self):
        color_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        size_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="size",
            name="Size",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        wrong_option = CategoryAttributeOption.objects.create(
            attribute_definition=size_definition,
            value="large",
            label="Large",
        )
        product = self._product(category=self.leaf)
        value = ProductAttributeValue(
            product=product,
            attribute_definition=color_definition,
            value_option=wrong_option,
        )

        with self.assertRaises(DjangoValidationError) as context:
            value.full_clean()

        self.assertIn("value_option", context.exception.message_dict)

    def test_model_full_clean_rejects_multiple_value_fields_for_one_attribute(self):
        definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="weight",
            name="Weight",
            data_type=CategoryAttributeDefinition.DataType.NUMBER,
        )
        product = self._product(category=self.leaf)
        value = ProductAttributeValue(
            product=product,
            attribute_definition=definition,
            value_text="extra",
            value_number=Decimal("10.0"),
        )

        with self.assertRaises(DjangoValidationError) as context:
            value.full_clean()

        self.assertIn("value_text", context.exception.message_dict)

    def test_model_full_clean_rejects_missing_required_typed_values(self):
        definitions = [
            CategoryAttributeDefinition.objects.create(
                category=self.leaf,
                code="material",
                name="Material",
                data_type=CategoryAttributeDefinition.DataType.TEXT,
            ),
            CategoryAttributeDefinition.objects.create(
                category=self.leaf,
                code="weight",
                name="Weight",
                data_type=CategoryAttributeDefinition.DataType.NUMBER,
            ),
            CategoryAttributeDefinition.objects.create(
                category=self.leaf,
                code="recyclable",
                name="Recyclable",
                data_type=CategoryAttributeDefinition.DataType.BOOLEAN,
            ),
            CategoryAttributeDefinition.objects.create(
                category=self.leaf,
                code="color",
                name="Color",
                data_type=CategoryAttributeDefinition.DataType.ENUM,
            ),
        ]
        product = self._product(category=self.leaf)

        for definition in definitions:
            value = ProductAttributeValue(product=product, attribute_definition=definition)
            with self.assertRaises(DjangoValidationError):
                value.full_clean()

    def test_model_full_clean_accepts_valid_rows_for_each_data_type(self):
        text_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="material-valid",
            name="Material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
        )
        number_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="weight-valid",
            name="Weight",
            data_type=CategoryAttributeDefinition.DataType.NUMBER,
        )
        boolean_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="recyclable-valid",
            name="Recyclable",
            data_type=CategoryAttributeDefinition.DataType.BOOLEAN,
        )
        enum_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color-valid",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        option = CategoryAttributeOption.objects.create(
            attribute_definition=enum_definition,
            value="red",
            label="Red",
        )
        product = self._product(category=self.leaf)
        values = [
            ProductAttributeValue(product=product, attribute_definition=text_definition, value_text="Cotton"),
            ProductAttributeValue(product=product, attribute_definition=number_definition, value_number=Decimal("10.5")),
            ProductAttributeValue(product=product, attribute_definition=boolean_definition, value_boolean=False),
            ProductAttributeValue(product=product, attribute_definition=enum_definition, value_option=option),
        ]

        for value in values:
            value.full_clean()

    def test_model_full_clean_rejects_inactive_enum_option(self):
        enum_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color-inactive",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        inactive_option = CategoryAttributeOption.objects.create(
            attribute_definition=enum_definition,
            value="red-inactive",
            label="Red",
            is_active=False,
        )
        product = self._product(category=self.leaf)
        value = ProductAttributeValue(
            product=product,
            attribute_definition=enum_definition,
            value_option=inactive_option,
        )

        with self.assertRaises(DjangoValidationError) as context:
            value.full_clean()

        self.assertIn("value_option", context.exception.message_dict)

    def test_admin_form_rejects_enum_option_from_another_definition(self):
        color_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="color-admin",
            name="Color",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        size_definition = CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="size-admin",
            name="Size",
            data_type=CategoryAttributeDefinition.DataType.ENUM,
        )
        wrong_option = CategoryAttributeOption.objects.create(
            attribute_definition=size_definition,
            value="large-admin",
            label="Large",
        )
        product = self._product(category=self.leaf)
        form = ProductAttributeValueAdminForm(
            data={
                "product": product.id,
                "attribute_definition": color_definition.id,
                "value_text": "",
                "value_number": "",
                "value_boolean": "",
                "value_option": wrong_option.id,
                "source": "manual",
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("value_option", form.errors)

    def test_legacy_product_parameter_search_fallback_is_not_changed(self):
        product = self._product(category=self.leaf, name="Legacy Param Product")
        ProductParameter.objects.create(product=product, name="LegacyColor", value="Chartreuse")

        response = APIClient().get(reverse("search"), {"q": "Chartreuse"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in response.data["results"]["products"]}
        self.assertIn(product.id, ids)

    def test_public_detail_does_not_require_typed_attributes_for_old_products(self):
        CategoryAttributeDefinition.objects.create(
            category=self.leaf,
            code="required-material",
            name="Required material",
            data_type=CategoryAttributeDefinition.DataType.TEXT,
            is_required=True,
        )
        product = self._product(category=self.leaf, name="Old Approved Product")

        response = APIClient().get(reverse("product-detail", kwargs={"id": product.id}), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], product.id)
        self.assertIn("product_parameters", response.data)
