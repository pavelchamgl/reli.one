import os
import base64
import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.core.files.base import ContentFile

from order.models import Order
from warehouses.models import Warehouse
from delivery.models import DeliveryParcel, DeliveryParcelItem
from delivery.validators.validators import validate_phone_matches_country
from delivery.services.packeta import PacketaService
from delivery.services.local_rates import (
    calculate_shipping_options as packeta_calculate_shipping_options,
)
from delivery.services.shipping_split import (
    split_items_into_parcels as packeta_split_items,
)
from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point

from delivery.providers.dpd import endpoints as dpd_ep
from delivery.providers.dpd.client import DpdClient
from delivery.providers.dpd.builders import build_single_shipment

from delivery.services.gls_rates import calculate_gls_shipping_options
from delivery.services.gls_split import split_items_into_parcels_gls
from delivery.providers.mygls.service import MyGlsService, SimpleShipment
from delivery.providers.mygls.builders import (
    build_pickup_address_from_settings,
    build_address,
    build_parcel_properties,
    build_service_psd,
    build_parcel,
)

# --- DPD: «источник истины» по маршрутизации берем из rates ---
from delivery.services.dpd_rates import (
    calculate_dpd_shipping_options,
    resolve_channel_for,  # -> "S2S" | "S2H" | "HD"
)
from delivery.services.dpd_split import split_items_into_parcels_dpd

logger = logging.getLogger(__name__)


def format_zip(zip_code: str, country_code: str) -> str:
    """CZ/SK: '60200' -> '602 00'. Остальные без изменений."""
    original_zip = zip_code or ""
    cc = (country_code or "").upper()
    s = (zip_code or "").strip()
    if cc in ("CZ", "SK") and len(s) == 5 and s.isdigit():
        formatted_zip = f"{s[:3]} {s[3:]}"
        logger.info("Formatted ZIP for %s: %s -> %s", cc, original_zip, formatted_zip)
        return formatted_zip
    return original_zip


def _resolve_phone_prefix(country_code: str) -> str:
    cc = (country_code or "").upper()
    return {
        "CZ": "+420",
        "SK": "+421",
        "PL": "+48",
        "HU": "+36",
        "RO": "+40",
        "DE": "+49",
        "AT": "+43",
    }.get(cc, "+420")


def _get_courier_code_from_order(order: Order) -> str:
    try:
        code = (order.courier_service.code or "").strip().lower()
    except Exception:
        code = ""
    return code or "packeta"


def _is_hd(order: Order) -> bool:
    name = (getattr(order.delivery_type, "name", "") or "").strip().lower()
    return name in {"home delivery", "hd"}


def _attach_file_from_media_url(filefield, url: str) -> None:
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


def _normalize_options(maybe_options):
    if isinstance(maybe_options, dict):
        return list(maybe_options.get("options", []))
    return list(maybe_options or [])


