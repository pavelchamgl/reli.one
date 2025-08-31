from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from .client import MyGlsClient
from . import builders
from .endpoints import print_labels, prepare_labels, get_printed_labels


@dataclass
class SimpleShipment:
    client_reference: Optional[str]
    sender: Dict[str, Any]
    receiver: Dict[str, Any]
    services: List[Dict[str, Any]]
    properties: List[Dict[str, Any]]


def _extract_parcel_numbers(print_info: Dict[str, Any]) -> List[str]:
    if not isinstance(print_info, dict):
        return []
    candidates = []
    for k in ("PrintLabelsInfoList", "PrintDataInfoList", "PrintedParcelInfoList", "ParcelInfoList"):
        v = print_info.get(k)
        if isinstance(v, list):
            candidates.extend(v)
    out = []
    for it in candidates:
        if isinstance(it, dict):
            num = it.get("ParcelNumber") or it.get("ParcelNo") or it.get("Barcode")
            if num:
                out.append(str(num))
    return out


class MyGlsService:
    def __init__(self, client: Optional[MyGlsClient] = None):
        self.client = client or MyGlsClient.from_settings()
        self.client_number = int(settings.MYGLS_CLIENT_NUMBER)
        self.type_of_printer = settings.MYGLS_TYPE_OF_PRINTER or "A4_2x2"  # PDF по умолчанию

    def build_parcel_payload(self, s: SimpleShipment) -> Dict[str, Any]:
        return builders.build_parcel(
            client_number=self.client_number,
            pickup_address=s.sender,
            delivery_address=s.receiver,
            service_list=s.services,
            properties=s.properties,
            client_reference=s.client_reference,
            pickup_date=None,
        )

    def create_and_print(
        self,
        shipments: List[SimpleShipment],
        type_of_printer: Optional[str] = None,
        print_position: int = 1,
    ) -> Tuple[bytes, Dict[str, Any], List[str], List[Dict[str, Any]]]:
        """
        Возвращает (file_bytes, info, parcel_numbers, errors)
        """
        printer = (type_of_printer or self.type_of_printer)
        parcel_list = [self.build_parcel_payload(s) for s in shipments]
        file_bytes, info, errors = print_labels(self.client, parcel_list, printer, print_position=print_position)
        numbers = _extract_parcel_numbers(info)
        return file_bytes, info, numbers, errors

    def prepare_then_print(
        self,
        shipments: List[SimpleShipment],
        type_of_printer: Optional[str] = None,
        print_position: int = 1,
    ) -> Tuple[bytes, Dict[str, Any], List[int], List[str], List[Dict[str, Any]]]:
        """
        Возвращает (file_bytes, info, parcel_ids, parcel_numbers, errors)
        """
        printer = (type_of_printer or self.type_of_printer)
        parcel_list = [self.build_parcel_payload(s) for s in shipments]
        ids, errors_prepare = prepare_labels(self.client, parcel_list)
        file_bytes, info, errors_print = get_printed_labels(self.client, ids, printer, print_position=print_position)
        numbers = _extract_parcel_numbers(info)
        return file_bytes, info, ids, numbers, (errors_prepare + errors_print)

    def save_label_file(self, file_bytes: bytes, dirname: str = "shipping_labels/mygls", printer: Optional[str] = None) -> Tuple[str, str]:
        p = (printer or self.type_of_printer).lower()
        if p.startswith("a4_"):
            ext = ".pdf"
        elif p == "thermozpl":
            ext = ".zpl"
        else:
            # Thermo часто тоже PDF как Byte[], но на всякий случай оставим .pdf
            ext = ".pdf"
        from uuid import uuid4
        name = f"{dirname}/{uuid4()}{ext}"
        path = default_storage.save(name, ContentFile(file_bytes))
        url = default_storage.url(path)
        return path, url

    def create_print_and_store(
        self,
        shipments: List[SimpleShipment],
        store_dir: str = "shipping_labels/mygls",
        type_of_printer: Optional[str] = None,
        print_position: int = 1,
    ) -> Dict[str, Any]:
        file_bytes, info, numbers, errors = self.create_and_print(
            shipments, type_of_printer=type_of_printer, print_position=print_position
        )
        storage_path, url = self.save_label_file(file_bytes, store_dir, printer=(type_of_printer or self.type_of_printer))
        return {
            "parcel_numbers": numbers,
            "storage_path": storage_path,
            "url": url,
            "print_info": info,
            "errors": errors,
            "printer": (type_of_printer or self.type_of_printer),
        }
