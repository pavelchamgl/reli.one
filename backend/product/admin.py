from django.contrib import admin
from .models import BaseProduct, ParameterName,ParameterValue, BaseProductImage
# Register your models here.



admin.site.register(BaseProduct)
admin.site.register(BaseProductImage)
admin.site.register(ParameterValue)
admin.site.register(ParameterName)