from rest_framework import serializers
from .models import ParameterName, BaseProduct, ParameterValue, BaseProductImage, Category
from PIL import Image

class ParameterStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterName
        fields = '__all__'
        depth = 2


class ImageSerializer(serializers.Serializer):
    image = serializers.ImageField(use_url=False, )



class BaseProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    parameters = serializers.SerializerMethodField()

    class Meta:
        model = BaseProduct
        fields = ('id', 'name', 'image', 'product_description', 'price', 'parameters', 'category')
        depth = 2

    def get_image(self, obj):
        images = obj.image.all()
        if images:
            # Берем первое изображение и возвращаем только абсолютный путь
            return f'/app{images[0].image.url}'
        return None

    def get_parameters(self, obj):
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
