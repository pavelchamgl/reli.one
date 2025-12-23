from __future__ import annotations

import json

from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.core.files.storage import default_storage

from .models import (
    SellerOnboardingApplication,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
    SellerSelfEmployedAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
    SellerCompanyAddress,
    SellerBankAccount,
    SellerWarehouseAddress,
    SellerReturnAddress,
    SellerDocument,
)
from .permissions_onboarding import IsSeller
from .serializers_onboarding import (
    SellerTypeSerializer,
    OnboardingStateSerializer,
    SellerDocumentCreateSerializer,
    SellerDocumentReadSerializer,
    SelfEmployedPersonalSerializer,
    SelfEmployedTaxSerializer,
    SelfEmployedAddressSerializer,
    CompanyInfoSerializer,
    CompanyRepresentativeSerializer,
    CompanyAddressSerializer,
    BankAccountSerializer,
    WarehouseAddressSerializer,
    ReturnAddressSerializer,
)
from .services_onboarding import (
    get_or_create_application_for_user,
    compute_completeness,
    submit_application,
)


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}

MAX_FILE_SIZE_MB = 10
MAX_FILES_PER_REQUEST = 5


class SellerOnboardingStateAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get seller onboarding state",
        description=(
            "Returns current onboarding application state for the authenticated seller.\n\n"
            "The response includes:\n"
            "- onboarding application metadata (status, step, timestamps)\n"
            "- computed completeness flags for each onboarding block\n"
            "- `is_submittable` flag indicating whether the application can be submitted\n\n"
            "This endpoint is intended to be called:\n"
            "- on onboarding page load\n"
            "- after saving any onboarding block\n"
            "- before showing review / submit screen"
        ),
        responses={
            200: OpenApiResponse(
                description="Current onboarding state and completeness flags",
                examples=[
                    OpenApiExample(
                        name="Draft onboarding (incomplete)",
                        value={
                            "id": 12,
                            "seller_type": "self_employed",
                            "status": "draft",
                            "current_step": 4,
                            "submitted_at": None,
                            "reviewed_at": None,
                            "rejected_reason": None,
                            "completeness": {
                                "seller_type_selected": True,
                                "personal_complete": True,
                                "tax_complete": False,
                                "address_complete": True,
                                "bank_complete": False,
                                "warehouse_complete": False,
                                "return_complete": False,
                                "documents_complete": False,
                                "is_submittable": False,
                            },
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Ready for submission",
                        value={
                            "id": 12,
                            "seller_type": "company",
                            "status": "draft",
                            "current_step": 6,
                            "submitted_at": None,
                            "reviewed_at": None,
                            "rejected_reason": None,
                            "completeness": {
                                "seller_type_selected": True,
                                "personal_complete": True,
                                "tax_complete": True,
                                "address_complete": True,
                                "bank_complete": True,
                                "warehouse_complete": True,
                                "return_complete": True,
                                "documents_complete": True,
                                "is_submittable": True,
                            },
                        },
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        data = OnboardingStateSerializer(app).data
        completeness = compute_completeness(app)
        data["completeness"] = {
            "seller_type_selected": completeness.seller_type_selected,
            "personal_complete": completeness.personal_complete,
            "tax_complete": completeness.tax_complete,
            "address_complete": completeness.address_complete,
            "bank_complete": completeness.bank_complete,
            "warehouse_complete": completeness.warehouse_complete,
            "return_complete": completeness.return_complete,
            "documents_complete": completeness.documents_complete,
            "is_submittable": completeness.is_submittable,
        }
        return Response(data, status=status.HTTP_200_OK)


class SellerSetSellerTypeAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Set seller type for onboarding",
        description=(
            "Sets the seller type for the current onboarding application.\n\n"
            "This is the first mandatory step of seller onboarding. "
            "Seller type determines which data blocks and documents "
            "are required in subsequent steps.\n\n"
            "Allowed values:\n"
            "- `self_employed` — self-employed / sole proprietor\n"
            "- `company` — company / legal entity\n\n"
            "Seller type can only be changed while the onboarding application "
            "is in `draft` status."
        ),
        request=SellerTypeSerializer,
        responses={
            200: OpenApiResponse(
                description="Seller type successfully set",
                examples=[
                    OpenApiExample(
                        name="Self-employed selected",
                        value={
                            "id": 12,
                            "seller_type": "self_employed",
                            "status": "draft",
                            "current_step": 1,
                            "submitted_at": None,
                            "reviewed_at": None,
                            "rejected_reason": None,
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Company selected",
                        value={
                            "id": 12,
                            "seller_type": "company",
                            "status": "draft",
                            "current_step": 1,
                            "submitted_at": None,
                            "reviewed_at": None,
                            "rejected_reason": None,
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request or onboarding is not in draft status",
                examples=[
                    OpenApiExample(
                        name="Not draft status",
                        value={
                            "detail": "Seller type can only be set in draft status."
                        },
                        response_only=True,
                    )
                ],
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        if app.status != "draft":
            return Response(
                {"detail": "Seller type can only be set in draft status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = SellerTypeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        app.seller_type = ser.validated_data["seller_type"]
        app.current_step = max(app.current_step, 1)
        app.save(update_fields=["seller_type", "current_step", "updated_at"])

        return Response(
            OnboardingStateSerializer(app).data,
            status=status.HTTP_200_OK,
        )


def _get_or_create_one_to_one(model_cls, app: SellerOnboardingApplication, related_name: str):
    obj = getattr(app, related_name, None)
    if obj:
        return obj
    return model_cls.objects.create(application=app)


class SellerSelfEmployedPersonalAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update self-employed personal details",
        description=(
            "Updates personal details for a self-employed seller during onboarding.\n\n"
            "This endpoint stores personal identification data required for KYC verification, "
            "such as date of birth and nationality.\n\n"
            "The data is saved in a draft state and can be updated multiple times "
            "until the onboarding application is submitted."
        ),
        request=SelfEmployedPersonalSerializer,
        responses={
            200: OpenApiResponse(
                description="Personal details successfully saved",
                examples=[
                    OpenApiExample(
                        name="Personal details updated",
                        value={
                            "date_of_birth": "1990-05-12",
                            "nationality": "PL",
                            "personal_phone": "+48123123123",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerSelfEmployedPersonalDetails,
            app,
            "self_employed_personal",
        )
        ser = SelfEmployedPersonalSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedTaxAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update self-employed tax information",
        description=(
            "Updates tax-related information for a self-employed seller during onboarding.\n\n"
            "This endpoint stores tax identification data required for KYB/KYC compliance, "
            "including tax country and tax identification number (TIN).\n\n"
            "The data can be updated multiple times while the onboarding application "
            "remains in draft status."
        ),
        request=SelfEmployedTaxSerializer,
        responses={
            200: OpenApiResponse(
                description="Tax information successfully saved",
                examples=[
                    OpenApiExample(
                        name="Tax info updated",
                        value={
                            "tax_country": "PL",
                            "tin": "1234567890",
                            "ico": None,
                            "vat_id": "PL1234567890",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerSelfEmployedTaxInfo,
            app,
            "self_employed_tax",
        )
        ser = SelfEmployedTaxSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedAddressAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update self-employed address",
        description=(
            "Updates the residential address of a self-employed seller during onboarding.\n\n"
            "This address is used for KYC verification and must correspond "
            "to the proof of address document uploaded later.\n\n"
            "The information can be updated multiple times while the onboarding "
            "application remains in draft status."
        ),
        request=SelfEmployedAddressSerializer,
        responses={
            200: OpenApiResponse(
                description="Self-employed address successfully saved",
                examples=[
                    OpenApiExample(
                        name="Address updated",
                        value={
                            "street": "Main Street 12",
                            "city": "Warsaw",
                            "zip_code": "00-001",
                            "country": "PL",
                            "proof_document_issue_date": "2025-01-10",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerSelfEmployedAddress,
            app,
            "self_employed_address",
        )
        ser = SelfEmployedAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyInfoAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update company information",
        description=(
            "Updates company identification and registration details during seller onboarding.\n\n"
            "This endpoint is applicable only for sellers with seller type `company` "
            "(legal entities).\n\n"
            "The provided information is used for KYB verification and must match "
            "the uploaded company registration documents.\n\n"
            "Data can be updated multiple times while the onboarding application "
            "is in draft status."
        ),
        request=CompanyInfoSerializer,
        responses={
            200: OpenApiResponse(
                description="Company information successfully saved",
                examples=[
                    OpenApiExample(
                        name="Company info updated",
                        value={
                            "company_name": "Reli Group s.r.o.",
                            "legal_form": "s.r.o.",
                            "country_of_registration": "CZ",
                            "business_id": "12345678",
                            "ico": "12345678",
                            "tin": "CZ12345678",
                            "vat_id": "CZ12345678",
                            "imports_to_eu": True,
                            "eori_number": "CZEORI123456",
                            "company_phone": "+420777123456",
                            "certificate_issue_date": "2024-11-15",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerCompanyInfo,
            app,
            "company_info",
        )
        ser = CompanyInfoSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyRepresentativeAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update company representative details",
        description=(
            "Updates personal details of the company representative during seller onboarding.\n\n"
            "This endpoint is applicable only for sellers with seller type `company`.\n\n"
            "The representative is a natural person authorized to act on behalf of the company "
            "(e.g. owner, director, or authorized signatory). "
            "The provided information is used for KYC verification and must match "
            "the uploaded identity document.\n\n"
            "Data can be updated multiple times while the onboarding application "
            "remains in draft status."
        ),
        request=CompanyRepresentativeSerializer,
        responses={
            200: OpenApiResponse(
                description="Company representative details successfully saved",
                examples=[
                    OpenApiExample(
                        name="Representative updated",
                        value={
                            "first_name": "Jan",
                            "last_name": "Novák",
                            "role": "Managing Director",
                            "date_of_birth": "1985-03-22",
                            "nationality": "CZ",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerCompanyRepresentative,
            app,
            "company_representative",
        )
        ser = CompanyRepresentativeSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyAddressAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update company registered address",
        description=(
            "Updates the registered legal address of the company during seller onboarding.\n\n"
            "This endpoint is applicable only for sellers with seller type `company`.\n\n"
            "The address must correspond to the company registration details and "
            "must match the uploaded proof of address document.\n\n"
            "Data can be updated multiple times while the onboarding application "
            "remains in draft status."
        ),
        request=CompanyAddressSerializer,
        responses={
            200: OpenApiResponse(
                description="Company address successfully saved",
                examples=[
                    OpenApiExample(
                        name="Company address updated",
                        value={
                            "street": "Václavské náměstí 1",
                            "city": "Praha",
                            "zip_code": "11000",
                            "country": "CZ",
                            "proof_document_issue_date": "2024-12-01",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerCompanyAddress,
            app,
            "company_address",
        )
        ser = CompanyAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerBankAccountAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update seller bank account details",
        description=(
            "Updates bank account information used for seller payouts during onboarding.\n\n"
            "This endpoint is mandatory for all sellers, regardless of seller type "
            "(self-employed or company).\n\n"
            "The bank account holder name must match:\n"
            "- seller full name for self-employed sellers\n"
            "- company name for company sellers\n\n"
            "The provided information is validated before onboarding submission "
            "and is required to complete the onboarding process."
        ),
        request=BankAccountSerializer,
        responses={
            200: OpenApiResponse(
                description="Bank account details successfully saved",
                examples=[
                    OpenApiExample(
                        name="Bank account updated (IBAN)",
                        value={
                            "iban": "PL61109010140000071219812874",
                            "swift_bic": "WBKPPLPP",
                            "account_holder": "Jan Kowalski",
                            "bank_code": "1090",
                            "local_account_number": "071219812874",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerBankAccount,
            app,
            "bank_account",
        )
        ser = BankAccountSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerWarehouseAddressAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update warehouse address",
        description=(
            "Updates the warehouse (shipping origin) address used by the seller.\n\n"
            "This address is required for logistics, shipping calculations, "
            "and courier integrations. It may also be subject to compliance "
            "and address verification.\n\n"
            "This endpoint is mandatory for all sellers and must be completed "
            "before onboarding submission."
        ),
        request=WarehouseAddressSerializer,
        responses={
            200: OpenApiResponse(
                description="Warehouse address successfully saved",
                examples=[
                    OpenApiExample(
                        name="Warehouse address updated",
                        value={
                            "street": "Logistics Park 7",
                            "city": "Wrocław",
                            "zip_code": "50-001",
                            "country": "PL",
                            "contact_phone": "+48777123456",
                            "proof_document_issue_date": "2024-10-20",
                        },
                        response_only=True,
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerWarehouseAddress,
            app,
            "warehouse_address",
        )
        ser = WarehouseAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerReturnAddressAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update return address",
        description=(
            "Updates the return address used for customer returns during seller onboarding.\n\n"
            "If `same_as_warehouse` is set to `true`, the warehouse address "
            "will be used automatically as the return address.\n\n"
            "If `same_as_warehouse` is set to `false`, a separate return address "
            "must be provided.\n\n"
            "This endpoint is mandatory for all sellers and must be completed "
            "before onboarding submission."
        ),
        request=ReturnAddressSerializer,
        responses={
            200: OpenApiResponse(
                description="Return address successfully saved",
                examples=[
                    OpenApiExample(
                        name="Return address same as warehouse",
                        value={
                            "same_as_warehouse": True,
                            "street": None,
                            "city": None,
                            "zip_code": None,
                            "country": None,
                            "contact_phone": None,
                            "proof_document_issue_date": None,
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Separate return address",
                        value={
                            "same_as_warehouse": False,
                            "street": "Returns Center 5",
                            "city": "Poznań",
                            "zip_code": "60-001",
                            "country": "PL",
                            "contact_phone": "+48600123456",
                            "proof_document_issue_date": "2024-11-01",
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request data",
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(
            SellerReturnAddress,
            app,
            "return_address",
        )
        ser = ReturnAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])

        return Response(ser.data, status=status.HTTP_200_OK)


class SellerDocumentUploadAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Upload KYC/KYB documents",
        description=(
            "Uploads documents required for KYC/KYB verification during seller onboarding.\n\n"
            "This endpoint supports two modes:\n\n"
            "1. Single document upload\n"
            "- Uploads one document per request\n"
            "- Replaces any existing document with the same `(doc_type, scope, side)`\n\n"
            "2. Batch document upload\n"
            "- Uploads multiple documents in a single request\n"
            "- Uses a JSON array in `documents` field and matching files in `files[]`\n"
            "- Each uploaded document replaces any existing document with the same key\n\n"
            "Documents are validated by MIME type and file size. "
            "Completeness of required documents is evaluated separately "
            "via onboarding state endpoint."
        ),
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "doc_type": {
                        "type": "string",
                        "example": "identity_document",
                    },
                    "scope": {
                        "type": "string",
                        "example": "company_representative",
                    },
                    "side": {
                        "type": "string",
                        "nullable": True,
                        "example": "front",
                    },
                    "file": {
                        "type": "string",
                        "format": "binary",
                    },
                    "documents": {
                        "type": "string",
                        "description": "JSON array of document metadata (batch upload)",
                        "example": (
                            '[{"doc_type":"identity_document","scope":"company_representative","side":"front"},'
                            '{"doc_type":"identity_document","scope":"company_representative","side":"back"}]'
                        ),
                    },
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "binary",
                        },
                    },
                },
            }
        },
        responses={
            201: OpenApiResponse(
                description="Document(s) successfully uploaded",
                examples=[
                    OpenApiExample(
                        name="Single document uploaded",
                        value={
                            "id": 45,
                            "doc_type": "identity_document",
                            "scope": "company_representative",
                            "side": "front",
                            "file": "/media/seller_onboarding_documents/id_front.jpg",
                            "uploaded_at": "2025-01-15T12:30:00Z",
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Batch documents uploaded",
                        value=[
                            {
                                "id": 46,
                                "doc_type": "identity_document",
                                "scope": "company_representative",
                                "side": "front",
                                "file": "/media/seller_onboarding_documents/id_front.jpg",
                                "uploaded_at": "2025-01-15T12:31:00Z",
                            },
                            {
                                "id": 47,
                                "doc_type": "identity_document",
                                "scope": "company_representative",
                                "side": "back",
                                "file": "/media/seller_onboarding_documents/id_back.jpg",
                                "uploaded_at": "2025-01-15T12:31:01Z",
                            },
                        ],
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request or validation error",
                examples=[
                    OpenApiExample(
                        name="Invalid content type",
                        value={"detail": "Content-Type must be multipart/form-data"},
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Invalid file type",
                        value={"detail": "Unsupported file type: application/x-msdownload"},
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    @transaction.atomic
    def post(self, request):
        if not request.content_type or not request.content_type.startswith("multipart/form-data"):
            raise ValidationError("Content-Type must be multipart/form-data")

        app = get_or_create_application_for_user(request.user)

        if "documents" in request.data:
            return self._handle_batch_upload(request, app)

        return self._handle_single_upload(request, app)

    # SINGLE FILE UPLOAD
    def _handle_single_upload(self, request, app):
        serializer = SellerDocumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data.get("file")
        self._validate_file(file)

        self._replace_existing_document(app, serializer.validated_data)

        document = SellerDocument.objects.create(
            application=app,
            **serializer.validated_data,
        )

        return Response(
            SellerDocumentReadSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )

    # BATCH FILE UPLOAD
    def _handle_batch_upload(self, request, app):
        try:
            documents_meta = json.loads(request.data.get("documents", "[]"))
        except json.JSONDecodeError:
            raise ValidationError("Invalid JSON in 'documents' field")

        if not documents_meta:
            raise ValidationError("Documents metadata list is empty")

        files = request.FILES.getlist("files")

        if not files:
            raise ValidationError("No files provided")

        if len(documents_meta) != len(files):
            raise ValidationError(
                "Documents metadata count does not match files count"
            )

        if len(files) > MAX_FILES_PER_REQUEST:
            raise ValidationError(
                f"Maximum {MAX_FILES_PER_REQUEST} files allowed per request"
            )

        created_documents = []

        for meta, file in zip(documents_meta, files):
            self._validate_file(file)

            serializer = SellerDocumentCreateSerializer(
                data={**meta, "file": file}
            )
            serializer.is_valid(raise_exception=True)

            self._replace_existing_document(app, serializer.validated_data)

            document = SellerDocument.objects.create(
                application=app,
                **serializer.validated_data,
            )

            created_documents.append(document)

        return Response(
            SellerDocumentReadSerializer(created_documents, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    # FILE VALIDATION
    def _validate_file(self, file):
        if not file:
            raise ValidationError("File is required")

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise ValidationError(
                f"Unsupported file type: {file.content_type}"
            )

        max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(
                f"File size exceeds {MAX_FILE_SIZE_MB} MB limit"
            )

    # REPLACE EXISTING DOCUMENT (KYC CORE LOGIC)
    def _replace_existing_document(self, app, data):
        """
        KYC/KYB rule:
        One actual document per:
        (application, doc_type, scope, side)
        """

        existing_docs = SellerDocument.objects.filter(
            application=app,
            doc_type=data.get("doc_type"),
            scope=data.get("scope"),
            side=data.get("side"),
        )

        for old_doc in existing_docs:
            if old_doc.file:
                default_storage.delete(old_doc.file.name)
            old_doc.delete()


class SellerOnboardingReviewAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Review onboarding application before submission",
        description=(
            "Returns a full review of the current seller onboarding application.\n\n"
            "This endpoint **does not modify any data**. It is used to:\n"
            "- Check whether the onboarding application is complete\n"
            "- Determine if the application can be submitted for verification\n"
            "- Inspect completeness of each required block (data & documents)\n\n"
            "Typically called before invoking the submit endpoint."
        ),
        responses={
            200: OpenApiResponse(
                description="Onboarding review data",
                examples=[
                    OpenApiExample(
                        name="Review response",
                        value={
                            "application": {
                                "id": 12,
                                "seller_type": "company",
                                "status": "draft",
                                "current_step": 4,
                                "submitted_at": None,
                                "reviewed_at": None,
                                "rejected_reason": None,
                            },
                            "is_submittable": True,
                            "completeness": {
                                "seller_type_selected": True,
                                "personal_complete": True,
                                "tax_complete": True,
                                "address_complete": True,
                                "bank_complete": True,
                                "warehouse_complete": True,
                                "return_complete": True,
                                "documents_complete": True,
                            },
                        },
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        completeness = compute_completeness(app)
        data = {
            "application": OnboardingStateSerializer(app).data,
            "is_submittable": completeness.is_submittable,
            "completeness": {
                "seller_type_selected": completeness.seller_type_selected,
                "personal_complete": completeness.personal_complete,
                "tax_complete": completeness.tax_complete,
                "address_complete": completeness.address_complete,
                "bank_complete": completeness.bank_complete,
                "warehouse_complete": completeness.warehouse_complete,
                "return_complete": completeness.return_complete,
                "documents_complete": completeness.documents_complete,
            },
        }
        return Response(data, status=status.HTTP_200_OK)


class SellerOnboardingSubmitAPIView(APIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Submit onboarding application for verification",
        description=(
            "Submits the seller onboarding application for verification.\n\n"
            "This endpoint:\n"
            "- Performs **strict validation** of all required onboarding blocks\n"
            "- Validates documents, bank account, addresses and seller type\n"
            "- Changes application status to `pending_verification`\n\n"
            "Submission is only allowed when the application is complete.\n"
            "If validation fails, a detailed error structure is returned."
        ),
        responses={
            200: OpenApiResponse(
                description="Onboarding application successfully submitted",
                examples=[
                    OpenApiExample(
                        name="Successful submission",
                        value={
                            "id": 12,
                            "seller_type": "company",
                            "status": "pending_verification",
                            "current_step": 4,
                            "submitted_at": "2025-12-23T10:15:30Z",
                            "reviewed_at": None,
                            "rejected_reason": None,
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description="Validation error – onboarding application is incomplete",
                examples=[
                    OpenApiExample(
                        name="Validation errors",
                        value={
                            "bank_account": "Bank account is required.",
                            "warehouse_address": "Warehouse address is incomplete.",
                            "completeness": {
                                "seller_type_selected": True,
                                "personal_complete": True,
                                "tax_complete": False,
                                "address_complete": True,
                                "bank_complete": False,
                                "warehouse_complete": False,
                                "return_complete": True,
                                "documents_complete": True,
                            },
                        },
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        app = submit_application(app)
        return Response(OnboardingStateSerializer(app).data, status=status.HTTP_200_OK)
