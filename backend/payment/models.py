from django.db import models
from account.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


# Create your models here.


class UserPayment(models.Model):
    app_user= models.ForeignKey(User, on_delete=models.CASCADE)
    payment_bool=models.BooleanField(default=False)
    stripe_checkout_id= models.CharField(max_length=500)


@receiver(post_save, sender=User)
def create_user_payment(sender, instance, created, **kvargs):
    if created:
        UserPayment.objects.create(app_user=instance)