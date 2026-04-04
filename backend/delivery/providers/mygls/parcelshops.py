from __future__ import annotations

import logging
import requests
import xml.etree.ElementTree as ET

from typing import Optional, Dict, Any
from functools import lru_cache

logger = logging.getLogger(__name__)

FEED_URL = "https://ps-maps.gls-czech.com/getDropoffPoints.php"


def _norm(value: str | None) -> str:
    """
    Нормализация строк:
    - убираем пробелы по краям
    - приводим к верхнему регистру
    """
    return (value or "").strip().upper()


def _safe(value: str | None) -> str:
    return (value or "").strip()


def _split_house_number(address: str) -> tuple[str, str]:
    """
    Пытаемся аккуратно выделить номер дома из конца строки адреса.
    Примеры:
      "Jungmannova 10"      -> ("Jungmannova", "10")
      "Masarykova 12/5"     -> ("Masarykova", "12/5")
      "Náměstí"             -> ("Náměstí", "")
      ""                    -> ("", "")
    """
    raw = _safe(address)
    if not raw:
        return "", ""

    parts = raw.rsplit(" ", 1)
    if len(parts) != 2:
        return raw, ""

    street_part, last_part = parts[0].strip(), parts[1].strip()

    # Если последний токен похож на номер дома — отделяем.
    has_digit = any(ch.isdigit() for ch in last_part)
    if has_digit:
        return street_part, last_part

    return raw, ""


@lru_cache(maxsize=32)
def _load_country_feed(ctrcode: str) -> dict[str, dict]:
    """
    Кэшируем GLS feed по стране.

    Возвращаем словарь:
        {
            POINT_ID: {
                "id": ...,
                "name": ...,
                "address": ...,
                "street": ...,
                "house_number": ...,
                "zip": ...,
                "city": ...,
                "country": ...,
                "lat": ...,
                "lng": ...,
                "is_parcel_locker": bool,
            }
        }

    Важно:
    - ключи нормализуются
    - одна загрузка на страну переиспользуется для:
      * проверки существования pickup point
      * определения box/shop
      * получения адреса pickup point для payload
    """
    country = _norm(ctrcode)
    logger.info("[GLS] Loading parcelshop feed for country=%s", country)

    try:
        response = requests.get(
            FEED_URL,
            params={"ctrcode": country},
            timeout=15,
            verify=False,
        )
        response.raise_for_status()
    except Exception as e:
        logger.exception("[GLS] Failed to fetch parcelshop feed for country=%s: %s", country, e)
        raise

    try:
        root = ET.fromstring(response.content)
    except Exception as e:
        logger.exception("[GLS] Failed to parse XML feed for country=%s: %s", country, e)
        raise

    out: dict[str, dict] = {}

    for dp in root.findall(".//DropoffPoint"):
        raw_pid = dp.attrib.get("ID") or dp.attrib.get("pclshopid")
        pid = _norm(raw_pid)
        if not pid:
            continue

        raw_address = _safe(dp.attrib.get("Address"))
        street, house_number = _split_house_number(raw_address)

        out[pid] = {
            "id": pid,
            "name": _safe(dp.attrib.get("Name")),
            "address": raw_address,
            "street": street,
            "house_number": house_number,
            "zip": _safe(dp.attrib.get("ZipCode")),
            "city": _safe(dp.attrib.get("CityName") or dp.attrib.get("City")),
            "country": _norm(dp.attrib.get("CtrCode")),
            "lat": dp.attrib.get("GeoLat"),
            "lng": dp.attrib.get("GeoLng"),
            "is_parcel_locker": dp.attrib.get("IsParcelLocker") == "1",
        }

    logger.info(
        "[GLS] Feed loaded successfully for country=%s, total points=%s",
        country,
        len(out),
    )
    return out


def get_parcelshop(ps_id: str, ctrcode: str) -> Optional[Dict[str, Any]]:
    """
    Получить GLS pickup point по ID и стране.

    Возвращает:
        dict | None
    """
    point_id = _norm(ps_id)
    country = _norm(ctrcode)

    if not point_id:
        logger.warning("[GLS] Empty pickup point ID received")
        return None

    try:
        feed = _load_country_feed(country)
    except Exception:
        # ошибка уже залогирована в _load_country_feed
        return None

    point = feed.get(point_id)
    if point is None:
        sample_keys = list(feed.keys())[:5]
        logger.warning(
            "[GLS] Pickup point not found: id=%s country=%s sample_keys=%s",
            point_id,
            country,
            sample_keys,
        )

    return point


def is_parcel_locker(ps_id: str, ctrcode: str) -> Optional[bool]:
    """
    True  – если это Parcel Locker (BOX)
    False – если это обычный ParcelShop (SHOP)
    None  – если точка не найдена или feed недоступен
    """
    ps = get_parcelshop(ps_id, ctrcode)
    if not ps:
        return None
    return bool(ps.get("is_parcel_locker"))


def get_point_type(ps_id: str, ctrcode: str) -> Optional[str]:
    """
    Возвращает:
        "box"  – если Parcel Locker
        "shop" – если ParcelShop
        None   – если не найдено
    """
    flag = is_parcel_locker(ps_id, ctrcode)
    if flag is None:
        return None
    return "box" if flag else "shop"


def get_parcelshop_delivery_address_data(ps_id: str, ctrcode: str) -> Optional[Dict[str, str]]:
    """
    Возвращает адрес pickup point в нормализованном виде для последующей
    подстановки в GLS DeliveryAddress payload.

    Формат:
        {
            "name": "...",
            "street": "...",
            "house_number": "...",
            "city": "...",
            "zip_code": "...",
            "country_iso": "...",
            "contact_name": "...",
        }

    Возвращает None, если точка не найдена.
    """
    point = get_parcelshop(ps_id, ctrcode)
    if not point:
        logger.warning(
            "[GLS] Cannot build delivery address data: pickup point not found id=%s country=%s",
            _norm(ps_id),
            _norm(ctrcode),
        )
        return None

    payload = {
        "name": point.get("name") or point.get("address") or point.get("id") or "GLS Pickup Point",
        "street": point.get("street") or point.get("address") or "",
        "house_number": point.get("house_number") or "",
        "city": point.get("city") or "",
        "zip_code": point.get("zip") or "",
        "country_iso": point.get("country") or _norm(ctrcode),
        "contact_name": point.get("name") or "GLS Pickup Point",
    }

    logger.info(
        "[GLS] Resolved pickup point address id=%s country=%s payload=%s",
        _norm(ps_id),
        _norm(ctrcode),
        payload,
    )
    return payload