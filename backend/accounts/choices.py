from django.db import models


class UserRole(models.TextChoices):
    ADMIN = 'Admin', 'Admin'
    MANAGER = 'Manager', 'Manager'
    CUSTOMER = 'Customer', 'Customer'
    SELLER = 'Seller', 'Seller'
