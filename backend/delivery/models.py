from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.utils.html import format_html

from order.models import Order, OrderProduct, CourierService
from warehouses.models import Warehouse


class DeliveryParcel(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    service = models.ForeignKey(CourierService, on_delete=models.PROTECT)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    # TODO: при переходе GLS — можно сделать upload_to='labels/'
    label_file = models.FileField(upload_to='packeta_labels/', null=True, blank=True)
    weight_grams = models.PositiveIntegerField()
    parcel_index = models.PositiveIntegerField(
        default=0,
        help_text="Порядковый номер посылки в рамках заказа",
    )
    shipping_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Стоимость доставки для этой посылки",
    )
    status = models.CharField(max_length=50, default="created")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Parcel #{self.pk} for Order {self.order.order_number}"

    def label_link(self):
        if self.label_file:
            return format_html('<a href="{}" target="_blank">Скачать PDF</a>', self.label_file.url)
        return "Нет"
    label_link.short_description = "Этикетка"


class DeliveryParcelItem(models.Model):
    parcel = models.ForeignKey(DeliveryParcel, on_delete=models.CASCADE, related_name='items')
    order_product = models.ForeignKey(OrderProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity}×{self.order_product.product.sku} in parcel {self.parcel_id}"


class DeliveryAddress(models.Model):
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    phone = PhoneNumberField()
    email = models.EmailField()
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)


class ShippingRate(models.Model):
    CHANNELS = [('PUDO', 'Pick-up point'), ('HD', 'Home Delivery')]
    CATEGORIES = [('standard', 'Standard'), ('oversized', 'Oversized')]
    ADDRESS_BUNDLE = [('one', '1 parcel / address'), ('multi', '2+ parcels / address')]

    WEIGHT_LIMITS = (
        ("1", "up to 1 kg"),
        ("2", "up to 2 kg"),
        ("3", "up to 3 kg"),
        ("5", "up to 5 kg"),
        ("10", "up to 10 kg"),
        ("15", "up to 15 kg"),
        ("20", "up to 20 kg"),
        ("30", "up to 30 kg"),
        ("31_5", "up to 31.5 kg"),
        ("50", "up to 50 kg"),
        ("over_limit", "over limit"),
    )

    courier_service = models.ForeignKey(
        CourierService,
        on_delete=models.CASCADE,
        related_name='shipping_rates',
        help_text='Courier service this rate belongs to',
    )
    country = models.CharField(max_length=2)
    channel = models.CharField(max_length=4, choices=CHANNELS)
    category = models.CharField(max_length=9, choices=CATEGORIES)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    cod_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    estimate = models.CharField(max_length=50, blank=True)
    weight_limit = models.CharField(
        max_length=10,
        choices=WEIGHT_LIMITS,
        default="5",
        help_text="Weight limit for the shipping rate",
    )
    # GLS: различие цены для 1 посылки на адрес и 2+ (BusinessParcel).
    # Для Zásilkovna 'one' по умолчанию.
    address_bundle = models.CharField(
        max_length=8,
        choices=ADDRESS_BUNDLE,
        default="one",
        blank=True,
        help_text="GLS BusinessParcel: 1 vs 2+ parcels to the same address/date",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "courier_service",
                    "country",
                    "channel",
                    "category",
                    "weight_limit",
                    "address_bundle",
                ],
                name="uniq_rate_per_courier_country_channel_category_weight_bundle",
            )
        ]
        indexes = [
            models.Index(
                fields=[
                    "courier_service",
                    "country",
                    "channel",
                    "category"
                ],
                name="rate_cccc_idx"
            ),
        ]

    def __str__(self):
        wl = self.weight_limit.replace("_", ".")
        return f"{self.courier_service.name} {self.country} {self.channel} {self.category} ≤{wl}"
