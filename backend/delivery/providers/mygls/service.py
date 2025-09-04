from __future__ import annotations
import os
import base64

from datetime import datetime
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from django.conf import settings
from django.utils.timezone import now

from .client import MyGlsClient


@dataclass
class SimpleShipment:
    parcel: Dict[str, Any]
    type_of_printer: str = "A4_2x2"  # A4_2x2, A4_4x1, Connect, Thermo, ThermoZPL


class MyGlsService:
    def __init__(self, client: Optional[MyGlsClient] = None):
        self.client = client or MyGlsClient.from_settings()

    @classmethod
    def from_settings(cls) -> "MyGlsService":
        return cls(MyGlsClient.from_settings())

    # единообразно вытаскиваем ошибки из разных ответов
    @staticmethod
    def _collect_errors(resp: Dict[str, Any]) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for key in (
            "PrintLabelsErrorList",
            "PrepareLabelsError",
            "GetPrintedLabelsErrorList",
            "GetParcelListErrors",
            "GetParcelStatusErrors",
        ):
            if key in resp and resp[key]:
                out.extend(resp[key] or [])
        return out

    @staticmethod
    def _ensure_dir(path: str) -> None:
        os.makedirs(path, exist_ok=True)

    def _save_labels(self, labels_any, type_of_printer: str, store_dir: str) -> Tuple[str, str]:
        """
        Принимает ярлык как:
          - list[int]  -> bytes(labels_any)
          - str (base64) -> base64.b64decode
          - bytes/bytearray -> 그대로
        Возвращает (abs_path, rel_url).
        """
        # нормализуем в bytes
        if isinstance(labels_any, list):
            raw = bytes(labels_any)
        elif isinstance(labels_any, (bytes, bytearray)):
            raw = bytes(labels_any)
        elif isinstance(labels_any, str):
            s = labels_any.strip()
            # если вдруг прилетит уже текстовый PDF/ZPL (крайне маловероятно)
            if s.startswith("%PDF") or s.startswith("^XA") or s.startswith("~D"):
                raw = s.encode("latin1")
            else:
                raw = base64.b64decode(s)
        else:
            raw = b""

        ext = ".pdf"
        if (type_of_printer or "").lower() == "thermozpl":
            ext = ".zpl"

        media_root = getattr(settings, "MEDIA_ROOT", ".")
        media_url = getattr(settings, "MEDIA_URL", "/media/")
        subdir = store_dir.strip("/")

        out_dir = os.path.join(media_root, subdir)
        os.makedirs(out_dir, exist_ok=True)

        fname = f"mygls_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}{ext}"
        abs_path = os.path.join(out_dir, fname)

        with open(abs_path, "wb") as f:
            f.write(raw or b"")

        rel_url = f"{media_url.rstrip('/')}/{subdir}/{fname}"
        return abs_path, rel_url

    def create_print_and_store(
        self,
        shipments: List[SimpleShipment],
        *,
        store_dir: str = "dev/mygls_labels",
        flow: str = "print",  # "print" | "prepare"
    ) -> Dict[str, Any]:
        """
        flow="prepare" -> PrepareLabels
        flow="print"   -> PrintLabels (в один шаг)
        """
        if not shipments:
            return {"status": 400, "errors": [{"ErrorCode": 11, "ErrorDescription": "Parcel list is empty"}]}

        # Для простоты выполняем по одному отправлению за запрос
        last_status = 0
        all_errors: List[Dict[str, Any]] = []
        all_numbers: List[str] = []
        last_url: Optional[str] = None
        last_print_info: Dict[str, Any] = {}
        used_printer = shipments[0].type_of_printer

        for sh in shipments:
            if flow == "prepare":
                status, resp = self.client._post("PrepareLabels", {
                    "ParcelList": sh.parcel.get("ParcelList", []),
                })
                errors = self._collect_errors(resp)
                last_status = status
                all_errors.extend(errors)
                last_print_info = {
                    "ParcelInfoList": resp.get("ParcelInfoList", []),
                    "PrepareLabelsError": resp.get("PrepareLabelsError", []),
                }
                # Номеров и ярлыка тут нет
                continue

            # flow == "print"
            status, resp = self.client._post("PrintLabels", {
                "ParcelList": sh.parcel.get("ParcelList", []),
                "TypeOfPrinter": sh.type_of_printer,
            })
            last_status = status
            errors = self._collect_errors(resp)
            all_errors.extend(errors)

            # Номера
            info_list = resp.get("PrintLabelsInfoList") or []
            for it in info_list:
                num = it.get("ParcelNumber")
                if num:
                    all_numbers.append(str(num))

            # Ярлык
            labels_b64 = resp.get("Labels")
            if labels_b64:
                _, url = self._save_labels(labels_b64, sh.type_of_printer, store_dir)
                last_url = url

            last_print_info = {
                "PrintLabelsInfoList": info_list,
                "GetPrintedLabelsErrorList": resp.get("GetPrintedLabelsErrorList", []),
                "PrintLabelsErrorList": resp.get("PrintLabelsErrorList", []),
            }

        ok = (last_status == 200) and not all_errors
        return {
            "status": last_status or 200,
            "errors": all_errors,
            "parcel_numbers": all_numbers,
            "url": last_url,
            "print_info": last_print_info,
            "printer": used_printer,
            "ts": now().isoformat(),
        }
