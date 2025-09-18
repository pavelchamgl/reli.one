import os
import logging

from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

from django.conf import settings
from django.db import transaction
from django.core.files.base import ContentFile

from order.models import Order
from warehouses.models import Warehouse, WarehouseItem
from delivery.models import DeliveryParcel, DeliveryParcelItem  # CourierService здесь не обязателен
from delivery.validators.validators import validate_phone_matches_country
from delivery.services.packeta import PacketaService
from delivery.services.local_rates import calculate_shipping_options as packeta_calculate_shipping_options
from delivery.services.shipping_split import split_items_into_parcels as packeta_split_items
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point

# GLS: используем ваш стек myGLS + ваш расчёт ставок и сплиттер для консистентности
from delivery.services.gls_rates import calculate_gls_shipping_options
from delivery.services.gls_split import split_items_into_parcels_gls

from delivery.providers.mygls.service import MyGlsService, SimpleShipment
from delivery.providers.mygls.builders import (
    build_pickup_address_from_settings,
    build_address,
    build_parcel_properties,
    build_service_psd,     # PUDO (PSD)
    build_parcel,          # универсальный сборщик {"ParcelList":[...]}
)

logger = logging.getLogger(__name__)


def format_zip(zip_code: str, country_code: str) -> str:
    """
    Форматирует ZIP для CZ и SK: вставляет пробел после третьей цифры.
    '60200' -> '602 00'. Для прочих стран — без изменений.
    """
    original_zip = zip_code or ""
    cc = (country_code or "").upper()
    s = (zip_code or "").strip()
    if cc in ("CZ", "SK") and len(s) == 5 and s.isdigit():
        formatted_zip = f"{s[:3]} {s[3:]}"
        logger.info("Formatted ZIP for %s: %s -> %s", cc, original_zip, formatted_zip)
        return formatted_zip
    logger.info("No ZIP formatting for %s: %s", cc, original_zip)
    return original_zip


def _get_courier_code_from_order(order: Order) -> str:
    """
    Возвращает код курьера из заказа (`order.courier_service.code`), в нижнем регистре.
    Если кода нет — считаем Packeta по умолчанию.
    """
    try:
        code = (order.courier_service.code or "").strip().lower()
    except Exception:
        code = ""
    return code or "packeta"


def _is_hd(order: Order) -> bool:
    name = (getattr(order.delivery_type, "name", "") or "").strip().lower()
    return name == "home delivery" or name == "hd"


def _attach_file_from_media_url(filefield, url: str) -> None:
    """
    Преобразует MEDIA_URL→MEDIA_ROOT, читает файл и сохраняет в FileField.
    Тихо логирует предупреждение, если файл не найден/не читается.
    """
    if not url:
        return
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    media_root = getattr(settings, "MEDIA_ROOT", ".")
    rel = url.split(media_url, 1)[-1] if media_url and media_url in url else url.lstrip("/")
    abs_path = os.path.join(media_root, rel)
    try:
        with open(abs_path, "rb") as fh:
            filefield.save(os.path.basename(abs_path), ContentFile(fh.read()), save=True)
    except Exception as e:
        logger.warning("Failed to attach file from %s: %s", abs_path, e)


