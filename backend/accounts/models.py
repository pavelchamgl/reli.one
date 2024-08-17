from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from phonenumber_field.modelfields import PhoneNumberField

from .managers import BaseUserManagerWithRole, CustomerManager, SellerManager


class UserRole(models.TextChoices):
    CUSTOMER = 'Customer', 'Customer'
    SELLER = 'Seller', 'Seller'


class CustomUser(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    address = models.CharField(max_length=500, blank=True, null=True)
    email = models.EmailField(unique=True)
    image = models.ImageField(upload_to='avatar_images/', blank=True, null=True)
    phone_number = PhoneNumberField(unique=True, blank=True, null=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number_confirmed = models.BooleanField(default=False)
    email_confirmed = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = BaseUserManagerWithRole()
    customers = CustomerManager()
    sellers = SellerManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"ID: {self.pk}. E-mail: {self.email}"

    def has_role(self, role_name):
        return self.role == role_name

    def is_customer(self):
        return self.has_role(UserRole.CUSTOMER)

    def is_seller(self):
        return self.has_role(UserRole.SELLER)


class OTP(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    title = models.CharField(max_length=128)
    value = models.IntegerField(blank=True, null=True)
    expired_date = models.DateTimeField(blank=True, null=True)
