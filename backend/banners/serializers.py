from rest_framework import serializers

from .models import Banner


class BannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_url_mobile = serializers.SerializerMethodField()
    seller_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Banner
        fields = (
            "id", "title", "alt", "link_url",
            "image_url", "image_url_mobile",
            "sort_order",
            "seller_id",
        )

    def get_image_url(self, obj: Banner):
        request = self.context.get("request")
        if obj.image_webp:
            return request.build_absolute_uri(obj.image_webp.url) if request else obj.image_webp.url
        return None

    def get_image_url_mobile(self, obj: Banner):
        request = self.context.get("request")
        if obj.image_webp_mobile:
            return request.build_absolute_uri(obj.image_webp_mobile.url) if request else obj.image_webp_mobile.url
        return None
