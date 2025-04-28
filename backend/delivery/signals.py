from collections import defaultdict
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save

from .models import DeliveryParcel, CourierService
from order.models import Order, OrderProduct
from .services.packeta import PacketaService


@receiver(post_save, sender=Order)
def create_delivery_parcels(sender, instance, created, **kwargs):
    if not created:
        return

    order = instance

    # Группируем продукты по складам
    warehouse_map = defaultdict(list)
    products = OrderProduct.objects.filter(order=order).select_related("product_variant__warehouse")

    for op in products:
        warehouse = op.product_variant.warehouse
        warehouse_map[warehouse].append(op)

    # Получаем службу доставки
    try:
        service = CourierService.objects.get(code="packeta")
    except CourierService.DoesNotExist:
        return  # не создаём доставку, если службы нет

    api = PacketaService(api_key=settings.PACKETA_API_KEY)

    for warehouse, order_products in warehouse_map.items():
        total_weight = sum(
            op.product_variant.weight_grams * op.quantity for op in order_products
        )

        shipment = api.create_shipment(order=order, warehouse=warehouse)

        DeliveryParcel.objects.create(
            order=order,
            warehouse=warehouse,
            service=service,
            tracking_number=shipment["tracking_number"],
            label_url=shipment["label_url"],
            weight_grams=total_weight
        )
