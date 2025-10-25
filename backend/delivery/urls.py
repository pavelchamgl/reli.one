from django.urls import path

from .api.dev_views import (
    DevShipMyGLS,
    DevMyGLSAuthCheck,
    DevShipDPD,
    DevDpdPrintByShipment,
)
from .views import (
    SellerShippingOptionsView,
)

urlpatterns = [
    path('seller-shipping-options/', SellerShippingOptionsView.as_view(), name='seller-shipping-options'),
    path("dev/mygls/ship/", DevShipMyGLS.as_view(), name="dev-mygls-ship"),
    path("dev/mygls/authcheck/", DevMyGLSAuthCheck.as_view(), name="dev-mygls-authcheck"),
    path("dev/dpd/ship/", DevShipDPD.as_view(), name="dev-dpd-ship"),
    path("dev/dpd/print-by-shipment/", DevDpdPrintByShipment.as_view(), name="dev-dpd-print-by-shipment"),
]
