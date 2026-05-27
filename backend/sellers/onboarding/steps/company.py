from __future__ import annotations

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...models import (
    SellerCompanyAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
)
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import (
    CompanyAddressSerializer,
    CompanyInfoSerializer,
    CompanyRepresentativeSerializer,
)
from ...services_onboarding import (
    ensure_application_editable,
    get_or_create_application_for_user,
    get_or_create_onboarding_block,
    get_onboarding_block_or_none,
)


class SellerCompanyInfoAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get company information",
        description=(
            "Returns saved company identification and registration details.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=CompanyInfoSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "company_name": "Reli Group s.r.o.",
                            "legal_form": "s.r.o.",
                            "country_of_registration": "CZ",
                            "business_id": "12345678",
                            "tin": "CZ12345678",
                            "vat_id": "CZ12345678",
                            "imports_to_eu": True,
                            "eori_number": "CZEORI123456",
                            "company_phone": "+420777123456",
                            "certificate_issue_date": "2024-11-15",
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
        obj = get_onboarding_block_or_none(app, "company_info")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(CompanyInfoSerializer(obj).data, status=status.HTTP_200_OK)

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
            "is in draft/rejected status."
        ),
        request=CompanyInfoSerializer,
        responses={
            200: OpenApiResponse(
                response=CompanyInfoSerializer,
                description="Company information successfully saved",
                examples=[
                    OpenApiExample(
                        name="Company info updated",
                        value={
                            "company_name": "Reli Group s.r.o.",
                            "legal_form": "s.r.o.",
                            "country_of_registration": "CZ",
                            "business_id": "12345678",
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
                description="Invalid request data or onboarding is not editable",
                examples=[
                    OpenApiExample(
                        name="Not editable status",
                        value={"detail": "Only draft/rejected applications can be edited."},
                        response_only=True,
                    )
                ],
            ),
            403: OpenApiResponse(
                description="User is not a seller",
            ),
        },
    )
    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        ensure_application_editable(app)

        obj = get_or_create_onboarding_block(
            SellerCompanyInfo,
            app,
            "company_info",
        )
        ser = CompanyInfoSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyRepresentativeAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get company representative details",
        description=(
            "Returns saved personal details of the company representative.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=CompanyRepresentativeSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "first_name": "Jan",
                            "last_name": "Novák",
                            "role": "Managing Director",
                            "date_of_birth": "1985-03-22",
                            "nationality": "CZ",
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
        obj = get_onboarding_block_or_none(app, "company_representative")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(CompanyRepresentativeSerializer(obj).data, status=status.HTTP_200_OK)

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
            "remains in draft/rejected status."
        ),
        request=CompanyRepresentativeSerializer,
        responses={
            200: OpenApiResponse(
                response=CompanyRepresentativeSerializer,
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
            SellerCompanyRepresentative,
            app,
            "company_representative",
        )
        ser = CompanyRepresentativeSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyAddressAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get company registered address",
        description=(
            "Returns saved registered legal address of the company.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=CompanyAddressSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "street": "Václavské náměstí 1",
                            "city": "Praha",
                            "zip_code": "11000",
                            "country": "CZ",
                            "proof_document_issue_date": "2024-12-01",
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
        obj = get_onboarding_block_or_none(app, "company_address")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(CompanyAddressSerializer(obj).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update company registered address",
        description=(
            "Updates the registered legal address of the company during seller onboarding.\n\n"
            "This endpoint is applicable only for sellers with seller type `company`.\n\n"
            "The address must correspond to the company registration details and "
            "must match the uploaded proof of address document.\n\n"
            "Data can be updated multiple times while the onboarding application "
            "remains in draft/rejected status."
        ),
        request=CompanyAddressSerializer,
        responses={
            200: OpenApiResponse(
                response=CompanyAddressSerializer,
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
            SellerCompanyAddress,
            app,
            "company_address",
        )
        ser = CompanyAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)
