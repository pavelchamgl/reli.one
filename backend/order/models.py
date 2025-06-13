import uuid
from decimal import Decimal
from datetime import datetime
from django.db import models
from django.core.validators import MinValueValidator
from phonenumber_field.modelfields import PhoneNumberField

from sellers.models import SellerProfile
from product.models import ProductVariant
from warehouses.models import Warehouse


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
        verbose_name = 'Ordered status'

        verbose_name_plural = 'Ordered statuses'

    def __str__(self):
        return self.name


# Статус доставки самовывозом Assembling, On the Way, Sorting Center, Pickup Point (Enum)
class DeliveryStatus(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'Delivery status'
        verbose_name_plural = 'Delivery statuses'

    def __str__(self):
        return self.name


class CourierService(models.Model):
    """
    Курьерская служба: используется и для выбора при оформлении заказа,
    и для интеграции в delivery-логике.
    """
    name = models.CharField(
        max_length=100,
        help_text="Читабельное имя службы (например, Packeta, Zásilkovna)"
    )
    code = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Уникальный код службы (например, packeta, zasilkovna)"
    )
    active = models.BooleanField(
        default=True,
        help_text="Включена ли служба для выбора в интерфейсах"
    )

    class Meta:
        verbose_name = "Courier Service"
        verbose_name_plural = "Courier Services"
        ordering = ("name",)

    def __str__(self):
        return f"{self.pk} {self.name}"


class Invoice(models.Model):
    payment = models.OneToOneField("payment.Payment", on_delete=models.CASCADE, related_name="invoice")
    invoice_number = models.CharField(max_length=50, unique=True)
    file = models.FileField(upload_to="invoices/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} ({self.payment.session_id})"


class Order(models.Model):
    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    customer_email = models.EmailField()
    order_date = models.DateTimeField(auto_now_add=True)
    payment = models.ForeignKey(
        "payment.Payment", on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    group_subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Итоговая сумма группы: товары + доставка."
    )
    promo_code = models.ForeignKey('promocode.PromoCode', on_delete=models.SET_NULL, null=True, blank=True)
    delivery_type = models.ForeignKey('DeliveryType', on_delete=models.SET_NULL, null=True)
    order_status = models.ForeignKey('OrderStatus', on_delete=models.SET_NULL, null=True, blank=True)
    delivery_status = models.ForeignKey('DeliveryStatus', on_delete=models.SET_NULL, null=True, blank=True)
    delivery_address = models.ForeignKey('delivery.DeliveryAddress', on_delete=models.SET_NULL, null=True, blank=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    courier_service = models.ForeignKey(CourierService, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    pickup_point_id = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"Order #{self.order_number} by {self.user.email} on {self.order_date.strftime('%d.%m.%Y')}"

    def calculate_refund(self):
        # Начальная сумма возврата - это стоимость всех незабранных товаров
        refund_amount = sum(
            item.product_price * item.quantity for item in self.order_products.all() if not item.received)

        # Если хотя бы один товар не получен, добавляем всю стоимость доставки
        if self.order_products.filter(received=False).exists():
            refund_amount += self.delivery_cost

        return refund_amount


class ProductStatus(models.TextChoices):
    AWAITING_ASSEMBLY = 'awaiting_assembly', 'Awaiting assembly'
    AWAITING_SHIPMENT = 'awaiting_shipment', 'Awaiting shipment'
    DELIVERABLE = 'deliverable', 'Deliverable'
    DELIVERED = 'delivered', 'Delivered'
    CANCELED = 'canceled', 'Canceled'
    CONTROVERSIAL = 'controversial', 'Controversial'


class OrderProduct(models.Model):
    order = models.ForeignKey(Order, related_name='order_products', on_delete=models.CASCADE)
    product = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    status = models.CharField(
        max_length=30,
        choices=ProductStatus.choices,
        default=ProductStatus.AWAITING_ASSEMBLY
    )
    received = models.BooleanField(default=False)
    delivery_cost = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    seller_profile = models.ForeignKey(SellerProfile, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, null=True, blank=True)
    product_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Ordered product'
        verbose_name_plural = 'Ordered products'

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
