from rest_framework import generics
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework.permissions import IsAuthenticated

from .models import Order
from .serializers import OrderListSerializer, OrderDetailSerializer


@extend_schema(
    summary="Retrieve all orders for the authenticated user",
    description=(
        "This endpoint returns a list of all orders placed by the authenticated user. "
        "You can filter orders by status using the 'status' query parameter. "
        "To retrieve orders with status 'Closed', set 'status=closed'. "
        "To retrieve orders with statuses other than 'Closed', set 'status=not_closed'. "
        "If no status parameter is provided, the default behavior is to retrieve orders with statuses other than 'Closed'. "
        "Each order in the list includes the order ID, order number, order date, received date (if applicable), "
        "a list of images of the first three products in the order, total amount, order status, and delivery type. "
        "The orders are sorted by 'order_date' in descending order."
    ),
    parameters=[
        OpenApiParameter(
            name='status',
            description=(
                "Filter orders by status. Use 'closed' to retrieve orders with status 'Closed' "
                "and 'not_closed' to retrieve orders with statuses other than 'Closed'."
            ),
            required=False,
            type=str
        )
    ],
    responses={
        200: OpenApiResponse(
            response=OrderListSerializer,
            description="List of orders with brief details."
        ),
        401: OpenApiResponse(description="Unauthorized"),
    },
    tags=["Orders"]
)
class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        status = self.request.query_params.get('status', 'not_closed')

        if status == 'closed':
            return Order.objects.filter(user=user, order_status__name='Closed').order_by('-order_date')
        else:
            return Order.objects.filter(user=user).exclude(order_status__name='Closed').order_by('-order_date')


@extend_schema(
    summary="Retrieve detailed information for a specific order",
    description=(
        "This endpoint returns detailed information about a specific order placed by the authenticated user. "
        "The response includes the order ID, order number, order date, order status, total amount, delivery cost, "
        "and a list of products in the order with detailed information about each product, including variant details, "
        "base product details, quantity, and product price."
    ),
    responses={
        200: OpenApiResponse(
            response=OrderDetailSerializer,
            description="Detailed information about the order, including product details."
        ),
        401: OpenApiResponse(description="Unauthorized"),
        404: OpenApiResponse(description="Not Found")
    },
    tags=["Orders"]
)
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
