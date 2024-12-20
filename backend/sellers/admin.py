from django.contrib import admin

from .models import SellerProfile, SellerLegalInfo

admin.site.register(SellerProfile)
admin.site.register(SellerLegalInfo)
