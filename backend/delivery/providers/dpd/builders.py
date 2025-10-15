from __future__ import annotations

from typing import Optional


def build_receiver(
    *,
    name: str,
    email: Optional[str],
    phone: Optional[str],
    street: str,
    zip_code: str,
    city: str,
    country_iso: str,
    phone_prefix: Optional[str] = None,
    pudo_id: Optional[str] = None,
) -> dict:
    """
    Ровно те поля, которые прошли в боевых запросах:
    name, street, zipCode, city, countryCode, contactEmail, contactMobile, contactPhonePrefix, pudoId
    """
    rec = {
        "name": (name or "")[:35],
        "street": (street or "")[:35],
        "zipCode": (zip_code or "").strip(),
        "city": (city or "")[:35],
        "countryCode": (country_iso or "").upper(),
    }
    if email:
        rec["contactEmail"] = email
    if phone:
        rec["contactMobile"] = phone
    if phone_prefix:
        rec["contactPhonePrefix"] = phone_prefix
    if pudo_id:
        rec["pudoId"] = pudo_id
    return rec


def build_shipment(
        *,
        sender_address_id: str | int,
        receiver: dict, parcels: list[dict],
        save_mode: str, main_codes: list[str],
        print_format: str, label_size: str,
        num_order: int = 1,
        additional_codes: list[str] | None = None,
) -> dict:
    """
    Сборка одного shipment для /shipments.
    ВАЖНО: numOrder только 1..99 (DPD ограничение)
    """
    if not (1 <= int(num_order) <= 99):
        num_order = 1

    service = {"mainServiceElementCodes": list(main_codes)}
    if additional_codes:
        service["additionalServiceElementCodes"] = list(additional_codes)

    return {
        "numOrder": int(num_order),
        "senderAddressId": str(sender_address_id),
        "receiver": receiver,
        "parcels": parcels,
        "service": service,
        "saveMode": save_mode,           # "draft" | "printed"
        "printFormat": print_format,     # "PDF" | "ZPL"
        "labelSize": label_size,         # "A4" | "A6"
    }
