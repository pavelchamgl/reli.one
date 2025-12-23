from rest_framework import serializers

from .models import (
    SellerOnboardingApplication,
    SellerType,
    SellerDocument,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
    SellerSelfEmployedAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
    SellerCompanyAddress,
    SellerBankAccount,
    SellerWarehouseAddress,
    SellerReturnAddress,
)


class SellerTypeSerializer(serializers.Serializer):
    seller_type = serializers.ChoiceField(choices=SellerType.choices)


class OnboardingStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerOnboardingApplication
        fields = ["id", "seller_type", "status", "current_step", "submitted_at", "reviewed_at", "rejected_reason"]


class SellerDocumentCreateSerializer(serializers.ModelSerializer):
    """
    Финальный сериалайзер для загрузки KYC/KYB документов.

    Поведение:
    - side="" -> None (важно для multipart/form-data)
    - passport:
        side=None или side="front"
    - ID / residence:
        side="front" или "back"
    - proof_of_address, registration_certificate:
        только односторонние (side=None / front)
    - корректность количества сторон проверяется в compute_completeness
    """

    # Разрешённые scope для каждого типа документа
    ALLOWED_SCOPES = {
        "identity_document": {
            "self_employed_personal",
            "company_representative",
        },
        "proof_of_address": {
            "self_employed_address",
            "company_address",
            "warehouse_address",
            "return_address",
        },
        "registration_certificate": {
            "company_info",
        },
    }

    SINGLE_SIDED_DOCS = {
        "proof_of_address",
        "registration_certificate",
    }

    class Meta:
        model = SellerDocument
        fields = [
            "doc_type",
            "scope",
            "side",
            "file",
        ]

    def validate_side(self, value):
        """
        Postman multipart:
        - пустое поле приходит как ""
        """
        if value in ("", None):
            return None

        value = value.lower()
        if value not in {"front", "back"}:
            raise serializers.ValidationError(
                "Invalid side value. Allowed values: 'front', 'back' or null."
            )
        return value

    def validate(self, attrs):
        doc_type = attrs.get("doc_type")
        scope = attrs.get("scope")
        side = attrs.get("side")

        # --- doc_type -> scope ---
        allowed_scopes = self.ALLOWED_SCOPES.get(doc_type)
        if not allowed_scopes:
            raise serializers.ValidationError(
                {"doc_type": "Unsupported document type."}
            )

        if scope not in allowed_scopes:
            raise serializers.ValidationError(
                {
                    "scope": (
                        f"Invalid scope '{scope}' for document type '{doc_type}'. "
                        f"Allowed scopes: {sorted(allowed_scopes)}"
                    )
                }
            )

        # --- односторонние документы ---
        if doc_type in self.SINGLE_SIDED_DOCS and side == "back":
            raise serializers.ValidationError(
                {
                    "side": (
                        f"{doc_type} is a single-sided document. "
                        "Side 'back' is not allowed."
                    )
                }
            )

        return attrs

class SellerDocumentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerDocument
        fields = [
            "id",
            "doc_type",
            "scope",
            "side",
            "file",
            "uploaded_at",
        ]
        read_only_fields = fields


# ----- Block serializers -----

class SelfEmployedPersonalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerSelfEmployedPersonalDetails
        fields = ["date_of_birth", "nationality", "personal_phone"]


class SelfEmployedTaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerSelfEmployedTaxInfo
        fields = ["tax_country", "tin", "ico", "vat_id"]


class SelfEmployedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerSelfEmployedAddress
        fields = ["street", "city", "zip_code", "country", "proof_document_issue_date"]


class CompanyInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerCompanyInfo
        fields = [
            "company_name",
            "legal_form",
            "country_of_registration",
            "business_id",
            "ico",
            "tin",
            "vat_id",
            "imports_to_eu",
            "eori_number",
            "company_phone",
            "certificate_issue_date",
        ]


class CompanyRepresentativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerCompanyRepresentative
        fields = ["first_name", "last_name", "role", "date_of_birth", "nationality"]


class CompanyAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerCompanyAddress
        fields = ["street", "city", "zip_code", "country", "proof_document_issue_date"]


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerBankAccount
        fields = ["iban", "swift_bic", "account_holder", "bank_code", "local_account_number"]


class WarehouseAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerWarehouseAddress
        fields = ["street", "city", "zip_code", "country", "contact_phone", "proof_document_issue_date"]


class ReturnAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerReturnAddress
        fields = ["same_as_warehouse", "street", "city", "zip_code", "country", "contact_phone", "proof_document_issue_date"]
