from __future__ import annotations

import json

from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
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

    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        if app.status != "draft":
            return Response({"detail": "Seller type can only be set in draft status."}, status=status.HTTP_400_BAD_REQUEST)

        ser = SellerTypeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        app.seller_type = ser.validated_data["seller_type"]
        app.current_step = max(app.current_step, 1)
        app.save(update_fields=["seller_type", "current_step", "updated_at"])
        return Response(OnboardingStateSerializer(app).data, status=status.HTTP_200_OK)


def _get_or_create_one_to_one(model_cls, app: SellerOnboardingApplication, related_name: str):
    obj = getattr(app, related_name, None)
    if obj:
        return obj
    return model_cls.objects.create(application=app)


class SellerSelfEmployedPersonalAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerSelfEmployedPersonalDetails, app, "self_employed_personal")
        ser = SelfEmployedPersonalSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedTaxAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerSelfEmployedTaxInfo, app, "self_employed_tax")
        ser = SelfEmployedTaxSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerSelfEmployedAddress, app, "self_employed_address")
        ser = SelfEmployedAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyInfoAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerCompanyInfo, app, "company_info")
        ser = CompanyInfoSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyRepresentativeAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerCompanyRepresentative, app, "company_representative")
        ser = CompanyRepresentativeSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerCompanyAddress, app, "company_address")
        ser = CompanyAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerBankAccountAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerBankAccount, app, "bank_account")
        ser = BankAccountSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerWarehouseAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerWarehouseAddress, app, "warehouse_address")
        ser = WarehouseAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerReturnAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerReturnAddress, app, "return_address")
        ser = ReturnAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerDocumentUploadAPIView(APIView):
    permission_classes = [IsSeller]

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

    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        app = submit_application(app)
        return Response(OnboardingStateSerializer(app).data, status=status.HTTP_200_OK)
