from __future__ import annotations
from uuid import uuid4

from django.conf import settings
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from delivery.providers.mygls.client import MyGlsClient
from delivery.providers.mygls.service import MyGlsService, SimpleShipment
from delivery.providers.mygls import builders


class ShipSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=["home", "pudo"])
    client_reference = serializers.CharField(required=False, allow_blank=True)

    # адрес получателя
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

    # габариты
    length_cm = serializers.FloatField(min_value=1)
    width_cm = serializers.FloatField(min_value=1)
    height_cm = serializers.FloatField(min_value=1)
    weight_kg = serializers.FloatField(min_value=0.01)

    # печать и описание
    type_of_printer = serializers.CharField(required=False, allow_blank=True, default="A4_2x2")
    content = serializers.CharField(required=False, allow_blank=True, default="Goods")

    # режим
    flow = serializers.ChoiceField(choices=["print", "prepare"], required=False, default="print")

    def validate(self, attrs):
        if attrs["mode"] == "pudo" and not attrs.get("pickup_point_id"):
            raise serializers.ValidationError("pickup_point_id обязателен для mode='pudo'.")
        return attrs


class DevShipMyGLS(APIView):
    """DEV endpoint: собирает 1 Parcel и вызывает PrintLabels/PrepareLabels."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        s = ShipSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        client_number = getattr(settings, "MYGLS_CLIENT_NUMBER", None)
        parcel = builders.build_parcel(
            mode=d["mode"],
            client_reference=d.get("client_reference") or f"DEV-{uuid4().hex[:8]}",
            receiver_name=d["receiver_name"],
            receiver_street=d["receiver_street"],
            receiver_house_number=d.get("receiver_house_number") or "",
            receiver_city=d["receiver_city"],
            receiver_zip=d["receiver_zip"],
            receiver_country_iso=d["receiver_country_iso"],
            receiver_email=d.get("receiver_email") or "",
            receiver_phone=d.get("receiver_phone") or "",
            length_cm=d["length_cm"],
            width_cm=d["width_cm"],
            height_cm=d["height_cm"],
            weight_kg=d["weight_kg"],
            content=d.get("content") or "Goods",
            pickup_point_id=d.get("pickup_point_id"),
            client_number=client_number,
        )

        svc = MyGlsService()
        result = svc.create_print_and_store(
            [SimpleShipment(parcel=parcel, type_of_printer=d.get("type_of_printer") or "A4_2x2")],
            store_dir="dev/mygls_labels",
            flow=d.get("flow") or "print",
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
    """Тест авторизации: вызываем PrintLabels с пустым ParcelList (ожидаем 200)."""
    permission_classes = [AllowAny]
    authentication_classes = []

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
