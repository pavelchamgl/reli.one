from __future__ import annotations

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    SellerOnboardingApplication,
    SellerSelfEmployedPersonalDetails,
    SellerSelfEmployedTaxInfo,
    SellerSelfEmployedAddress,
    SellerCompanyInfo,
    SellerCompanyRepresentative,
    SellerCompanyAddress,
    SellerBankAccount,
    SellerWarehouseAddress,
    SellerReturnAddress,
    SellerDocument,
)
from .permissions_onboarding import IsSeller
from .serializers_onboarding import (
    SellerTypeSerializer,
    OnboardingStateSerializer,
    SellerDocumentUploadSerializer,
    SelfEmployedPersonalSerializer,
    SelfEmployedTaxSerializer,
    SelfEmployedAddressSerializer,
    CompanyInfoSerializer,
    CompanyRepresentativeSerializer,
    CompanyAddressSerializer,
    BankAccountSerializer,
    WarehouseAddressSerializer,
    ReturnAddressSerializer,
)
from .services_onboarding import (
    get_or_create_application_for_user,
    compute_completeness,
    submit_application,
)


class SellerOnboardingStateAPIView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        data = OnboardingStateSerializer(app).data
        completeness = compute_completeness(app)
        data["completeness"] = {
            "seller_type_selected": completeness.seller_type_selected,
            "personal_complete": completeness.personal_complete,
            "tax_complete": completeness.tax_complete,
            "address_complete": completeness.address_complete,
            "bank_complete": completeness.bank_complete,
            "warehouse_complete": completeness.warehouse_complete,
            "return_complete": completeness.return_complete,
            "documents_complete": completeness.documents_complete,
            "is_submittable": completeness.is_submittable,
        }
        return Response(data, status=status.HTTP_200_OK)


class SellerSetSellerTypeAPIView(APIView):
    permission_classes = [IsSeller]

    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        if app.status != "draft":
            return Response({"detail": "Seller type can only be set in draft status."}, status=status.HTTP_400_BAD_REQUEST)

        ser = SellerTypeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        app.seller_type = ser.validated_data["seller_type"]
        app.current_step = max(app.current_step, 1)
        app.save(update_fields=["seller_type", "current_step", "updated_at"])
        return Response(OnboardingStateSerializer(app).data, status=status.HTTP_200_OK)


def _get_or_create_one_to_one(model_cls, app: SellerOnboardingApplication, related_name: str):
    obj = getattr(app, related_name, None)
    if obj:
        return obj
    return model_cls.objects.create(application=app)


class SellerSelfEmployedPersonalAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerSelfEmployedPersonalDetails, app, "self_employed_personal")
        ser = SelfEmployedPersonalSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedTaxAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerSelfEmployedTaxInfo, app, "self_employed_tax")
        ser = SelfEmployedTaxSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerSelfEmployedAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerSelfEmployedAddress, app, "self_employed_address")
        ser = SelfEmployedAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyInfoAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerCompanyInfo, app, "company_info")
        ser = CompanyInfoSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyRepresentativeAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerCompanyRepresentative, app, "company_representative")
        ser = CompanyRepresentativeSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerCompanyAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerCompanyAddress, app, "company_address")
        ser = CompanyAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerBankAccountAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerBankAccount, app, "bank_account")
        ser = BankAccountSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerWarehouseAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerWarehouseAddress, app, "warehouse_address")
        ser = WarehouseAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerReturnAddressAPIView(APIView):
    permission_classes = [IsSeller]

    def put(self, request):
        app = get_or_create_application_for_user(request.user)
        obj = _get_or_create_one_to_one(SellerReturnAddress, app, "return_address")
        ser = ReturnAddressSerializer(instance=obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        app.current_step = max(app.current_step, 4)
        app.save(update_fields=["current_step", "updated_at"])
        return Response(ser.data, status=status.HTTP_200_OK)


class SellerDocumentUploadAPIView(APIView):
    permission_classes = [IsSeller]

    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        ser = SellerDocumentUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        doc = SellerDocument.objects.create(application=app, **ser.validated_data)
        return Response(SellerDocumentUploadSerializer(doc).data, status=status.HTTP_201_CREATED)


class SellerOnboardingReviewAPIView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        app = get_or_create_application_for_user(request.user)
        completeness = compute_completeness(app)
        data = {
            "application": OnboardingStateSerializer(app).data,
            "is_submittable": completeness.is_submittable,
            "completeness": {
                "seller_type_selected": completeness.seller_type_selected,
                "personal_complete": completeness.personal_complete,
                "tax_complete": completeness.tax_complete,
                "address_complete": completeness.address_complete,
                "bank_complete": completeness.bank_complete,
                "warehouse_complete": completeness.warehouse_complete,
                "return_complete": completeness.return_complete,
                "documents_complete": completeness.documents_complete,
            },
        }
        return Response(data, status=status.HTTP_200_OK)


class SellerOnboardingSubmitAPIView(APIView):
    permission_classes = [IsSeller]

    def post(self, request):
        app = get_or_create_application_for_user(request.user)
        app = submit_application(app)
        return Response(OnboardingStateSerializer(app).data, status=status.HTTP_200_OK)
