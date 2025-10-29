from __future__ import annotations

import json
import logging

from django.conf import settings

from .client import DpdClient

log = logging.getLogger(__name__)

def create_shipments(client: DpdClient, shipments: list[dict]) -> dict:
    """
    POST /api/v1.1/shipments
    Контракт: { "buCode": "...", "customerId": "...", "shipments": [ {...}, ... ] }
    """
    payload = {
        "buCode": getattr(settings, "DPD_BU_CODE", "015"),
        "customerId": settings.DPD_CUSTOMER_ID,
        "shipments": shipments,
    }

    # легкий лог — без персональных данных
    try:
        log.debug("DPD /shipments payload keys=%s", list(payload.keys()))
        # Показать только ключи первого shipment
        sh0 = shipments[0] if shipments else {}
        if sh0:
            keys0 = {k: True for k in sh0.keys()}
            if "receiver" in sh0:
                keys0["receiver"] = {"name": True, "zipCode": True, "city": True, "countryCode": True}
            log.debug("DPD /shipments first shipment keys=%s", json.dumps(keys0))
    except Exception:
        pass

    resp = client.post("/shipments", payload)

    # отдельный лог внутренних ошибок (если DPD вернул errors внутри shipmentResults)
    try:
        sr = (resp.get("shipmentResults") or [None])[0]
        if sr and sr.get("errors"):
            log.error("DPD /shipments inline errors: %s", json.dumps(sr["errors"])[:1000])
    except Exception:
        pass

    return resp

def labels_by_parcel_numbers(
    client: DpdClient,
    parcel_numbers: list[str],
    fmt: str = "A6",
    start_pos: int = 1,
    print_format: str = "PDF",
) -> dict:
    """
    POST /api/v1.0/label/parcel-numbers
    Контракт: { buCode, customerId, startPosition, labelSize, parcelNumberList, printFormat }
    ВАЖНО: у этого метода у DPD используется v1.0 (даже если base v1.1)
    """
    payload = {
        "buCode": settings.DPD_BU_CODE,
        "customerId": settings.DPD_CUSTOMER_ID,
        "startPosition": start_pos,
        "labelSize": (fmt or "A6").upper(),
        "parcelNumberList": parcel_numbers,
        "printFormat": (print_format or "PDF").upper(),
    }

    base_v10 = settings.DPD_API_BASE.replace("/v1.1", "/v1.0").rstrip("/")

    log.debug("DPD /label/parcel-numbers → base=%s parcels=%s", base_v10, parcel_numbers)

    r = client.session.post(
        f"{base_v10}/label/parcel-numbers",
        json=payload,
        headers=client._headers(),
        timeout=client.timeout,
    )

    try:
        r.raise_for_status()
    except Exception:
        log.warning("DPD /label/parcel-numbers failed: %s %s", r.status_code, r.text[:800])
        raise

    try:
        data = r.json()
        log.debug("DPD /label/parcel-numbers ← status=%s keys=%s", r.status_code, list(data.keys()))
        return data
    except Exception:
        log.warning("DPD /label/parcel-numbers non-JSON response: %s", r.text[:800])
        raise

def labels_by_shipment_ids(
    client: DpdClient,
    shipment_ids: list[int],
    fmt: str = "A6",
    start_pos: int = 1,
    print_format: str = "PDF",
) -> dict:
    """
    POST /api/v1.0/label/shipment-ids
    Контракт: { buCode, customerId, startPosition, labelSize, shipmentIdList, printFormat }
    """
    payload = {
        "buCode": settings.DPD_BU_CODE,
        "customerId": settings.DPD_CUSTOMER_ID,
        "startPosition": start_pos,
        "labelSize": (fmt or "A6").upper(),
        "shipmentIdList": shipment_ids,
        "printFormat": (print_format or "PDF").upper(),
    }

    base_v10 = settings.DPD_API_BASE.replace("/v1.1", "/v1.0").rstrip("/")

    log.debug("DPD /label/shipment-ids → base=%s shipmentIds=%s", base_v10, shipment_ids)

    r = client.session.post(
        f"{base_v10}/label/shipment-ids",
        json=payload,
        headers=client._headers(),
        timeout=client.timeout,
    )

    try:
        r.raise_for_status()
    except Exception:
        log.warning("DPD /label/shipment-ids failed: %s %s", r.status_code, r.text[:800])
        raise

    try:
        data = r.json()
        log.debug("DPD /label/shipment-ids ← status=%s keys=%s", r.status_code, list(data.keys()))
        return data
    except Exception:
        log.warning("DPD /label/shipment-ids non-JSON response: %s", r.text[:800])
        raise

def cancel_shipment(client: DpdClient, shipment_id: int | str) -> dict:
    """
    POST /api/v1.1/shipments/cancellation
    """
    payload = {"shipmentId": int(shipment_id)}
    log.debug("DPD /shipments/cancellation → %s", shipment_id)
    resp = client.post("/shipments/cancellation", payload)
    log.debug("DPD /shipments/cancellation ← %s", resp)
    return resp
