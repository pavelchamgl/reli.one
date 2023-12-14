# myapp/views.py
from rest_framework import generics
from .models import News, NewsImage
from .serializers import NewsSerializer, NewsImageSerializer

class NewsListCreateView(generics.ListCreateAPIView):
    queryset = News.objects.all()
    serializer_class = NewsSerializer

class NewsDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = News.objects.all()
    serializer_class = NewsSerializer
