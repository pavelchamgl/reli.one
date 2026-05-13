from __future__ import annotations

import json

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.core.files.storage import default_storage

from .models import (
    SellerWarehouseAddress,
    SellerReturnAddress,
    SellerDocument,
)
from .drf_hooks import AuditAPIView
from .permissions_onboarding import IsSeller
from .serializers_onboarding import (
    SellerDocumentCreateSerializer,
    SellerDocumentReadSerializer,
    WarehouseAddressSerializer,
    ReturnAddressSerializer,
)
from .services_onboarding import (
    ensure_application_editable,
    get_or_create_application_for_user,
    get_or_create_onboarding_block,
    get_onboarding_block_or_none,
)
from .onboarding.steps.state import SellerOnboardingStateAPIView
from .onboarding.steps.seller_type import SellerSetSellerTypeAPIView
from .onboarding.steps.self_employed import (
    SellerSelfEmployedAddressAPIView,
    SellerSelfEmployedPersonalAPIView,
    SellerSelfEmployedTaxAPIView,
)
from .onboarding.steps.company import (
    SellerCompanyAddressAPIView,
    SellerCompanyInfoAPIView,
    SellerCompanyRepresentativeAPIView,
)
from .onboarding.steps.bank import SellerBankAccountAPIView
from .onboarding.review.review import SellerOnboardingReviewAPIView
from .onboarding.review.submit import SellerOnboardingSubmitAPIView


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}

MAX_FILE_SIZE_MB = 10
MAX_FILES_PER_REQUEST = 5


class SellerWarehouseAddressAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get warehouse address",
        description=(
            "Returns saved warehouse (shipping origin) address.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=WarehouseAddressSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "street": "Logistics Park 7",
                            "city": "Wrocław",
                            "zip_code": "50-001",
                            "country": "PL",
                            "contact_phone": "+48777123456",
                            "proof_document_issue_date": "2024-10-20",
                        },
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = get_onboarding_block_or_none(app, "warehouse_address")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(WarehouseAddressSerializer(obj).data, status=status.HTTP_200_OK)

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
                response=WarehouseAddressSerializer,
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
                description="Invalid request data or onboarding is not editable",
                examples=[
                    OpenApiExample(
                        name="Not editable status",
                        value={"detail": "Only draft/rejected applications can be edited."},
                        response_only=True,
                    )
                ],
            ),
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        ensure_application_editable(app)

        obj = get_or_create_onboarding_block(
            SellerWarehouseAddress,
            app,
            "warehouse_address",
        )
        ser = WarehouseAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerReturnAddressAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get return address",
        description=(
            "Returns saved return address used for customer returns.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=ReturnAddressSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
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
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = get_onboarding_block_or_none(app, "return_address")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(ReturnAddressSerializer(obj).data, status=status.HTTP_200_OK)

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
                response=ReturnAddressSerializer,
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
                description="Invalid request data or onboarding is not editable",
                examples=[
                    OpenApiExample(
                        name="Not editable status",
                        value={"detail": "Only draft/rejected applications can be edited."},
                        response_only=True,
                    )
                ],
            ),
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        ensure_application_editable(app)

        obj = get_or_create_onboarding_block(
            SellerReturnAddress,
            app,
            "return_address",
        )
        ser = ReturnAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerDocumentUploadAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="List uploaded documents",
        description=(
            "Returns list of uploaded documents for the current onboarding application.\n\n"
            "Frontend should use this endpoint to display already uploaded documents "
            "and allow replacing them when onboarding is editable."
        ),
        responses={
            200: OpenApiResponse(
                response=SellerDocumentReadSerializer(many=True),
                description="Document(s) successfully uploaded",
                examples=[
                    OpenApiExample(
                        name="Documents list example",
                        value=[
                            {
                                "id": 46,
                                "doc_type": "registration_certificate",
                                "scope": "company_info",
                                "identity_document_subtype": None,
                                "side": None,
                                "file": "/media/seller_onboarding_documents/company_registration.pdf",
                                "uploaded_at": "2025-01-15T12:31:00Z",
                            },
                            {
                                "id": 47,
                                "doc_type": "proof_of_address",
                                "scope": "company_address",
                                "identity_document_subtype": None,
                                "side": None,
                                "file": "/media/seller_onboarding_documents/company_address.pdf",
                                "uploaded_at": "2025-01-15T12:31:01Z",
                            },
                        ],
                        response_only=True,
                    )
                ],
            ),
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        qs = SellerDocument.objects.filter(application=app).order_by("-uploaded_at", "-id")
        return Response(SellerDocumentReadSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Upload KYC/KYB documents",
        description=(
                "Uploads documents required for KYC/KYB verification during seller onboarding.\n\n"

                "Supported document types:\n"
                "- `identity_document`\n"
                "- `proof_of_address`\n"
                "- `registration_certificate`\n\n"

                "For `identity_document`, an optional field `identity_document_subtype` is supported:\n"
                "- `passport`\n"
                "- `id_card`\n"
                "- `driving_license`\n\n"

                "Subtype rules:\n"
                "- `passport` allows `side=null` or `side=front`; `side=back` is not allowed\n"
                "- `id_card` requires explicit `side=front` or `side=back`\n"
                "- `driving_license` requires explicit `side=front` or `side=back`\n\n"

                "Backward compatibility:\n"
                "- `identity_document_subtype` is optional\n"
                "- existing clients may continue uploading `identity_document` without subtype\n"
                "- document completeness is still evaluated by uploaded sides, so older documents remain valid\n\n"

                "This endpoint supports two modes:\n\n"

                "1. Single document upload\n"
                "- Uploads one document per request\n"
                "- Replaces any existing document with the same `(doc_type, scope, side)`\n\n"

                "2. Batch document upload\n"
                "- Uploads multiple documents in a single request\n"
                "- Uses a JSON array in `documents` field and matching files in `files`\n"
                "- The order of files must match the order of objects in `documents`\n"
                "- Each uploaded document replaces any existing document with the same `(doc_type, scope, side)`\n"
                "- Duplicate `(doc_type, scope, side)` combinations within one batch are rejected\n"
                "- For `identity_document`, all entries for the same scope within one batch must use the same subtype\n\n"

                "Allowed scopes by document type:\n"
                "- `identity_document`: `self_employed_personal`\n"
                "- `proof_of_address`: `self_employed_address`, `company_address`, `warehouse_address`, `return_address`\n"
                "- `registration_certificate`: `company_info`\n\n"

                "Validation rules:\n"
                "- Content-Type must be `multipart/form-data`\n"
                "- Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`\n"
                "- Maximum file size: 10 MB per file\n"
                "- Maximum batch size: 5 files per request\n"
                "- `proof_of_address` and `registration_certificate` are single-sided documents\n"
                "- `identity_document_subtype` can only be used with `identity_document`\n"
                "- `documents` must be a valid JSON array of objects in batch mode\n\n"

                "Storage safety:\n"
                "- Existing database records are updated safely instead of being deleted before replacement\n"
                "- Old physical files are deleted only after a successful database commit\n\n"

                "Response format:\n"
                "- single upload returns one uploaded document object\n"
                "- batch upload returns an array of uploaded document objects\n\n"

                "Completeness of required documents is evaluated separately via the onboarding state endpoint."
        ),
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "doc_type": {
                        "type": "string",
                        "enum": [
                            "identity_document",
                            "proof_of_address",
                            "registration_certificate",
                        ],
                        "example": "identity_document",
                    },
                    "scope": {
                        "type": "string",
                        "enum": [
                            "self_employed_personal",
                            "self_employed_address",
                            "company_address",
                            "warehouse_address",
                            "return_address",
                            "company_info",
                        ],
                        "example": "company_info",
                    },
                    "identity_document_subtype": {
                        "type": "string",
                        "nullable": True,
                        "enum": [
                            "passport",
                            "id_card",
                            "driving_license",
                        ],
                        "example": "driving_license",
                        "description": (
                                "Optional. Allowed only for `identity_document`. "
                                "Use `passport`, `id_card`, or `driving_license`."
                        ),
                    },
                    "side": {
                        "type": "string",
                        "nullable": True,
                        "enum": ["front", "back"],
                        "example": "front",
                        "description": (
                                "For single-sided documents, `side` may be omitted/null or set to `front`. "
                                "For `id_card` and `driving_license`, `side` must be `front` or `back`."
                        ),
                    },
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": "Single file upload field.",
                    },
                    "documents": {
                        "type": "string",
                        "description": "JSON array of document metadata for batch upload.",
                        "example": (
                                '[{"doc_type":"registration_certificate","scope":"company_info","side":null},'
                                '{"doc_type":"proof_of_address","scope":"company_address","side":null}]'
                        ),
                    },
                    "files": {
                        "type": "array",
                        "description": "Array of files for batch upload. Order must match the `documents` JSON array.",
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
                description="Single upload returns one document object. Batch upload returns an array of document objects.",
                examples=[
                    OpenApiExample(
                        name="Single passport uploaded",
                        value={
                            "id": 45,
                            "doc_type": "identity_document",
                            "scope": "self_employed_personal",
                            "identity_document_subtype": "passport",
                            "side": "front",
                            "file": "/media/seller_onboarding_documents/passport_front.jpg",
                            "uploaded_at": "2025-01-15T12:30:00Z",
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Proof of address uploaded",
                        value={
                            "id": 48,
                            "doc_type": "proof_of_address",
                            "scope": "company_address",
                            "identity_document_subtype": None,
                            "side": None,
                            "file": "/media/seller_onboarding_documents/company_address_proof.pdf",
                            "uploaded_at": "2025-01-15T12:32:00Z",
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request or validation error.",
                examples=[
                    OpenApiExample(
                        name="Subtype used with non-identity document",
                        value={
                            "identity_document_subtype": (
                                    "identity_document_subtype can be used only with identity_document."
                            )
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Passport back side is not allowed",
                        value={
                            "side": "Passport is a single-sided document. Side 'back' is not allowed."
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Driving license requires explicit side",
                        value={
                            "side": "For id_card and driving_license, side must be 'front' or 'back'."
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Duplicate document key in batch",
                        value={
                            "documents": (
                                    "Batch contains duplicate document keys. "
                                    "Each (doc_type, scope, side) combination must be unique within one request."
                            )
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Conflicting subtype in batch",
                        value={
                            "documents": (
                                    "Batch contains conflicting identity_document_subtype values "
                                    "for scope 'self_employed_personal'. All identity_document entries for the same scope "
                                    "must use the same subtype, including null."
                            )
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Not editable status",
                        value={"detail": "Only draft/rejected applications can be edited."},
                        response_only=True,
                    ),
                ],
            ),
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    @transaction.atomic
    def post(self, request):
        if not request.content_type or not request.content_type.startswith("multipart/form-data"):
            raise ValidationError("Content-Type must be multipart/form-data")

        app = get_or_create_application_for_user(request.user)
        ensure_application_editable(app)

        items = self._prepare_upload_items(request)
        documents = self._save_upload_items(app, items)

        if len(documents) == 1:
            return Response(
                SellerDocumentReadSerializer(documents[0]).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            SellerDocumentReadSerializer(documents, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    def _prepare_upload_items(self, request):
        """
        Полностью валидирует входящий payload ДО любых изменений в БД и storage.
        Возвращает список validated_data для дальнейшего сохранения.
        """
        if request.data.get("documents"):
            return self._prepare_batch_upload_items(request)
        return self._prepare_single_upload_items(request)

    def _prepare_single_upload_items(self, request):
        serializer = SellerDocumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data.get("file")
        self._validate_file(file)

        return [serializer.validated_data]

    def _prepare_batch_upload_items(self, request):
        try:
            documents_meta = json.loads(request.data.get("documents", "[]"))
        except json.JSONDecodeError:
            raise ValidationError("Invalid JSON in 'documents' field")

        if not isinstance(documents_meta, list):
            raise ValidationError("Field 'documents' must be a JSON array")

        if not documents_meta:
            raise ValidationError("Documents metadata list is empty")

        files = request.FILES.getlist("files")
        if not files:
            raise ValidationError("No files provided")

        if len(documents_meta) != len(files):
            raise ValidationError("Documents metadata count does not match files count")

        if len(files) > MAX_FILES_PER_REQUEST:
            raise ValidationError(f"Maximum {MAX_FILES_PER_REQUEST} files allowed per request")

        validated_items = []

        # Сначала валидируем все файлы и все serializer'ы
        for index, (meta, file) in enumerate(zip(documents_meta, files)):
            if not isinstance(meta, dict):
                raise ValidationError(
                    {
                        "documents": (
                            f"Each item in 'documents' must be an object. "
                            f"Invalid item at index {index}."
                        )
                    }
                )

            self._validate_file(file)

            serializer = SellerDocumentCreateSerializer(
                data={**meta, "file": file}
            )
            serializer.is_valid(raise_exception=True)
            validated_items.append(serializer.validated_data)

        # Затем проверяем batch как единое целое
        self._validate_batch_duplicates(validated_items)
        self._validate_batch_identity_subtypes(validated_items)

        return validated_items

    def _validate_file(self, file):
        """
        Валидация физического загружаемого файла.

        Оставляем её на уровне view, потому что:
        - здесь уже есть доступ к upload-specific константам
        - эта проверка нужна и для single, и для batch режима
        - сериализатор сейчас отвечает за бизнес-валидацию метаданных документа,
          а не за MIME/size бинарного файла
        """
        if not file:
            raise ValidationError("File is required")

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise ValidationError(f"Unsupported file type: {file.content_type}")

        max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(f"File size exceeds {MAX_FILE_SIZE_MB} MB limit")

    def _validate_batch_duplicates(self, items):
        """
        Запрещаем присылать в одном batch два документа с одинаковым ключом:
        (doc_type, scope, side)

        Иначе второй элемент просто 'перезатрёт' первый в рамках одного запроса,
        что делает поведение неочевидным и неидемпотентным.
        """
        seen = set()

        for item in items:
            key = (
                item.get("doc_type"),
                item.get("scope"),
                item.get("side"),
            )
            if key in seen:
                raise ValidationError(
                    {
                        "documents": (
                            "Batch contains duplicate document keys. "
                            "Each (doc_type, scope, side) combination must be unique within one request."
                        )
                    }
                )
            seen.add(key)

    def _validate_batch_identity_subtypes(self, items):
        """
        Для identity_document внутри одного batch не даём смешивать subtype
        в рамках одного scope.

        Недопустимы:
        - разные subtype для одного scope
        - сочетание explicit subtype и null subtype для одного scope
        """
        subtype_state_by_scope = {}

        for item in items:
            if item.get("doc_type") != "identity_document":
                continue

            scope = item.get("scope")
            subtype = item.get("identity_document_subtype")

            if scope not in subtype_state_by_scope:
                subtype_state_by_scope[scope] = subtype
                continue

            if subtype_state_by_scope[scope] != subtype:
                raise ValidationError(
                    {
                        "documents": (
                            "Batch contains conflicting identity_document_subtype values "
                            f"for scope '{scope}'. All identity_document entries for the same scope "
                            "must use the same subtype, including null."
                        )
                    }
                )

    def _save_upload_items(self, app, items):
        """
        Сохраняет все документы максимально безопасно:

        - старые файлы удаляются только ПОСЛЕ успешного commit
        - если в процессе записи что-то упало, новые уже загруженные файлы
          удаляются best-effort, чтобы не оставлять мусор в storage
        """
        documents = []
        newly_written_file_names = []

        try:
            for item in items:
                document, new_file_name = self._upsert_document(app, item)
                documents.append(document)

                if new_file_name:
                    newly_written_file_names.append(new_file_name)

            return documents

        except Exception:
            # Если БД откатится, новые файлы могут остаться сиротами в storage.
            # Удаляем их best-effort.
            for file_name in set(newly_written_file_names):
                self._safe_delete_file(file_name)
            raise

    def _upsert_document(self, app, data):
        """
        Безопасная замена документа:
        - не удаляем запись заранее
        - лочим существующую запись через select_for_update()
        - обновляем её in-place, если она уже есть
        - старый файл удаляем только через transaction.on_commit()

        Ключ документа остаётся прежним:
        (application, doc_type, scope, side)
        """
        qs = SellerDocument.objects.select_for_update().filter(
            application=app,
            doc_type=data.get("doc_type"),
            scope=data.get("scope"),
            side=data.get("side"),
        )

        existing_doc = qs.first()

        if existing_doc:
            old_file_name = existing_doc.file.name if existing_doc.file else None

            existing_doc.identity_document_subtype = data.get("identity_document_subtype")
            existing_doc.file = data.get("file")
            existing_doc.uploaded_at = timezone.now()
            existing_doc.save()

            new_file_name = existing_doc.file.name if existing_doc.file else None

            if old_file_name and old_file_name != new_file_name:
                self._schedule_file_delete_on_commit(old_file_name)

            return existing_doc, new_file_name

        document = SellerDocument.objects.create(
            application=app,
            **data,
        )
        new_file_name = document.file.name if document.file else None
        return document, new_file_name

    def _schedule_file_delete_on_commit(self, file_name):
        transaction.on_commit(lambda name=file_name: self._safe_delete_file(name))

    def _safe_delete_file(self, file_name):
        if not file_name:
            return

        try:
            default_storage.delete(file_name)
        except Exception:
            # Не валим основной flow из-за проблем удаления старого/временного файла
            pass
