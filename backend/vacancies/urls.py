# myapp/urls.py
from django.urls import path
from .views import VacancyListCreateView, VacancyDetailView

urlpatterns = [
    path('vacancies/', VacancyListCreateView.as_view(), name='vacancy-list-create'),
    path('vacancies/<int:pk>/', VacancyDetailView.as_view(), name='vacancy-detail'),
]
