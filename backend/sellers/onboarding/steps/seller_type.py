from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response

from ...drf_hooks import AuditAPIView
from ...permissions_onboarding import IsSeller
from ...serializers_onboarding import OnboardingStateSerializer, SellerTypeSerializer
from ...services_onboarding import ensure_application_editable, get_or_create_application_for_user


class SellerSetSellerTypeAPIView(AuditAPIView):
    permission_classes = [IsSeller]

    @extend_schema(
        tags=["Seller Onboarding"],
        summary="Set seller type for onboarding",
        description=(
            "Sets the seller type for the current onboarding application.\n\n"
            "This is the first mandatory step of seller onboarding. "
            "Seller type determines which data blocks and documents "
            "are required in subsequent steps.\n\n"
            "Allowed values:\n"
            "- `self_employed` — self-employed / sole proprietor\n"
            "- `company` — company / legal entity\n\n"
            "Seller type can only be changed while the onboarding application "
            "is in `draft` or `rejected` status."
        ),
        request=SellerTypeSerializer,
        responses={
            200: OpenApiResponse(
                response=OnboardingStateSerializer,
                description="Seller type successfully set",
                examples=[
                    OpenApiExample(
                        name="Self-employed selected",
                        value={
                            "id": 12,
                            "seller_type": "self_employed",
                            "status": "draft",
                            "submitted_at": None,
                            "reviewed_at": None,
                            "rejected_reason": None,
                        },
                        response_only=True,
                    ),
                    OpenApiExample(
                        name="Company selected",
                        value={
                            "id": 12,
                            "seller_type": "company",
                            "status": "draft",
                            "submitted_at": None,
                            "reviewed_at": None,
                            "rejected_reason": None,
                        },
                        response_only=True,
                    ),
                ],
            ),
            400: OpenApiResponse(
                description="Invalid request or onboarding is not editable (only draft/rejected)",
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
    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        ensure_application_editable(app)

        ser = SellerTypeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        app.seller_type = ser.validated_data["seller_type"]
        app.save(update_fields=["seller_type", "updated_at"])

        return Response(
            OnboardingStateSerializer(app).data,
            status=status.HTTP_200_OK,
        )
