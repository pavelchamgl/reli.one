from __future__ import annotations

import re
from typing import Any, Dict, List, Literal, Optional
from django.conf import settings


# --- DPD service codes ---
DPD_MAIN_CLASSIC = "001"
DPD_PREDICT = "013"
DPD_PUDO_DELIVERY = "200"
DPD_HANDIN = "610"

Service = Literal["CLASSIC", "SHOP2HOME", "SHOP2SHOP"]

# Небольшая карта наиболее используемых направлений.
# Если страны нет в карте — логика всё равно корректно разберёт телефон из E.164/00.
COUNTRY_DIAL_PREFIX: Dict[str, str] = {
    "CZ": "+420",
    "SK": "+421",
    "PL": "+48",
    "RO": "+40",
    "HU": "+36",
    "DE": "+49",
    "AT": "+43",
}


# ----------------- helpers -----------------

def _service_codes(service: Service) -> List[str]:
    if service == "CLASSIC":
        return [DPD_MAIN_CLASSIC]
    if service == "SHOP2HOME":
        # классика + уведомления + "подача в пункте"
        return [DPD_MAIN_CLASSIC, DPD_PREDICT, DPD_HANDIN]
    if service == "SHOP2SHOP":
        # классика + уведомления + доставка в PUDO + "подача в пункте"
        return [DPD_MAIN_CLASSIC, DPD_PREDICT, DPD_PUDO_DELIVERY, DPD_HANDIN]
    raise ValueError(f"Unsupported service: {service}")


def _only_digits(s: Optional[str]) -> str:
    return "".join(ch for ch in (s or "") if ch.isdigit())


def _sanitize_prefix_digits(prefix: Optional[str]) -> str:
    """Разрешаем только цифры, максимум 4 (как и раньше)."""
    if not prefix:
        return ""
    digits = _only_digits(prefix)
    return digits[:4]


def _normalize_phone_prefix(prefix: Optional[str]) -> str:
    """
    В доках часто примеры с префиксом вида '+48'.
    Делаем '+{digits}' если есть цифры, иначе пусто.
    """
    digits = _sanitize_prefix_digits(prefix)
    return f"+{digits}" if digits else ""


def _expected_prefix_by_country(country_iso: Optional[str]) -> str:
    return COUNTRY_DIAL_PREFIX.get((country_iso or "").upper(), "")


def _split_phone_for_dpd(
    phone: Optional[str],
    *,
    country_iso: Optional[str] = None,
    explicit_prefix: Optional[str] = None,
) -> tuple[Optional[str], Optional[str]]:
    """
    Возвращает (contactPhonePrefix, contactPhone) для DPD.
    Поддерживает форматы:
      - '+40712345678' / '+420777123456'
      - '0048200123456'
      - '777123456' (+ 'phone_prefix' или по стране)
    Префикс — с '+', local — только цифры без префикса.
    """
    p = (phone or "").strip()
    if not p:
        return None, None

    # Явно переданный префикс — главный (если есть)
    norm_explicit = _normalize_phone_prefix(explicit_prefix)

    # Ветвь E.164 / 00…:
    if p.startswith("+") or _only_digits(p).startswith("00"):
        digits = _only_digits(p)
        # убрать leading '00'
        if digits.startswith("00"):
            digits = digits[2:]

        # найти известный код из справочника (самый длинный матч)
        known = [v.lstrip("+") for v in COUNTRY_DIAL_PREFIX.values()]
        known.sort(key=len, reverse=True)
        matched = None
        for pref in known:
            if digits.startswith(pref):
                matched = pref
                break

        if matched:
            prefix = f"+{matched}"
            local = digits[len(matched):]
        else:
            # безопасный фолбэк: 2-значный код страны
            prefix = f"+{digits[:2]}" if len(digits) >= 2 else None
            local = digits[2:] if len(digits) >= 2 else None

        # если был явный префикс — перезапишем им
        if norm_explicit:
            prefix = norm_explicit

        return prefix, (local or None)

    # Ветвь локального номера: используем prefix из аргумента или по стране
    local = _only_digits(p)
    prefix = norm_explicit or _expected_prefix_by_country(country_iso)
    prefix = prefix or None
    return prefix, (local or None)


