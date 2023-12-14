# myapp/serializers.py
from rest_framework import serializers
from .models import Vacancy, VacancyImage

class VacancyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacancyImage
        fields = ('image',)

class VacancySerializer(serializers.ModelSerializer):
    images = VacancyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Vacancy
        fields = ('id', 'title', 'description', 'images')
