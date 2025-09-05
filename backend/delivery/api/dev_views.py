from uuid import uuid4
from typing import Optional, List, Dict, Any

from django.conf import settings
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from delivery.providers.mygls.client import MyGlsClient
from delivery.providers.mygls.service import MyGlsService, SimpleShipment
from delivery.providers.mygls import builders


# ---------- Serializers ----------

class ShipSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=["home", "pudo"])
    client_reference = serializers.CharField(required=False, allow_blank=True)

    # Адрес получателя
    receiver_name = serializers.CharField()
    receiver_street = serializers.CharField()
    receiver_house_number = serializers.CharField(required=False, allow_blank=True)
    receiver_city = serializers.CharField()
    receiver_zip = serializers.CharField()
    receiver_country_iso = serializers.CharField(max_length=2)
    receiver_email = serializers.EmailField(required=False, allow_blank=True)
    receiver_phone = serializers.CharField(required=False, allow_blank=True)

    # PUDO
    pickup_point_id = serializers.CharField(required=False, allow_blank=True)

    # Габариты
    length_cm = serializers.FloatField(min_value=1)
    width_cm = serializers.FloatField(min_value=1)
    height_cm = serializers.FloatField(min_value=1)
    weight_kg = serializers.FloatField(min_value=0.01)

    # Печать и описание
    type_of_printer = serializers.CharField(required=False, allow_blank=True, default="A4_2x2")
    content = serializers.CharField(required=False, allow_blank=True, default="Goods")

    # Режим работы (для совместимости с фронтом; сервис этот флаг не принимает)
    flow = serializers.ChoiceField(choices=["print", "prepare"], required=False, default="print")

    def validate(self, attrs):
        if attrs["mode"] == "pudo" and not attrs.get("pickup_point_id"):
            raise serializers.ValidationError("pickup_point_id обязателен для mode='pudo'.")
        return attrs


# ---------- Views ----------

class DevShipMyGLS(APIView):
    """DEV endpoint: собирает 1 Parcel и вызывает PrintLabels."""
    permission_classes = [AllowAny]
    authentication_classes: List = []

    def _sender_from_settings(self) -> Dict[str, Any]:
        """
        Берём адрес отправителя из settings.* (MYGLS_PICKUP_*).
        Поле HouseNumber скармливаем билдера, он корректно разделит номер/суффикс.
        """
        return builders.build_address(
            name=getattr(settings, "MYGLS_PICKUP_NAME", "") or getattr(settings, "COMPANY_NAME", ""),
            street=getattr(settings, "MYGLS_PICKUP_STREET", "") or getattr(settings, "COMPANY_STREET", ""),
            house_number=getattr(settings, "MYGLS_PICKUP_HOUSE_NUMBER", "") or getattr(settings, "COMPANY_HOUSE_NUMBER", ""),
            city=getattr(settings, "MYGLS_PICKUP_CITY", "") or getattr(settings, "COMPANY_CITY", ""),
            zip_code=getattr(settings, "MYGLS_PICKUP_ZIP", "") or getattr(settings, "COMPANY_ZIP", ""),
            country_iso=(getattr(settings, "MYGLS_PICKUP_COUNTRY_ISO", "") or getattr(settings, "COMPANY_COUNTRY_ISO", "CZ")).upper(),
            contact_name=getattr(settings, "MYGLS_PICKUP_NAME", "") or getattr(settings, "COMPANY_CONTACT_NAME", ""),
            contact_phone=getattr(settings, "MYGLS_PICKUP_PHONE", "") or getattr(settings, "COMPANY_CONTACT_PHONE", ""),
            contact_email=getattr(settings, "MYGLS_PICKUP_EMAIL", "") or getattr(settings, "COMPANY_CONTACT_EMAIL", ""),
        )

    def post(self, request):
        s = ShipSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        # 1) Адрес отправителя
        pickup_addr = self._sender_from_settings()

        # 2) Адрес получателя
        delivery_addr = builders.build_address(
            name=d["receiver_name"],
            street=d["receiver_street"],
            house_number=d.get("receiver_house_number") or "",
            city=d["receiver_city"],
            zip_code=d["receiver_zip"],
            country_iso=(d["receiver_country_iso"] or "").upper(),
            contact_name=d.get("receiver_name"),
            contact_phone=d.get("receiver_phone") or "",
            contact_email=d.get("receiver_email") or "",
        )

        # 3) Свойства посылки
        props = builders.build_parcel_properties(
            content=d.get("content") or "Goods",
            length_cm=d["length_cm"],
            width_cm=d["width_cm"],
            height_cm=d["height_cm"],
            weight_kg=d["weight_kg"],
        )

        # 4) Сервисы
        services: List[Dict[str, Any]] = []
        if d["mode"] == "pudo":
            services.append(builders.build_service_psd(d["pickup_point_id"]))

        # 5) Собираем Parcel (билдер ожидает именованные аргументы)
        client_number: Optional[str] = getattr(settings, "MYGLS_CLIENT_NUMBER", None)
        client_reference = d.get("client_reference") or f"DEV-{uuid4().hex[:8]}"
        parcel = builders.build_parcel(
            client_reference=client_reference,
            client_number=client_number,
            pickup_address=pickup_addr,
            delivery_address=delivery_addr,
            properties=props,
            services=services,
        )

        # 6) Печать / сохранение ярлыков
        svc = MyGlsService()
        type_of_printer = (d.get("type_of_printer") or getattr(settings, "MYGLS_TYPE_OF_PRINTER", "A4_2x2")) or "A4_2x2"
        result = svc.create_print_and_store(
            [SimpleShipment(parcel=parcel, type_of_printer=type_of_printer)],
            store_dir="dev/mygls_labels",
        )

        ok = (result.get("status") == 200) and not result.get("errors")
        return Response(
            {
                "ok": bool(ok),
                "flow": d.get("flow") or "print",
                "parcel_numbers": result.get("parcel_numbers") or [],
                "label_url": result.get("url"),
                "print_info": result.get("print_info"),
                "errors": result.get("errors") or [],
                "printer": result.get("printer"),
            },
            status=status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST,
        )


class DevMyGLSAuthCheck(APIView):
    """Простой тест авторизации: шлём PrintLabels с пустым ParcelList."""
    permission_classes = [AllowAny]
    authentication_classes: List = []

    def get(self, request):
        client = MyGlsClient.from_settings()
        type_of_printer = getattr(settings, "MYGLS_TYPE_OF_PRINTER", "A4_2x2")
        body = {**client._auth_payload(), "ParcelList": [], "TypeOfPrinter": type_of_printer}

        url = f"{client.base_json}/PrintLabels"
        r = client.session.post(url, json=body, timeout=client.timeout)

        try:
            payload = r.json()
        except Exception:
            payload = {"raw": r.text[:800]}

        debug = {
            "username": client.username,
            "webshop_engine": client.webshop_engine,
            "base_json": client.base_json,
            "password_len": len(getattr(client, "password_bytes", b"")),
            "sent_keys": list(body.keys()),
            "sent_preview": {
                "Username": body.get("Username"),
                "Password": "<bytes:64>" if isinstance(body.get("Password"), list) else "<?>",
                "WebshopEngine": body.get("WebshopEngine"),
                "ParcelList": body.get("ParcelList"),
                "TypeOfPrinter": body.get("TypeOfPrinter"),
            },
        }
        return Response({"status": r.status_code, "payload": payload, "debug": debug})