@transaction.atomic
def generate_parcels_for_order(order_id: int):
    """
    Генерация отправлений по заказу:
    - GLS через MyGLS API
    - DPD через NST API v1.1 (build_single_shipment)
    - Packeta (Zásilkovna)
    """
    logger.info("Start generate_parcels_for_order(%s)", order_id)

    try:
        order = (
            Order.objects
            .select_related("delivery_type", "delivery_address", "user", "courier_service")
            .prefetch_related("order_products__product__product__seller__default_warehouse")
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        logger.error("Order with ID %s does not exist.", order_id)
        return

    raw_items = [
        {"sku": op.product.sku, "quantity": op.quantity}
        for op in order.order_products.filter(status="awaiting_shipment")
        if hasattr(op, "product") and hasattr(op.product, "sku")
    ]

    # Один продавец на заказ (группы уже разнесены ранее)
    if (
        order.order_products
        .values_list("product__product__seller_id", flat=True)
        .distinct()
        .count() != 1
    ):
        raise RuntimeError("Order contains multiple sellers; expected single-seller order.")

    first_op = order.order_products.select_related(
        "product__product__seller__default_warehouse"
    ).first()
    if not first_op or not getattr(first_op.product, "product", None) or not getattr(first_op.product.product, "seller", None):
        msg = f"Cannot resolve seller/default_warehouse for order {order_id}"
        logger.error(msg)
        raise RuntimeError(msg)

    seller = first_op.product.product.seller
    dw = getattr(seller, "default_warehouse", None)
    if not dw:
        raise RuntimeError("Seller has no default_warehouse set (must be a CZ warehouse).")
    if getattr(dw, "country", None) != "CZ":
        raise RuntimeError("Отправка разрешена только из Чехии: default_warehouse.country != 'CZ'.")
    chosen_wh = dw

    # Страна назначения
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
    requested_delivery_type = "HD" if is_hd else "PUDO"  # выбор пользователя ("HD"|"PUDO")
    created = []

    # ----------------------------------------------- GLS -----------------------------------------------
    if courier_code == "gls":
        logger.info("Order %s: using myGLS provider", order_id)

        parcels = split_items_into_parcels_gls(raw_items)
        logger.debug("Order %s → %d GLS parcels", order_id, len(parcels))

        sender_addr = build_pickup_address_from_settings()
        gls = MyGlsService.from_settings()
        printer = getattr(settings, "MYGLS_PRINTER_TYPE", "A4_2x2")
        sku_to_op = {op.product.sku: op for op in order.order_products.all()}

        for idx, block in enumerate(parcels, start=1):
            wt = sum(
                (sku_to_op[b["sku"]].product.weight_grams or 0) * b["quantity"]
                for b in block if b["sku"] in sku_to_op
            )

            opts_raw = calculate_gls_shipping_options(
                country=country_code,
                items=block,
                currency="EUR",
                cod=False,
                address_bundle="one" if len(parcels) == 1 else "multi",
            )
            opts = _normalize_options(opts_raw)
            channel_opts = [o for o in opts if o.get("channel") == requested_delivery_type]
            if not channel_opts:
                raise RuntimeError(f"No GLS {requested_delivery_type} options for order {order_id}, parcel {idx}")
            chosen = channel_opts[0]
            price_with_vat = Decimal(str(chosen["priceWithVat"])).quantize(Decimal("0.01"))

            if is_hd:
                phone_err = validate_phone_matches_country(str(order.phone_number or ""), country_code)
                if phone_err:
                    raise RuntimeError(f"Invalid phone number for destination country: {phone_err}")

            deliv_addr = build_address(
                name=f"{order.first_name} {order.last_name}",
                street=getattr(order.delivery_address, "street", ""),
                house_number="",
                city=getattr(order.delivery_address, "city", ""),
                zip_code=format_zip(getattr(order.delivery_address, "zip_code", ""), country_code),
                country_iso=country_code,
                contact_name=f"{order.first_name} {order.last_name}",
                contact_phone=str(order.phone_number or ""),
                contact_email=getattr(order, "customer_email", ""),
            )

            props = build_parcel_properties(
                content=f"Order {order.order_number}",
                length_cm=1, width_cm=1, height_cm=1,
                weight_kg=max(0.01, (wt or 0) / 1000.0),
            )

            services = []
            if not is_hd:
                if not order.pickup_point_id:
                    raise RuntimeError(f"pickup_point_id required for GLS PUDO (order {order_id})")
                services.append(build_service_psd(str(order.pickup_point_id)))

            parcel_payload = build_parcel(
                client_reference=f"{order.order_number}-p{idx}",
                client_number=getattr(settings, "MYGLS_CLIENT_NUMBER", None),
                pickup_address=sender_addr,
                delivery_address=deliv_addr,
                properties=props,
                services=services or None,
            )

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
                warehouse=chosen_wh,
                service=order.courier_service,
                tracking_number=tracking,
                parcel_index=idx,
                weight_grams=wt or 0,
                shipping_price=price_with_vat,
            )
            _attach_file_from_media_url(dp.label_file, res.get("url"))

            for u in block:
                op = sku_to_op.get(u["sku"])
                if op:
                    DeliveryParcelItem.objects.create(parcel=dp, order_product=op, quantity=u["quantity"])
            created.append(dp)

    # ----------------------------------------------- DPD -----------------------------------------------
    elif courier_code == "dpd":
        logger.info("Order %s: using DPD provider", order_id)

        # Сплит — тем же типом сервиса, который выбрал пользователь
        sku_to_op = {op.product.sku: op for op in order.order_products.select_related("product")}
        variant_map = {sku: op.product for sku, op in sku_to_op.items()}
        parcels = split_items_into_parcels_dpd(raw_items, variant_map=variant_map, service=requested_delivery_type)

        client = DpdClient()
        sender_address_id = getattr(settings, "DPD_SENDER_ADDRESS_ID", None)
        if not sender_address_id:
            raise RuntimeError("DPD_SENDER_ADDRESS_ID must be configured")

        # Разрешаем канал единым резолвером ("S2S"|"S2H"|"HD")
        resolved_channel = resolve_channel_for(country_code, requested_delivery_type)

        # Локальное маппирование канала → сервиса NST API (чтобы не трогать dpd_rates)
        if resolved_channel == "S2S":
            service_type = "SHOP2SHOP"
        elif resolved_channel == "S2H":
            service_type = "SHOP2HOME"
        else:
            service_type = "CLASSIC"

        need_pudo_id = (resolved_channel == "S2S")

        if need_pudo_id and not order.pickup_point_id:
            raise RuntimeError(f"pickup_point_id required for DPD PUDO (order {order_id})")

        # Для фильтрации опций из rates: "PUDO" для S2S, иначе "HD"
        expected_option_channel = "PUDO" if resolved_channel == "S2S" else "HD"

        for idx, block in enumerate(parcels, start=1):
            wt_g = sum(
                (variant_map[b["sku"]].weight_grams or 0) * b["quantity"]
                for b in block if b["sku"] in variant_map
            )
            wt_kg = float(f"{max(0.01, (wt_g or 0) / 1000.0):.2f}")

            opts_raw = calculate_dpd_shipping_options(
                country=country_code,
                items=block,
                currency="EUR",
                cod=False,
                variant_map=variant_map,
            )
            opts = _normalize_options(opts_raw)
            chosen_opts = [o for o in opts if o.get("channel") == expected_option_channel]
            if not chosen_opts:
                raise RuntimeError(f"No DPD {expected_option_channel} options for order {order_id} (parcel {idx})")
            chosen = chosen_opts[0]
            price_with_vat = Decimal(str(chosen["priceWithVat"])).quantize(Decimal("0.01"))

            shipment = build_single_shipment(
                num_order=order.id,
                sender_address_id=sender_address_id,
                name=f"{order.first_name} {order.last_name}",
                email=getattr(order, "customer_email", ""),
                phone=str(order.phone_number or ""),
                phone_prefix=_resolve_phone_prefix(country_code),
                street=getattr(order.delivery_address, "street", ""),
                zip_code=format_zip(getattr(order.delivery_address, "zip_code", ""), country_code),
                city=getattr(order.delivery_address, "city", ""),
                country=country_code,
                weight_kg=wt_kg,
                service=service_type,                              # "SHOP2SHOP" | "SHOP2HOME" | "CLASSIC"
                pudo_id=str(order.pickup_point_id) if need_pudo_id else None,
                label_size=getattr(settings, "DPD_LABEL_SIZE", "A6"),
                print_format=getattr(settings, "DPD_PRINT_FORMAT", "pdf"),
            )

            res = dpd_ep.create_shipments(client, [shipment])
            first = (res.get("shipmentResults") or [{}])[0]
            if first.get("errors") or res.get("errors"):
                raise RuntimeError(f"DPD error: {first.get('errors') or res.get('errors')}")

            # Лейбл может прийти inline (labelFile), а номер посылки — в parcelResults.
            shipment_obj = first.get("shipment", {}) or {}
            parcel_results = first.get("parcelResults") or shipment_obj.get("parcels") or []
            label_b64 = first.get("labelFile")

            # Трекинг — parcelNumber, если есть; иначе mpsId/shipmentId
            tracking = ""
            if parcel_results:
                tracking = parcel_results[0].get("parcelNumber") or ""
            if not tracking:
                tracking = shipment_obj.get("mpsId") or str(first.get("shipmentId") or "")

            dp = DeliveryParcel.objects.create(
                order=order,
                warehouse=chosen_wh,
                service=order.courier_service,
                tracking_number=tracking or "",
                parcel_index=idx,
                weight_grams=wt_g or 0,
                shipping_price=price_with_vat,
            )

            if label_b64:
                raw = label_b64.split(",", 1)[-1]
                try:
                    pdf = base64.b64decode(raw)
                    dp.label_file.save(f"label_{tracking or order.order_number}.pdf", ContentFile(pdf), save=True)
                except Exception as e:
                    logger.error("Failed to decode inline DPD label for order %s parcel %s: %s", order.id, idx, e)

            for u in block:
                op = sku_to_op.get(u["sku"])
                if op:
                    DeliveryParcelItem.objects.create(parcel=dp, order_product=op, quantity=u["quantity"])
            created.append(dp)

    # --------------------------------------------- PACKETA ----------------------------------------------
    else:
        logger.info("Order %s: using Packeta provider", order_id)
        svc = PacketaService()
        packeta_currency = svc.COUNTRY_CURRENCY.get(country_code, "CZK")

        parcels = packeta_split_items(country=country_code, items=raw_items, cod=False, currency="EUR")
        wh = chosen_wh or Warehouse.objects.first()
        if not wh:
            raise RuntimeError(f"No warehouse available for order {order_id}")

        sku_to_op = {op.product.sku: op for op in order.order_products.all()}

        for idx, block in enumerate(parcels, start=1):
            wt = sum(
                (sku_to_op[u["sku"]].product.weight_grams or 0) * u["quantity"]
                for u in block if u["sku"] in sku_to_op
            )

            opts_raw = packeta_calculate_shipping_options(
                country=country_code, items=block, cod=False, currency="EUR"
            )
            opts = _normalize_options(opts_raw)
            channel_opts = [o for o in opts if o.get("channel") == requested_delivery_type]
            if not channel_opts:
                raise RuntimeError(f"No Packeta {requested_delivery_type} options for order {order_id}")
            chosen = channel_opts[0]
            price_with_vat = Decimal(str(chosen["priceWithVat"])).quantize(Decimal("0.01"))

            if is_hd:
                normalized_zip = format_zip(getattr(order.delivery_address, "zip_code", ""), country_code)
                packet_id = svc.create_home_delivery_shipment(
                    order_number=order.order_number,
                    first_name=order.first_name,
                    surname=order.last_name,
                    phone=str(order.phone_number or ""),
                    email=getattr(order, "customer_email", ""),
                    street=order.delivery_address.street,
                    city=order.delivery_address.city,
                    zip_code=normalized_zip,
                    country=country_code,
                    weight_grams=wt or 0,
                    value_amount=Decimal("1.00"),
                    cod_amount=Decimal("0.00"),
                    currency=packeta_currency,
                )
            else:
                if not order.pickup_point_id:
                    raise RuntimeError(f"pickup_point_id required for Packeta PUDO (order {order_id})")
                packet_id = svc.create_pickup_point_shipment(
                    order_number=order.order_number,
                    first_name=order.first_name,
                    surname=order.last_name,
                    phone=str(order.phone_number or ""),
                    email=getattr(order, "customer_email", ""),
                    pickup_point_id=order.pickup_point_id,
                    weight_grams=wt or 0,
                    value_amount=Decimal("1.00"),
                    cod_amount=Decimal("0.00"),
                    currency=packeta_currency,
                )

            dp = DeliveryParcel.objects.create(
                order=order,
                warehouse=wh,
                service=order.courier_service,
                tracking_number=packet_id or "",
                parcel_index=idx,
                weight_grams=wt or 0,
                shipping_price=price_with_vat,
            )
            try:
                label_pdf = svc.get_label_pdf(packet_id)
                dp.label_file.save(f"label_{packet_id}.pdf", ContentFile(label_pdf), save=True)
            except Exception as e:
                logger.error("Failed to fetch Packeta label %s: %s", packet_id, e)

            for u in block:
                op = sku_to_op.get(u["sku"])
                if op:
                    DeliveryParcelItem.objects.create(parcel=dp, order_product=op, quantity=u["quantity"])
            created.append(dp)

    logger.info("generate_parcels_for_order(%s) done, created %d parcels", order_id, len(created))
    return created


