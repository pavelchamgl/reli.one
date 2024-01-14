from rest_framework import generics
from rest_framework.decorators import permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from product.models import BaseProduct
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


@permission_classes([AllowAny])
class BasketItemCreateView(APIView):
    def post(self, request, *args, **kwargs):
        basket_id = request.data.get('basket')
        product_id = request.data.get('product')
        quantity = request.data.get('quantity')

        try:
            basket = ChipBasket.objects.get(id=basket_id)
        except ChipBasket.DoesNotExist:
            return Response({'error': 'Invalid basket ID'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = BaseProduct.objects.get(id=product_id)
        except BaseProduct.DoesNotExist:
            return Response({'error': 'Invalid product ID'}, status=status.HTTP_400_BAD_REQUEST)

        # Создаем экземпляр BasketItem и сохраняем его
        basket_item = BasketItem(basket=basket, product=product, quantity=quantity)
        basket_item.save()

        return Response({'message': 'BasketItem created successfully'}, status=status.HTTP_201_CREATED)