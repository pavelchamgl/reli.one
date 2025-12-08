from django.urls import path

from .views import ContactCreateView, ContactMessageCreateAPIView


urlpatterns = [
    path('create/', ContactCreateView.as_view(), name='contact_create'),
    path("message/", ContactMessageCreateAPIView.as_view(), name="contact_message"),
]
