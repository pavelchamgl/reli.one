"""
E2E test-setup endpoints for seller module.

Exposed only when ENABLE_E2E_ENDPOINTS=True. Never register in production.
"""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.choices import UserRole
from warehouses.models import Warehouse


class E2ESyncSellerDefaultWarehouseView(APIView):
    """
    Creates (or reuses) a warehouses.Warehouse from onboarding warehouse_address
    and links it to seller_profile.default_warehouse.

    Full-stack checkout tests need default_warehouse.country == 'CZ'; onboarding
    warehouse step only stores SellerWarehouseAddress until moderation approve.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != UserRole.SELLER:
            return Response({"error": "Seller account required."}, status=403)

        seller_profile = getattr(user, "seller_profile", None)
        if seller_profile is None:
            return Response({"error": "Seller profile not found."}, status=404)

        app = getattr(seller_profile, "onboarding_application", None)
        if app is None:
            return Response({"error": "Onboarding application not found."}, status=404)

        wh_addr = getattr(app, "warehouse_address", None)
        if wh_addr is None:
            return Response({"error": "Warehouse address not set in onboarding."}, status=400)

        country = (wh_addr.country or "").upper()
        if country != "CZ":
            return Response(
                {"error": f"Warehouse country must be CZ, got {country or 'empty'}."},
                status=400,
            )

        warehouse_name = f"E2E Seller WH {seller_profile.pk}"
        warehouse, _ = Warehouse.objects.get_or_create(
            name=warehouse_name,
            defaults={
                "street": wh_addr.street or "Warehouse Street 1",
                "city": wh_addr.city or "Praha",
                "zip_code": wh_addr.zip_code or "10000",
                "country": "CZ",
                "phone": wh_addr.contact_phone or "",
            },
        )

        seller_profile.default_warehouse = warehouse
        seller_profile.save(update_fields=["default_warehouse"])

        return Response(
            {
                "warehouse_id": warehouse.pk,
                "warehouse_name": warehouse.name,
                "country": warehouse.country,
            },
            status=200,
        )
