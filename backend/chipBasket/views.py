from rest_framework import generics
from rest_framework.decorators import permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ChipBasket, BasketItem
from .serializers import ChipsBasketSerializer, BasketItemSerializer


@permission_classes([AllowAny])
class ChipsBasketListCreateView(ListAPIView):
    queryset = ChipBasket.objects.all()
    serializer_class = ChipsBasketSerializer


@permission_classes([AllowAny])
class BasketItemListCreateView(ListAPIView):
    queryset = BasketItem.objects.all()
    serializer_class = BasketItemSerializer


class BasketItemCreateView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = BasketItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)