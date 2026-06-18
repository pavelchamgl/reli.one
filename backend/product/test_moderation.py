from __future__ import annotations

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Category, ProductStatus, ProductVariant
from product.services_moderation import approve_product, reject_product
from sellers.models import SellerProfile


class ProductModerationServiceTestCase(TestCase):
    def setUp(self):
        self.seller_user = CustomUser.objects.create_user(
            email="moderation-seller@example.com",
            password="pass12345",
            first_name="Seller",
            last_name="Moderation",
            role=UserRole.SELLER,
            phone_number="+420730111444",
        )
        self.seller_profile = SellerProfile.objects.get(user=self.seller_user)

        self.moderator = CustomUser.objects.create_user(
            email="moderation-manager@example.com",
            password="pass12345",
            first_name="Manager",
            last_name="Moderation",
            role=UserRole.MANAGER,
            phone_number="+420730111445",
        )

        self.category = Category.objects.create(name="Moderation Leaf", allows_product_assignment=True)

        self.product = BaseProduct.objects.create(
            name="Pending Product",
            product_description="Awaiting moderation.",
            seller=self.seller_profile,
            category=self.category,
            article="5000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.PENDING,
        )
        ProductVariant.objects.create(
            product=self.product,
            name="Default",
            text="Standard",
            price=Decimal("10.00"),
            weight_grams=100,
            width_mm=100,
            height_mm=100,
            length_mm=100,
        )

    def test_approve_product_happy_path_sets_audit_fields(self):
        before = timezone.now()
        approved = approve_product(self.product, self.moderator)
        after = timezone.now()

        approved.refresh_from_db()
        self.assertEqual(approved.status, ProductStatus.APPROVED)
        self.assertEqual(approved.approved_by, self.moderator)
        self.assertIsNotNone(approved.approved_at)
        self.assertGreaterEqual(approved.approved_at, before)
        self.assertLessEqual(approved.approved_at, after)
        self.assertIsNone(approved.rejected_reason)

    def test_reject_product_requires_reason(self):
        with self.assertRaises(ValidationError) as ctx:
            reject_product(self.product, self.moderator, "")

        self.assertIn("rejected_reason", ctx.exception.detail)

        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatus.PENDING)
        self.assertIsNone(self.product.rejected_reason)

    def test_reject_product_sets_audit_fields(self):
        rejected = reject_product(self.product, self.moderator, "Incomplete listing")

        rejected.refresh_from_db()
        self.assertEqual(rejected.status, ProductStatus.REJECTED)
        self.assertEqual(rejected.rejected_reason, "Incomplete listing")
        self.assertEqual(rejected.approved_by, self.moderator)
        self.assertIsNotNone(rejected.approved_at)

    def test_approve_product_fails_without_variant(self):
        self.product.variants.all().delete()

        with self.assertRaises(ValidationError) as ctx:
            approve_product(self.product, self.moderator)

        self.assertIn("detail", ctx.exception.detail)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatus.PENDING)
