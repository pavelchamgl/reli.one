from django.contrib.auth.models import BaseUserManager

from .choices import UserRole


class BaseUserManagerWithRole(BaseUserManager):
    def create_user(self, email, password=None, role=UserRole.CUSTOMER, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('role') != UserRole.ADMIN:
            raise ValueError('Superuser must have role of Admin.')
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class ManagerManager(BaseUserManagerWithRole):
    def get_queryset(self):
        return super().get_queryset().filter(role=UserRole.MANAGER)


class AdminManager(BaseUserManagerWithRole):
    def get_queryset(self):
        return super().get_queryset().filter(role=UserRole.ADMIN)


class CustomerManager(BaseUserManagerWithRole):
    def get_queryset(self):
        return super().get_queryset().filter(role=UserRole.CUSTOMER)


class SellerManager(BaseUserManagerWithRole):
    def get_queryset(self):
        return super().get_queryset().filter(role=UserRole.SELLER)
