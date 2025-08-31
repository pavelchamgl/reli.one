from rest_framework import serializers

from .models import Banner


class BannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ("id", "title", "alt", "link_url", "image_url", "sort_order")

    def get_image_url(self, obj: Banner):
        request = self.context.get("request")
        if obj.image_webp:
            return request.build_absolute_uri(obj.image_webp.url) if request else obj.image_webp.url
        return None
