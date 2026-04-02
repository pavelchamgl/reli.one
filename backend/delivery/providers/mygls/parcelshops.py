from __future__ import annotations

import logging
import requests
import xml.etree.ElementTree as ET

from typing import Optional, Dict
from functools import lru_cache

logger = logging.getLogger(__name__)

FEED_URL = "https://ps-maps.gls-czech.com/getDropoffPoints.php"


def _norm(value: str | None) -> str:
    """
    Нормализация строк:
    - убираем пробелы
    - приводим к верхнему регистру
    """
    return (value or "").strip().upper()


@lru_cache(maxsize=32)
def _load_country_feed(ctrcode: str) -> dict[str, dict]:
    """
    Кэшируем GLS фид по стране.

    Возвращаем:
        dict: {POINT_ID: {...данные точки...}}

    ВАЖНО:
    - ключи нормализуются (_norm)
    - логируем загрузку и размер фида
    """
    country = _norm(ctrcode)
    logger.info("[GLS] Loading parcelshop feed for country=%s", country)

    try:
        response = requests.get(FEED_URL, params={"ctrcode": country}, timeout=15, verify=False)
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

        out[pid] = {
            "id": pid,
            "name": (dp.attrib.get("Name") or "").strip(),
            "address": (dp.attrib.get("Address") or "").strip(),
            "zip": (dp.attrib.get("ZipCode") or "").strip(),
            "city": (dp.attrib.get("CityName") or dp.attrib.get("City") or "").strip(),
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


def get_parcelshop(ps_id: str, ctrcode: str) -> Optional[Dict]:
    """
    Получить GLS pickup point по ID и стране.

    Возвращает:
        dict | None

    Особенности:
    - нормализует входные данные
    - логирует ошибки загрузки
    - логирует если точка не найдена
    """
    point_id = _norm(ps_id)
    country = _norm(ctrcode)

    if not point_id:
        logger.warning("[GLS] Empty pickup point ID received")
        return None

    try:
        feed = _load_country_feed(country)
    except Exception:
        # Ошибка уже залогирована выше
        return None

    point = feed.get(point_id)

    if point is None:
        # Логируем первые несколько ключей для дебага
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
    None  – если точка не найдена или фид недоступен
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