def _normalize_label_size(label_size: Optional[str]) -> str:
    size = (label_size or getattr(settings, "DPD_LABEL_SIZE", "A6")).upper()
    return "A6" if size not in {"A6", "A4"} else size


def _resolve_print_format(print_format: Optional[str]) -> str:
    # API принимает pdf|zpl (регистр не критичен, но приведём к нижнему)
    fmt = (print_format or getattr(settings, "DPD_PRINT_FORMAT", "pdf")).lower()
    return "pdf" if fmt not in {"pdf", "zpl"} else fmt


_STREET_RE = re.compile(r"^(?P<street>.*?)[,\s]+(?P<house>\d+[^\s,/]*)\s*$")


def _split_street_house_no(street: str, house_no: Optional[str]) -> tuple[str, Optional[str]]:
    """
    Если номер дома уже передали отдельно — используем его.
    Иначе пытаемся вычленить trailing «число/суффикс» из конца строки.
    Примеры:
      'Na Lysinách 551/34' -> ('Na Lysinách', '551/34')
      'Evropská 1'         -> ('Evropská', '1')
      'Křižíkova'          -> ('Křižíkova', None)
    """
    street = (street or "").strip()
    if house_no:
        return street, str(house_no).strip() or None

    m = _STREET_RE.match(street)
    if not m:
        return street, None
    s = (m.group("street") or "").strip(" ,")
    h = (m.group("house") or "").strip()
    return (s or street), (h or None)


# ----------------- builders -----------------

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
    house_no: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Строго структурированный адрес получателя для DPD:
    - street без номера
    - houseNo отдельным полем
    - contactPhonePrefix в виде '+420'
    - contactPhone как строка БЕЗ префикса (только цифры)
    """
    norm_street, norm_house = _split_street_house_no(street, house_no)

    # Корректно разложим E.164/00/локальный номер.
    pref, local = _split_phone_for_dpd(
        phone,
        country_iso=country_iso,
        explicit_prefix=phone_prefix,
    )

    r: Dict[str, Any] = {
        "name": name,
        "countryCode": (country_iso or "").upper(),
        "city": city,
        "street": norm_street,
        "zipCode": zip_code,
    }
    if norm_house:
        r["houseNo"] = norm_house
    if email:
        r["contactEmail"] = email
    if local:
        r["contactPhone"] = local
    if pref:
        r["contactPhonePrefix"] = pref
    return r


def _predicts(phone: Optional[str], email: Optional[str], *, country_iso: Optional[str], phone_prefix: Optional[str]) -> List[Dict[str, str]]:
    """
    Для Predict-сообщений DPD:
    - SMS: локальная часть (без '+', как в ваших рабочих примерах/логах)
    - EMAIL: из аргумента
    """
    preds: List[Dict[str, str]] = []
    if phone:
        _, local = _split_phone_for_dpd(phone, country_iso=country_iso, explicit_prefix=phone_prefix)
        if local:
            preds.append({"destination": local, "type": "SMS"})
    if email:
        preds.append({"destination": email, "type": "EMAIL"})
    return preds


def build_single_shipment(
    *,
    num_order: int,
    sender_address_id: int | str,
    name: str,
    email: Optional[str],
    phone: Optional[str],                 # может быть E.164/00/локальный
    phone_prefix: Optional[str],
    street: str,
    zip_code: str,
    city: str,
    country: str,
    weight_kg: float | int,
    service: Service,
    label_size: str = "A6",
    pudo_id: Optional[str] = None,
    save_mode: Optional[str] = None,
    extend_data: bool = True,
    print_format: Optional[str] = None,
    house_no: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Формирует payload одного отправления для POST /shipments (v1.1).
    """
    # --- numOrder: 1..99 ---
    try:
        n = int(num_order)
    except Exception:
        n = 1
    if not (1 <= n <= 99):
        n = 1

    receiver = build_receiver(
        name=name,
        email=email,
        phone=phone,
        street=street,
        zip_code=zip_code,
        city=city,
        country_iso=country,
        phone_prefix=phone_prefix,
        house_no=house_no,
    )

    service_obj: Dict[str, Any] = {"mainServiceElementCodes": _service_codes(service)}

    if service in ("SHOP2HOME", "SHOP2SHOP"):
        preds = _predicts(phone, email, country_iso=country, phone_prefix=phone_prefix)
        if preds:
            service_obj["additionalService"] = {"predicts": preds}

    if service == "SHOP2SHOP":
        if not pudo_id:
            raise ValueError("pudo_id is required for SHOP2SHOP")
        service_obj.setdefault("additionalService", {})
        service_obj["additionalService"]["pudoId"] = str(pudo_id)

    senderAddressId = getattr(settings, "DPD_SENDER_ADDRESS_ID", 1)

    shipment: Dict[str, Any] = {
        "numOrder": n,
        "senderAddressId": int(senderAddressId),
        "receiver": receiver,
        "parcels": [{"weight": float(weight_kg)}],
        "service": service_obj,
        "saveMode": (save_mode or getattr(settings, "DPD_SHIP_SAVE_MODE", "printed")).lower(),  # printed|draft
        "printFormat": _resolve_print_format(print_format),   # pdf|zpl
        "labelSize": _normalize_label_size(label_size),       # A6|A4
        "extendShipmentData": bool(extend_data),
    }
    return shipment