def generate_parcels_for_order(order_id: int):
    """
    Генерация отправлений по заказу:
      - Packeta(Zásilkovna): createPacket + получение PDF ярлыка.
      - myGLS: PrintLabels (сохранение PDF на диск через сервис) + прикрепление в FileField.
    Сплит на посылки делается по провайдеру: для Packeta — общий сплиттер,
    для GLS — GLS-сплиттер (как в расчётах тарифов).
    """
    logger.info("Start generate_parcels_for_order(%s)", order_id)

    try:
        order = (
            Order.objects
            .select_related("delivery_type", "delivery_address", "user", "courier_service")
            .prefetch_related("order_products__product")
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        logger.error("Order with ID %s does not exist.", order_id)
        return

    # Собираем SKU→qty для позиций в статусе awaiting_shipment
    raw_items = [
        {"sku": op.product.sku, "quantity": op.quantity}
        for op in order.order_products.filter(status="awaiting_shipment")
    ]

    # Определяем страну назначения
    if order.delivery_address and order.delivery_address.country:
        country_code = order.delivery_address.country
    elif order.pickup_point_id:
        country_code = resolve_country_from_local_pickup_point(order.pickup_point_id)
    else:
        msg = f"Cannot determine country for order {order_id}"
        logger.error(msg)
        raise RuntimeError(msg)

    courier_code = _get_courier_code_from_order(order)
    is_hd = _is_hd(order)
    channel = "HD" if is_hd else "PUDO"

    created = []
    with transaction.atomic():
        if courier_code == "gls":
            # === GLS ветка ===
            logger.info("Order %s: using myGLS provider", order_id)

            # Разбиваем по GLS-логике
            parcels = split_items_into_parcels_gls(raw_items)
            logger.debug("Order %s → %d GLS parcels", order_id, len(parcels))

            # Адрес отправителя (из settings или COMPANY_*)
            sender_addr = build_pickup_address_from_settings()

            # Адрес получателя (house_number как отдельного поля нет — пустой)
            if is_hd:
                # HD: адрес обязателен
                deliv_addr = build_address(
                    name=f"{order.first_name} {order.last_name}",
                    street=order.delivery_address.street if order.delivery_address else "",
                    house_number="",  # нет отдельного поля — оставляем пустым
                    city=order.delivery_address.city if order.delivery_address else "",
                    zip_code=format_zip(order.delivery_address.zip_code, country_code) if order.delivery_address else "",
                    country_iso=country_code,
                    contact_name=f"{order.first_name} {order.last_name}",
                    contact_phone=str(order.phone_number or "") or "",
                    contact_email=order.customer_email or "",
                )
            else:
                # PUDO: адрес получателя формален, реальный пункт в ServiceList(PSD)
                deliv_addr = build_address(
                    name=f"{order.first_name} {order.last_name}",
                    street=order.delivery_address.street if order.delivery_address else "",
                    house_number="",
                    city=order.delivery_address.city if order.delivery_address else "",
                    zip_code=order.delivery_address.zip_code if order.delivery_address else "",
                    country_iso=country_code,
                    contact_name=f"{order.first_name} {order.last_name}",
                    contact_phone=str(order.phone_number or "") or "",
                    contact_email=order.customer_email or "",
                )

            # Инициализация сервиса
            gls = MyGlsService.from_settings()
            printer = getattr(settings, "MYGLS_PRINTER_TYPE", "A4_2x2")

            for idx, block in enumerate(parcels, start=1):
                # Вес посылки
                sku_to_op = {op.product.sku: op for op in order.order_products.all()}
                wt = sum(
                    (sku_to_op[b["sku"]].product.weight_grams or 0) * b["quantity"]
                    for b in block if b["sku"] in sku_to_op
                )
                logger.info("Order %s, GLS parcel #%d weight: %s g", order_id, idx, wt)

                # Стоимость доставки для этой посылки — по GLS ставкам
                try:
                    opts = calculate_gls_shipping_options(
                        country=country_code,
                        items=block,
                        currency="EUR",
                        cod=False,
                        address_bundle="one",  # одна посылка — бандл 'one'
                    )
                except Exception as e:
                    logger.error("GLS options failed for order %s, parcel #%d: %s", order_id, idx, e)
                    raise

                channel_opts = [o for o in opts if o.get("channel") == channel]
                if not channel_opts:
                    logger.error("No GLS %s options for order %s, parcel #%d", channel, order_id, idx)
                    raise RuntimeError(f"No GLS {channel} options for order {order_id}, parcel {idx}")

                chosen = channel_opts[0]
                price_with_vat = (Decimal(chosen["priceWithVat"])
                                  if isinstance(chosen["priceWithVat"], Decimal)
                                  else Decimal(str(chosen["priceWithVat"]))).quantize(Decimal("0.01"))
                logger.info("Order %s, GLS parcel #%d chosen: %s (%.2f EUR)",
                            order_id, idx, chosen["service"], price_with_vat)

                # Телефон обязателен для HD → валидация (аналогично Packeta)
                if is_hd:
                    phone_err = validate_phone_matches_country(str(order.phone_number or ""), country_code)
                    if phone_err:
                        logger.error("Phone validation failed for GLS order %s: %s", order_id, phone_err)
                        raise RuntimeError(f"Invalid phone number for destination country: {phone_err}")

                # Свойства посылки (габариты допускаем минимальные валидные)
                props = build_parcel_properties(
                    content=f"Order {order.order_number}",
                    length_cm=1, width_cm=1, height_cm=1,
                    weight_kg=max(0.01, (wt or 0) / 1000.0),
                )

                services = []
                if not is_hd:
                    # GLS PUDO → PSD
                    if not order.pickup_point_id:
                        raise RuntimeError(f"pickup_point_id is required for GLS PUDO (order {order_id})")
                    services.append(build_service_psd(str(order.pickup_point_id)))

                parcel_payload = build_parcel(
                    client_reference=f"{order.order_number}-p{idx}",
                    client_number=getattr(settings, "MYGLS_CLIENT_NUMBER", None),
                    pickup_address=sender_addr,
                    delivery_address=deliv_addr,
                    properties=props,
                    services=services or None,
                )

                # Печать ярлыка и сохранение на диск
                res = gls.create_print_and_store(
                    [SimpleShipment(parcel=parcel_payload, type_of_printer=printer)],
                    store_dir="labels/mygls",
                    flow="print",
                    corr_id=f"order-{order.id}-parcel-{idx}",
                )
                if res.get("errors"):
                    raise RuntimeError(f"myGLS errors: {res['errors']}")

                numbers = res.get("parcel_numbers") or []
                tracking = numbers[0] if numbers else ""

                dp = DeliveryParcel.objects.create(
                    order=order,
                    warehouse=Warehouse.objects.filter(pickup_by_courier=False).first() or Warehouse.objects.first(),
                    service=order.courier_service,
                    tracking_number=tracking,
                    parcel_index=idx,
                    weight_grams=wt or 0,
                    shipping_price=price_with_vat,
                )

                # Прикрепляем PDF-файл к FileField из уже сохранённого файла
                _attach_file_from_media_url(dp.label_file, res.get("url"))

                # Сгруппировать позиции по SKU → DeliveryParcelItem
                grouped = defaultdict(int)
                for u in block:
                    grouped[u["sku"]] += u["quantity"]

                for sku, total_q in grouped.items():
                    op = sku_to_op.get(sku)
                    if not op:
                        logger.error("SKU %s not found in order %s; skip linking to parcel", sku, order_id)
                        continue
                    DeliveryParcelItem.objects.create(parcel=dp, order_product=op, quantity=total_q)

                logger.info("Created GLS parcel #%d for order %s: tracking=%s, price=%s",
                            idx, order_id, tracking, price_with_vat)
                created.append(dp)

        else:
            # === Packeta (Zásilkovna) ветка (как было, только аккуратнее) ===
            logger.info("Order %s: using Packeta provider", order_id)
            svc = PacketaService()

            # Валюта Packeta HD по стране
            currency = svc.COUNTRY_CURRENCY.get(country_code, "CZK")

            # Разбиваем по общей логике Packeta
            parcels = packeta_split_items(country=country_code, items=raw_items, cod=False, currency="EUR")
            logger.debug("Order %s → %d Packeta parcels", order_id, len(parcels))

            # Склад
            wh = Warehouse.objects.filter(pickup_by_courier=False).first() or Warehouse.objects.first()
            if not wh:
                msg = f"No warehouse available for order {order_id}"
                logger.error(msg)
                raise RuntimeError(msg)

            sku_to_op = {op.product.sku: op for op in order.order_products.all()}

            for idx, block in enumerate(parcels, start=1):
                # Вес
                wt = sum(
                    (sku_to_op[u["sku"]].product.weight_grams or 0) * u["quantity"]
                    for u in block if u["sku"] in sku_to_op
                )
                logger.info("Order %s, Packeta parcel #%d weight: %s g", order_id, idx, wt)

                # Тарифы Packeta для этого блока
                opts = packeta_calculate_shipping_options(
                    country=country_code,
                    items=block,
                    cod=False,
                    currency="EUR",
                )
                channel_opts = [o for o in opts if o.get("channel") == channel]
                if not channel_opts:
                    logger.error("No Packeta %s options for order %s, parcel #%d", channel, order_id, idx)
                    raise RuntimeError(f"No shipping options for channel {channel} on order {order_id}, parcel {idx}")

                chosen = channel_opts[0]
                price_with_vat = (Decimal(chosen["priceWithVat"])
                                  if isinstance(chosen["priceWithVat"], Decimal)
                                  else Decimal(str(chosen["priceWithVat"]))).quantize(Decimal("0.01"))
                logger.info("Order %s, Packeta parcel #%d chosen: %s, price %.2f EUR",
                            order_id, idx, chosen["service"], price_with_vat)

                # Страховка (как у вас было)
                value_amount = Decimal("1.00")

                if is_hd:
                    # Валидация телефона и нормализация ZIP
                    phone_error = validate_phone_matches_country(str(order.phone_number or ""), country_code)
                    if phone_error:
                        logger.error("Phone validation failed for Packeta order %s: %s", order_id, phone_error)
                        raise RuntimeError(f"Invalid phone number for destination country: {phone_error}")

                    normalized_zip = format_zip(order.delivery_address.zip_code, country_code)
                    packet_id = svc.create_home_delivery_shipment(
                        order_number=order.order_number,
                        first_name=order.first_name,
                        surname=order.last_name,
                        phone=str(order.phone_number or ""),
                        email=order.customer_email,
                        street=order.delivery_address.street,
                        city=order.delivery_address.city,
                        zip_code=normalized_zip,
                        country=country_code,
                        weight_grams=wt or 0,
                        value_amount=value_amount,
                        cod_amount=Decimal("0.00"),
                        currency=currency,
                    )
                else:
                    if not order.pickup_point_id:
                        raise RuntimeError(f"pickup_point_id is required for Packeta PUDO (order {order_id})")
                    packet_id = svc.create_pickup_point_shipment(
                        order_number=order.order_number,
                        first_name=order.first_name,
                        surname=order.last_name,
                        phone=str(order.phone_number or ""),
                        email=order.customer_email,
                        pickup_point_id=order.pickup_point_id,
                        weight_grams=wt or 0,
                        value_amount=value_amount,
                        cod_amount=Decimal("0.00"),
                        currency=currency,
                    )

                # Создаём DeliveryParcel
                dp = DeliveryParcel.objects.create(
                    order=order,
                    warehouse=wh,
                    service=order.courier_service,
                    tracking_number=packet_id or "",
                    parcel_index=idx,
                    weight_grams=wt or 0,
                    shipping_price=price_with_vat,
                )

                # Прикрепляем ярлык (PDF из Packeta)
                try:
                    label_pdf = svc.get_label_pdf(packet_id)
                    dp.label_file.save(f"label_{packet_id}.pdf", ContentFile(label_pdf), save=True)
                except Exception as e:
                    logger.error("Failed to fetch Packeta label for packet %s: %s", packet_id, e)

                # Сгруппировать позиции по SKU
                grouped = defaultdict(int)
                for u in block:
                    grouped[u["sku"]] += u["quantity"]

                for sku, total_q in grouped.items():
                    op = sku_to_op.get(sku)
                    if not op:
                        logger.error("SKU %s not found in order %s; skip linking to parcel", sku, order_id)
                        continue
                    DeliveryParcelItem.objects.create(parcel=dp, order_product=op, quantity=total_q)

                logger.info("Created Packeta parcel #%d for order %s: packet_id=%s, price=%s",
                            idx, order_id, packet_id, price_with_vat)
                created.append(dp)

    logger.info("generate_parcels_for_order(%s) done, created %d parcels", order_id, len(created))
    return created


def fetch_and_store_labels_for_order(order_id: int):
    """
    Догрузка ярлыков:
      - Packeta: запрашиваем PDF по packet_id и прикладываем.
      - myGLS: ярлык сохраняется при печати (create_print_and_store); если FileField пуст —
               пробуем подцепить с диска по ранее сохранённому URL (если мы его хранили)
               или логируем предупреждение (API повторной выдачи ярлыков не трогаем).
    """
    svc_packeta = PacketaService()
    parcels = DeliveryParcel.objects.filter(order_id=order_id)
    saved_count = 0

    for parcel in parcels:
        if parcel.label_file:
            logger.info("Label already exists for parcel %s, skipping.", parcel.id)
            continue

        # Пробуем понять провайдера по коду в связанной службе
        code = ""
        try:
            code = (parcel.service.code or "").strip().lower()
        except Exception:
            pass

        if code == "gls":
            # Ярлык для GLS уже печатается и сохраняется при создании.
            # Здесь можем только попробовать восстановить файл с диска, если знаем URL (не храним) — пропускаем.
            logger.info("GLS parcel %s has no label in DB; label is expected to be saved on creation.", parcel.id)
            continue

        # Packeta — скачиваем PDF по packet_id
        try:
            pdf = svc_packeta.get_label_pdf(parcel.tracking_number)
            parcel.label_file.save(f"label_{parcel.tracking_number}.pdf", ContentFile(pdf))
            parcel.save()
            saved_count += 1
            logger.info("Packeta label saved for parcel %s", parcel.id)
        except Exception as e:
            logger.error("Failed to fetch Packeta label for parcel %s: %s", parcel.id, e)

    logger.info("Total labels saved for order %s: %d", order_id, saved_count)
