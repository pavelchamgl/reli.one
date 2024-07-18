import datetime
from datetime import datetime
from django.utils import timezone
from django.conf import settings
from random import randint
from django.core.mail import send_mail
from .models import OTP


def create_and_send_otp(user, otp_title):
    value = randint(100000, 999999)

    try:
        otp = OTP.objects.get(user=user, title=otp_title)
        otp.value = value
        otp.expired_date = datetime.now() + settings.OTP_LIFETIME
    except OTP.DoesNotExist:
        otp = OTP.objects.create(
            user=user,
            title=otp_title,
            value=value,
            expired_date=datetime.now() + settings.OTP_LIFETIME)

    otp.save()

    if otp_title == "EmailConfirmation":
        subject = "Email Confirmation"
        message = f"Hi {user.email}! You can confirm your email by using code: {value}"
    elif otp_title == "PasswordReset":
        subject = "Password Reset"
        message = f"Hi {user.email}! Use the following code to reset your password: {value}"
    elif otp_title == "ChangePassword":
        subject = "Change Password"
        message = f"Hi {user.email}! Use the following code to change your password: {value}"

    send_mail(subject, message, "auth_server@admin.com", [user.email])
