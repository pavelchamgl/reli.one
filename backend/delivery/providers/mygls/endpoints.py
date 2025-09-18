from __future__ import annotations
import base64

from typing import Any, Dict, List, Tuple

from .client import MyGlsClient


# ===== helpers ==============================================================

def _decode_bytes_field(value) -> bytes:
    """
    GLS в JSON возвращает бинарные поля как base64-строку (чаще всего),
    но иногда встречаются и массивы байтов. Поддерживаем оба варианта.
    """
    if value is None:
        return b""
    if isinstance(value, str):
        return base64.b64decode(value)
    if isinstance(value, list):
        return bytes(value)
    try:
        return bytes(value)
    except Exception:
        return b""


# ===== high-level wrappers over RPCs ========================================

def prepare_labels(
    client: MyGlsClient,
    parcel_list: List[Dict[str, Any]],
) -> Tuple[List[int], Dict[str, Any]]:
    """
    PrepareParcel — создаёт черновики отправлений и возвращает их ParcelId.
    """
    payload = {"ParcelList": parcel_list}
    data = client._post("PrepareParcel", payload)
    info_list = data.get("ParcelInfoList") or []
    parcel_ids = [x.get("ParcelId") for x in info_list if x.get("ParcelId") is not None]
    errors = data.get("Errors") or []
    return parcel_ids, {"ParcelInfoList": info_list, "Errors": errors}


def get_printed_labels(
    client: MyGlsClient,
    parcel_ids: List[int],
    type_of_printer: str,
) -> Tuple[bytes, Dict[str, Any]]:
    """
    PrintData — печать по списку ParcelId (A4/pdf тоже здесь).
    """
    payload = {"ParcelIdList": parcel_ids, "TypeOfPrinter": type_of_printer}
    data = client._post("PrintData", payload)
    file_bytes = _decode_bytes_field(data.get("PrintData"))
    info = {"PrintDataInfoList": data.get("PrintDataInfoList") or [], "Errors": data.get("Errors") or []}
    return file_bytes, info


def print_labels(
    client: MyGlsClient,
    parcel_list: List[Dict[str, Any]],
    type_of_printer: str,
) -> Tuple[bytes, Dict[str, Any]]:
    """
    PrintLabels — «короткий путь»: сразу печать по данным посылки (без сохранения ParcelId).
    """
    payload = {"ParcelList": parcel_list, "TypeOfPrinter": type_of_printer}
    data = client._post("PrintLabels", payload)
    file_bytes = _decode_bytes_field(data.get("Labels"))
    info = {
        "PrintLabelsInfoList": data.get("PrintLabelsInfoList") or [],
        "Errors": data.get("PrintLabelsErrorList") or data.get("Errors") or [],
    }
    return file_bytes, info
