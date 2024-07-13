import uuid
from decimal import Decimal
from datetime import datetime
from django.db import models
from django.core.validators import MinValueValidator
from phonenumber_field.modelfields import PhoneNumberField

from supplier.models import Supplier
from product.models import BaseProduct


# Функция для генерации уникального номера заказа в формате ддммггччммсс + первые шесть символов из UUID
def generate_order_number():
    return datetime.now().strftime("%d%m%y%H%M%S") + "-" + str(uuid.uuid4().hex[:6])


# Тип доставки: Courier или Self Pickup(самовывоз)(Enum)
class DeliveryType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


# Статус заказа: Pending, Processing, Shipped, Delivered, Cancelled (Enum)
class OrderStatus(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'Order status'
        verbose_name_plural = 'Order status'

    def __str__(self):
        return self.name


# Статус доставки самовывозом Assembling, On the Way, Sorting Center, Pickup Point (Enum)
class SelfPickupStatus(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class CourierService(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    customer_email = models.EmailField()
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    promo_code = models.ForeignKey('promocode.PromoCode', on_delete=models.SET_NULL, null=True, blank=True)
    delivery_type = models.ForeignKey('DeliveryType', on_delete=models.SET_NULL, null=True)
    order_status = models.ForeignKey('OrderStatus', on_delete=models.SET_NULL, null=True, blank=True)
    self_pickup_status = models.ForeignKey('SelfPickupStatus', on_delete=models.SET_NULL, null=True, blank=True)
    delivery_address = models.CharField(max_length=255, null=True, blank=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    courier_service = models.ForeignKey(CourierService, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"{self.pk} {self.user} {self.total_amount} {self.order_date}"

    def calculate_refund(self):
        # Начальная сумма возврата - это стоимость всех незабранных товаров
        refund_amount = sum(
            item.product_price * item.quantity for item in self.order_products.all() if not item.received)

        # Если хотя бы один товар не получен, добавляем всю стоимость доставки
        if self.order_products.filter(received=False).exists():
            refund_amount += self.delivery_cost

        return refund_amount


class OrderProduct(models.Model):
    order = models.ForeignKey(Order, related_name='order_products', on_delete=models.CASCADE)
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    received = models.BooleanField(default=False)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    product_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Order product'
        verbose_name_plural = 'Order products'

    def __str__(self):
        return f"{self.quantity} of {self.product.name} in order {self.order.pk}"

    def save(self, *args, **kwargs):
        if not self.pk:  # if new instance
            self.previous_received = self.received
        else:
            previous_instance = OrderProduct.objects.get(pk=self.pk)
            self.previous_received = previous_instance.received

        if self.received != self.previous_received:
            if not self.received:
                self.received_at = None
            elif self.received:
                self.received_at = datetime.now()

        super().save(*args, **kwargs)
