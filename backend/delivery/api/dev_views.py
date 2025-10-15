import os
import base64
import logging

from uuid import uuid4
from typing import Optional, List, Dict, Any

from django.conf import settings
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from delivery.providers.mygls import builders
from delivery.providers.mygls.client import MyGlsClient
from delivery.providers.mygls.service import MyGlsService, SimpleShipment
from delivery.providers.dpd import endpoints as ep
from delivery.providers.dpd.client import DpdClient
from delivery.providers.dpd.service import DpdService
from delivery.providers.dpd.builders import build_receiver


logger = logging.getLogger(__name__)


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


# ---------- Small helpers for safe logs ----------

def _mask_email(s: str | None) -> str:
    if not s:
        return ""
    local, _, domain = s.partition("@")
    return (local[:2] + "***@" + domain) if domain else "***"


def _mask_phone(s: str | None) -> str:
    if not s:
        return ""
    digits = "".join(ch for ch in s if ch.isdigit())
    if len(digits) <= 3:
        return "***"
    prefix = "+" if s.strip().startswith("+") else ""
    return f"{prefix}{'*'*(len(digits)-3)}{digits[-3:]}"


def _brief_addr(a: dict) -> dict:
    return {
        "Name": a.get("Name"),
        "Street": a.get("Street"),
        "HouseNumber": a.get("HouseNumber"),
        "HouseNumberInfo": a.get("HouseNumberInfo"),
        "City": a.get("City"),
        "ZipCode": a.get("ZipCode"),
        "CountryIsoCode": a.get("CountryIsoCode"),
        "ContactName": a.get("ContactName"),
        "ContactEmail": _mask_email(a.get("ContactEmail")),
        "ContactPhone": _mask_phone(a.get("ContactPhone")),
    }


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

        corr_id = uuid4().hex[:8]
        logger.info(
            "GLS DEV ship start id=%s mode=%s ref=%s printer=%s",
            corr_id, d["mode"], d.get("client_reference"), d.get("type_of_printer") or "A4_2x2"
        )

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

        logger.debug("id=%s PickupAddress=%s", corr_id, _brief_addr(pickup_addr))
        logger.debug("id=%s DeliveryAddress=%s", corr_id, _brief_addr(delivery_addr))
        logger.debug("id=%s ParcelProperties=%s", corr_id, props)
        if services:
            logger.debug("id=%s Services=%s", corr_id, services)

        # 5) Собираем Parcel
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
        logger.info("GLS DEV PrintLabels call id=%s", corr_id)
        result = svc.create_print_and_store(
            [SimpleShipment(parcel=parcel, type_of_printer=type_of_printer)],
            store_dir="dev/mygls_labels",
            corr_id=corr_id,
        )

        ok = (result.get("status") == 200) and not result.get("errors")
        if ok:
            logger.info(
                "GLS DEV ship OK id=%s nums=%s file=%s",
                corr_id, result.get("parcel_numbers"), result.get("url"),
            )
        else:
            logger.error(
                "GLS DEV ship FAIL id=%s status=%s errors=%s",
                corr_id, result.get("status"), result.get("errors"),
            )

        return Response(
            {
                "ok": bool(ok),
                "flow": d.get("flow") or "print",
                "parcel_numbers": result.get("parcel_numbers") or [],
                "label_url": result.get("url"),
                "print_info": result.get("print_info"),
                "errors": result.get("errors") or [],
                "printer": result.get("printer"),
                "debug_id": corr_id,
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

        logger.info("GLS DEV authcheck → status=%s base=%s", r.status_code, client.base_json)

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


class DevShipDPD(APIView):
    """
    DEV endpoint:
      - создаёт отправление (saveMode берётся из settings.DPD_SHIP_SAVE_MODE)
      - печатает ярлык (если printed) и сохраняет PDF в MEDIA_ROOT/DPD_LABEL_DIR
      - для draft возвращает shipment_id (для допечатки позже)
    """
    permission_classes = [AllowAny]

    class Input(serializers.Serializer):
        # получатель
        name = serializers.CharField(max_length=80)
        email = serializers.EmailField(required=False, allow_blank=True)
        phone = serializers.CharField(required=False, allow_blank=True)
        phone_prefix = serializers.CharField(
            required=False, allow_blank=True,
            default=getattr(settings, "DPD_PHONE_DEFAULT_PREFIX", "420"),
        )
        street = serializers.CharField(max_length=80)
        zip = serializers.CharField(max_length=16)
        city = serializers.CharField(max_length=80)
        country = serializers.CharField(max_length=2)
        # PUDO — обязателен для SHOP2SHOP
        pudo_id = serializers.CharField(required=False, allow_blank=True)

        # посылка
        weight_kg = serializers.FloatField(min_value=0.01)
        length_cm = serializers.FloatField(required=False, min_value=0.0)
        width_cm = serializers.FloatField(required=False, min_value=0.0)
        height_cm = serializers.FloatField(required=False, min_value=0.0)

        # сервис
        service = serializers.ChoiceField(choices=("CLASSIC", "SHOP2HOME", "SHOP2SHOP"))

        # печать
        label_size = serializers.ChoiceField(
            choices=("A4", "A6"), required=False,
            default=getattr(settings, "DPD_LABEL_SIZE", "A6"),
        )

        def validate(self, data):
            if data["service"] == "SHOP2SHOP" and not data.get("pudo_id"):
                raise serializers.ValidationError({"pudo_id": "pudo_id is required for SHOP2SHOP"})
            return data

    def post(self, request):
        inp = self.Input(data=request.data)
        inp.is_valid(raise_exception=True)
        d = inp.validated_data

        # сервисные коды: main vs additional (важно для SHOP2SHOP / SHOP2HOME)
        if d["service"] == "CLASSIC":
            service_codes_main = ["001"]        # базовый продукт
            service_codes_add  = []
        elif d["service"] == "SHOP2HOME":
            service_codes_main = ["001"]
            service_codes_add  = ["013"]        # Private delivery (доп.-услуга)
        else:  # SHOP2SHOP
            service_codes_main = ["001"]
            service_codes_add  = ["013", "200"] # Private + пункт выдачи (доп.-услуги)

        receiver = build_receiver(
            name=d["name"],
            email=d.get("email"),
            phone=d.get("phone"),
            street=d["street"],
            zip_code=d["zip"],
            city=d["city"],
            country_iso=d["country"],
            phone_prefix=d.get("phone_prefix"),
            pudo_id=d.get("pudo_id"),
        )

        parcel: dict = {"weight": float(d["weight_kg"])}
        parcels: List[dict] = [parcel]

        saved_path_fs: Optional[str] = None
        saved_url: Optional[str] = None

        def save_pdf_cb(pdf_b64: str, numbers: List[str]) -> None:
            nonlocal saved_path_fs, saved_url
            if pdf_b64.startswith("data:"):
                pdf_b64 = pdf_b64.split(",", 1)[1]
            pdf_bytes = base64.b64decode(pdf_b64)

            out_dir = os.path.join(settings.MEDIA_ROOT, settings.DPD_LABEL_DIR)
            os.makedirs(out_dir, exist_ok=True)
            # если номера нет (draft/печать по shipmentId) — используем generic имя
            fname = f"dpd_{(numbers or ['label'])[0]}.pdf"
            path_fs = os.path.join(out_dir, fname)
            with open(path_fs, "wb") as f:
                f.write(pdf_bytes)

            rel = os.path.relpath(path_fs, settings.MEDIA_ROOT).replace("\\", "/")
            saved_path_fs = path_fs
            saved_url = (settings.MEDIA_URL.rstrip("/") + "/" + rel.lstrip("/")).replace("//", "/")

        try:
            svc = DpdService()
            numbers = svc.create_and_print(
                receiver=receiver,
                parcels=parcels,
                main_codes=service_codes_main,
                additional_codes=service_codes_add,          # << важно
                save_pdf_cb=save_pdf_cb,
                fmt=d.get("label_size") or getattr(settings, "DPD_LABEL_SIZE", "A6"),
                num_order=1,  # DPD ограничение 1..99
            )

            # вытащим shipment_id из сырого ответа (полезно для draft)
            api_res = svc._last_raw or {}
            shipment_id = None
            try:
                shipment_id = (api_res.get("shipmentResults") or [{}])[0].get("shipmentId")
            except Exception:
                pass

        except Exception as e:
            log.exception("DPD create_and_print failed")
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "ok": True,
                "service": d["service"],
                "parcel_numbers": numbers,   # в draft обычно []
                "shipment_id": shipment_id,  # важно для допечатки
                "label_path": saved_path_fs, # путь на FS (для дебага)
                "label_url": saved_url,      # готовый URL из MEDIA_URL
                "save_mode": getattr(settings, "DPD_SHIP_SAVE_MODE", "printed"),
            },
            status=status.HTTP_201_CREATED,
        )


