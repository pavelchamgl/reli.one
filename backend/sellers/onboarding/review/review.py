from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...permissions_onboarding import IsSeller
from ...services_onboarding import (
    build_seller_onboarding_review_response,
    get_or_create_application_for_user,
)


class SellerOnboardingReviewAPIView(AuditAPIView):
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
            403: OpenApiResponse(description="User is not a seller"),
        },
    )
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        return Response(
            build_seller_onboarding_review_response(app),
            status=status.HTTP_200_OK,
        )