def fetch_and_store_labels_for_order(order_id: int):
    """
    Догрузка ярлыков.
    Если при создании посылки DPD не вернул inline label/parcelNumber,
    здесь можно добрать PDF (при необходимости — доработать dpd_ep для запроса по shipmentId/numOrder).
    """
    svc_packeta = PacketaService()
    parcels = DeliveryParcel.objects.filter(order_id=order_id)
    saved_count = 0

    for parcel in parcels:
        if parcel.label_file:
            continue

        code = ""
        try:
            code = (parcel.service.code or "").strip().lower()
        except Exception:
            pass

        if code == "gls":
            logger.info(
                "GLS parcel %s has no label in DB; label is expected to be saved on creation.",
                parcel.id,
            )
            continue

        elif code == "dpd":
            try:
                # Базовый путь — по номеру посылки.
                lab = dpd_ep.labels_by_parcel_numbers(
                    DpdClient(),
                    [parcel.tracking_number],
                    fmt=getattr(settings, "DPD_LABEL_SIZE", "A6"),
                    start_pos=getattr(settings, "DPD_LABEL_START_POSITION", 1),
                    print_format=getattr(settings, "DPD_PRINT_FORMAT", "pdf"),
                )
                raw = (lab.get("pdfFile") or "").split(",", 1)[-1]
                if not raw:
                    raise RuntimeError("Empty pdfFile from DPD")
                pdf = base64.b64decode(raw)
                parcel.label_file.save(f"label_{parcel.tracking_number}.pdf", ContentFile(pdf))
                parcel.save()
                saved_count += 1
            except Exception as e:
                # Если tracking_number оказался mpsId/shipmentId, а не parcelNumber,
                # здесь можно добавить альтернативный вызов (по shipmentId/numOrder),
                # когда он будет реализован в delivery.providers.dpd.endpoints.
                logger.error("Failed to fetch DPD label for parcel %s: %s", parcel.id, e)
            continue

        # Packeta
        try:
            pdf = svc_packeta.get_label_pdf(parcel.tracking_number)
            parcel.label_file.save(f"label_{parcel.tracking_number}.pdf", ContentFile(pdf))
            parcel.save()
            saved_count += 1
        except Exception as e:
            logger.error("Failed to fetch Packeta label for parcel %s: %s", parcel.id, e)

    logger.info("Total labels saved for order %s: %d", order_id, saved_count)
