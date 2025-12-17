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


class SellerDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerDocument
        fields = ["id", "doc_type", "scope", "side", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


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
