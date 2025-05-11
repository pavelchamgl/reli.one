import logging
from decimal import Decimal
from django.db import transaction

from order.models import Order
from warehouses.models import Warehouse
from delivery.models import DeliveryParcel, DeliveryParcelItem, CourierService
from delivery.services.packeta import PacketaService
from delivery.services.local_rates import calculate_shipping_options
from delivery.services.shipping_split import split_items_into_parcels

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

    # 1) составляем «сырые» строки для сплита
    raw = [
        {"sku": op.product.sku, "quantity": op.quantity}
        for op in order.order_products.filter(status="awaiting_shipment")
    ]
    parcels = split_items_into_parcels(
        country=order.delivery_address.country,
        items=raw,
        cod=False,
        currency="EUR",
    )
    logger.debug("Order %s → %d parcels", order_id, len(parcels))

    # 2) выбираем origin warehouse
    try:
        wh = Warehouse.objects.get(pickup_by_courier=False)
    except Warehouse.DoesNotExist:
        wh = Warehouse.objects.first()

    created = []
    with transaction.atomic():
        for idx, block in enumerate(parcels, start=1):
            # расчёт общего веса в граммах
            wt = sum(
                op.product.weight_grams * unit["quantity"]
                for unit in block
                for op in order.order_products.filter(product__sku=unit["sku"])
            )

            # 3) запрашиваем все варианты доставки
            opts = calculate_shipping_options(
                order.delivery_address.country,
                block,
                False,
                "EUR"
            )
            logger.debug(
                "Order %s, parcel #%d raw shipping options: %s",
                order_id, idx, opts
            )

            # 4) определяем канал по типу доставки
            is_hd = order.delivery_type.name.lower() == "home delivery"
            channel = "HD" if is_hd else "PUDO"

            # 5) фильтруем по каналу
            channel_opts = [o for o in opts if o.get("channel") == channel]
            logger.debug(
                "Order %s, parcel #%d channel '%s' options: %s",
                order_id, idx, channel, channel_opts
            )

            if not channel_opts:
                logger.error(
                    "No %s options for order %s, parcel #%d — opts was %s",
                    channel, order_id, idx, opts
                )
                raise RuntimeError(
                    f"No shipping options for channel {channel} "
                    f"on order {order_id}, parcel {idx}"
                )

            # 6) берём первый вариант (с НДС)
            chosen = channel_opts[0]
            logger.debug(
                "Order %s, parcel #%d selected option: %s",
                order_id, idx, chosen
            )
            price_with_vat = Decimal(chosen["priceWithVat"]).quantize(Decimal("0.01"))

            # 7) создаём отправление в Packeta
            if is_hd:
                packet_id = svc.create_home_delivery_shipment(
                    order_number=order.order_number,
                    first_name=order.user.first_name,
                    surname=order.user.last_name,
                    phone=order.phone_number,
                    email=order.customer_email,
                    street=order.delivery_address.street,
                    city=order.delivery_address.city,
                    zip_code=order.delivery_address.zip_code,
                    country=order.delivery_address.country,
                    weight_grams=wt,
                    value_amount=order.total_amount,
                    cod_amount=Decimal("0.00"),
                    currency=svc.COUNTRY_CURRENCY.get(
                        order.delivery_address.country, "CZK"
                    ),
                )
            else:
                packet_id = svc.create_pickup_point_shipment(
                    order_number=order.order_number,
                    first_name=order.user.first_name,
                    surname=order.user.last_name,
                    phone=order.phone_number,
                    email=order.customer_email,
                    pickup_point_id=order.pickup_point_id,
                    weight_grams=wt,
                    value_amount=order.total_amount,
                    cod_amount=Decimal("0.00"),
                    currency=svc.COUNTRY_CURRENCY.get(
                        order.delivery_address.country, "CZK"
                    ),
                )

            # 8) сохраняем DeliveryParcel
            dp = DeliveryParcel.objects.create(
                order=order,
                warehouse=wh,
                service=order.courier_service,
                tracking_number=packet_id,
                parcel_index=idx,
                weight_grams=wt,
                shipping_price=price_with_vat,
            )

            # 9) создаём позиции в посылке
            for unit in block:
                op = order.order_products.get(product__sku=unit["sku"])
                DeliveryParcelItem.objects.create(
                    parcel=dp,
                    order_product=op,
                    quantity=unit["quantity"],
                )

            logger.info(
                "Created parcel #%d for order %s: packet_id=%s, price=%s",
                idx, order_id, packet_id, price_with_vat
            )
            created.append(dp)

    logger.info(
        "generate_parcels_for_order(%s) done, created %d parcels",
        order_id, len(created)
    )
    return created
