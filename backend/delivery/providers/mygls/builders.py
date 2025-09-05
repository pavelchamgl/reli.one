import re
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings

_HOUSE_RE = re.compile(r"^\s*(\d+)\s*([A-Za-z/_\-]*)\s*$")


def _split_house(house_number: str) -> Tuple[str, str]:
    s = (house_number or "").strip()
    if not s:
        return "", ""
    m = _HOUSE_RE.match(s)
    if not m:
        return "", s
    return m.group(1), (m.group(2) or "").strip()


# === Адреса ===

def build_address(
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
    """Универсальный билдер адреса (и для Pickup, и для Delivery)."""
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
        "ContactPhone": contact_phone or "",
        "ContactEmail": contact_email or "",
    }


def build_pickup_address_from_settings() -> Dict[str, Any]:
    """Источник адреса отправителя — MYGLS_PICKUP_* c фоллбэком на COMPANY_*."""
    def _get(name, default=""):
        return getattr(settings, name, default)

    return build_address(
        name=_get("MYGLS_PICKUP_NAME", _get("COMPANY_NAME", "")),
        street=_get("MYGLS_PICKUP_STREET", _get("COMPANY_STREET", "")),
        house_number=_get("MYGLS_PICKUP_HOUSE_NUMBER", _get("COMPANY_HOUSE_NUMBER", "")),
        city=_get("MYGLS_PICKUP_CITY", _get("COMPANY_CITY", "")),
        zip_code=_get("MYGLS_PICKUP_ZIP", _get("COMPANY_ZIP", "")),
        country_iso=_get("MYGLS_PICKUP_COUNTRY_ISO", _get("COMPANY_COUNTRY_ISO", "CZ")),
        contact_name=_get("MYGLS_PICKUP_NAME", _get("COMPANY_CONTACT_NAME", "")),
        contact_phone=_get("MYGLS_PICKUP_PHONE", _get("COMPANY_CONTACT_PHONE", "")),
        contact_email=_get("MYGLS_PICKUP_EMAIL", _get("COMPANY_CONTACT_EMAIL", "")),
    )


# === Свойства посылки и сервисы ===

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
        "PackageType": 1,
        "Length": int(length_cm),
        "Width": int(width_cm),
        "Height": int(height_cm),
        "Weight": float(weight_kg),
    }]


def build_service_psd(pickup_point_id: str) -> Dict[str, Any]:
    pid = (pickup_point_id or "").strip()
    if pid.isdigit():
        return {"Code": "PSD", "PSDParameter": {"IntegerValue": int(pid)}}
    return {"Code": "PSD", "PSDParameter": {"StringValue": pid}}


# === Универсальный билдер посылки (новый + legacy) ===

def build_parcel(
    *,
    # новый API (как в текущем dev_view):
    client_reference: Optional[str] = None,
    client_number: Optional[str] = None,
    pickup_address: Optional[Dict[str, Any]] = None,
    delivery_address: Optional[Dict[str, Any]] = None,
    properties: Optional[List[Dict[str, Any]]] = None,
    services: Optional[List[Dict[str, Any]]] = None,
    # legacy API (поддержка на всякий случай):
    mode: Optional[str] = None,
    receiver_name: Optional[str] = None,
    receiver_street: Optional[str] = None,
    receiver_house_number: Optional[str] = None,
    receiver_city: Optional[str] = None,
    receiver_zip: Optional[str] = None,
    receiver_country_iso: Optional[str] = None,
    receiver_email: Optional[str] = None,
    receiver_phone: Optional[str] = None,
    length_cm: Optional[float] = None,
    width_cm: Optional[float] = None,
    height_cm: Optional[float] = None,
    weight_kg: Optional[float] = None,
    content: Optional[str] = None,
    pickup_point_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Возвращает {"ParcelList": [ ParcelData ]}.
    Если передан pickup_address/delivery_address/properties — используем новый путь.
    Если передан mode — собираем структуру по legacy-параметрам.
    """
    # === Новый путь (то, что ожидает ваш dev_view) ===
    if pickup_address is not None and delivery_address is not None and properties is not None:
        parcel: Dict[str, Any] = {
            "ClientReference": client_reference or "",
            "PickupAddress": pickup_address,
            "DeliveryAddress": delivery_address,
            "ParcelPropertyList": properties,
        }
        if client_number:
            # int, если цифры; иначе строкой
            cn = str(client_number).strip()
            parcel["ClientNumber"] = int(cn) if cn.isdigit() else cn

        if services:
            parcel["ServiceList"] = services

        return {"ParcelList": [parcel]}

    # === Legacy путь (совместимость со старым вызовом) ===
    if mode:
        # 1) адреса
        pickup_addr = build_pickup_address_from_settings()
        delivery_addr = build_address(
            name=receiver_name or "",
            street=receiver_street or "",
            house_number=receiver_house_number or "",
            city=receiver_city or "",
            zip_code=receiver_zip or "",
            country_iso=(receiver_country_iso or "").upper(),
            contact_name=receiver_name or "",
            contact_phone=receiver_phone or "",
            contact_email=receiver_email or "",
        )
        # 2) свойства
        props = build_parcel_properties(
            content=content or "Goods",
            length_cm=length_cm or 1,
            width_cm=width_cm or 1,
            height_cm=height_cm or 1,
            weight_kg=weight_kg or 0.01,
        )
        # 3) сервисы
        svc_list: List[Dict[str, Any]] = []
        if (mode or "").lower() == "pudo":
            if not pickup_point_id:
                raise ValueError("pickup_point_id is required for PUDO mode (legacy call).")
            svc_list.append(build_service_psd(pickup_point_id))

        # 4) сборка
        parcel: Dict[str, Any] = {
            "ClientReference": client_reference or "",
            "PickupAddress": pickup_addr,
            "DeliveryAddress": delivery_addr,
            "ParcelPropertyList": props,
        }
        if client_number:
            cn = str(client_number).strip()
            parcel["ClientNumber"] = int(cn) if cn.isdigit() else cn
        if svc_list:
            parcel["ServiceList"] = svc_list

        return {"ParcelList": [parcel]}

    # Если ни новый, ни legacy набор параметров не распознан:
    raise ValueError("build_parcel: provide either (pickup_address, delivery_address, properties) "
                     "or legacy arguments including mode=...")
