from __future__ import annotations
from typing import Optional

from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point
from delivery.providers.mygls.parcelshops import get_parcelshop

DELIVERY_TYPE_PUDO = 1
DELIVERY_TYPE_HD = 2


def resolve_country_code_from_group(
    group: dict,
    idx: int,
    logger=None,
    *,
    root_country: Optional[str] = None,
    courier_code: Optional[str] = None,
) -> Optional[str]:
    """
    Возвращает ISO-код страны назначения для группы заказа.

    Логика (как была):
      • HD (2): страна берётся из group.delivery_address.country с фолбэком на root_country.
      • PUDO (1):
          - DPD: берём страну из group.delivery_address.country (у DPD нет локального каталога ПВЗ).
          - GLS: проверяем ПВЗ в фиде GLS по root_country.
          - Packeta: определяем страну по самому pickup_point_id.
    НИКАКИХ новых валидаторов не добавляем.
    """
    delivery_type = group.get("delivery_type")

    # HD
    if delivery_type == DELIVERY_TYPE_HD:
        addr = group.get("delivery_address") or {}
        cc = (addr.get("country") or root_country or "").upper()
        if not cc:
            if logger:
                logger.error(f"Group {idx}: Missing country for HD.")
            return None
        return cc

    # PUDO
    if delivery_type == DELIVERY_TYPE_PUDO:
        pid = (group.get("pickup_point_id") or "").strip()
        if not pid:
            if logger:
                logger.error(f"Group {idx}: Missing pickup_point_id for PUDO.")
            return None

        ccode = (courier_code or "").lower()

        # DPD PUDO — берём страну из адреса
        if ccode == "dpd":
            addr = group.get("delivery_address") or {}
            cc = (addr.get("country") or "").upper()
            if not cc:
                if logger:
                    logger.error(f"Group {idx}: Missing country in delivery_address for DPD PUDO.")
                return None
            return cc

        # GLS PUDO — проверяем по фиду GLS
        if ccode == "gls":
            cc = (root_country or "").upper()
            if not cc:
                if logger:
                    logger.error(f"Group {idx}: Missing root_country for GLS PUDO.")
                return None
            ok = bool(get_parcelshop(pid, cc))
            if not ok and logger:
                logger.error(f"Group {idx}: GLS pickup point '{pid}' not found in country {cc}.")
            return cc if ok else None

        # Packeta PUDO
        cc = resolve_country_from_local_pickup_point(pid)
        if not cc:
            if logger:
                logger.error(f"Group {idx}: Packeta pickup point not found: {pid}")
            return None
        cc = cc.upper()

        # если root_country был — сверяем
        if root_country and cc != (root_country or "").upper():
            if logger:
                logger.error(
                    f"Group {idx}: Packeta point '{pid}' belongs to {cc}, "
                    f"but order country is {(root_country or '').upper()}."
                )
            return None

        return cc

    if logger:
        logger.error(f"Group {idx}: Unknown delivery_type {delivery_type}")
    return None
