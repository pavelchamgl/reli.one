from rest_framework import serializers

from .models import (
    SellerOnboardingApplication,
    SellerType,
    SellerDocument,
    SellerIdentityDocumentSubtype,
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
        fields = ["id", "seller_type", "status", "submitted_at", "reviewed_at", "rejected_reason"]


class OnboardingCompletenessSerializer(serializers.Serializer):
    seller_type_selected = serializers.BooleanField()
    personal_complete = serializers.BooleanField()
    tax_complete = serializers.BooleanField()
    address_complete = serializers.BooleanField()
    bank_complete = serializers.BooleanField()
    warehouse_complete = serializers.BooleanField()
    return_complete = serializers.BooleanField()
    documents_complete = serializers.BooleanField()
    is_submittable = serializers.BooleanField()


class DocumentsRequirementSerializer(serializers.Serializer):
    doc_type = serializers.CharField()
    scope = serializers.CharField()
    identity_document_subtypes = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )
    status = serializers.ChoiceField(choices=["satisfied", "missing"])
    satisfied_by = serializers.ChoiceField(
        choices=["double_sided", "single_sided"],
        allow_null=True,
        required=False,
    )
    # side может быть "front"/"back" либо null (для single-sided в вашей модели)
    uploaded_sides = serializers.ListField(
        child=serializers.CharField(allow_null=True),
    )
    document_ids = serializers.ListField(
        child=serializers.IntegerField(),
    )


class DocumentsSummaryCountsSerializer(serializers.Serializer):
    total_uploaded = serializers.IntegerField()
    used_for_requirements = serializers.IntegerField()
    extra_unused = serializers.IntegerField()


class DocumentsSummarySerializer(serializers.Serializer):
    requirements = DocumentsRequirementSerializer(many=True)
    counts = DocumentsSummaryCountsSerializer()


class DocumentsMissingItemSerializer(serializers.Serializer):
    doc_type = serializers.CharField()
    scope = serializers.CharField()
    rule = serializers.CharField()
    missing_sides = serializers.ListField(
        child=serializers.CharField(allow_null=True),
    )
    # есть не во всех правилах — optional
    accepts_single_side = serializers.BooleanField(required=False)


class OnboardingStateResponseSerializer(serializers.Serializer):
    # поля заявки (как в OnboardingStateSerializer)
    id = serializers.IntegerField()
    seller_type = serializers.CharField(allow_null=True, required=False)
    status = serializers.CharField()
    submitted_at = serializers.DateTimeField(allow_null=True, required=False)
    reviewed_at = serializers.DateTimeField(allow_null=True, required=False)
    rejected_reason = serializers.CharField(allow_null=True, required=False)

    # computed fields
    completeness = OnboardingCompletenessSerializer()
    is_editable = serializers.BooleanField()
    can_submit = serializers.BooleanField()
    requires_onboarding = serializers.BooleanField()
    next_step = serializers.CharField(allow_null=True, required=False)

    documents_summary = DocumentsSummarySerializer()
    documents_missing = DocumentsMissingItemSerializer(many=True)


class SellerDocumentCreateSerializer(serializers.ModelSerializer):
    """
    Финальный сериалайзер для загрузки KYC/KYB документов.

    Поведение:
    - side="" -> None (важно для multipart/form-data)
    - identity_document:
        - passport: side=None или side="front"
        - id_card: side="front" или side="back"
        - driving_license: side="front" или side="back"
    - proof_of_address, registration_certificate:
        только односторонние (side=None / front)
    - корректность набора сторон для completeness проверяется в compute_completeness
    """

    # Разрешённые scope для каждого типа документа
    ALLOWED_SCOPES = {
        "identity_document": {
            "self_employed_personal",
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

    identity_document_subtype = serializers.ChoiceField(
        choices=SellerIdentityDocumentSubtype.choices,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SellerDocument
        fields = [
            "doc_type",
            "scope",
            "identity_document_subtype",
            "side",
            "file",
        ]

    def validate_side(self, value):
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
        subtype = attrs.get("identity_document_subtype")

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

        # subtype допустим только для identity_document
        if doc_type != "identity_document" and subtype is not None:
            raise serializers.ValidationError(
                {
                    "identity_document_subtype": (
                        "identity_document_subtype can be used only with identity_document."
                    )
                }
            )

        # для identity_document subtype желателен, но не обязателен,
        # чтобы не сломать старых клиентов
        if doc_type == "identity_document":
            if subtype == SellerIdentityDocumentSubtype.PASSPORT:
                if side == "back":
                    raise serializers.ValidationError(
                        {
                            "side": "Passport is a single-sided document. Side 'back' is not allowed."
                        }
                    )

            elif subtype in {
                SellerIdentityDocumentSubtype.ID_CARD,
                SellerIdentityDocumentSubtype.DRIVING_LICENSE,
            }:
                if side is None:
                    raise serializers.ValidationError(
                        {
                            "side": "For id_card and driving_license, side must be 'front' or 'back'."
                        }
                    )

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
            "identity_document_subtype",
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
        fields = ["tax_country", "tin", "business_id", "vat_id"]


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
