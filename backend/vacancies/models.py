# myapp/models.py
from django.db import models

class Vacancy(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        verbose_name = 'Vacancy'
        verbose_name_plural = 'Vacancies'

class VacancyImage(models.Model):
    image = models.ImageField(upload_to='vacancy_images/')

    def __str__(self):
        return str(self.image)
