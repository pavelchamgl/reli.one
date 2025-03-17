import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse, OpenApiExample

from .services import get_stats_for_two_warehouses
from .permissions import IsSellerWarehouseOwner

logger = logging.getLogger('warehouse')


class WarehouseOrdersStatsView(APIView):
    permission_classes = [IsAuthenticated, IsSellerWarehouseOwner]
    """
    Returns warehouse-specific order statistics over the last N days.
    Statistics are grouped separately for:
    - Vendor Warehouse
    - Reli Warehouse
    """

    @extend_schema(
        description="""
            Returns warehouse-specific order statistics over the last N days.
            Statistics are grouped separately for:
            - Vendor Warehouse
            - Reli Warehouse
        """,
        parameters=[
            OpenApiParameter(
                name='days',
                description='Number of days to look back (default=15)',
                required=False,
                type=int
            ),
        ],
        responses={
            200: OpenApiResponse(
                description="Warehouse order statistics grouped by two warehouses.",
                response={
                    "type": "object",
                    "properties": {
                        "vendor_warehouse": {
                            "type": "object",
                            "properties": {
                                "awaiting_assembly": {"type": "integer", "example": 5},
                                "awaiting_shipment": {"type": "integer", "example": 5},
                                "controversial": {"type": "integer", "example": 1},
                                "awaiting_assembly_and_shipment": {"type": "integer", "example": 10},
                                "deliverable": {"type": "integer", "example": 8},
                                "delivered": {"type": "integer", "example": 15},
                                "canceled": {"type": "integer", "example": 2},
                                "all": {"type": "integer", "example": 36}
                            }
                        },
                        "reli_warehouse": {
                            "type": "object",
                            "properties": {
                                "awaiting_assembly": {"type": "integer", "example": 5},
                                "awaiting_shipment": {"type": "integer", "example": 5},
                                "controversial": {"type": "integer", "example": 1},
                                "awaiting_assembly_and_shipment": {"type": "integer", "example": 10},
                                "deliverable": {"type": "integer", "example": 8},
                                "delivered": {"type": "integer", "example": 15},
                                "canceled": {"type": "integer", "example": 2},
                                "all": {"type": "integer", "example": 36}
                            }
                        }
                    }
                },
                examples=[
                    OpenApiExample(
                        name="Warehouse Statistics Example",
                        value={
                            "vendor_warehouse": {
                                "awaiting_assembly": 5,
                                "awaiting_shipment": 5,
                                "controversial": 1,
                                "awaiting_assembly_and_shipment": 10,
                                "deliverable": 8,
                                "delivered": 15,
                                "canceled": 2,
                                "all": 36
                            },
                            "reli_warehouse": {
                                "awaiting_assembly": 3,
                                "awaiting_shipment": 2,
                                "controversial": 2,
                                "awaiting_assembly_and_shipment": 5,
                                "deliverable": 6,
                                "delivered": 12,
                                "canceled": 1,
                                "all": 26
                            }
                        },
                        description="Example of statistics grouped by Vendor and Reli warehouses.",
                        response_only=True
                    )
                ]
            )
        },
        tags=["Seller Analytics - Warehouses"]
    )
    def get(self, request, *args, **kwargs):
        days = int(request.query_params.get('days', 15))

        try:
            logger.info(f"Fetching warehouse stats for {days} days by user {request.user.email}")

            data = get_stats_for_two_warehouses(days=days)

            return Response(data, status=200)

        except Exception as e:
            logger.error(f"Error generating warehouse statistics for user {request.user.email}: {e}", exc_info=True)
            return Response({"error": "An error occurred while generating statistics."}, status=500)
