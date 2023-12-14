from django.contrib import admin
from .models import Vacancy, VacancyImage
# Register your models here.
admin.site.register(Vacancy)
admin.site.register(VacancyImage)