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
    SellerSelfEmployedAddress,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
)
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import (
    SelfEmployedAddressSerializer,
    SelfEmployedPersonalSerializer,
    SelfEmployedTaxSerializer,
)
from ...services_onboarding import (
    ensure_application_editable,
    get_or_create_application_for_user,
    get_or_create_onboarding_block,
    get_onboarding_block_or_none,
    self_employed_personal_defaults_from_account,
)


class SellerSelfEmployedPersonalAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get self-employed personal details",
        description=(
            "Returns saved personal details for a self-employed seller.\n\n"
            "If the block is not filled yet, returns the seller account name fields.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=SelfEmployedPersonalSerializer,
                description="Existing data or account name fields",
                examples=[
                    OpenApiExample(
                        name="Name fields only",
                        value={
                            "first_name": "Jan",
                            "last_name": "Kowalski",
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "first_name": "Jan",
                            "last_name": "Kowalski",
                            "date_of_birth": "1990-05-12",
                            "nationality": "PL",
                            "personal_phone": "+48123123123",
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
        obj = get_onboarding_block_or_none(app, "self_employed_personal")
        if not obj:
            return Response(self_employed_personal_defaults_from_account(app), status=status.HTTP_200_OK)
        return Response(SelfEmployedPersonalSerializer(obj).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update self-employed personal details",
        description=(
            "Updates personal details for a self-employed seller during onboarding.\n\n"
            "This endpoint stores personal identification data required for KYC verification, "
            "such as date of birth and nationality.\n\n"
            "The data is saved in a draft/rejected state and can be updated multiple times "
            "until the onboarding application is submitted."
        ),
        request=SelfEmployedPersonalSerializer,
        responses={
            200: OpenApiResponse(
                response=SelfEmployedPersonalSerializer,
                description="Personal details successfully saved",
                examples=[
                    OpenApiExample(
                        name="Personal details updated",
                        value={
                            "first_name": "Jan",
                            "last_name": "Kowalski",
                            "date_of_birth": "1990-05-12",
                            "nationality": "PL",
                            "personal_phone": "+48123123123",
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
            SellerSelfEmployedPersonalDetails,
            app,
            "self_employed_personal",
        )
        ser = SelfEmployedPersonalSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedTaxAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get self-employed tax information",
        description=(
            "Returns saved tax-related information for a self-employed seller.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=SelfEmployedTaxSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "tax_country": "PL",
                            "tin": "1234567890",
                            "business_id": None,
                            "vat_id": "PL1234567890",
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
        obj = get_onboarding_block_or_none(app, "self_employed_tax")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(SelfEmployedTaxSerializer(obj).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update self-employed tax information",
        description=(
            "Updates tax-related information for a self-employed seller during onboarding.\n\n"
            "This endpoint stores tax identification data required for KYB/KYC compliance, "
            "including tax country and tax identification number (TIN).\n\n"
            "The data can be updated multiple times while the onboarding application "
            "remains in draft/rejected status."
        ),
        request=SelfEmployedTaxSerializer,
        responses={
            200: OpenApiResponse(
                response=SelfEmployedTaxSerializer,
                description="Tax information successfully saved",
                examples=[
                    OpenApiExample(
                        name="Tax info updated",
                        value={
                            "tax_country": "PL",
                            "tin": "1234567890",
                            "business_id": None,
                            "vat_id": "PL1234567890",
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
            SellerSelfEmployedTaxInfo,
            app,
            "self_employed_tax",
        )
        ser = SelfEmployedTaxSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedAddressAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get self-employed address",
        description=(
            "Returns saved residential address of a self-employed seller.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=SelfEmployedAddressSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "street": "Main Street 12",
                            "city": "Warsaw",
                            "zip_code": "00-001",
                            "country": "PL",
                            "proof_document_issue_date": "2025-01-10",
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
        obj = get_onboarding_block_or_none(app, "self_employed_address")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(SelfEmployedAddressSerializer(obj).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Update self-employed address",
        description=(
            "Updates the residential address of a self-employed seller during onboarding.\n\n"
            "This address is used for KYC verification and must correspond "
            "to the proof of address document uploaded later.\n\n"
            "The information can be updated multiple times while the onboarding "
            "application remains in draft/rejected status."
        ),
        request=SelfEmployedAddressSerializer,
        responses={
            200: OpenApiResponse(
                response=SelfEmployedAddressSerializer,
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
            SellerSelfEmployedAddress,
            app,
            "self_employed_address",
        )
        ser = SelfEmployedAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)
