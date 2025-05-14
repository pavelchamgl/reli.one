import logging
from decimal import Decimal
from django.db import transaction
from django.core.files.base import ContentFile

from order.models import Order
from warehouses.models import Warehouse
from delivery.models import DeliveryParcel, DeliveryParcelItem, CourierService
from delivery.services.packeta import PacketaService
from delivery.services.local_rates import calculate_shipping_options
from delivery.services.shipping_split import split_items_into_parcels
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point

logger = logging.getLogger(__name__)


def generate_parcels_for_order(order_id: int):
    """
    1) Сплитим order.order_products на блоки,
    2) считаем стоимость и создаём в Packeta,
    3) сохраняем DeliveryParcel + DeliveryParcelItem — с заполненными warehouse, service и tracking_number.
    """
    logger.info("Start generate_parcels_for_order(%s)", order_id)
    svc = PacketaService()
    order = Order.objects.select_related(
        "delivery_type", "delivery_address", "user", "courier_service"
    ).prefetch_related("order_products__product").get(pk=order_id)

    # 1) Составляем «сырые» строки для сплита
    raw = [
        {"sku": op.product.sku, "quantity": op.quantity}
        for op in order.order_products.filter(status="awaiting_shipment")
    ]

    # 2) Определяем страну для сплита
    if order.delivery_address:
        country_code = order.delivery_address.country
    elif order.pickup_point_id:
        country_code = resolve_country_from_local_pickup_point(order.pickup_point_id)
    else:
        country_code = "cz"

    parcels = split_items_into_parcels(
        country=country_code,
        items=raw,
        cod=False,
        currency="EUR",
    )
    logger.debug("Order %s → %d parcels", order_id, len(parcels))

    # 3) Выбираем origin warehouse
    try:
        wh = Warehouse.objects.get(pickup_by_courier=False)
    except Warehouse.DoesNotExist:
        wh = Warehouse.objects.first()
    if not wh:
        logger.error(f"No warehouse found for order {order_id}")
        raise RuntimeError(f"No warehouse available for order {order_id}")

    created = []
    with transaction.atomic():
        for idx, block in enumerate(parcels, start=1):
            # расчёт общего веса в граммах
            wt = sum(
                op.product.weight_grams * unit["quantity"]
                for unit in block
                for op in order.order_products.filter(product__sku=unit["sku"])
            )

            # 4) Запрашиваем все варианты доставки
            opts = calculate_shipping_options(
                country_code,
                block,
                cod=False,
                currency="EUR"
            )
            logger.debug("Order %s, parcel #%d raw shipping options: %s", order_id, idx, opts)

            # 5) Определяем канал по типу доставки
            is_hd = order.delivery_type.name.lower() == "home delivery"
            channel = "HD" if is_hd else "PUDO"

            # 6) Фильтруем по каналу
            channel_opts = [o for o in opts if o.get("channel") == channel]
            logger.debug("Order %s, parcel #%d channel '%s' options: %s", order_id, idx, channel, channel_opts)

            if not channel_opts:
                logger.error("No %s options for order %s, parcel #%d — opts was %s", channel, order_id, idx, opts)
                raise RuntimeError(f"No shipping options for channel {channel} on order {order_id}, parcel {idx}")

            # 7) Берём первый вариант
            chosen = channel_opts[0]
            price_with_vat = Decimal(chosen["priceWithVat"]).quantize(Decimal("0.01"))
            logger.debug("Order %s, parcel #%d selected option: %s", order_id, idx, chosen)

            # 8) Определяем валюту на основе страны
            currency_country = order.delivery_address.country if order.delivery_address else country_code
            currency = svc.COUNTRY_CURRENCY.get(currency_country, "CZK")

            # 9) Создаём отправление в Packeta
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
                    value_amount=order.total_amount,
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
                    value_amount=order.total_amount,
                    cod_amount=Decimal("0.00"),
                    currency=currency,
                )

            # 10) Сохраняем DeliveryParcel
            if not order.courier_service:
                logger.error(f"No courier service defined for order {order.id}")
                raise RuntimeError(f"No courier service defined for order {order.id}")

            dp = DeliveryParcel.objects.create(
                order=order,
                warehouse=wh,
                service=order.courier_service,
                tracking_number=packet_id,
                parcel_index=idx,
                weight_grams=wt,
                shipping_price=price_with_vat,
            )

            # 11) Создаём позиции в посылке
            for unit in block:
                op = order.order_products.get(product__sku=unit["sku"])
                DeliveryParcelItem.objects.create(
                    parcel=dp,
                    order_product=op,
                    quantity=unit["quantity"],
                )

            logger.info("Created parcel #%d for order %s: packet_id=%s, price=%s", idx, order_id, packet_id, price_with_vat)
            created.append(dp)

    logger.info("generate_parcels_for_order(%s) done, created %d parcels", order_id, len(created))
    return created


def fetch_and_store_labels_for_order(order_id: int):
    """
    Fetches labels for all parcels of the given order and stores them in label_file field.
    """
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
