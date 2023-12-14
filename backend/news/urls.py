# myapp/urls.py
from django.urls import path
from .views import NewsListCreateView, NewsDetailView

urlpatterns = [
    path('news/', NewsListCreateView.as_view(), name='news-list-create'),
    path('news/<int:pk>/', NewsDetailView.as_view(), name='news-detail'),
]
