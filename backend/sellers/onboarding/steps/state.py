from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import OnboardingStateResponseSerializer
from ...services_onboarding import (
    build_seller_onboarding_state_response,
    get_or_create_application_for_user,
)


class SellerOnboardingStateAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Get seller onboarding state",
        description=(
                "Returns current onboarding application state for the authenticated seller.\n\n"
                "The response includes:\n"
                "- onboarding application metadata (status, timestamps, rejection info)\n"
                "- computed completeness flags for each onboarding block\n"
                "- submission & editability flags (`is_editable`, `can_submit`, `requires_onboarding`)\n"
                "- `next_step` indicating where the user should continue onboarding\n"
                "- normalized `documents_summary` describing how document requirements are satisfied\n"
                "- `documents_missing` listing unmet document requirements\n\n"
                "This endpoint is intended to be called:\n"
                "- on onboarding page load\n"
                "- after saving any onboarding block\n"
                "- before showing review / submit screen"
        ),
        responses={
            200: OpenApiResponse(
                response=OnboardingStateResponseSerializer,
                description="Current onboarding state and completeness flags",
                examples=[
                    OpenApiExample(
                        name="Draft onboarding (incomplete)",
                        value={
                            "id": 12,
                            "seller_type": "self_employed",
                            "status": "draft",
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
                            "is_editable": True,
                            "can_submit": False,
                            "requires_onboarding": True,
                            "next_step": "tax",
                            "documents_summary": {
                                "requirements": [
                                    {
                                        "doc_type": "identity_document",
                                        "scope": "self_employed_personal",
                                        "status": "missing",
                                        "satisfied_by": None,
                                        "uploaded_sides": [],
                                        "document_ids": []
                                    },
                                    {
                                        "doc_type": "proof_of_address",
                                        "scope": "self_employed_address",
                                        "status": "missing",
                                        "satisfied_by": None,
                                        "uploaded_sides": [],
                                        "document_ids": []
                                    }
                                ],
                                "counts": {
                                    "total_uploaded": 0,
                                    "used_for_requirements": 0,
                                    "extra_unused": 0
                                }
                            },
                            "documents_missing": [
                                {
                                    "doc_type": "identity_document",
                                    "scope": "self_employed_personal",
                                    "rule": "identity_document",
                                    "missing_sides": ["front", "back"],
                                    "accepts_single_side": True
                                },
                                {
                                    "doc_type": "proof_of_address",
                                    "scope": "self_employed_address",
                                    "rule": "single_sided",
                                    "missing_sides": [None]
                                }
                            ]
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Ready for submission",
                        value={
                            "id": 12,
                            "seller_type": "company",
                            "status": "draft",
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
                            "is_editable": True,
                            "can_submit": True,
                            "requires_onboarding": True,
                            "next_step": "review",
                            "documents_summary": {
                                "requirements": [
                                    {
                                        "doc_type": "registration_certificate",
                                        "scope": "company_info",
                                        "status": "satisfied",
                                        "satisfied_by": "single_sided",
                                        "uploaded_sides": [None],
                                        "document_ids": [10]
                                    },
                                    {
                                        "doc_type": "proof_of_address",
                                        "scope": "company_address",
                                        "status": "satisfied",
                                        "satisfied_by": "single_sided",
                                        "uploaded_sides": [None],
                                        "document_ids": [13]
                                    }
                                ],
                                "counts": {
                                    "total_uploaded": 3,
                                    "used_for_requirements": 3,
                                    "extra_unused": 0
                                }
                            },
                            "documents_missing": []
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
    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        data = build_seller_onboarding_state_response(app)
        return Response(data, status=status.HTTP_200_OK)
