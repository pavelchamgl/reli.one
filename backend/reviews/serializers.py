from rest_framework import serializers

from .models import Review, ReviewMedia
from product.models import ProductVariant


class ReviewMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ReviewMedia
        fields = ['file_url', 'media_type']

    def get_file_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url)


class ReviewSerializer(serializers.ModelSerializer):
    author_first_name = serializers.CharField(source='author.first_name')
    author_last_name = serializers.CharField(source='author.last_name')
    variant_name = serializers.CharField(source='product_variant.name')
    variant_text = serializers.CharField(source='product_variant.text')
    media = ReviewMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'author_first_name',
            'author_last_name',
            'content',
            'date_created',
            'rating',
            'variant_name',
            'variant_text',
            'media',
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(write_only=True)
    media = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Review
        fields = ['sku', 'content', 'rating', 'media']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_media(self, value):
        for media_item in value:
            if media_item.content_type not in ['image/jpeg', 'image/png', 'video/mp4']:
                raise serializers.ValidationError("Unsupported file type.")
            if media_item.size > 15 * 1024 * 1024:  # Ограничение 15 MB
                raise serializers.ValidationError("File too large ( > 15MB ).")
        return value

    def validate(self, data):
        sku = data.get('sku')
        try:
            product_variant = ProductVariant.objects.get(sku=sku)
            data['product_variant'] = product_variant
            data['product_id'] = product_variant.product
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError({'sku': 'Invalid SKU'})
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        media_data = validated_data.pop('media', [])
        product_variant = validated_data.pop('product_variant')
        product_id = validated_data.pop('product_id')

        review = Review.objects.create(
            author=user,
            product_variant=product_variant,
            product_id=product_id,
            **validated_data
        )

        for media_item in media_data:
            media_type = 'video' if 'video' in media_item.content_type else 'image'
            ReviewMedia.objects.create(
                review=review,
                file=media_item,
                media_type=media_type
            )

        return review
