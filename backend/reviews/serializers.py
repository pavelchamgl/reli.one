from rest_framework import serializers

from .models import Review


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
    class Meta:
        model = Review
        fields = ['product', 'content', 'rating']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
