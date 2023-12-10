# contactform/admin.py
from django.contrib import admin
from .models import Contact

class AdminContact(admin.ModelAdmin):
    list_display = ('email', 'address', 'company_name', 'message', 'phone')

admin.site.register(Contact, AdminContact)