def build_shipments_payload(shipments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Помощник для пакетной отправки (если понадобится)."""
    return {
        "buCode": getattr(settings, "DPD_BU_CODE", "015"),
        "customerId": settings.DPD_CUSTOMER_ID,
        "shipments": shipments,
    }


def build_shipment(
    *,
    sender_address_id: int | str,
    receiver: Dict[str, Any],
    parcels: List[Dict[str, Any]],
    save_mode: str,
    main_codes: List[str],
    print_format: str,
    label_size: str,
    num_order: int = 1,
    additional_service: Optional[Dict[str, Any]] = None,
    extend_data: bool = True,
) -> Dict[str, Any]:
    # --- нормализация служебных полей ---
    norm_label_size = _normalize_label_size(label_size)
    norm_print_fmt = _resolve_print_format(print_format)

    # --- numOrder: 1..99 ---
    try:
        n = int(num_order)
    except Exception:
        n = 1
    if not (1 <= n <= 99):
        n = 1

    # --- parcels: приводим к {"weight": float} ---
    norm_parcels: List[Dict[str, float]] = []
    for p in (parcels or []):
        if "weight" in p:
            norm_parcels.append({"weight": float(p["weight"])})
        elif "weight_kg" in p:
            norm_parcels.append({"weight": float(p["weight_kg"])})
        else:
            raise ValueError(f"Parcel dict must contain 'weight' (kg): got {p}")

    # --- сервисные коды/доп. услуги ---
    service_obj: Dict[str, Any] = {"mainServiceElementCodes": list(main_codes or [])}
    if additional_service:
        service_obj["additionalService"] = additional_service

    senderAddressId = getattr(settings, "DPD_SENDER_ADDRESS_ID", 1)

    return {
        "numOrder": n,
        "senderAddressId": int(senderAddressId),
        "receiver": receiver,                 # объект!
        "parcels": norm_parcels,
        "service": service_obj,
        "saveMode": (save_mode or getattr(settings, "DPD_SHIP_SAVE_MODE", "printed")).lower(),
        "printFormat": norm_print_fmt,        # pdf|zpl
        "labelSize": norm_label_size,         # A4|A6
        "extendShipmentData": bool(extend_data),
    }
