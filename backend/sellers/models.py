from __future__ import annotations

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from accounts.models import CustomUser
from accounts.choices import UserRole


class LegalInfoStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class SellerProfile(models.Model):
    """
    Профиль продавца — доменная сущность sellers.
    Используется как owner для продуктов и точка привязки онбординга.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={"role": UserRole.SELLER},
        related_name="seller_profile",
    )

    managers = models.ManyToManyField(
        CustomUser,
        limit_choices_to={"role": UserRole.MANAGER},
        related_name="sellers_managed",
        blank=True,
    )

    # Склад по умолчанию
    default_warehouse = models.ForeignKey(
        "warehouses.Warehouse",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_for_sellers",
    )

    # Возможность хранить доступные склады продавца (если нужно)
    warehouses = models.ManyToManyField(
        "warehouses.Warehouse",
        blank=True,
        related_name="sellers",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Доп. защита: SellerProfile может быть только у роли SELLER
        if self.user and self.user.role != UserRole.SELLER:
            raise ValidationError("SellerProfile can only be created for users with role SELLER.")

    def __str__(self) -> str:
        return f"SellerProfile({self.pk}) for {self.user.email}"


class SellerLegalInfo(models.Model):
    """
    Исторически существующая сущность (НЕ ломаем).
    Её будем синхронизировать после approve заявки onboarding.
    """
    seller_profile = models.OneToOneField(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name="legal_info",
    )

    company_name = models.CharField(max_length=255)
    legal_address = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=LegalInfoStatus.choices,
        default=LegalInfoStatus.PENDING,
    )

    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        limit_choices_to={"role__in": [UserRole.MANAGER, UserRole.ADMIN]},
        null=True,
        blank=True,
        related_name="approved_legal_infos",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"LegalInfo({self.pk}) for {self.seller_profile.user.email}: {self.status}"


# -------------------------
# Onboarding models
# -------------------------

class SellerType(models.TextChoices):
    SELF_EMPLOYED = "self_employed", "Self-employed / Sole proprietor"
    COMPANY = "company", "Company / Legal entity"


class OnboardingStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    PENDING_VERIFICATION = "pending_verification", "Pending verification"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class SellerDocumentType(models.TextChoices):
    IDENTITY_DOCUMENT = "identity_document", "Identity document"
    PROOF_OF_ADDRESS = "proof_of_address", "Proof of address"
    REGISTRATION_CERTIFICATE = "registration_certificate", "Registration certificate"


class SellerDocumentScope(models.TextChoices):
    SELF_EMPLOYED_PERSONAL = "self_employed_personal", "Self-employed / Personal"
    SELF_EMPLOYED_ADDRESS = "self_employed_address", "Self-employed / Address"
    COMPANY_INFO = "company_info", "Company / Info"
    COMPANY_REPRESENTATIVE = "company_representative", "Company / Representative"
    COMPANY_ADDRESS = "company_address", "Company / Address"
    WAREHOUSE_ADDRESS = "warehouse_address", "Warehouse address"
    RETURN_ADDRESS = "return_address", "Return address"


class SellerOnboardingApplication(models.Model):
    """
    Сущность процесса. Одна активная заявка на SellerProfile.
    """
    seller_profile = models.OneToOneField(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name="onboarding_application",
    )

    seller_type = models.CharField(
        max_length=32,
        choices=SellerType.choices,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=32,
        choices=OnboardingStatus.choices,
        default=OnboardingStatus.DRAFT,
    )

    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role__in": [UserRole.MANAGER, UserRole.ADMIN]},
        related_name="reviewed_onboarding_applications",
    )

    rejected_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_submitted(self):
        self.status = OnboardingStatus.SUBMITTED
        self.submitted_at = timezone.now()

    def __str__(self) -> str:
        return f"OnboardingApplication({self.pk}) {self.status} for {self.seller_profile.user.email}"


class SellerDocument(models.Model):
    """
    Универсальное хранилище документов (KYC/KYB).
    """
    application = models.ForeignKey(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    doc_type = models.CharField(max_length=64, choices=SellerDocumentType.choices)
    scope = models.CharField(max_length=64, choices=SellerDocumentScope.choices)

    # если документ двусторонний: front/back
    side = models.CharField(max_length=16, blank=True, null=True)

    file = models.FileField(upload_to="seller_onboarding_documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["application", "doc_type", "scope", "side"],
                name="unique_document_per_scope_side",
            )
        ]

    def __str__(self) -> str:
        return f"SellerDocument({self.pk}) {self.doc_type}/{self.scope}"


# -------- Self-employed data --------

class SellerSelfEmployedPersonalDetails(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="self_employed_personal",
    )
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=2, null=True, blank=True)  # ISO country code
    personal_phone = models.CharField(max_length=64, null=True, blank=True)

    def __str__(self) -> str:
        return f"SelfEmployedPersonal({self.pk})"


class SellerSelfEmployedTaxInfo(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="self_employed_tax",
    )
    tax_country = models.CharField(max_length=2, null=True, blank=True)  # ISO
    tin = models.CharField(max_length=64, null=True, blank=True)
    ico = models.CharField(max_length=32, null=True, blank=True)  # CZ/SK only
    vat_id = models.CharField(max_length=64, null=True, blank=True)

    def __str__(self) -> str:
        return f"SelfEmployedTax({self.pk})"


class SellerSelfEmployedAddress(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="self_employed_address",
    )
    street = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    zip_code = models.CharField(max_length=32, null=True, blank=True)
    country = models.CharField(max_length=2, null=True, blank=True)

    # если хочешь формально валидировать "не старше 3 месяцев"
    proof_document_issue_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return f"SelfEmployedAddress({self.pk})"


# -------- Company data --------

class SellerCompanyInfo(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="company_info",
    )

    company_name = models.CharField(max_length=255, null=True, blank=True)
    legal_form = models.CharField(max_length=128, null=True, blank=True)
    country_of_registration = models.CharField(max_length=2, null=True, blank=True)

    business_id = models.CharField(max_length=64, null=True, blank=True)
    ico = models.CharField(max_length=32, null=True, blank=True)  # CZ/SK only
    tin = models.CharField(max_length=64, null=True, blank=True)

    vat_id = models.CharField(max_length=64, null=True, blank=True)

    imports_to_eu = models.BooleanField(default=False)
    eori_number = models.CharField(max_length=64, null=True, blank=True)

    company_phone = models.CharField(max_length=64, null=True, blank=True)

    certificate_issue_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return f"CompanyInfo({self.pk})"


class SellerCompanyRepresentative(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="company_representative",
    )

    first_name = models.CharField(max_length=150, null=True, blank=True)
    last_name = models.CharField(max_length=150, null=True, blank=True)
    role = models.CharField(max_length=64, null=True, blank=True)  # Owner/Director etc.
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=2, null=True, blank=True)

    def __str__(self) -> str:
        return f"CompanyRepresentative({self.pk})"


class SellerCompanyAddress(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="company_address",
    )
    street = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    zip_code = models.CharField(max_length=32, null=True, blank=True)
    country = models.CharField(max_length=2, null=True, blank=True)

    proof_document_issue_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return f"CompanyAddress({self.pk})"


# -------- Common blocks --------

class SellerBankAccount(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="bank_account",
    )
    iban = models.CharField(max_length=34, null=True, blank=True)
    swift_bic = models.CharField(max_length=11, null=True, blank=True)
    account_holder = models.CharField(max_length=255, null=True, blank=True)

    bank_code = models.CharField(max_length=32, null=True, blank=True)  # CZ/SK
    local_account_number = models.CharField(max_length=64, null=True, blank=True)  # CZ/SK

    def __str__(self) -> str:
        return f"BankAccount({self.pk})"


class SellerWarehouseAddress(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="warehouse_address",
    )
    street = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    zip_code = models.CharField(max_length=32, null=True, blank=True)
    country = models.CharField(max_length=2, null=True, blank=True)
    contact_phone = models.CharField(max_length=64, null=True, blank=True)

    proof_document_issue_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return f"WarehouseAddress({self.pk})"


class SellerReturnAddress(models.Model):
    application = models.OneToOneField(
        SellerOnboardingApplication,
        on_delete=models.CASCADE,
        related_name="return_address",
    )
    same_as_warehouse = models.BooleanField(default=True)

    street = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    zip_code = models.CharField(max_length=32, null=True, blank=True)
    country = models.CharField(max_length=2, null=True, blank=True)
    contact_phone = models.CharField(max_length=64, null=True, blank=True)

    proof_document_issue_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return f"ReturnAddress({self.pk})"


class OnboardingActorType(models.TextChoices):
    SELLER = "seller", "Seller"
    ADMIN = "admin", "Admin"
    SYSTEM = "system", "System"


class OnboardingEventType(models.TextChoices):
    # seller
    SECTION_UPDATED = "section_updated", "Section updated"
    DOCUMENT_UPLOADED = "document_uploaded", "Document uploaded"
    DOCUMENT_REPLACED = "document_replaced", "Document replaced"
    DOCUMENT_DELETED = "document_deleted", "Document deleted"
    REVIEW_REQUESTED = "review_requested", "Review requested"

    # moderator
    MODERATION_APPROVED = "moderation_approved", "Moderation approved"
    MODERATION_REJECTED = "moderation_rejected", "Moderation rejected"


class OnboardingAuditLog(models.Model):
    """
    Событийный журнал онбординга (минимальная версия).
    Храним только факт события + минимальный контекст (payload).
    Без "before/after" значений.
    """
    application = models.ForeignKey(
        "sellers.SellerOnboardingApplication",
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )

    actor_type = models.CharField(
        max_length=16,
        choices=OnboardingActorType.choices,
        default=OnboardingActorType.SYSTEM,
    )

    actor = models.ForeignKey(
        "accounts.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="onboarding_audit_logs",
    )

    event_type = models.CharField(max_length=64, choices=OnboardingEventType.choices)

    # Минимальный контекст:
    # - section + changed_fields
    # - doc_type/scope/side
    # - reason (moderation_rejected)
    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["application", "created_at"]),
            models.Index(fields=["event_type", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"OnboardingAuditLog({self.pk}) {self.event_type} app={self.application_id}"
