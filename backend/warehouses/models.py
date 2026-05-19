from django.db import models
from django.utils import timezone

from product.models import ProductVariant


class Warehouse(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    contact_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2, default='CZ')
    pickup_by_courier = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class WarehouseItem(models.Model):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='warehouse_items'
    )
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(
        default=0,
        help_text=(
            "Units currently held by pending stock reservations. "
            "available_quantity = quantity_in_stock - reserved_quantity."
        ),
    )

    class Meta:
        unique_together = ('warehouse', 'product_variant')

    def __str__(self):
        return f"{self.product_variant} in {self.warehouse.name} -> {self.quantity_in_stock}"

    @property
    def available_quantity(self) -> int:
        """Units available for new reservations (never negative)."""
        return max(0, self.quantity_in_stock - self.reserved_quantity)


class StockReservation(models.Model):
    """
    Represents a stock hold created when a customer starts the payment flow.

    Lifecycle:
      PENDING   — created at session creation, holds stock for TTL duration
      CONFIRMED — webhook success: stock permanently decremented
      RELEASED  — webhook failure/cancel: reserved_quantity restored
      EXPIRED   — cleanup job: TTL elapsed without payment, reserved_quantity restored

    session_key matches StripeMetadata.session_key / PayPalMetadata.session_key.
    """

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        RELEASED  = "released",  "Released"
        EXPIRED   = "expired",   "Expired"

    session_key    = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Matches StripeMetadata.session_key / PayPalMetadata.session_key",
    )
    payment_system = models.CharField(
        max_length=10,
        help_text='"stripe" or "paypal"',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    expires_at   = models.DateTimeField(
        db_index=True,
        help_text="Reservation TTL; cleanup job releases PENDING rows past this timestamp",
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    released_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Stock Reservation"
        verbose_name_plural = "Stock Reservations"
        indexes = [
            # cleanup query: WHERE status='pending' AND expires_at < now()
            models.Index(
                fields=("status", "expires_at"),
                name="stockres_status_expires_idx",
            ),
        ]

    def __str__(self):
        return f"StockReservation {self.session_key} [{self.status}]"


class StockReservationItem(models.Model):
    """
    One line of a StockReservation — the specific WarehouseItem and quantity held.
    """

    reservation    = models.ForeignKey(
        StockReservation,
        on_delete=models.CASCADE,
        related_name="items",
    )
    warehouse_item = models.ForeignKey(
        WarehouseItem,
        on_delete=models.CASCADE,
        related_name="reservation_items",
    )
    quantity = models.PositiveIntegerField()

    class Meta:
        verbose_name = "Stock Reservation Item"
        verbose_name_plural = "Stock Reservation Items"
        unique_together = ("reservation", "warehouse_item")

    def __str__(self):
        return (
            f"{self.quantity}× {self.warehouse_item.product_variant} "
            f"for reservation {self.reservation_id}"
        )
