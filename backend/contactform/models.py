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


class ContactMessage(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    business_type = models.CharField(max_length=255, blank=True)
    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.email} — {self.created_at:%Y-%m-%d %H:%M}"
