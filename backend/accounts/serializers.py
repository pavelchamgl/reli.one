import re

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password

from .choices import UserRole
from .models import CustomUser


class PasswordValidateMixin(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"error": "Password fields didn't match."})

        password = attrs['password']
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError(
                {'password': "Password must contain at least one uppercase letter."}
            )
        if not re.search(r'\d', password):
            raise serializers.ValidationError(
                {'password': "Password must contain at least one digit."}
            )
        if not re.search(r'[!@#$%^&*]', password):
            raise serializers.ValidationError(
                {'password': "Password must contain at least one special character (!@#$%^&*)."}
            )
        if len(password) < 8:
            raise serializers.ValidationError({'password': "Password must be at least 8 characters long."})
        return attrs


class UserRegistrationSerializer(PasswordValidateMixin, serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password']

    def create(self, validated_data):
        role_name = self.context.get('role_name', UserRole.CUSTOMER)
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(role=role_name, **validated_data)
        return user


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class EmailConfirmationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True)

    def validate(self, attrs):
        otp = attrs['otp']
        if not otp.isdigit():
            raise serializers.ValidationError({"error": "OTP is not digit."})
        data = super().validate(attrs)
        return data


class PasswordResetConfirmSerializer(PasswordValidateMixin, serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True)
    password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def save(self, **kwargs):
        email = self.validated_data['email']
        password = self.validated_data['password']

        user = CustomUser.objects.get(email=email)
        user.password = make_password(password)
        user.save()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({'first_name': self.user.first_name})
        data.update({'last_name': self.user.last_name})
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Добавление роли пользователя в payload токена
        token['role'] = user.role
        return token


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'first_name',
            'last_name',
            'address',
            'email',
            'phone_number',
            'role',
            'phone_number_confirmed',
            'email_confirmed',
        ]
        read_only_fields = [
            'id',
            'role',
            'phone_number_confirmed',
            'email_confirmed',
        ]
