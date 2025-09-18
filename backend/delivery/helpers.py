from __future__ import annotations

from typing import Optional

from delivery.services.packeta_point_service import (
    resolve_country_from_local_pickup_point,
)
from delivery.providers.mygls.parcelshops import get_parcelshop

# Номера типов доставки в ваших данных
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

    Поведение:
      • HD (delivery_type=2): страна берётся из group['delivery_address']['country']
        с фолбэком на root_country. Требуем наличие страны.
      • PUDO (delivery_type=1):
          - GLS: валидируем, что pickup_point_id существует в фиде GLS именно для
            заявленной страны (root_country). Возвращаем root_country.
          - Packeta: страну получаем строго по самому pickup_point_id
            (resolve_country_from_local_pickup_point) и, если задан root_country,
            требуем совпадение.
      • Логируем причину отказа через переданный logger.
    """
    delivery_type = group.get("delivery_type")

    # --- Home Delivery
    if delivery_type == DELIVERY_TYPE_HD:
        addr = group.get("delivery_address") or {}
        cc = (addr.get("country") or root_country or "").upper()
        if not cc:
            if logger:
                logger.error(f"Group {idx}: Missing country for HD.")
            return None
        return cc

    # --- PUDO
    if delivery_type == DELIVERY_TYPE_PUDO:
        pid = (group.get("pickup_point_id") or "").strip()
        if not pid:
            if logger:
                logger.error(f"Group {idx}: Missing pickup_point_id for PUDO.")
            return None

        # GLS: проверяем пункт строго в выбранной стране (root_country обязательно)
        if (courier_code or "").lower() == "gls":
            cc = (root_country or "").upper()
            if not cc:
                if logger:
                    logger.error(f"Group {idx}: Missing root_country for GLS PUDO.")
                return None
            ok = bool(get_parcelshop(pid, cc))
            if not ok:
                if logger:
                    logger.error(
                        f"Group {idx}: GLS pickup point '{pid}' not found in country {cc}."
                    )
                return None
            return cc

        # Packeta: страна = страна самого пункта; без фолбэка на root_country
        cc = resolve_country_from_local_pickup_point(pid)
        if not cc:
            if logger:
                logger.error(f"Group {idx}: Packeta pickup point not found: {pid}")
            return None
        cc = cc.upper()

        # Если в запросе указана страна (root_country), требуем совпадение
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
