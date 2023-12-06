from django.urls import path
from .views import get_stripe_coupons, add_stripe_coupons

urlpatterns = [

    path('get-stripe-coupons/', get_stripe_coupons),
    path('add_stripe_coupons/', add_stripe_coupons),

]