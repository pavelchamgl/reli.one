from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomerRegistrationView,
    SellerRegistrationView,
    SendOTPForEmailVerificationAPIView,
    PasswordResetConfirmationAPIView,
    EmailConfirmationAPIView,
    CustomTokenObtainPairView,
    CustomLogoutView,
    UserProfileGetAPIView,
    UserProfileUpdateAPIView,
    AccountDeletionAPIView,
    SendOTPForPasswordResetAPIView,
    CheckingOTPPasswordResetAPIView,
)

urlpatterns = [
    path('register/customer/', CustomerRegistrationView.as_view(), name='register_customer'),
    path('register/seller/', SellerRegistrationView.as_view(), name='register_seller'),
    path('email/confirmation/', EmailConfirmationAPIView.as_view(), name='email_confirmation'),
    path('email/otp/resend/', SendOTPForEmailVerificationAPIView.as_view(), name='resend_otp_for_email_verification'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('check-otp-password-reset/', CheckingOTPPasswordResetAPIView.as_view(), name='check-otp-password-reset'),
    path('password/reset/confirmation/', PasswordResetConfirmationAPIView.as_view(), name='reset_password_confirmation'),
    path('profile/me/', UserProfileGetAPIView.as_view(), name='my_profile'),
    path('profile/update/', UserProfileUpdateAPIView.as_view(), name='my_profile'),
    path('deletion/me/', AccountDeletionAPIView.as_view(), name='deletion_me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password/reset/otp/send/', SendOTPForPasswordResetAPIView.as_view(), name='send_orp_for_password_reset'),
]
