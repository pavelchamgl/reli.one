from django.contrib.auth import get_user_model
from django.db import models

from promocode.models import PromoCode
from chipBasket.models import ChipBasket
from account.models import User


class DeliveryType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class OrderStatus(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class SelfPickupStatus(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class OrderItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.IntegerField()
    promo_code = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True)
    user_basket = models.ForeignKey(ChipBasket, on_delete=models.SET_NULL, null=True)
    delivery_type = models.ForeignKey(DeliveryType, on_delete=models.SET_NULL, null=True)
    order_status = models.ForeignKey(OrderStatus, on_delete=models.SET_NULL, null=True, blank=True)
    self_pickup_status = models.ForeignKey(SelfPickupStatus, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Order Items'

    def count_total_amount(self, *args, **kwargs):
        basket = self.user_basket
        total_amount = sum(item.quantity * item.price for item in basket)
        self.total_amount = total_amount
        self.save()

    def __str__(self):
        User = get_user_model()
        return f"{self.pk} {self.user} {self.total_amount} {self.order_date} "
