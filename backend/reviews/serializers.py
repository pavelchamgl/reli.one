from rest_framework import serializers

from .models import Review
from product.models import ProductVariant


class ReviewSerializer(serializers.ModelSerializer):
    author_first_name = serializers.CharField(source='author.first_name')
    author_last_name = serializers.CharField(source='author.last_name')
    variant_name = serializers.CharField(source='product_variant.name')
    variant_text = serializers.CharField(source='product_variant.text')

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
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(write_only=True)

    class Meta:
        model = Review
        fields = ['sku', 'content', 'rating']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
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
        product_variant = validated_data.pop('product_variant')
        product_id = validated_data.pop('product_id')
        review = Review.objects.create(
            author=user,
            product_variant=product_variant,
            product_id=product_id,
            **validated_data
        )
        return review
