from .seller_type import SellerSetSellerTypeAPIView
from .self_employed import (
    SellerSelfEmployedAddressAPIView,
    SellerSelfEmployedPersonalAPIView,
    SellerSelfEmployedTaxAPIView,
)
from .company import (
    SellerCompanyAddressAPIView,
    SellerCompanyInfoAPIView,
    SellerCompanyRepresentativeAPIView,
)
from .bank import SellerBankAccountAPIView
from .warehouse import SellerWarehouseAddressAPIView
from .return_policy import SellerReturnAddressAPIView
from .documents import SellerDocumentUploadAPIView

