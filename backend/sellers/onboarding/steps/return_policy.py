from __future__ import annotations

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...models import SellerReturnAddress
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import ReturnAddressSerializer
from ...services_onboarding import (
    ensure_application_editable,
    get_or_create_application_for_user,
    get_or_create_onboarding_block,
    get_onboarding_block_or_none,
)


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
