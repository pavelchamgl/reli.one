from rest_framework import serializers

from favorites.models import Favorite
from .models import (
    ParameterName,
    BaseProduct,
    ParameterValue,
    Category,
    LicenseFile,
)


class ParameterStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParameterName
        fields = '__all__'
        depth = 2


class ImageSerializer(serializers.Serializer):
    image = serializers.ImageField(use_url=False)


class RecursiveSerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    children = RecursiveSerializer(many=True, read_only=True)

    def get_image(self, obj):
        if obj.image:
            return f'https://reli.one{obj.image.url}'
        else:
            return "None"

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'image',
            'children',
        )


class LicenseFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LicenseFile
        fields = (
            'id',
            'name',
            'file',
            'product',
        )


class BaseProductSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    parameters = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    category = CategorySerializer()
    license_file = LicenseFileSerializer(read_only=True, source='license_files')

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
            'license_file',
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
