from __future__ import annotations
import re

from typing import Any, Dict, List, Optional, Tuple
from django.conf import settings

# Только цифры в HouseNumber, всё остальное — в HouseNumberInfo
_HOUSE_RE = re.compile(r"^\s*(\d+)\s*([A-Za-z/_\-]*)\s*$")


def _split_house(house_number: str) -> Tuple[str, str]:
    s = (house_number or "").strip()
    if not s:
        return "", ""
    m = _HOUSE_RE.match(s)
    if not m:
        return "", s.strip()
    return m.group(1), (m.group(2) or "").strip()


def build_delivery_address(
    *,
    name: str,
    street: str,
    house_number: str,
    city: str,
    zip_code: str,
    country_iso: str,
    contact_name: Optional[str] = None,
    contact_phone: Optional[str] = None,
    contact_email: Optional[str] = None,
) -> Dict[str, Any]:
    num, info = _split_house(house_number)
    return {
        "Name": name or "",
        "Street": street or "",
        "HouseNumber": num,
        "HouseNumberInfo": info,
        "City": city or "",
        "ZipCode": zip_code or "",
        "CountryIsoCode": (country_iso or "").upper(),
        # Для PSD(PUDO) эти контакты обязательны
        "ContactName": (contact_name or name or ""),
        "ContactPhone": (contact_phone or ""),
        "ContactEmail": (contact_email or ""),
    }


def build_pickup_address_from_settings() -> Dict[str, Any]:
    """
    Адрес отправителя: поддерживаем оба нейминга:
      - MYGLS_PICKUP_*
      - MYGLS_SENDER_*
    и fallback на COMPANY_*.
    """
    def pick(*names: str, default: str = "") -> str:
        for n in names:
            v = getattr(settings, n, None)
            if v not in (None, ""):
                return str(v)
        return default

    sender_name = pick("MYGLS_PICKUP_NAME", "MYGLS_SENDER_NAME", "COMPANY_NAME")
    sender_street = pick("MYGLS_PICKUP_STREET", "MYGLS_SENDER_STREET", "COMPANY_STREET")
    sender_house = pick("MYGLS_PICKUP_HOUSE_NUMBER", "MYGLS_SENDER_HOUSE_NUMBER", "COMPANY_HOUSE_NUMBER")
    sender_city = pick("MYGLS_PICKUP_CITY", "MYGLS_SENDER_CITY", "COMPANY_CITY")
    sender_zip = pick("MYGLS_PICKUP_ZIP", "MYGLS_SENDER_ZIP", "COMPANY_ZIP")
    sender_country = pick("MYGLS_PICKUP_COUNTRY_ISO", "MYGLS_SENDER_COUNTRY", "COMPANY_COUNTRY_ISO", default="CZ")

    # <= Ключи с CONTACT_ и без CONTACT_ поддерживаем одновременно
    sender_contact_name = pick(
        "MYGLS_PICKUP_CONTACT_NAME", "MYGLS_SENDER_CONTACT_NAME",
        "COMPANY_CONTACT_NAME", default=sender_name
    )
    sender_phone = pick(
        "MYGLS_PICKUP_CONTACT_PHONE", "MYGLS_PICKUP_PHONE",
        "MYGLS_SENDER_PHONE", "COMPANY_CONTACT_PHONE"
    )
    sender_email = pick(
        "MYGLS_PICKUP_CONTACT_EMAIL", "MYGLS_PICKUP_EMAIL",
        "MYGLS_SENDER_EMAIL", "COMPANY_CONTACT_EMAIL"
    )

    num, info = _split_house(sender_house)

    return {
        "Name": sender_name or "",
        "Street": sender_street or "",
        "HouseNumber": num,
        "HouseNumberInfo": info,
        "City": sender_city or "",
        "ZipCode": sender_zip or "",
        "CountryIsoCode": (sender_country or "").upper(),
        "ContactName": sender_contact_name or sender_name or "",
        "ContactPhone": sender_phone or "",
        "ContactEmail": sender_email or "",
    }


def build_parcel_properties(
    *,
    content: str,
    length_cm: float,
    width_cm: float,
    height_cm: float,
    weight_kg: float,
) -> List[Dict[str, Any]]:
    return [{
        "Content": content or "Goods",
        "PackageType": 1,  # Colli
        "Height": int(height_cm),
        "Length": int(length_cm),
        "Width": int(width_cm),
        "Weight": float(weight_kg),
    }]


def build_service_psd(pickup_point_id: str) -> Dict[str, Any]:
    pid = str(pickup_point_id or "").strip()
    # Документация разрешает и StringValue, и IntegerValue.
    if pid.isdigit():
        return {"Code": "PSD", "PSDParameter": {"IntegerValue": int(pid)}}
    return {"Code": "PSD", "PSDParameter": {"StringValue": pid}}


def build_parcel(
    *,
    mode: str,
    client_reference: str,
    receiver_name: str,
    receiver_street: str,
    receiver_house_number: str,
    receiver_city: str,
    receiver_zip: str,
    receiver_country_iso: str,
    receiver_email: str,
    receiver_phone: str,
    length_cm: float,
    width_cm: float,
    height_cm: float,
    weight_kg: float,
    content: str,
    pickup_point_id: str | None = None,
    client_number: str | int | None = None,
) -> Dict[str, Any]:
    """Собирает payload с одним Parcel в соответствии с MyGLS API."""
    pickup_address = build_pickup_address_from_settings()
    delivery_address = build_delivery_address(
        name=receiver_name,
        street=receiver_street,
        house_number=receiver_house_number,
        city=receiver_city,
        zip_code=receiver_zip,
        country_iso=receiver_country_iso,
        contact_name=receiver_name,
        contact_phone=receiver_phone,
        contact_email=receiver_email,
    )
    parcel: Dict[str, Any] = {
        # По доке ClientNumber — поле Parcel и обязательно
        "ClientNumber": int(client_number) if client_number not in (None, "",) else int(getattr(settings, "MYGLS_CLIENT_NUMBER")),
        "ClientReference": client_reference,
        "PickupAddress": pickup_address,
        "DeliveryAddress": delivery_address,
        "ParcelPropertyList": build_parcel_properties(
            content=content, length_cm=length_cm, width_cm=width_cm, height_cm=height_cm, weight_kg=weight_kg
        ),
    }

    services: List[Dict[str, Any]] = []
    if mode == "pudo":
        if not pickup_point_id:
            raise ValueError("pickup_point_id is required for PUDO mode")
        services.append(build_service_psd(pickup_point_id))
    if services:
        parcel["ServiceList"] = services

    return {"ParcelList": [parcel]}
