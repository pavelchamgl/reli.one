from django.urls import path

from .views import generate_report

urlpatterns = [
    path('report/', generate_report, name='supplier-report'),
]
