from typing import Any, Dict, List, Tuple
import base64

from .client import MyGlsClient


def _decode_possible_file(data: Dict[str, Any]) -> bytes:
    """
    Универсальный декодер файла: поддерживает разные ключи и форматы.
    Порядок:
      1) 'Labels' — base64-строка или массив байтов (int)
      2) 'PrintData' — base64-строка (на старых инсталляциях)
      3) 'PrintDataPageList' — список base64-страниц, склеиваем
      4) фолбэк: любая длинная base64-строка
    """
    # 1) Labels
    if "Labels" in data:
        val = data["Labels"]
        if isinstance(val, str):
            try:
                return base64.b64decode(val)
            except Exception:
                pass
        if isinstance(val, list):
            try:
                return bytes(val)
            except Exception:
                pass

    # 2) PrintData
    if "PrintData" in data and isinstance(data["PrintData"], str):
        try:
            return base64.b64decode(data["PrintData"])
        except Exception:
            pass

    # 3) PrintDataPageList
    if "PrintDataPageList" in data and isinstance(data["PrintDataPageList"], list):
        try:
            pages = b"".join(base64.b64decode(p) for p in data["PrintDataPageList"] if isinstance(p, str))
            if pages:
                return pages
        except Exception:
            pass

    # 4) Фолбэк: ищем любую base64-строку
    for v in data.values():
        if isinstance(v, str) and len(v) > 100:
            try:
                b = base64.b64decode(v)
                if b:
                    return b
            except Exception:
                continue

    return b""


def _extract_info_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Нормализуем метаданные, чтобы дальше было проще вытаскивать ParcelNumber.
    """
    info_keys = [
        "PrintLabelsInfoList", "PrintDataInfoList", "PrintedParcelInfoList",
        "ParcelInfoList", "LabelInfoList", "LabelsInfoList"
    ]
    out = {}
    for k in info_keys:
        if k in data:
            out[k] = data.get(k) or []
    return out


def _extract_error_list(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Возвращает любые '*ErrorList' из ответа в единый список.
    """
    errors = []
    for k, v in data.items():
        if isinstance(k, str) and k.endswith("ErrorList") and isinstance(v, list):
            errors.extend(v)
    return errors


def prepare_labels(client: MyGlsClient, parcel_list: List[Dict[str, Any]]) -> Tuple[List[int], List[Dict[str, Any]]]:
    """
    Возвращает ([ParcelId], errors)
    """
    payload = {"ParcelList": parcel_list}
    data = client._post("PrepareLabels", payload)
    info = data.get("ParcelInfoList") or []
    ids = [int(x["ParcelId"]) for x in info if isinstance(x, dict) and x.get("ParcelId") is not None]
    return ids, _extract_error_list(data)


def get_printed_labels(
    client: MyGlsClient,
    parcel_id_list: List[int],
    type_of_printer: str,
    print_position: int = 1,
) -> Tuple[bytes, Dict[str, Any], List[Dict[str, Any]]]:
    """
    Возвращает (file_bytes, info_dict, errors)
    """
    payload = {
        "ParcelIdList": parcel_id_list,
        "TypeOfPrinter": type_of_printer,
    }
    # PrintPosition работает только для A4
    if type_of_printer.startswith("A4_"):
        payload["PrintPosition"] = print_position

    data = client._post("GetPrintedLabels", payload)
    file_bytes = _decode_possible_file(data)
    info = _extract_info_dict(data)
    errors = _extract_error_list(data)
    return file_bytes, info, errors


def print_labels(
    client: MyGlsClient,
    parcel_list: List[Dict[str, Any]],
    type_of_printer: str,
    print_position: int = 1,
) -> Tuple[bytes, Dict[str, Any], List[Dict[str, Any]]]:
    """
    Полный цикл: валидация + генерация ParcelNumber + возврат ярлыков.
    Возвращает (file_bytes, info_dict, errors)
    """
    payload = {
        "ParcelList": parcel_list,
        "TypeOfPrinter": type_of_printer,
    }
    if type_of_printer.startswith("A4_"):
        payload["PrintPosition"] = print_position

    data = client._post("PrintLabels", payload)
    file_bytes = _decode_possible_file(data)
    info = _extract_info_dict(data)
    errors = _extract_error_list(data)
    return file_bytes, info, errors
