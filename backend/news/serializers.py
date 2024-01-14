from rest_framework import serializers
from .models import News, NewsImage

class NewsImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsImage
        fields = ('image',)


class NewsSerializer(serializers.ModelSerializer):

    class Meta:
        depth = 2
        model = News
        fields = ('id', 'title', 'content', 'image')