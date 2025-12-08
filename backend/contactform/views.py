from django.conf import settings
from django.core.mail import send_mail

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import Contact
from .serializers import ContactSerializer, ContactMessageSerializer


class ContactCreateView(generics.CreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


@extend_schema(
    summary="Send message from contact form",
    description="Public endpoint used by the landing contact form to send a message to project managers.",
    request=ContactMessageSerializer,
    responses={201: {"success": True}},
    tags=["Contact"],
)
class ContactMessageCreateAPIView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        instance = serializer.save()

        # ---- Email to manager ----
        subject = "New message from Reli.one landing"
        body = (
            f"New landing contact form message:\n\n"
            f"First name: {instance.first_name}\n"
            f"Last name: {instance.last_name}\n"
            f"Email: {instance.email}\n"
            f"Business type: {instance.business_type}\n\n"
            f"Message:\n{instance.message}\n\n"
            f"Created at: {instance.created_at:%Y-%m-%d %H:%M}"
        )

        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            settings.PROJECT_MANAGERS_EMAILS,
            fail_silently=False,
        )

        return instance

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"success": True}, status=status.HTTP_201_CREATED)
