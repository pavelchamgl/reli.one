from django.db import models
from django.core.exceptions import ValidationError

from accounts.models import CustomUser
from accounts.choices import UserRole


class LegalInfoStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


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

    def clean(self):
        if self.user.role != UserRole.SELLER:
            raise ValidationError("SellerProfile can only be assigned to a user with role=SELLER.")


class SellerLegalInfo(models.Model):
    seller_profile = models.OneToOneField(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='legal_info'
    )

    company_name = models.CharField(max_length=255)
    legal_address = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=LegalInfoStatus.choices,
        default=LegalInfoStatus.PENDING
    )
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        limit_choices_to={'role__in': ['Manager', 'Admin']},
        null=True,
        blank=True,
        related_name='approved_legal_infos'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Legal Info for {self.seller_profile.user.email}: {self.status}"
