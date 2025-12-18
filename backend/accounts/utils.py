from random import randint
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail

from .models import OTP


def create_and_send_otp(user, title: str, ttl_minutes: int = 10) -> OTP:
    """
    Создаёт или обновляет OTP и отправляет его на email.
    Безопасно для повторных запросов (resend).
    """
    value = randint(100000, 999999)
    now = timezone.now()

    otp, _ = OTP.objects.update_or_create(
        user=user,
        title=title,
        defaults={
            "value": value,
            "expired_date": now + timedelta(minutes=ttl_minutes),
            "attempts_count": 0,
            "locked_until": None,
            "sent_at": now,
        },
    )

    if title == "EmailConfirmation":
        subject = "Email Confirmation"
        message = f"Hi {user.email}! You can confirm your email by using code: {value}"
    elif title == "PasswordReset":
        subject = "Password Reset"
        message = f"Hi {user.email}! Use the following code to reset your password: {value}"
    elif title == "ChangePassword":
        subject = "Change Password"
        message = f"Hi {user.email}! Use the following code to change your password: {value}"
    else:
        subject = "Verification code"
        message = f"Your verification code is: {value}"

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

    return otp
