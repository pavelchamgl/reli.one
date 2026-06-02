from __future__ import annotations

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...models import SellerWarehouseAddress
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import WarehouseAddressSerializer
from ...services_onboarding import (
    ensure_application_editable,
    get_or_create_application_for_user,
    get_or_create_onboarding_block,
    get_onboarding_block_or_none,
)


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
                            "same_as_primary_address": False,
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
                            "same_as_primary_address": False,
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
