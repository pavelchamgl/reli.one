from django.urls import path

from .api.dev_views import DevShipMyGLS, DevMyGLSAuthCheck, GlsPudoCallback, GlsPudoEchoPage
from .views import (
    SellerShippingOptionsView
)

urlpatterns = [
    path('seller-shipping-options/', SellerShippingOptionsView.as_view(), name='seller-shipping-options'),
    path("dev/mygls/ship/", DevShipMyGLS.as_view(), name="dev-mygln-ship"),
    path("dev/mygls/authcheck", DevMyGLSAuthCheck.as_view(), name="dev-mygln-authcheck"),
    path("dev/mygls/pudo-callback", GlsPudoCallback.as_view()),
    path("dev/mygls/pudo-echo", GlsPudoEchoPage.as_view()),
]
