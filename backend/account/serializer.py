from rest_framework import serializers
from .models import User


class MyUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = 'adress', 'first_name', 'last_name', 'country', 'region', 'city', 'phone'