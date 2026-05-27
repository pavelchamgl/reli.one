"""
E2E test-setup endpoints for payment module.

Exposed only when ENABLE_E2E_ENDPOINTS=True. Never register in production.
"""
from __future__ import annotations

import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from order.models import CourierService, DeliveryType, OrderStatus
from order.order_status_names import OrderStatusName
from payment.models import StripeMetadata


class E2ESetupOrderDataView(APIView):
    """
    Idempotently creates required lookup records for E2E webhook lifecycle tests:
      - OrderStatus(name=PENDING)
      - DeliveryType(pk=2, name="Home Delivery")
      - CourierService(pk=2, code="packeta")

    Safe to call multiple times. Returns the IDs of created/existing records.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        status_obj, _ = OrderStatus.objects.get_or_create(name=OrderStatusName.PENDING)
        dt, _ = DeliveryType.objects.get_or_create(pk=2, defaults={"name": "Home Delivery"})
        cs, _ = CourierService.objects.get_or_create(
            pk=2, defaults={"code": "packeta", "name": "Packeta", "active": True}
        )
        return Response(
            {
                "order_status_id": status_obj.pk,
                "delivery_type_id": dt.pk,
                "courier_service_id": cs.pk,
            },
            status=200,
        )


class E2ECreateStripeMetadataView(APIView):
    """
    Creates a StripeMetadata record for E2E webhook simulation tests.

    Accepts:
      session_key      — optional; auto-generated UUID if omitted
      custom_data      — dict (user_id, email, first_name, last_name, phone, delivery_address)
      invoice_data     — dict (invoice_number, groups)
      description_data — dict (gross_total, delivery_total, variable_symbol)

    Returns:
      {"session_key": "<session_key>"}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        session_key = data.get("session_key") or str(uuid.uuid4())

        StripeMetadata.objects.create(
            session_key=session_key,
            custom_data=data.get("custom_data") or {},
            invoice_data=data.get("invoice_data") or {},
            description_data=data.get("description_data") or {},
        )

        return Response({"session_key": session_key}, status=201)
