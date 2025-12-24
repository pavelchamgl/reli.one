from django.urls import path, include
from rest_framework_nested import routers

from .views import (
    BaseProductViewSet,
    ProductParameterViewSet,
    BaseProductImageViewSet,
    ProductVariantViewSet,
    LicenseFileViewSet,
    SellerProductListView,
    SellerSalesStatisticsView,
    SellerBaseProductListView,
)
from .views_onboarding import (
    SellerOnboardingStateAPIView,
    SellerSetSellerTypeAPIView,
    SellerSelfEmployedPersonalAPIView,
    SellerSelfEmployedTaxAPIView,
    SellerSelfEmployedAddressAPIView,
    SellerCompanyInfoAPIView,
    SellerCompanyRepresentativeAPIView,
    SellerCompanyAddressAPIView,
    SellerBankAccountAPIView,
    SellerWarehouseAddressAPIView,
    SellerReturnAddressAPIView,
    SellerDocumentUploadAPIView,
    SellerOnboardingReviewAPIView,
    SellerOnboardingSubmitAPIView,
)


router = routers.SimpleRouter()
router.register(r'products', BaseProductViewSet, basename='products')


products_router = routers.NestedSimpleRouter(router, r'products', lookup='product')
products_router.register(
    r'parameters',
    ProductParameterViewSet,
    basename='product-parameters'
)
products_router.register(
    r'images',
    BaseProductImageViewSet,
    basename='product-images'
)

products_router.register(
    r'variants',
    ProductVariantViewSet,
    basename='product-variants'
)

products_router.register(
    r'license',
    LicenseFileViewSet,
    basename='product-license'
)

urlpatterns = [
    path('', include(router.urls)),
    path('', include(products_router.urls)),
    path('my-products/', SellerProductListView.as_view(), name='seller-product-list'),
    path('statistics/sales/', SellerSalesStatisticsView.as_view(), name='seller-sales-statistics'),
    path("<int:seller_id>/products/", SellerBaseProductListView.as_view(), name="seller-products"),

    # --- Onboarding (Seller) ---
    path("onboarding/state/", SellerOnboardingStateAPIView.as_view(), name="seller-onboarding-state"),
    path("onboarding/seller-type/", SellerSetSellerTypeAPIView.as_view(), name="seller-onboarding-set-type"),

    path("onboarding/self-employed/personal/", SellerSelfEmployedPersonalAPIView.as_view(),
         name="seller-onboarding-se-personal"),
    path("onboarding/self-employed/tax/", SellerSelfEmployedTaxAPIView.as_view(), name="seller-onboarding-se-tax"),
    path("onboarding/self-employed/address/", SellerSelfEmployedAddressAPIView.as_view(),
         name="seller-onboarding-se-address"),

    path("onboarding/company/info/", SellerCompanyInfoAPIView.as_view(), name="seller-onboarding-company-info"),
    path("onboarding/company/representative/", SellerCompanyRepresentativeAPIView.as_view(),
         name="seller-onboarding-company-rep"),
    path("onboarding/company/address/", SellerCompanyAddressAPIView.as_view(),
         name="seller-onboarding-company-address"),

    path("onboarding/bank/", SellerBankAccountAPIView.as_view(), name="seller-onboarding-bank"),
    path("onboarding/warehouse/", SellerWarehouseAddressAPIView.as_view(), name="seller-onboarding-warehouse"),
    path("onboarding/return/", SellerReturnAddressAPIView.as_view(), name="seller-onboarding-return"),

    path("onboarding/documents/", SellerDocumentUploadAPIView.as_view(), name="seller-onboarding-documents"),
    path("onboarding/review/", SellerOnboardingReviewAPIView.as_view(), name="seller-onboarding-review"),
    path("onboarding/submit/", SellerOnboardingSubmitAPIView.as_view(), name="seller-onboarding-submit"),
]
