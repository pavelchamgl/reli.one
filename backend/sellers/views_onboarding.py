"""Реэкспорт onboarding views для обратной совместимости с `sellers/urls.py` и внешними импортами.

Реализации: пакет `sellers.onboarding`.
"""
from __future__ import annotations

from .onboarding.steps.bank import SellerBankAccountAPIView
from .onboarding.steps.company import (
    SellerCompanyAddressAPIView,
    SellerCompanyInfoAPIView,
    SellerCompanyRepresentativeAPIView,
)
from .onboarding.steps.documents import SellerDocumentUploadAPIView
from .onboarding.steps.return_policy import SellerReturnAddressAPIView
from .onboarding.steps.self_employed import (
    SellerSelfEmployedAddressAPIView,
    SellerSelfEmployedPersonalAPIView,
    SellerSelfEmployedTaxAPIView,
)
from .onboarding.steps.seller_type import SellerSetSellerTypeAPIView
from .onboarding.steps.state import SellerOnboardingStateAPIView
from .onboarding.steps.warehouse import SellerWarehouseAddressAPIView
from .onboarding.review.review import SellerOnboardingReviewAPIView
from .onboarding.review.submit import SellerOnboardingSubmitAPIView
