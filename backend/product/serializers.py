from rest_framework import serializers

from favorites.models import Favorite
from .models import ParameterName, BaseProduct, ParameterValue, Category


class ParameterStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterName
        fields = '__all__'
        depth = 2


class ImageSerializer(serializers.Serializer):
    image = serializers.ImageField(use_url=False)


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_children(self, obj):
        children = obj.children.all()
        if children:
            return CategorySerializer(children, many=True).data
        return None


class BaseProductSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    parameters = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    category = CategorySerializer()

    class Meta:
        model = BaseProduct
        fields = (
            'id',
            'name',
            'images',
            'product_description',
            'price',
            'parameters',
            'category',
            'is_favorite',
        )
        depth = 2

    def get_images(self, obj):
        images = obj.image.all()
        if images:
            # Return an array of absolute paths for all images
            return [f'https://solopharma.shop{image.image.url}' for image in images]
        return None

    def get_parameters(self, obj):
        parameters = {}
        for param in obj.parameters.all():
            parameters[param.parameter.name] = param.value

        return parameters

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False


class ValueStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterValue
        fields = '__all__'
        depth = 2
