from django.contrib.auth import get_user_model
from django.db import models
from account.models import User
from product.models import BaseProduct
from enum import Enum
from promocode.models import PromoCode
from chipBasket.models import ChipBasket
from account.models import User


class OrderStatus(Enum):
    PENDING = 'Pending'
    PROCESSING = 'Processing'
    SHIPPED = 'Shipped'
    DELIVERED = 'Delivered'
    CANCELLED = 'Cancelled'

    @classmethod
    def choices(cls):
        return [(member.value, member.name) for member in cls]


class OrderItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.IntegerField()
    promo_code = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True)
    user_basket = models.ForeignKey(ChipBasket, on_delete=models.SET_NULL, null=True)
    status = models.CharField(
        max_length=50,
        choices=OrderStatus.choices(),
        default=OrderStatus.PENDING.value,
    )
    class Meta:
        verbose_name_plural = 'OrderItems'

    def count_total_amount(self, *args, **kwargs):
        basket = self.user_basket
        total_amount  = sum(item.quantity * item.price for item in basket)
        self.total_amount = total_amount
        self.save()

    def __str__(self):
        User = get_user_model()
        return f"{self.pk} {self.user} {self.total_amount} {self.order_date} "
