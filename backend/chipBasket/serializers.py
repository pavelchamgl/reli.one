from rest_framework import serializers
from .models import ChipBasket, BasketItem
from product.models import BaseProduct

class BaseProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseProduct
        fields = '__all__'
        deph = 2

class BasketItemSerializer(serializers.ModelSerializer):
    product = BaseProductSerializer()

    class Meta:
        model = BasketItem
        fields = '__all__'
        depth = 2


class ChipsBasketSerializer(serializers.ModelSerializer):
    items = BasketItemSerializer(many=True, read_only=True)

    class Meta:
        model = ChipBasket
        fields = '__all__'
        depth = 2

