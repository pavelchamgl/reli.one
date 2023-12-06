from django.db import models
from authemail.models import EmailUserManager, EmailAbstractUser

from chipBasket.models import ChipBasket


class User(EmailAbstractUser):
	# Custom fields
	adress = models.CharField(max_length=500)
	first_name = models.CharField(max_length=30)
	last_name = models.CharField(max_length=30)
	country = models.CharField(max_length=30)
	region = models.CharField(max_length=30)
	city = models.CharField(max_length=30)
	phone = models.CharField(max_length=30)
	chips_basket = models.OneToOneField(ChipBasket, on_delete=models.CASCADE, null=True)
	# Required
	objects = EmailUserManager()

