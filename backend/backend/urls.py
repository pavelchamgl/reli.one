from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.db import connection, OperationalError
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def health_check(request):
    """Lightweight health-check for Docker / load balancer.

    Returns 200 {"status": "ok", "db": "ok"} when healthy.
    Returns 503 {"status": "error", "db": "error"} when the DB is unreachable.
    Does not expose settings or secrets.
    """
    try:
        connection.ensure_connection()
        db_status = "ok"
    except OperationalError:
        db_status = "error"

    healthy = db_status == "ok"
    return JsonResponse(
        {"status": "ok" if healthy else "error", "db": db_status},
        status=200 if healthy else 503,
    )


urlpatterns = [
    path("health/", health_check, name="health"),
    path('admin/', admin.site.urls),
    path('reports/', include('reports.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/analytics/', include('analytics.urls')),
    path("api/delivery/", include("delivery.urls")),
    path("api/banner/", include("banners.urls")),
    path('api/orders/', include('order.urls')),
    path('api/products/', include('product.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/', include('payment.urls')),
    path('api/', include('promocode.urls')),
    path('api/contact/', include('contactform.urls')),
    path('api/', include('news.urls')),
    path('api/', include('vacancies.urls')),
    path('api/favorites/', include('favorites.urls')),
    path('api/sellers/', include('sellers.urls')),
    path('api/sellers/orders/', include('order.seller_urls')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if getattr(settings, "ENABLE_E2E_ENDPOINTS", False):
    from payment.e2e_views import E2ECreateStripeMetadataView, E2ESetupOrderDataView
    urlpatterns += [
        path(
            "api/e2e/payment/setup-order-data/",
            E2ESetupOrderDataView.as_view(),
            name="e2e_setup_order_data",
        ),
        path(
            "api/e2e/payment/create-stripe-metadata/",
            E2ECreateStripeMetadataView.as_view(),
            name="e2e_create_stripe_metadata",
        ),
    ]
