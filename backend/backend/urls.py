from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('api/', include('accounts.urls')),
    path('api/', include('order.urls')),
    path('api/', include('product.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('payment.urls')),
    path('api/', include('promocode.urls')),
    path('api/contact/', include('contactform.urls')),
    path('api/', include('news.urls')),
    path('api/', include('vacancies.urls')),
    path('api/favorites/', include('favorites.urls')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
