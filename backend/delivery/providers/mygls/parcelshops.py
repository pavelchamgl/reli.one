from __future__ import annotations
import requests
import xml.etree.ElementTree as ET

from typing import Optional, Dict
from functools import lru_cache

FEED_URL = "https://ps-maps.gls-czech.com/getDropoffPoints.php"


@lru_cache(maxsize=32)
def _load_country_feed(ctrcode: str) -> dict[str, dict]:
    """Кэшируем фид по стране. Возвращаем словарь id -> запись."""
    r = requests.get(FEED_URL, params={"ctrcode": ctrcode}, timeout=15)
    r.raise_for_status()
    root = ET.fromstring(r.content)
    out: dict[str, dict] = {}
    for dp in root.findall(".//DropoffPoint"):
        pid = dp.attrib.get("ID") or dp.attrib.get("pclshopid")
        if not pid:
            continue
        out[str(pid)] = {
            "id": str(pid),
            "name": dp.attrib.get("Name", ""),
            "address": dp.attrib.get("Address", ""),
            "zip": dp.attrib.get("ZipCode", ""),
            "city": dp.attrib.get("CityName") or dp.attrib.get("City") or "",
            "country": (dp.attrib.get("CtrCode") or "").upper(),
            "lat": dp.attrib.get("GeoLat"),
            "lng": dp.attrib.get("GeoLng"),
            "is_parcel_locker": dp.attrib.get("IsParcelLocker") == "1",
        }
    return out


def get_parcelshop(ps_id: str, ctrcode: str) -> Optional[Dict]:
    """Надёжный способ: знать страну (ctrcode) и искать только там."""
    try:
        feed = _load_country_feed((ctrcode or "").upper())
    except Exception:
        return None
    return feed.get(ps_id)
