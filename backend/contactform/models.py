from django.db import models

class Contact(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    address = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    phone = models.CharField(max_length=20)

    def __str__(self):
        return self.email
