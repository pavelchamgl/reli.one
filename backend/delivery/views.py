import uuid
import logging
import requests

from decimal import Decimal
from rest_framework import status
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, extend_schema, OpenApiExample

from .serializers import (
    DeliveryEstimateSerializer,
    CreateShipmentSerializer,
    SellerShippingRequestSerializer,
    ShippingOptionsResponseSerializer,
    PacketaCalculateSerializer,
)
from .models import DeliveryParcel, CourierService
from .services.packeta import PacketaService
from .services.local_rates import calculate_shipping_options
from .services.shipping_split import split_items_into_parcels, calculate_order_shipping
from order.models import Order
from warehouses.models import Warehouse

import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)


class EstimateDeliveryView(APIView):
    def post(self, request):
        serializer = DeliveryEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = PacketaService(api_key="your_api_key_here")
        result = service.estimate(**serializer.validated_data)
        return Response(result)


class CreateShipmentView(APIView):
    def post(self, request):
        serializer = CreateShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = Order.objects.get(pk=serializer.validated_data['order_id'])
        warehouse = Warehouse.objects.get(pk=serializer.validated_data['warehouse_id'])
        service = CourierService.objects.get(code="packeta")

        packeta = PacketaService(api_key=settings.PACKETA_API_KEY)
        shipment = packeta.create_shipment(order=order, warehouse=warehouse)

        parcel = DeliveryParcel.objects.create(
            order=order,
            warehouse=warehouse,
            service=service,
            tracking_number=shipment["packet_id"],
            weight_grams=order.get_total_weight(),
        )

        return Response({"packet_id": shipment["packet_id"]}, status=status.HTTP_201_CREATED)


