from __future__ import annotations

from django.conf import settings

from .client import DpdClient


def create_shipments(client: DpdClient, shipments: list[dict]) -> dict:
    """
    POST /api/v1.1/shipments
    Контракт: { "customerId": "...", "shipments": [ {...}, ... ] }
    """
    payload = {"customerId": settings.DPD_CUSTOMER_ID, "shipments": shipments}
    return client.post("/shipments", payload)


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
        "labelSize": fmt,
        "parcelNumberList": parcel_numbers,
        "printFormat": print_format,
    }

    base_v10 = settings.DPD_API_BASE.replace("/v1.1", "/v1.0").rstrip("/")
    r = client.session.post(
        f"{base_v10}/label/parcel-numbers",
        json=payload,
        headers=client._headers(),
        timeout=client.timeout,
    )
    r.raise_for_status()
    return r.json()


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
        "labelSize": fmt,
        "shipmentIdList": shipment_ids,
        "printFormat": print_format,
    }

    base_v10 = settings.DPD_API_BASE.replace("/v1.1", "/v1.0").rstrip("/")
    r = client.session.post(
        f"{base_v10}/label/shipment-ids",
        json=payload,
        headers=client._headers(),
        timeout=client.timeout,
    )
    r.raise_for_status()
    return r.json()


def cancel_shipment(client: DpdClient, shipment_id: int | str) -> dict:
    """
    POST /api/v1.1/shipments/cancellation
    """
    payload = {"shipmentId": int(shipment_id)}
    return client.post("/shipments/cancellation", payload)
