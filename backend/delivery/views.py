import uuid
import logging
import requests
from decimal import Decimal
from rest_framework import status, serializers
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema, OpenApiExample

from .serializers import (
    DeliveryEstimateSerializer,
    CreateShipmentSerializer,
    ShippingOptionsSerializer
)
from .models import DeliveryParcel, CourierService
from .serializers import PacketaCalculateSerializer
from .services.packeta import PacketaService
from .services.shipping_split import calculate_order_shipping
from order.models import Order
from warehouses.models import Warehouse

import xml.etree.ElementTree as ET
from zeep import Client
from zeep.transports import Transport
from zeep.exceptions import Fault


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


class ShippingOptionSerializer(serializers.Serializer):
    service = serializers.CharField(help_text="Service type: Pick-up point or Home Delivery")
    channel = serializers.ChoiceField(
        choices=[("PUDO", "Pick-up point"), ("HD", "Home Delivery")],
        help_text="Delivery channel"
    )
    price = serializers.FloatField(help_text="Cost without VAT")
    priceWithVat = serializers.FloatField(help_text="Cost including VAT")
    currency = serializers.CharField(help_text="Currency code")
    estimate = serializers.CharField(help_text="Delivery estimate, e.g. '1–2 days'", allow_blank=True)


class ShippingOptionsResponseSerializer(serializers.Serializer):
    options = ShippingOptionSerializer(many=True, help_text="Available shipping options")


@extend_schema(
    summary="Calculate shipping options",
    description=(
        "Takes destination country, COD amount, currency, and line items, "
        "and returns two options: Pick-up point (PUDO) and Home Delivery (HD)."
    ),
    request=ShippingOptionsSerializer,
    responses={
        200: OpenApiResponse(
            response=ShippingOptionsResponseSerializer,
            description="Success: shipping options calculated"
        ),
        400: OpenApiResponse(description="Invalid input or package too large/heavy"),
        500: OpenApiResponse(description="Internal error or missing rate configuration"),
    },
    examples=[
        OpenApiExample(
            "Sample Request",
            request_only=True,
            value={
                "destination_country": "CZ",
                "cod": "150.00",
                "currency": "CZK",
                "items": [
                    {"sku": "ABC123", "quantity": 2},
                    {"sku": "XYZ789", "quantity": 1}
                ]
            },
        ),
        OpenApiExample(
            "Sample Response",
            response_only=True,
            value={
                "options": [
                    {
                        "service": "Pick-up point",
                        "channel": "PUDO",
                        "price": 144.00,
                        "priceWithVat": 174.24,
                        "currency": "CZK",
                        "estimate": "1–2 days"
                    },
                    {
                        "service": "Home Delivery",
                        "channel": "HD",
                        "price": 219.00,
                        "priceWithVat": 264.99,
                        "currency": "CZK",
                        "estimate": "2–3 days"
                    }
                ]
            },
        ),
    ],
    tags=['Delivery Сalculation']
)
class ShippingOptionsView(APIView):
    """
    POST /api/shipping-options/
    Expects JSON with:
      - destination_country
      - cod
      - currency
      - items: [{ 'sku': str, 'quantity': int }, …]
    Returns two shipping options (PUDO and Home Delivery) with calculated prices.
    """

    def post(self, request):
        # 1) Validate input
        serializer = ShippingOptionsSerializer(data=request.data)
        if not serializer.is_valid():
            logger.debug("ShippingOptions validation errors: %r", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # 2) Try calculation
        try:
            options = calculate_order_shipping(
                country=data['destination_country'],
                items=data['items'],
                cod=data['cod'],
                currency=data['currency'],
            )
        except ValueError as e:
            msg = str(e)
            # 2.1) Exceeded dimensions or weight → 400
            if "exceeds allowed dimensions or weight" in msg:
                return Response(
                    {"error": "Package exceeds allowed dimensions or weight"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # 2.2) Missing rate configuration → 500
            if msg.startswith("No rate for"):
                logger.error("Shipping rate not configured: %s", msg)
                return Response(
                    {"error": "Shipping rate not configured for this seller/country/channel"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            # 2.3) Other bad input (e.g. supplier or SKU not found) → 400
            logger.error("Data error during shipping calculation: %s", msg)
            return Response(
                {"error": "Invalid input data for shipping calculation"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            # 2.4) Unexpected internal error → 500
            logger.exception("Unexpected error while calculating shipping options")
            return Response(
                {"error": "Internal server error during shipping calculation"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 3) Successful response
        return Response({"options": options}, status=status.HTTP_200_OK)
