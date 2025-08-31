# -*- coding: utf-8 -*-
from typing import Any, Dict, List, Optional
import re

def _ensure_house_number_str(house_number: str | int) -> str:
    s = str(house_number).strip()
    if not s.isdigit():
        raise ValueError("MyGLS requires HouseNumber to be digits only")
    return s  # Спецификация: тип String, но только цифры. :contentReference[oaicite:2]{index=2}

def _normalize_zip(zip_code: str) -> str:
    # Спецификация: ZipCode — String; для REST лучше отдавать только цифры
    digits = re.sub(r"\D+", "", zip_code or "")
    if not digits:
        raise ValueError("ZipCode must contain digits")
    return digits

def build_address(
    name: str,
    street: str,
    house_number: str | int,
    city: str,
    zip_code: str,
    country_iso: str,
    contact_name: Optional[str] = None,
    contact_phone: Optional[str] = None,
    contact_email: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "Name": name,
        "Street": street,
        "HouseNumber": _ensure_house_number_str(house_number),  # String, только цифры. :contentReference[oaicite:3]{index=3}
        "City": city,
        "ZipCode": _normalize_zip(zip_code),
        "CountryIsoCode": (country_iso or "").upper(),
        **({"ContactName": contact_name} if contact_name else {}),
        **({"ContactPhone": contact_phone} if contact_phone else {}),
        **({"ContactEmail": contact_email} if contact_email else {}),
    }

def build_service(code: str, param_key: Optional[str] = None, param_value: Any = None) -> Dict[str, Any]:
    svc = {"Code": code}
    if param_key and param_value is not None:
        svc[param_key] = param_value
    return svc

def build_properties(
    length_cm: float, width_cm: float, height_cm: float, weight_kg: float,
    package_type: int = 2, *, content: str = "Merchandise"
) -> Dict[str, Any]:
    """
    ParcelProperty:
      - Length/Width/Height — Integer
      - Weight — Decimal
      - Content — String (некоторым инсталляциям обязателен) :contentReference[oaicite:4]{index=4}
    """
    # Приводим к целым
    L = int(round(float(length_cm)))
    W = int(round(float(width_cm)))
    H = int(round(float(height_cm)))
    if min(L, W, H) <= 0:
        raise ValueError("Dimensions must be positive integers")

    # Вес приведём к нормальному decimal-представлению (JSON number)
    weight = float(f"{float(weight_kg):.3f}")

    return {
        "PackageType": int(package_type),  # 1..7 (Box=2 и т.п.) :contentReference[oaicite:5]{index=5}
        "Length": L,
        "Width": W,
        "Height": H,
        "Weight": weight,
        "Content": (content or "Merchandise")[:50],  # безопасное краткое описание
    }

def build_parcel(
    client_number: int,
    pickup_address: Dict[str, Any],
    delivery_address: Dict[str, Any],
    service_list: List[Dict[str, Any]],
    properties: List[Dict[str, Any]],
    client_reference: Optional[str] = None,
    pickup_date: Optional[str] = None,
) -> Dict[str, Any]:
    payload = {
        "ClientNumber": int(client_number),  # REQUIRED :contentReference[oaicite:6]{index=6}
        "PickupAddress": pickup_address,
        "DeliveryAddress": delivery_address,
        "ServiceList": service_list,
        "ParcelPropertyList": properties,
    }
    if client_reference:
        payload["ClientReference"] = client_reference  # STRONGLY RECOMMENDED / иногда REQUIRED :contentReference[oaicite:7]{index=7}
    if pickup_date:
        payload["PickupDate"] = pickup_date
    return payload
