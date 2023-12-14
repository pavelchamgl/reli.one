from django.contrib import admin
from .models import NewsImage, News
# Register your models here.
admin.site.register(News)
admin.site.register(NewsImage)