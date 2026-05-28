from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import OnboardingStateSerializer
from ...services_onboarding import get_or_create_application_for_user, submit_application


class SellerOnboardingSubmitAPIView(AuditAPIView):
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
            403: OpenApiResponse(description="User is not a seller",),
        },
    )
    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        app = submit_application(app)
        return Response(OnboardingStateSerializer(app).data, status=status.HTTP_200_OK)
