from rest_framework import serializers
from .models import PromoCode

class PromoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = '__all__'