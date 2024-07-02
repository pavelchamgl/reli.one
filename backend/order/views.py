from rest_framework import generics
from .models import Order
from .serializers import OrderItemSerializer


class OrderItemListCreateView(generics.ListAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderItemSerializer

