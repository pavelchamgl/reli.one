from django.urls import path

from .api.dev_views import DevShipMyGLS, DevMyGLSAuthCheck
from .views import (
    SellerShippingOptionsView
)

urlpatterns = [
    path('seller-shipping-options/', SellerShippingOptionsView.as_view(), name='seller-shipping-options'),
    path("dev/mygls/ship/", DevShipMyGLS.as_view(), name="dev-mygln-ship"),
    path("dev/mygls/authcheck", DevMyGLSAuthCheck.as_view(), name="dev-mygln-authcheck"),
]
