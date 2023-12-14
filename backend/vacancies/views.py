# myapp/views.py
from rest_framework import generics
from .models import Vacancy, VacancyImage
from .serializers import VacancySerializer, VacancyImageSerializer

class VacancyListCreateView(generics.ListCreateAPIView):
    queryset = Vacancy.objects.all()
    serializer_class = VacancySerializer

class VacancyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vacancy.objects.all()
    serializer_class = VacancySerializer
