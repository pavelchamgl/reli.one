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
                                "awaiting_assembly_and_shipment": {"type": "integer", "example": 5},
                                "deliverable": {"type": "integer", "example": 8},
                                "delivered": {"type": "integer", "example": 15},
                                "canceled": {"type": "integer", "example": 2},
                                "all": {"type": "integer", "example": 30}
                            }
                        },
                        "reli_warehouse": {
                            "type": "object",
                            "properties": {
                                "awaiting_assembly_and_shipment": {"type": "integer", "example": 3},
                                "deliverable": {"type": "integer", "example": 6},
                                "delivered": {"type": "integer", "example": 12},
                                "canceled": {"type": "integer", "example": 1},
                                "all": {"type": "integer", "example": 22}
                            }
                        }
                    }
                },
                examples=[
                    OpenApiExample(
                        name="Warehouse Statistics Example",
                        value={
                            "vendor_warehouse": {
                                "awaiting_assembly_and_shipment": 5,
                                "deliverable": 8,
                                "delivered": 15,
                                "canceled": 2,
                                "all": 30
                            },
                            "reli_warehouse": {
                                "awaiting_assembly_and_shipment": 3,
                                "deliverable": 6,
                                "delivered": 12,
                                "canceled": 1,
                                "all": 22
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
            data = get_stats_for_two_warehouses(days=days)

            # Если статистика пустая, возвращаем нули
            if not data:
                data = {
                    "vendor_warehouse": {
                        "awaiting_assembly_and_shipment": 0,
                        "deliverable": 0,
                        "delivered": 0,
                        "canceled": 0,
                        "all": 0
                    },
                    "reli_warehouse": {
                        "awaiting_assembly_and_shipment": 0,
                        "deliverable": 0,
                        "delivered": 0,
                        "canceled": 0,
                        "all": 0
                    }
                }

            return Response(data, status=200)

        except Exception as e:
            logger.error(f"Error generating warehouse statistics: {e}")
            return Response({"error": "An error occurred while generating statistics."}, status=500)
