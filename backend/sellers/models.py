from django.db import models

from accounts.model import CustomUser
from accounts.choices import UserRole


class SellerProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': UserRole.SELLER},
        related_name='seller_profile'
    )
    managers = models.ManyToManyField(
        CustomUser,
        limit_choices_to={'role': UserRole.MANAGER},
        related_name='sellers_managed',
        blank=True
    )

    def __str__(self):
        return f"SellerProfile: {self.user.email}"
