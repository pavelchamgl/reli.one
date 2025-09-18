import logging
import requests
import xml.etree.ElementTree as ET

from base64 import b64decode
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

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

    # Статический маппинг для HD-отправлений
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

        # Единая HTTP-сессия с ретраями и увеличенным таймаутом чтения
        self._session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=(502, 503, 504),
            allowed_methods=frozenset(["POST"]),
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retries)
        self._session.mount("https://", adapter)
        self._session.mount("http://", adapter)

    def _send_xml(self, method: str, attrs: dict) -> ET.Element:
        """
        Общий XML-запрос к Packeta API (Session + Retry, timeout=(5, 30)).
        Бросает исключение при ненормальном статусе ответа.
        """
        logger.debug("PacketaService._send_xml %s %r", method, attrs)

        root = ET.Element(method)
        ET.SubElement(root, "apiPassword").text = self.api_password
        pa = ET.SubElement(root, "packetAttributes")
        for k, v in attrs.items():
            ET.SubElement(pa, k).text = "" if v is None else str(v)

        payload = ET.tostring(root, encoding="utf-8")
        headers = {"Content-Type": "application/xml"}

        try:
            resp = self._session.post(self.API_URL, data=payload, headers=headers, timeout=(5, 30))
            resp.raise_for_status()
        except requests.Timeout as e:
            logger.warning("Packeta timeout (%s): %s", method, e)
            raise
        except requests.RequestException as e:
            logger.warning("Packeta request error (%s): %s", method, e)
            raise

        try:
            tree = ET.fromstring(resp.content)
        except ET.ParseError as e:
            logger.error("Packeta invalid XML response (%s): %s\nRaw: %r", method, e, resp.content[:4000])
            raise

        status = (tree.findtext("status", "") or "").lower()
        if status != "ok":
            dump = ET.tostring(tree, encoding="utf-8").decode()
            logger.error("Packeta API error (%s):\n%s", method, dump)
            raise RuntimeError(f"Packeta API error for {method}:\n{dump}")

        return tree

    # ----------------- Публичные методы -----------------

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
        """Создаёт HD-отправление и возвращает packetId."""
        weight_kg = (Decimal(weight_grams) / Decimal(1000)).quantize(Decimal("0.01"), ROUND_HALF_UP)
        cc = (country or "").upper()
        try:
            address_id = self.HOME_DELIVERY_ADDRESS_IDS[cc]
        except KeyError:
            raise ValueError(f"Не задан addressId для страны {cc or country!r}")

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
            "country":       cc,
            "weight":        f"{weight_kg:.2f}",
            "value":         f"{value_amount:.2f}",
            "cod":           f"{cod_amount:.2f}",
            "currency":      currency,
        }
        tree = self._send_xml("createPacket", attrs)
        packet_id = tree.findtext("result/id")
        if not packet_id:
            dump = ET.tostring(tree, encoding="utf-8").decode()
            raise RuntimeError(f"createPacket: empty packet id\n{dump}")
        return packet_id

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
        """Создаёт PUDO-отправление по ID пункта и возвращает packetId."""
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
        packet_id = tree.findtext("result/id")
        if not packet_id:
            dump = ET.tostring(tree, encoding="utf-8").decode()
            raise RuntimeError(f"createPacket(PUDO): empty packet id\n{dump}")
        return packet_id

    def get_label_pdf(self, packet_id: str, fmt: str = "A6 on A6") -> bytes:
        """Возвращает PDF для заданного packetId (через общий канал с ретраями)."""
        logger.debug("PacketaService.get_label_pdf packet_id=%s format=%s", packet_id, fmt)

        root = ET.Element("packetLabelPdf")
        ET.SubElement(root, "apiPassword").text = self.api_password
        ET.SubElement(root, "packetId").text = packet_id
        ET.SubElement(root, "format").text = fmt
        ET.SubElement(root, "offset").text = "0"

        payload = ET.tostring(root, encoding="utf-8")
        headers = {"Content-Type": "application/xml"}

        resp = self._session.post(self.API_URL, data=payload, headers=headers, timeout=(5, 30))
        resp.raise_for_status()

        tree = ET.fromstring(resp.content)
        status = (tree.findtext("status", "") or "").lower()
        if status != "ok":
            dump = ET.tostring(tree, encoding="utf-8").decode()
            logger.error("packetLabelPdf error:\n%s", dump)
            raise RuntimeError(f"packetLabelPdf error:\n{dump}")

        b64 = tree.findtext("result")
        pdf_bytes = b64decode(b64) if b64 else b""
        logger.info("Packeta label PDF fetched for packet_id=%s (%d bytes)", packet_id, len(pdf_bytes))
        return pdf_bytes
