from django.contrib import admin

from .models import Payment, PayPalMetadata, StripeMetadata

admin.site.register(Payment)
admin.site.register(PayPalMetadata)
admin.site.register(StripeMetadata)
