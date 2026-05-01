"""
Минимальные API-тесты каталога: категория, карточка, поиск, сортировка, пустой поиск.
"""
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser
from product.models import BaseProduct, Category, ProductParameter, ProductStatus, ProductVariant
from sellers.models import SellerProfile
from warehouses.models import Warehouse


class CatalogApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wh = Warehouse.objects.create(
            name="WH-Catalog-Test",
            street="S",
            city="Praha",
            zip_code="10000",
            country="CZ",
        )
        cls.seller_user = CustomUser.objects.create_user(
            email="seller-catalog-api@example.com",
            password="pass12345",
            first_name="S",
            last_name="L",
            role=UserRole.SELLER,
            phone_number="+420730000011",
        )
        cls.seller_profile = SellerProfile.objects.get(user=cls.seller_user)
        cls.seller_profile.default_warehouse = cls.wh
        cls.seller_profile.save(update_fields=["default_warehouse"])

        cls.cat_main = Category.objects.create(name="CatalogApiMain")
        cls.cat_sub = Category.objects.create(name="CatalogApiSub", parent=cls.cat_main)
        cls.cat_orphan = Category.objects.create(name="ZetaOrphanCategoryX7")

        cls.product_alpha = BaseProduct.objects.create(
            name="AlphaSortTest Cheaper",
            product_description="Common token AlphaSortTest for search.",
            seller=cls.seller_profile,
            category=cls.cat_sub,
            article="1000000001",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
            rating=Decimal("4.0"),
            total_reviews=1,
        )
        ProductVariant.objects.create(
            product=cls.product_alpha,
            name="V",
            text="t",
            price=Decimal("15.00"),
            weight_grams=100,
            length_mm=50,
            width_mm=50,
            height_mm=50,
        )
        ProductParameter.objects.create(
            product=cls.product_alpha,
            name="Color",
            value="Black",
        )

        cls.product_beta = BaseProduct.objects.create(
            name="AlphaSortTest Pricier",
            product_description="Also AlphaSortTest.",
            seller=cls.seller_profile,
            category=cls.cat_sub,
            article="1000000002",
            vat_rate=Decimal("21.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
            rating=Decimal("5.0"),
            total_reviews=2,
        )
        ProductVariant.objects.create(
            product=cls.product_beta,
            name="V",
            text="t",
            price=Decimal("45.00"),
            weight_grams=200,
            length_mm=60,
            width_mm=60,
            height_mm=60,
        )

        cls.product_detail = BaseProduct.objects.create(
            name="DetailGadget Pro",
            product_description="Detail line for detail endpoint.",
            seller=cls.seller_profile,
            category=cls.cat_sub,
            article="1000000003",
            vat_rate=Decimal("10.00"),
            status=ProductStatus.APPROVED,
            is_active=True,
            rating=Decimal("4.5"),
            total_reviews=3,
        )
        ProductVariant.objects.create(
            product=cls.product_detail,
            name="Size",
            text="M",
            price=Decimal("99.00"),
            weight_grams=300,
            length_mm=70,
            width_mm=70,
            height_mm=70,
        )
        ProductParameter.objects.create(
            product=cls.product_detail,
            name="Weight",
            value="300g",
        )

    def setUp(self):
        self.client = APIClient()

    def test_category_list_returns_products(self):
        url = reverse("category-products", kwargs={"category_id": self.cat_sub.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        ids = {p["id"] for p in results}
        self.assertIn(self.product_alpha.id, ids)
        self.assertIn(self.product_beta.id, ids)

    def test_product_detail_returns_variants_images_parameters(self):
        url = reverse("product-detail", kwargs={"id": self.product_detail.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("variants", data)
        self.assertIn("images", data)
        self.assertIn("product_parameters", data)
        self.assertEqual(len(data["variants"]), 1)
        self.assertEqual(data["variants"][0]["sku"], ProductVariant.objects.get(product=self.product_detail).sku)
        self.assertEqual(len(data["product_parameters"]), 1)
        self.assertEqual(data["product_parameters"][0]["name"], "Weight")
        self.assertEqual(data["images"], [])

    def test_search_returns_products(self):
        url = reverse("search")
        response = self.client.get(url, {"q": "DetailGadget"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        block = response.data["results"]
        self.assertIn("products", block)
        ids = {p["id"] for p in block["products"]}
        self.assertIn(self.product_detail.id, ids)

    def test_search_returns_categories_without_matching_products(self):
        url = reverse("search")
        response = self.client.get(url, {"q": "ZetaOrphan"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        block = response.data["results"]
        cat_ids = {c["id"] for c in block["categories"]}
        self.assertIn(self.cat_orphan.id, cat_ids)
        self.assertEqual(block["products"], [])

    def test_search_ordering_min_price(self):
        url = reverse("search")
        response = self.client.get(
            url,
            {"q": "AlphaSortTest", "ordering": "min_price"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        products = response.data["results"]["products"]
        self.assertGreaterEqual(len(products), 2)
        ordered_ids = [p["id"] for p in products]
        i_cheap = ordered_ids.index(self.product_alpha.id)
        i_exp = ordered_ids.index(self.product_beta.id)
        self.assertLess(i_cheap, i_exp)

    def test_search_empty_query_returns_empty_buckets(self):
        url = reverse("search")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        block = response.data["results"]
        self.assertEqual(block["products"], [])
        self.assertEqual(block["categories"], [])

        response2 = self.client.get(url, {"q": "   "}, format="json")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        block2 = response2.data["results"]
        self.assertEqual(block2["products"], [])
        self.assertEqual(block2["categories"], [])
