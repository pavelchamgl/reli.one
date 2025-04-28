import requests
from base64 import b64decode
from decimal import Decimal
from django.conf import settings
import xml.etree.ElementTree as ET


class PacketaService:
    API_URL = "https://www.zasilkovna.cz/api/rest"

    def __init__(self):
        self.api_password = settings.PACKETA_API_PASSWORD
        self.locale = settings.PACKETA_API_LOCALE
        self.invoice_locale = settings.PACKETA_INVOICE_LOCALE

    def _send_xml(self, method: str, attributes: dict) -> ET.Element:
        envelope = ET.Element(method)
        ET.SubElement(envelope, "apiPassword").text = self.api_password

        packet_attrs = ET.SubElement(envelope, "packetAttributes")
        for key, value in attributes.items():
            el = ET.SubElement(packet_attrs, key)
            el.text = str(value)

        body = ET.tostring(envelope, encoding="utf-8", method="xml")

        response = requests.post(self.API_URL, data=body, headers={"Content-Type": "application/xml"})
        response.raise_for_status()

        tree = ET.fromstring(response.content)
        status = tree.find("status").text
        if status != "ok":
            raise Exception(f"Packeta API error: {ET.tostring(tree)}")

        return tree

    def create_packet(self, order, address_id: int, weight: int, currency: str = "EUR") -> str:
        user = order.user

        attributes = {
            "number": str(order.order_number),
            "name": user.first_name,
            "surname": user.last_name,
            "email": user.email,
            "phone": str(user.phone_number),
            "addressId": str(order.pickup_point_id),
            "addressId": str(address_id),
            "cod": "0",
            "value": str(Decimal(order.total_amount)),
            "currency": currency,
            "weight": str(int(weight / 1000)),  # kg
            "eshop": "MyEshop",
            "locale": self.locale,
            "invoiceLocale": self.invoice_locale,
        }

        tree = self._send_xml("createPacket", attributes)
        return tree.find("result").text  # packetId

    def get_label_pdf(self, packet_id: str, format: str = "A6 on A6") -> bytes:
        root = ET.Element("packetLabelPdf")
        ET.SubElement(root, "apiPassword").text = self.api_password
        ET.SubElement(root, "packetId").text = packet_id
        ET.SubElement(root, "format").text = format
        ET.SubElement(root, "offset").text = "0"

        body = ET.tostring(root, encoding="utf-8", method="xml")

        response = requests.post(self.API_URL, data=body, headers={"Content-Type": "application/xml"})
        response.raise_for_status()

        tree = ET.fromstring(response.content)
        result = tree.find("result").text
        return b64decode(result)
