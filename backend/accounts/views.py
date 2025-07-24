from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiTypes, OpenApiExample
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter

from .choices import UserRole
from .utils import create_and_send_otp
from .models import CustomUser, OTP
from .mixins import SocialLoginResponseMixin
from .serializers import (
    UserRegistrationSerializer,
    EmailSerializer,
    PasswordResetConfirmSerializer,
    EmailConfirmationSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
)


class UserRegistrationView(APIView):
    role_name = UserRole.CUSTOMER

    @extend_schema(
        description="Register a new user.",
        request=UserRegistrationSerializer,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(
                response={
                    'id': 'integer',
                    'email': 'string',
                    'first_name': 'string',
                    'last_name': 'string',
                    'role': 'string',
                },
                description="User registered successfully.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'id': 1,
                            'email': 'user@example.com',
                            'first_name': 'John',
                            'last_name': 'Doe',
                            'role': 'customer',
                        },
                        response_only=True,
                        status_codes=["201"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'errors': 'object'},
                description="Invalid data.",
                examples=[
                    OpenApiExample(
                        "Invalid Data",
                        value={'errors': {'email': ['This field is required.']}},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(
            data=request.data,
            context={'role_name': self.role_name}
        )
        if serializer.is_valid():
            user = serializer.save()
            # Возможно, нужно вернуть данные пользователя без пароля
            response_data = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerRegistrationView(UserRegistrationView):
    role_name = UserRole.CUSTOMER

    @extend_schema(
        description="Register a new customer.",
        request=UserRegistrationSerializer,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(
                response={
                    'id': 'integer',
                    'email': 'string',
                    'first_name': 'string',
                    'last_name': 'string',
                },
                description="Customer registered successfully.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'id': 1,
                            'email': 'customer@example.com',
                            'first_name': 'Jane',
                            'last_name': 'Doe',
                        },
                        response_only=True,
                        status_codes=["201"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'errors': 'object'},
                description="Invalid data.",
                examples=[
                    OpenApiExample(
                        "Invalid Data",
                        value={
                            'errors': {
                                'first_name': ['This field is required.'],
                                'last_name': ['This field is required.'],
                                'email': ['This field is required.'],
                                'password': ['This field is required.'],
                                'confirm_password': ['This field is required.'],
                            }
                        },
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class SellerRegistrationView(UserRegistrationView):
    role_name = UserRole.SELLER

    @extend_schema(
        description="Register a new seller.",
        request=UserRegistrationSerializer,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(
                response={
                    'id': 'integer',
                    'email': 'string',
                    'first_name': 'string',
                    'last_name': 'string',
                },
                description="Seller registered successfully.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'id': 1,
                            'email': 'customer@example.com',
                            'first_name': 'Jane',
                            'last_name': 'Doe',
                        },
                        response_only=True,
                        status_codes=["201"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'errors': 'object'},
                description="Invalid data.",
                examples=[
                    OpenApiExample(
                        "Invalid Data",
                        value={
                            'errors': {
                                'first_name': ['This field is required.'],
                                'last_name': ['This field is required.'],
                                'email': ['This field is required.'],
                                'password': ['This field is required.'],
                                'confirm_password': ['This field is required.'],
                            }
                        },
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class SendOTPForEmailVerificationAPIView(APIView):
    @extend_schema(
        description="Send OTP for email verification.",
        request=EmailSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response={'message': 'string'},
                description='OTP sent for email verification.',
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={'message': 'OTP sent to the specified email address for verification.'},
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'errors': 'object'},
                description='Invalid data.',
                examples=[
                    OpenApiExample(
                        "Invalid Data",
                        value={'errors': {'email': ['This field is required.']}},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(
                response={'message': 'string'},
                description='User not found.',
                examples=[
                    OpenApiExample(
                        "User Not Found",
                        value={'message': 'User with the specified email address not found.'},
                        response_only=True,
                        status_codes=["404"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {'message': 'User with the specified email address not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            create_and_send_otp(user, "EmailConfirmation")
            return Response(
                {'message': 'OTP sent to the specified email address for verification.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailConfirmationAPIView(APIView):
    @extend_schema(
        description="Confirm email using OTP.",
        request=EmailConfirmationSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response={
                    'message': 'string',
                    'first_name': 'string',
                    'last_name': 'string',
                    'refresh': 'string',
                    'access': 'string',
                },
                description='Email verified successfully.',
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'message': 'Email successfully verified',
                            'first_name': 'John',
                            'last_name': 'Doe',
                            'refresh': 'sample_refresh_token',
                            'access': 'sample_access_token',
                        },
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'error': 'string'},
                description='OTP expired or invalid.',
                examples=[
                    OpenApiExample(
                        "OTP Invalid or Expired",
                        value={'error': 'The specified OTP has expired or is invalid'},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(
                response={'error': 'string'},
                description='User not found.',
                examples=[
                    OpenApiExample(
                        "User Not Found",
                        value={'error': 'User with the specified email address not found'},
                        response_only=True,
                        status_codes=["404"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request):
        serializer = EmailConfirmationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            otp_value = serializer.validated_data.get('otp')

            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'User with the specified email address not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            try:
                otp = OTP.objects.get(user=user, title="EmailConfirmation", value=otp_value)
                if otp.expired_date < timezone.now() and otp_value.isdigit():
                    return Response(
                        {'error': 'The specified OTP has expired or is invalid'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except OTP.DoesNotExist:
                return Response(
                    {'error': 'The specified OTP is invalid or does not match the specified email'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.email_confirmed = True
            user.save()
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Email successfully verified',
                'first_name': user.first_name,
                'last_name': user.last_name,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
                status=status.HTTP_200_OK
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        description="Authenticate user and obtain access and refresh tokens.",
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response={
                    'access': 'string',
                    'refresh': 'string',
                    'first_name': 'string',
                    'last_name': 'string'
                },
                description="Tokens successfully acquired.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'access': 'sample_access_token',
                            'refresh': 'sample_refresh_token',
                            'first_name': 'John',
                            'last_name': 'Doe'
                        },
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
                response={'detail': 'string'},
                description="Invalid credentials.",
                examples=[
                    OpenApiExample(
                        "Invalid Credentials",
                        value={'detail': 'No active account found with the given credentials'},
                        response_only=True,
                        status_codes=["401"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class CustomLogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        description="Logout user by blacklisting the refresh token.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'refresh_token': {'type': 'string'}
                },
                'required': ['refresh_token']
            }
        },
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Logout successful.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={'message': 'User successfully logged out.'},
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Refresh token is required.",
                examples=[
                    OpenApiExample(
                        "Missing Token",
                        value={'error': 'Refresh token is required.'},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "User successfully logged out."})
        else:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )


class SendOTPForPasswordResetAPIView(APIView):
    @extend_schema(
        description="Send OTP to user's email for password reset.",
        request=EmailSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response={'message': 'string'},
                description='OTP for password reset successfully sent.',
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={'message': 'OTP for password reset successfully sent.'},
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'errors': 'object'},
                description='Invalid request format.',
                examples=[
                    OpenApiExample(
                        "Invalid Request",
                        value={'errors': {'email': ['This field is required.']}},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(
                response={'message': 'string'},
                description='User with the specified email address not found.',
                examples=[
                    OpenApiExample(
                        "User Not Found",
                        value={'message': 'User with the specified email address not found.'},
                        response_only=True,
                        status_codes=["404"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request):
        serializer = EmailSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {'message': 'User with the specified email address not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            create_and_send_otp(user, otp_title="PasswordReset")
            return Response(
                {'message': 'OTP for password reset successfully sent'},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckingOTPPasswordResetAPIView(APIView):
    @extend_schema(
        description="Verify OTP before allowing password reset.This endpoint confirms the OTP sent to the user's email for the purpose of password reset.",
        request=EmailConfirmationSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response={
                    'message': 'string',
                },
                description='OTP for password reset successfully confirmed.',
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'message': 'OTP for password reset successfully confirmed',
                        },
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'error': 'string'},
                description='OTP expired or invalid.',
                examples=[
                    OpenApiExample(
                        "OTP Invalid or Expired",
                        value={'error': 'The specified OTP has expired or is invalid'},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(
                response={'error': 'string'},
                description='User not found.',
                examples=[
                    OpenApiExample(
                        "User Not Found",
                        value={'error': 'User with the specified email address not found'},
                        response_only=True,
                        status_codes=["404"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request):
        serializer = EmailConfirmationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            otp_value = serializer.validated_data.get('otp')

            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'User with the specified email address not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            try:
                otp = OTP.objects.get(user=user, title="PasswordReset", value=otp_value)
                if otp.expired_date < timezone.now() or not otp_value.isdigit():
                    return Response(
                        {'error': 'The specified OTP has expired or is invalid'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except OTP.DoesNotExist:
                return Response(
                    {'error': 'The specified OTP is invalid or does not match the specified email'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                'message': 'OTP for password reset successfully confirmed',
            },
                status=status.HTTP_200_OK
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmationAPIView(APIView):
    @extend_schema(
        description=(
            "Confirm password reset using OTP. "
            "Requirements for the new password:\n"
            "- Password fields must match.\n"
            "- Password must be at least 8 characters long.\n"
            "- Password must contain at least one uppercase letter (A-Z).\n"
            "- Password must contain at least one digit (0-9).\n"
            "- Password must contain at least one special character (!@#$%^&*).\n"
        ),
        request=PasswordResetConfirmSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response={'message': 'string'},
                description="Password reset successfully.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={'message': 'Password reset successfully.'},
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={'error': 'string'},
                description="Invalid request format or OTP expired/invalid.",
                examples=[
                    OpenApiExample(
                        "Invalid OTP",
                        value={'error': 'OTP has expired or is invalid.'},
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(
                response={'error': 'string'},
                description="User not found.",
                examples=[
                    OpenApiExample(
                        "User Not Found",
                        value={'error': 'User with this email does not exist.'},
                        response_only=True,
                        status_codes=["404"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            otp_value = serializer.validated_data.get('otp')
            new_password = serializer.validated_data.get('password')

            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'User with this email does not exist.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            try:
                otp = OTP.objects.get(user=user, title="PasswordReset", value=otp_value)
                if otp.expired_date < timezone.now():
                    return Response(
                        {'error': 'OTP has expired or is invalid.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except OTP.DoesNotExist:
                return Response(
                    {'error': 'Invalid OTP or does not match the user.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()

            return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountDeletionAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        description="Delete user account.",
        responses={
            status.HTTP_204_NO_CONTENT: OpenApiResponse(
                response=None,
                description="Account successfully deleted.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={'message': 'Account successfully deleted.'},
                        response_only=True,
                        status_codes=["204"]
                    )
                ]
            ),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
                response={'detail': 'string'},
                description="Unauthorized - User not authenticated.",
                examples=[
                    OpenApiExample(
                        "Unauthorized",
                        value={'detail': 'Authentication credentials were not provided.'},
                        response_only=True,
                        status_codes=["401"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def delete(self, request):
        request.user.delete()
        return Response({'message': 'Account successfully deleted.'}, status=status.HTTP_204_NO_CONTENT)


class UserProfileGetAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Get user profile.",
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response=UserProfileSerializer,
                description="User profile retrieved successfully.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'id': 1,
                            'first_name': 'John',
                            'last_name': 'Doe',
                            'address': '123 Main St',
                            'email': 'user@example.com',
                            'phone_number': '+1234567890',
                            'role': 'Customer',
                            'phone_number_confirmed': True,
                            'email_confirmed': True,
                        },
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
                response={
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'}
                    },
                    'required': ['detail']
                },
                description="Unauthorized - User not authenticated.",
                examples=[
                    OpenApiExample(
                        "Unauthorized",
                        value={'detail': 'Authentication credentials were not provided.'},
                        response_only=True,
                        status_codes=["401"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def get(self, request):
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)


class UserProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Update user profile. "
                    "Only the fields 'first_name', 'last_name', 'address', 'email', and 'phone_number' can be updated.",
        request=UserProfileSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                response=UserProfileSerializer,
                description="User profile updated successfully.",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            'id': 1,
                            'first_name': 'John',
                            'last_name': 'Doe',
                            'address': '123 Main St',
                            'email': 'user@example.com',
                            'phone_number': '+1234567890',
                            'role': 'Customer',
                            'phone_number_confirmed': True,
                            'email_confirmed': True,
                        },
                        response_only=True,
                        status_codes=["200"]
                    )
                ]
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                response={
                    'type': 'object',
                    'properties': {
                        'email': {'type': 'array', 'items': {'type': 'string'}},
                        'phone_number': {'type': 'array', 'items': {'type': 'string'}},
                        'first_name': {'type': 'array', 'items': {'type': 'string'}},
                        'last_name': {'type': 'array', 'items': {'type': 'string'}},
                        'address': {'type': 'array', 'items': {'type': 'string'}},
                    }
                },
                description="Invalid data format for update.",
                examples=[
                    OpenApiExample(
                        "Invalid Data",
                        value={
                            'email': ['This field must be a valid email address.'],
                            'phone_number': ['This field must be a valid phone number.']
                        },
                        response_only=True,
                        status_codes=["400"]
                    )
                ]
            ),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
                response={
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'}
                    },
                    'required': ['detail']
                },
                description="Unauthorized - User not authenticated.",
                examples=[
                    OpenApiExample(
                        "Unauthorized",
                        value={'detail': 'Authentication credentials were not provided.'},
                        response_only=True,
                        status_codes=["401"]
                    )
                ]
            ),
        },
        tags=["Accounts"]
    )
    def patch(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@extend_schema(
    description="Authenticate user with Google OAuth2 access token.\n\n"
                "This endpoint accepts a Google `access_token` and returns both "
                "a JWT access token and a refresh token for the user, "
                "along with user's first and last name.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "access_token": {
                    "type": "string",
                    "description": "Google OAuth2 access token"
                }
            },
            "required": ["access_token"]
        },
    },
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            description="Successful authentication. Returns JWT tokens and user's name.",
            response={
                "type": "object",
                "properties": {
                    "access": {"type": "string", "description": "JWT access token"},
                    "refresh": {"type": "string", "description": "JWT refresh token"},
                    "first_name": {"type": "string", "description": "User's first name"},
                    "last_name": {"type": "string", "description": "User's last name"},
                },
                "required": ["access", "refresh", "first_name", "last_name"]
            },
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "first_name": "John",
                        "last_name": "Doe"
                    },
                    response_only=True,
                    status_codes=["200"]
                )
            ]
        ),
        status.HTTP_400_BAD_REQUEST: OpenApiResponse(
            description="Invalid or missing Google access token.",
            response={
                "type": "object",
                "properties": {
                    "non_field_errors": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["non_field_errors"]
            },
            examples=[
                OpenApiExample(
                    "Invalid Token",
                    value={
                        "non_field_errors": [
                            "Incorrect input. access_token or code is required."
                        ]
                    },
                    response_only=True,
                    status_codes=["400"]
                )
            ]
        ),
        status.HTTP_500_INTERNAL_SERVER_ERROR: OpenApiResponse(
            description="OAuth2Error: Failed to fetch user info from Google.",
            response={
                "type": "object",
                "properties": {
                    "detail": {"type": "string"}
                },
                "required": ["detail"]
            },
            examples=[
                OpenApiExample(
                    "OAuth2 Error",
                    value={
                        "detail": "OAuth2Error: Request to user info failed"
                    },
                    response_only=True,
                    status_codes=["500"]
                )
            ]
        )
    },
    tags=["Accounts Authentication Google"]
)
class GoogleLogin(SocialLoginResponseMixin, SocialLoginView):
    adapter_class = GoogleOAuth2Adapter



@extend_schema(
    operation_id="facebook_social_login",
    description=(
        "Authenticate user using Facebook OAuth2 access token.\n\n"
        "This endpoint accepts a Facebook `access_token` and returns a JWT access and refresh token.\n\n"
        "**Error cases:**\n"
        "- 400: access_token is missing or invalid\n"
        "- 500: Error fetching user info from Facebook"
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "access_token": {"type": "string", "description": "Facebook OAuth2 access token"},
            },
            "required": ["access_token"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="Successful authentication",
            examples=[
                OpenApiExample(
                    name="Success",
                    value={
                        "access": "eyJ0eXAiOiJKV1QiLCJh...",
                        "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "first_name": "John",
                        "last_name": "Doe"
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid token or missing input",
            examples=[
                OpenApiExample(
                    name="Missing Token",
                    value={"non_field_errors": ["Incorrect input. access_token or code is required."]}
                )
            ]
        ),
        500: OpenApiResponse(
            description="Facebook error",
            examples=[
                OpenApiExample(
                    name="OAuth2Error",
                    value={"detail": "OAuth2Error: Request to user info failed"}
                )
            ]
        )
    },
    tags=["Accounts Authentication Facebook"],
)
class FacebookLogin(SocialLoginResponseMixin, SocialLoginView):
    adapter_class = FacebookOAuth2Adapter
