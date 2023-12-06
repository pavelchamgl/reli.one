from django.urls import path
from .views import MyUserView, TokenView, SignupVerify,create_user

urlpatterns = [
    path('MyUser/', MyUserView.as_view()),
    path('TokenView/', TokenView),
    path('SignupVerify/', SignupVerify.as_view()),
    path('SignupVerify/', SignupVerify.as_view()),
    path('UserInfo/', create_user),

]
