import requests
from django.conf import settings

from .base import DeliveryService


class ZasilkovnaService(DeliveryService):
    BASE_URL = "https://www.zasilkovna.cz/api/v4"

    def __init__(self):
        self.token = settings.ZASILKOVNA_API_TOKEN

    def estimate(self, *, country: str, weight_grams: int, delivery_type: str) -> dict:
        # Для цен можно либо вызвать API Zásilkovny, либо,
        # если вы привыкли к local_rates — оставить расчёт там.
        raise NotImplementedError

    def create_shipment(self, *, sender: dict, recipient: dict, parcels: list) -> dict:
        url = f"{self.BASE_URL}/shipments"
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {"sender": sender, "recipient": recipient, "parcels": parcels}
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()
