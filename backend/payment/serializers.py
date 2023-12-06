from rest_framework import serializers
from .models import UserPayment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'