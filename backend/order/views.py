from rest_framework import generics
from .models import OrderItem
from .serializers import OrderItemSerializer


class OrderItemListCreateView(generics.ListAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

