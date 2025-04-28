from itertools import groupby
from delivery.services import get_service
from delivery.models import DeliveryParcel, DeliveryParcelItem, CourierService
from warehouses.models import Warehouse
from delivery.services.shipping_split import split_items_into_parcels


def generate_parcels_for_order(order):
    # группировка по (warehouse, seller)
    groups = {}
    for op in order.order_products.filter(status='awaiting_shipment'):
        key = (op.warehouse_id, op.seller_profile_id)
        groups.setdefault(key, []).append({
            "sku":            op.product.sku,
            "quantity":       op.quantity,
            "order_product_id": op.id,
        })

    for (warehouse_id, seller_id), items in groups.items():
        # разбиваем на мешки/парсели
        parcels = split_items_into_parcels(
            country=order.delivery_address.country,
            items=items,
            cod=False,
            currency=order.currency,
        )

        # получаем нужный CourierService
        cs = CourierService.objects.get(code="ZASILKOVNA", active=True)
        svc = get_service(cs.code)

        for p in parcels:
            # вызываем Zásilkovnu
            resp = svc.create_shipment(
                sender=Warehouse.objects.get(pk=warehouse_id).as_sender_dict(),
                recipient=order.delivery_address.as_dict(),
                parcels=[{
                  "weight":     p["weight_grams"]/1000,
                  "dimensions": p["dimensions"],
                  "items":      [i["order_product_id"] for i in p["items"]],
                }],
            )
            # сохраняем DeliveryParcel
            parcel = DeliveryParcel.objects.create(
                order=order,
                warehouse_id=warehouse_id,
                service=cs,
                tracking_number=resp["tracking_id"],
                label_url=resp["label_url"],
                weight_grams=p["weight_grams"],
            )
            for i in p["items"]:
                DeliveryParcelItem.objects.create(
                    parcel=parcel,
                    order_product_id=i["order_product_id"],
                    quantity=1
                )
