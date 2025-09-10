from __future__ import annotations

import os
import time
import base64
import logging

from datetime import datetime
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from django.conf import settings
from django.utils.timezone import now

from .client import MyGlsClient

logger = logging.getLogger(__name__)


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
        logger.info("GLS label saved: path=%s bytes=%s", abs_path, len(raw or b""))
        return abs_path, rel_url

    def create_print_and_store(
        self,
        shipments: List[SimpleShipment],
        *,
        store_dir: str = "dev/mygls_labels",
        flow: str = "print",  # "print" | "prepare"
        corr_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        flow="prepare" -> PrepareLabels
        flow="print"   -> PrintLabels (в один шаг)
        """
        if not shipments:
            return {"status": 400, "errors": [{"ErrorCode": 11, "ErrorDescription": "Parcel list is empty"}]}

        logger.info(
            "GLS create_print_and_store start id=%s flow=%s count=%s printer=%s",
            corr_id, flow, len(shipments),
            shipments[0].type_of_printer if shipments else None
        )

        # Для простоты выполняем по одному отправлению за запрос
        last_status = 0
        all_errors: List[Dict[str, Any]] = []
        all_numbers: List[str] = []
        last_url: Optional[str] = None
        last_print_info: Dict[str, Any] = {}
        used_printer = shipments[0].type_of_printer

        t0 = time.perf_counter()

        for sh in shipments:
            if flow == "prepare":
                status, resp = self.client._post("PrepareLabels", {
                    "ParcelList": sh.parcel.get("ParcelList", []),
                }, corr_id=corr_id)
                errors = self._collect_errors(resp)
                last_status = status
                all_errors.extend(errors)
                last_print_info = {
                    "ParcelInfoList": resp.get("ParcelInfoList", []),
                    "PrepareLabelsError": resp.get("PrepareLabelsError", []),
                }
                if errors:
                    logger.warning("GLS PrepareLabels errors=%s", errors)
                continue

            # flow == "print"
            status, resp = self.client._post("PrintLabels", {
                "ParcelList": sh.parcel.get("ParcelList", []),
                "TypeOfPrinter": sh.type_of_printer,
            }, corr_id=corr_id)
            last_status = status
            errors = self._collect_errors(resp)
            all_errors.extend(errors)

            # Номера
            info_list = resp.get("PrintLabelsInfoList") or []
            for it in info_list:
                num = it.get("ParcelNumber")
                if num:
                    all_numbers.append(str(num))
                    logger.info(
                        "GLS parcel registered: ref=%s id=%s num=%s",
                        it.get("ClientReference"), it.get("ParcelId"), it.get("ParcelNumber"),
                    )

            # Ярлык
            labels_b64 = resp.get("Labels")
            if labels_b64:
                _, url = self._save_labels(labels_b64, sh.type_of_printer, store_dir)
                last_url = url

            # Контроль расхождений между InfoList и Labels
            if info_list and not labels_b64:
                logger.warning(
                    "GLS response mismatch id=%s: have PrintLabelsInfoList (%d) but no Labels",
                    corr_id, len(info_list)
                )

            if labels_b64 and not info_list:
                size_hint = (len(labels_b64) if isinstance(labels_b64, list) else None)
                logger.warning(
                    "GLS response mismatch id=%s: have Labels%s but empty PrintLabelsInfoList",
                    corr_id,
                    f'[{size_hint}]' if size_hint is not None else ""
                )

            if errors:
                for e in errors:
                    logger.warning(
                        "GLS PrintLabels error: code=%s desc=%s refs=%s parcels=%s",
                        e.get("ErrorCode"), e.get("ErrorDescription"),
                        e.get("ClientReferenceList"), e.get("ParcelIdList"),
                    )

            last_print_info = {
                "PrintLabelsInfoList": info_list,
                "GetPrintedLabelsErrorList": resp.get("GetPrintedLabelsErrorList", []),
                "PrintLabelsErrorList": resp.get("PrintLabelsErrorList", []),
            }

        ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "GLS create_print_and_store done id=%s status=%s ms=%.1f numbers=%s url=%s errors=%s",
            corr_id, last_status, ms, all_numbers, last_url, bool(all_errors))
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
