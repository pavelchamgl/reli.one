from __future__ import annotations

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...models import SellerBankAccount
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import BankAccountSerializer
from ...services_onboarding import (
    ensure_application_editable,
    get_or_create_application_for_user,
    get_or_create_onboarding_block,
    get_onboarding_block_or_none,
)


class SellerBankAccountAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get seller bank account details",
        description=(
            "Returns saved bank account information used for seller payouts.\n\n"
            "If the block is not filled yet, returns an empty object `{}`.\n"
            "Frontend should use this endpoint to prefill onboarding forms."
        ),
        responses={
            200: OpenApiResponse(
                response=BankAccountSerializer,
                description="Existing data or empty object",
                examples=[
                    OpenApiExample(name="Empty", value={}, response_only=True),
                    OpenApiExample(
                        name="Existing data",
                        value={
                            "iban": "PL61109010140000071219812874",
                            "swift_bic": "WBKPPLPP",
                            "account_holder": "Jan Kowalski",
                            "bank_code": "1090",
                            "local_account_number": "071219812874",
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
        obj = get_onboarding_block_or_none(app, "bank_account")
        if not obj:
            return Response({}, status=status.HTTP_200_OK)
        return Response(BankAccountSerializer(obj).data, status=status.HTTP_200_OK)

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
                response=BankAccountSerializer,
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
            SellerBankAccount,
            app,
            "bank_account",
        )
        ser = BankAccountSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        app.save(update_fields=["updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)