class PacketaCalculateView(APIView):
    """
    Эндпоинт для расчёта стоимости Packeta:
    createPacket с calculateOnly=true и парсингом цены.
    """

    API_URL = "https://www.zasilkovna.cz/api/rest"
    HEADERS = {"Content-Type": "application/xml"}

    def post(self, request):
        # 1) проверяем вход
        serializer = PacketaCalculateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("[PacketaCalculate] Invalid request data: %r", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        # 2) генерируем номер (≤36 символов)
        raw_hex = uuid.uuid4().hex[:31]
        packet_number = f"calc-{raw_hex}"

        # 3) граммы → килограммы
        weight_kg = Decimal(data["weight"]) / 1000

        # 4) строим XML
        xml_body = f"""
<createPacket>
  <apiPassword>{settings.PACKETA_API_PASSWORD}</apiPassword>
  <packetAttributes>
    <number>{packet_number}</number>
    <name>John</name>
    <surname>Doe</surname>
    <company>My Company s.r.o.</company>
    <email>john@example.com</email>
    <phone>+420777123456</phone>
    <addressId>{data['address_id']}</addressId>
    <cod>{data['cod']:.2f}</cod>
    <value>{data['value']:.2f}</value>
    <currency>{data['currency']}</currency>
    <weight>{weight_kg:.2f}</weight>
    <calculateOnly>true</calculateOnly>
    <eshop>Reli</eshop>
  </packetAttributes>
</createPacket>
""".strip()

        logger.debug("[PacketaCalculate] Request XML:\n%s", xml_body)

        # 5) шлём запрос
        try:
            resp = requests.post(
                self.API_URL,
                data=xml_body.encode("utf-8"),
                headers=self.HEADERS,
                timeout=10
            )
            logger.debug("[PacketaCalculate] HTTP %s", resp.status_code)
            logger.debug("[PacketaCalculate] Raw response:\n%s", resp.text)  # :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.exception("[PacketaCalculate] Connection error")
            return Response(
                {"error": "Connection error to Packeta", "detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # 6) парсим XML
        try:
            root = ET.fromstring(resp.text)
        except ET.ParseError as e:
            logger.error("[PacketaCalculate] XML parse error: %s", e)
            return Response(
                {"error": "Invalid XML from Packeta", "raw": resp.text},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # 7) обрабатываем fault
        if root.findtext("status") == "fault":
            # (сбор attributeFault и fallback на <string> см. ранее)
            message = root.findtext("string") or root.findtext("detail")
            logger.warning("[PacketaCalculate] fault: %s", message)
            return Response(
                {"success": False, "fault": root.findtext("fault"), "message": message},
                status=status.HTTP_200_OK
            )

        # 8) разбираем вложенный <result>
        result_node = root.find("result")
        result_data = {}
        if result_node is not None:
            for child in result_node:
                result_data[child.tag] = child.text

        # 9) возвращаем всё, что пришло, в том числе цену
        #    Если API не вернул price/priceWithVat, они будут None
        logger.debug("[PacketaCalculate] Calculation succeeded: %r", result_data)
        return Response(
            {"success": True, "data": result_data},
            status=status.HTTP_200_OK
        )


class PacketaValidateView(APIView):
    """
    Эндпоинт для валидации атрибутов Packeta через packetAttributesValid.
    Гарантирует, что <number> ≤ 36 символов, и логирует все ошибки.
    """

    API_URL = "https://www.zasilkovna.cz/api/rest"
    HEADERS = {"Content-Type": "application/xml"}

    def post(self, request):
        # 1) валидируем входной JSON
        serializer = PacketaCalculateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("[PacketaValidate] Invalid request data: %r", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        # 2) генерируем номер заказа ≤ 36 символов
        #    префикс "calc-" (5 символов) + первые 31 символ hex-UUID = 36 всего
        raw_hex = uuid.uuid4().hex[:31]
        packet_number = f"calc-{raw_hex}"

        # 3) переводим вес в кг
        weight_kg = Decimal(data["weight"]) / 1000

        # 4) строим XML для packetAttributesValid
        xml_body = f"""
<packetAttributesValid>
  <apiPassword>{settings.PACKETA_API_PASSWORD}</apiPassword>
  <packetAttributes>
    <number>{packet_number}</number>
    <name>John</name>
    <surname>Doe</surname>
    <company>My Company s.r.o.</company>
    <email>john@example.com</email>
    <phone>+420777123456</phone>
    <addressId>{data['address_id']}</addressId>
    <cod>{data['cod']:.2f}</cod>
    <value>{data['value']:.2f}</value>
    <currency>{data['currency']}</currency>
    <weight>{weight_kg:.2f}</weight>
    <eshop>Reli</eshop>
  </packetAttributes>
</packetAttributesValid>
""".strip()

        logger.debug("[PacketaValidate] Request XML:\n%s", xml_body)

        # 5) отправляем запрос
        try:
            resp = requests.post(
                self.API_URL,
                data=xml_body.encode("utf-8"),
                headers=self.HEADERS,
                timeout=10
            )
            logger.debug("[PacketaValidate] HTTP %s", resp.status_code)
            logger.debug("[PacketaValidate] Raw response:\n%s", resp.text)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.exception("[PacketaValidate] Connection error")
            return Response(
                {"error": "Connection error to Packeta", "detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # 6) если пустой ответ — валидно
        text = resp.text.strip()
        if not text:
            logger.debug("[PacketaValidate] Empty response → valid")
            return Response({"success": True}, status=status.HTTP_200_OK)

        # 7) парсим XML ответа
        try:
            root = ET.fromstring(text)
        except ET.ParseError as e:
            logger.error("[PacketaValidate] XML parse error: %s", e)
            return Response(
                {"error": "Invalid XML from Packeta", "raw": text},
                status=status.HTTP_502_BAD_GATEWAY
            )

        status_text = root.findtext("status")
        fault_text  = root.findtext("fault")
        human_msg   = root.findtext("string") or root.findtext("detail")

        # 8) собираем attributeFault (если есть)
        errors = []
        for af in root.findall(".//attributeFault"):
            errors.append({
                "attribute": af.findtext("attribute"),
                "code":      af.findtext("code"),
                "message":   af.findtext("message"),
            })

        # 9) если нет стандартных attributeFault, но есть detail->attributes->fault
        if not errors:
            detail_attrs = root.find("detail/attributes")
            if detail_attrs is not None:
                for fault in detail_attrs.findall("fault"):
                    errors.append({
                        "attribute": fault.findtext("name"),
                        "message":   fault.findtext("fault"),
                    })

        # 10) возвращаем результат
        if status_text == "fault":
            if errors:
                logger.warning("[PacketaValidate] attribute errors: %r", errors)
                return Response(
                    {"success": False, "fault": fault_text, "errors": errors},
                    status=status.HTTP_200_OK
                )
            # fallback на human-readable
            logger.warning("[PacketaValidate] fault: %s", human_msg)
            return Response(
                {"success": False, "fault": fault_text, "message": human_msg},
                status=status.HTTP_200_OK
            )

        logger.debug("[PacketaValidate] Validation succeeded")
        return Response({"success": True}, status=status.HTTP_200_OK)


@extend_schema(
    summary="Calculate Zásilkovna shipping options for a seller and destination",
    description=(
        "Calculates and returns available shipping options (Pick-up point - PUDO and Home Delivery - HD) "
        "for the specified seller and destination country.\n\n"
        "**Note:** This endpoint exclusively supports shipping calculations for the Zásilkovna courier service. "
        "Prices are returned in EUR, including both base price and price with VAT.\n\n"
        "**Features:**\n"
        "- Automatically splits items into multiple parcels if package limits are exceeded.\n"
        "- Returns total parcel count and aggregated shipping prices (with and without VAT).\n"
        "- Aggregated prices are **summed across all parcels for each delivery channel (PUDO, HD)**.\n"
        "- Provides combined delivery estimates for all parcels.\n\n"
        "Courier Service: **Zásilkovna only**  \n"
        "Pricing Currency: **EUR**  \n"
        "Validation: **Ensures SKUs belong to the specified seller.**"
    ),
    request=SellerShippingRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=ShippingOptionsResponseSerializer,
            description="Shipping options calculated successfully for Zásilkovna courier service"
        ),
        400: OpenApiResponse(description="Validation error or invalid input"),
        500: OpenApiResponse(description="Internal server error during shipping calculation"),
    },
    tags=['Zásilkovna Delivery', 'Delivery Calculation']
)
class SellerShippingOptionsView(APIView):
    """
    POST /api/shipping-options/seller/
    Accepts seller_id, destination country, and a list of items with SKU and quantity.
    Returns available shipping options (PUDO and HD) for each calculated parcel with prices in EUR, including VAT.
    """

    def post(self, request):
        # Step 1: Validate incoming request
        serializer = SellerShippingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        seller_id = data['seller_id']
        destination_country = data['destination_country']
        items = data['items']

        logger.info("Starting shipping calculation for seller_id=%s, destination_country=%s", seller_id, destination_country)

        try:
            # Step 2: Split items into parcels
            parcels = split_items_into_parcels(
                country=destination_country,
                items=items,
                cod=Decimal("0.00"),
                currency='EUR'
            )

            all_options = []

            # Step 3: Calculate shipping options for each parcel
            for idx, parcel in enumerate(parcels, start=1):
                logger.info("Calculating shipping for parcel #%s with %s items", idx, len(parcel))
                options = calculate_shipping_options(
                    country=destination_country,
                    items=parcel,
                    cod=Decimal("0.00"),
                    currency='EUR'
                )
                all_options.append({
                    "parcel_number": idx,
                    "items": parcel,
                    "options": options
                })

            # Step 4: Return calculated shipping options
            logger.info("Shipping options successfully calculated for seller_id=%s", seller_id)
            result = calculate_order_shipping(
                country=data['destination_country'],
                items=data['items'],
                cod=Decimal("0.00"),
                currency='EUR'
            )

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Shipping calculation failed for seller_id=%s, country=%s", seller_id, destination_country)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
