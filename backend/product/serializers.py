from rest_framework import serializers
from .models import ParameterName, BaseProduct, ParameterValue, BaseProductImage, Category


class ParameterStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterName
        fields = '__all__'
        depth = 2


class ImageSerializer(serializers.Serializer):
    image = serializers.ImageField(use_url=False)





class BaseProductSerializer(serializers.ModelSerializer):
    image = ImageSerializer(many=True, read_only=True)
    parameters = serializers.SerializerMethodField()

    class Meta:
        model = BaseProduct
        fields = ('id', 'name', 'image', 'product_description', 'price', 'parameters', 'category')
        depth = 2

    def get_parameters(self, obj):
        # Создаем список параметров в формате ключ-значение (name-value)
        parameters = {}
        for param in obj.parameters.all():
            parameters[param.parameter.name] = param.value

        return parameters


class ValueStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterValue
        fields = '__all__'
        depth = 2


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = '__all__'
        depth = 2
