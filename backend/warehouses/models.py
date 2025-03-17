from django.db import models

from product.models import ProductVariant


class Warehouse(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=255, blank=True, null=True)

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

    class Meta:
        unique_together = ('warehouse', 'product_variant')

    def __str__(self):
        return f"{self.product_variant} in {self.warehouse.name} -> {self.quantity_in_stock}"
