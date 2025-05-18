import logging

from decimal import Decimal
from collections import defaultdict
from django.db import transaction
from django.core.files.base import ContentFile

from order.models import Order
from warehouses.models import Warehouse, WarehouseItem
from delivery.models import DeliveryParcel, DeliveryParcelItem, CourierService
from delivery.services.packeta import PacketaService
from delivery.services.local_rates import calculate_shipping_options
from delivery.services.shipping_split import split_items_into_parcels
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point

logger = logging.getLogger(__name__)


def generate_parcels_for_order(order_id: int):
    logger.info("Start generate_parcels_for_order(%s)", order_id)
    svc = PacketaService()
    order = Order.objects.select_related(
        "delivery_type", "delivery_address", "user", "courier_service"
    ).prefetch_related("order_products__product").get(pk=order_id)

    # Готовим список товаров для сплита
    raw = [
        {"sku": op.product.sku, "quantity": op.quantity}
        for op in order.order_products.filter(status="awaiting_shipment")
    ]

    # Определяем страну
    if order.delivery_address and order.delivery_address.country:
        country_code = order.delivery_address.country
    elif order.pickup_point_id:
        country_code = resolve_country_from_local_pickup_point(order.pickup_point_id)
    else:
        logger.error(f"Cannot determine country for order {order_id}")
        raise RuntimeError(f"Cannot determine country for order {order_id}")

    # Определяем валюту по стране
    currency = svc.COUNTRY_CURRENCY.get(country_code, "CZK")

    # Сплитим на посылки
    parcels = split_items_into_parcels(country=country_code, items=raw, cod=False, currency="EUR")
    logger.debug("Order %s → %d parcels", order_id, len(parcels))

    # Определяем склад
    wh = Warehouse.objects.filter(pickup_by_courier=False).first() or Warehouse.objects.first()
    if not wh:
        logger.error(f"No warehouse found for order {order_id}")
        raise RuntimeError(f"No warehouse available for order {order_id}")

    # Индексация order_products по SKU для оптимизации доступа
    order_products_by_sku = {op.product.sku: op for op in order.order_products.all()}

    created = []
    with transaction.atomic():
        for idx, block in enumerate(parcels, start=1):
            block_summary = ", ".join(f"{unit['sku']} x{unit['quantity']}" for unit in block)
            logger.info("Order %s, parcel #%d contents: %s", order_id, idx, block_summary)
            # Общий вес посылки
            wt = sum(
                order_products_by_sku[unit["sku"]].product.weight_grams * unit["quantity"]
                for unit in block
                if unit["sku"] in order_products_by_sku
            )
            logger.info("Order %s, parcel #%d weight: %s grams", order_id, idx, wt)

            # Получаем варианты доставки
            opts = calculate_shipping_options(country=country_code, items=block, cod=False, currency="EUR")
            logger.debug("Order %s, parcel #%d raw shipping options: %s", order_id, idx, opts)

            # Определяем канал доставки
            is_hd = order.delivery_type.name.lower() == "home delivery"
            channel = "HD" if is_hd else "PUDO"

            # Фильтруем варианты по каналу
            channel_opts = [o for o in opts if o.get("channel") == channel]
            if not channel_opts:
                logger.error("No %s options for order %s, parcel #%d", channel, order_id, idx)
                raise RuntimeError(f"No shipping options for channel {channel} on order {order_id}, parcel {idx}")

            # Выбираем первую найденную опцию
            chosen = channel_opts[0]
            price_with_vat = Decimal(chosen["priceWithVat"]).quantize(Decimal("0.01"))
            logger.info(
                "Order %s, parcel #%d chosen shipping option: %s, price with VAT: %s EUR",
                order_id, idx, chosen["service"], price_with_vat
            )

            # Фиксированная страховка 1 EUR
            value_amount = Decimal("1.00")

            # Создание отправления
            if is_hd:
                packet_id = svc.create_home_delivery_shipment(
                    order_number=order.order_number,
                    first_name=order.first_name,
                    surname=order.last_name,
                    phone=order.phone_number,
                    email=order.customer_email,
                    street=order.delivery_address.street,
                    city=order.delivery_address.city,
                    zip_code=order.delivery_address.zip_code,
                    country=country_code,
                    weight_grams=wt,
                    value_amount=value_amount,
                    cod_amount=Decimal("0.00"),
                    currency=currency,
                )
            else:
                packet_id = svc.create_pickup_point_shipment(
                    order_number=order.order_number,
                    first_name=order.first_name,
                    surname=order.last_name,
                    phone=order.phone_number,
                    email=order.customer_email,
                    pickup_point_id=order.pickup_point_id,
                    weight_grams=wt,
                    value_amount=value_amount,
                    cod_amount=Decimal("0.00"),
                    currency=currency,
                )

            # Сохраняем DeliveryParcel
            dp = DeliveryParcel.objects.create(
                order=order,
                warehouse=wh,
                service=order.courier_service,
                tracking_number=packet_id,
                parcel_index=idx,
                weight_grams=wt,
                shipping_price=price_with_vat,
            )

            # Группируем по SKU для одной записи на каждую позицию
            grouped_block = defaultdict(int)
            for unit in block:
                grouped_block[unit["sku"]] += unit["quantity"]

            for sku, total_quantity in grouped_block.items():
                op = order_products_by_sku.get(sku)
                if not op:
                    logger.error(f"Product with SKU {sku} not found in order {order_id}, skipping.")
                    continue
                DeliveryParcelItem.objects.create(
                    parcel=dp,
                    order_product=op,
                    quantity=total_quantity,
                )

            logger.info("Created parcel #%d for order %s: packet_id=%s, price=%s", idx, order_id, packet_id, price_with_vat)
            created.append(dp)

    logger.info("generate_parcels_for_order(%s) done, created %d parcels", order_id, len(created))
    return created


def fetch_and_store_labels_for_order(order_id: int):
    svc = PacketaService()
    parcels = DeliveryParcel.objects.filter(order_id=order_id)
    saved_count = 0

    for parcel in parcels:
        if parcel.label_file:
            logger.info(f"Label already exists for parcel {parcel.id}, skipping.")
            continue

        try:
            label_pdf = svc.get_label_pdf(parcel.tracking_number)
            filename = f"label_{parcel.tracking_number}.pdf"
            parcel.label_file.save(filename, ContentFile(label_pdf))
            parcel.save()
            saved_count += 1
            logger.info(f"Label saved for parcel {parcel.id}")
        except Exception as e:
            logger.error(f"Failed to fetch label for parcel {parcel.id}: {e}")

    logger.info(f"Total labels saved for order {order_id}: {saved_count}")
