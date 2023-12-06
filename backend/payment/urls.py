from django.urls import path
from .views import create_checkout_session, CreateOrderViewRemote, check_and_create_order, stripe_check_session

urlpatterns = [
    path('create_checkout_session/', create_checkout_session, name='create_checkout_session'),
    path('CreateOrderViewRemote/', CreateOrderViewRemote.as_view()),
    path('check_and_create_order/', check_and_create_order, name='check_and_create_order'),
    path('stripe_check_session/', stripe_check_session, name='stripe_check_session'),

]