class DevDpdPrintByShipment(APIView):
    """
    DEV endpoint: печать ярлыка по shipmentId (удобно для draft).
    """
    permission_classes = [AllowAny]

    class Input(serializers.Serializer):
        shipment_id = serializers.IntegerField()
        label_size = serializers.ChoiceField(
            choices=("A4", "A6"), required=False,
            default=getattr(settings, "DPD_LABEL_SIZE", "A6"),
        )

    def post(self, request):
        inp = self.Input(data=request.data)
        inp.is_valid(raise_exception=True)
        d = inp.validated_data

        cli = DpdClient()
        lab = ep.labels_by_shipment_ids(
            cli,
            [d["shipment_id"]],
            fmt=d["label_size"],
            start_pos=getattr(settings, "DPD_LABEL_START_POSITION", 1),
            print_format=settings.DPD_PRINT_FORMAT,
        )

        pdf_b64 = lab.get("pdfFile") or ""
        if pdf_b64.startswith("data:"):
            pdf_b64 = pdf_b64.split(",", 1)[1]
        if not pdf_b64:
            return Response({"ok": False, "error": "empty pdfFile"}, status=status.HTTP_502_BAD_GATEWAY)

        out_dir = os.path.join(settings.MEDIA_ROOT, settings.DPD_LABEL_DIR)
        os.makedirs(out_dir, exist_ok=True)
        fname = f"dpd_sh_{d['shipment_id']}.pdf"
        path_fs = os.path.join(out_dir, fname)
        with open(path_fs, "wb") as f:
            f.write(base64.b64decode(pdf_b64))

        rel = os.path.relpath(path_fs, settings.MEDIA_ROOT).replace("\\", "/")
        url = (settings.MEDIA_URL.rstrip("/") + "/" + rel).replace("//", "/")

        return Response({"ok": True, "shipment_id": d["shipment_id"], "label_url": url}, status=status.HTTP_201_CREATED)
