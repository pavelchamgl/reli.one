from django.db import models

from promocode.models import PromoCode
from accounts.models import CustomUser
from product.models import BaseProduct


class DeliveryType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class OrderStatus(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'Order status'
        verbose_name_plural = 'Order status'

    def __str__(self):
        return self.name


class SelfPickupStatus(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Order(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.IntegerField()
    promo_code = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_type = models.ForeignKey(DeliveryType, on_delete=models.SET_NULL, null=True)
    order_status = models.ForeignKey(OrderStatus, on_delete=models.SET_NULL, null=True, blank=True)
    self_pickup_status = models.ForeignKey(SelfPickupStatus, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_address = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"{self.pk} {self.user} {self.total_amount} {self.order_date} "


class OrderProduct(models.Model):
    order = models.ForeignKey(Order, related_name='order_products', on_delete=models.CASCADE)
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Order product'
        verbose_name_plural = 'Order products'

    def __str__(self):
        return f"{self.quantity} of {self.product.name} in order {self.order.pk}"
