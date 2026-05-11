from django.urls import path

from .dev_access import include_dev_courier_tooling
from .views import (
    SellerShippingOptionsView,
    ValidateAddressView,
)

urlpatterns = [
    path("seller-shipping-options/", SellerShippingOptionsView.as_view(), name="seller-shipping-options"),
    path("validate-address/", ValidateAddressView.as_view(), name="validate-address"),
]

if include_dev_courier_tooling():
    from .api.dev_views import (
        DevDpdPrintByShipment,
        DevMyGLSAuthCheck,
        DevShipDPD,
        DevShipMyGLS,
    )

    urlpatterns += [
        path("dev/mygls/ship/", DevShipMyGLS.as_view(), name="dev-mygls-ship"),
        path("dev/mygls/authcheck/", DevMyGLSAuthCheck.as_view(), name="dev-mygls-authcheck"),
        path("dev/dpd/ship/", DevShipDPD.as_view(), name="dev-dpd-ship"),
        path(
            "dev/dpd/print-by-shipment/",
            DevDpdPrintByShipment.as_view(),
            name="dev-dpd-print-by-shipment",
        ),
    ]
