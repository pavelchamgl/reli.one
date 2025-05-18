import logging
import requests

from base64 import b64decode
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)


class PacketaService:
    API_URL = "https://www.zasilkovna.cz/api/rest"
    # Валюты для HD по странам
    COUNTRY_CURRENCY = {
        "CZ": "CZK",
        "SK": "EUR",
        "HU": "HUF",
        "RO": "RON",
    }

    # статический маппинг для HD-отправлений
    HOME_DELIVERY_ADDRESS_IDS = {
        "CZ": 106,
        "SK": 131,
        "HU": 4159,
        "RO": 4161,
    }

    def __init__(self):
        self.api_password = settings.PACKETA_API_PASSWORD
        self.eshop_code = "Reli"
        self.locale = settings.PACKETA_API_LOCALE
        self.invoice_locale = settings.PACKETA_INVOICE_LOCALE

    def _send_xml(self, method: str, attrs: dict) -> ET.Element:
        """
        Общий XML-запрос к Packeta API.
        """
        logger.debug("PacketaService._send_xml %s %r", method, attrs)
        root = ET.Element(method)
        ET.SubElement(root, "apiPassword").text = self.api_password
        pa = ET.SubElement(root, "packetAttributes")
        for k, v in attrs.items():
            ET.SubElement(pa, k).text = str(v)

        payload = ET.tostring(root, encoding="utf-8")
        resp = requests.post(self.API_URL, data=payload,
                             headers={"Content-Type": "application/xml"}, timeout=10)
        resp.raise_for_status()
        tree = ET.fromstring(resp.content)
        if tree.findtext("status", "").lower() != "ok":
            dump = ET.tostring(tree, encoding="utf-8").decode()
            logger.error("Packeta API error:\n%s", dump)
            raise RuntimeError(f"Packeta API error:\n{dump}")
        return tree

    def create_home_delivery_shipment(
        self,
        *,
        order_number: str,
        first_name: str,
        surname: str,
        phone: str,
        email: str,
        street: str,
        city: str,
        zip_code: str,
        country: str,
        weight_grams: int,
        value_amount: Decimal,
        cod_amount: Decimal,
        currency: str,
    ) -> str:
        """
        Создаёт HD-отправление и возвращает packetId.
        """
        # Формируем килограммы с двумя десятичными
        weight_kg = (Decimal(weight_grams) / Decimal(1000)).quantize(Decimal("0.01"), ROUND_HALF_UP)

        try:
            address_id = self.HOME_DELIVERY_ADDRESS_IDS[country]
        except KeyError:
            raise ValueError(f"Не задан addressId для страны {country}")

        attrs = {
            "number":        order_number,
            "eshop":         self.eshop_code,
            "locale":        self.locale,
            "invoiceLocale": self.invoice_locale,
            "name":          first_name,
            "surname":       surname,
            "phone":         phone,
            "email":         email,
            "addressId":     address_id,
            "street":        street,
            "city":          city,
            "zip":           zip_code,
            "country":       country,
            "weight":        f"{weight_kg:.2f}",
            "value":         f"{value_amount:.2f}",
            "cod":           f"{cod_amount:.2f}",
            "currency":      currency,
        }
        tree = self._send_xml("createPacket", attrs)
        return tree.findtext("result/id")

    def create_pickup_point_shipment(
        self,
        *,
        order_number: str,
        first_name: str,
        surname: str,
        phone: str,
        email: str,
        pickup_point_id: int,
        weight_grams: int,
        value_amount: Decimal,
        cod_amount: Decimal,
        currency: str,
    ) -> str:
        """
        Создаёт PUDO-отправление по ID пункта и возвращает packetId.
        """
        weight_kg = (Decimal(weight_grams) / Decimal(1000)).quantize(Decimal("0.01"), ROUND_HALF_UP)
        attrs = {
            "number":        order_number,
            "eshop":         self.eshop_code,
            "locale":        self.locale,
            "invoiceLocale": self.invoice_locale,
            "name":          first_name,
            "surname":       surname,
            "phone":         phone,
            "email":         email,
            "addressId":     pickup_point_id,
            "weight":        f"{weight_kg:.2f}",
            "value":         f"{value_amount:.2f}",
            "cod":           f"{cod_amount:.2f}",
            "currency":      currency,
        }
        tree = self._send_xml("createPacket", attrs)
        return tree.findtext("result/id")

    def get_label_pdf(self, packet_id: str, fmt: str = "A6 on A6") -> bytes:
        """
        Возвращает PDF-строку с этикеткой для заданного packetId.
        """
        logger.debug("PacketaService.get_label_pdf packet_id=%s format=%s", packet_id, fmt)
        root = ET.Element("packetLabelPdf")
        ET.SubElement(root, "apiPassword").text = self.api_password
        ET.SubElement(root, "packetId").text = packet_id
        ET.SubElement(root, "format").text = fmt
        ET.SubElement(root, "offset").text = "0"

        resp = requests.post(
            self.API_URL,
            data=ET.tostring(root, encoding="utf-8"),
            headers={"Content-Type": "application/xml"},
            timeout=10
        )
        resp.raise_for_status()
        tree = ET.fromstring(resp.content)
        pdf_bytes = b64decode(tree.find("result").text)
        logger.info("Packeta label PDF fetched for packet_id=%s (%d bytes)", packet_id, len(pdf_bytes))
        return pdf_bytes
