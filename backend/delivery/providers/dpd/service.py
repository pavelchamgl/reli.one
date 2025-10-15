from __future__ import annotations

import logging
from typing import Callable, List, Optional

from django.conf import settings

from .client import DpdClient
from . import endpoints as ep
from .builders import build_shipment

log = logging.getLogger(__name__)


class DpdService:
    """
    Сервисный слой над DPD Shipping API:
      - Собирает shipment (учитывая main/additional услуги)
      - Вызывает /shipments
      - Сохраняет PDF через save_pdf_cb:
          * из labelFile (если пришёл сразу)
          * либо fallback: /label/parcel-numbers или /label/shipment-ids
    """

    def __init__(self, client: Optional[DpdClient] = None):
        self.client = client or DpdClient()
        self._last_raw: Optional[dict] = None  # сырой ответ последнего вызова

    def create_and_print(
        self,
        *,
        receiver: dict,
        parcels: list[dict],
        main_codes: list[str],
        save_pdf_cb: Callable[[str, List[str]], None],
        fmt: Optional[str] = None,
        num_order: int = 1,
        additional_codes: Optional[list[str]] = None,
    ) -> List[str]:
        """
        Возвращает список parcelNumbers.
        - В draft-режиме список обычно пуст (DPD не присваивает номера до печати).
        - В printed-режиме пытаемся сохранить PDF.
        """
        save_mode = (getattr(settings, "DPD_SHIP_SAVE_MODE", "printed") or "printed").lower()
        label_size = (fmt or getattr(settings, "DPD_LABEL_SIZE", "A6"))
        print_format = getattr(settings, "DPD_PRINT_FORMAT", "PDF")

        shipment = build_shipment(
            sender_address_id=settings.DPD_SENDER_ADDRESS_ID,
            receiver=receiver,
            parcels=parcels,
            save_mode=save_mode,
            main_codes=main_codes,
            print_format=print_format,
            label_size=label_size,
            num_order=num_order,
            additional_codes=additional_codes,  # << важно
        )

        api_res = ep.create_shipments(self.client, [shipment])
        self._last_raw = api_res

        results = api_res.get("shipmentResults") or []
        if not results:
            raise RuntimeError(f"DPD: empty shipmentResults: {api_res}")

        first = results[0]
        shipment_id = first.get("shipmentId")
        parcel_results = first.get("parcelResults") or []
        numbers = [p.get("parcelNumber") for p in parcel_results if p.get("parcelNumber")]

        # --- DRAFT: номера и ярлык не обязаны появляться ---
        if save_mode == "draft":
            return numbers  # [] — норм

        # --- PRINTED: сначала пробуем labelFile прямо из /shipments ---
        label_b64 = first.get("labelFile")
        if label_b64 and label_b64.startswith("data:"):
            label_b64 = label_b64.split(",", 1)[1]

        if label_b64:
            save_pdf_cb(label_b64, numbers or ["unknown"])
            return numbers

        # Fallback 1: есть номера — печать по parcel-numbers (v1.0)
        if numbers:
            lab = ep.labels_by_parcel_numbers(
                self.client,
                numbers,
                fmt=label_size,
                start_pos=getattr(settings, "DPD_LABEL_START_POSITION", 1),
                print_format=print_format,
            )
            pdf_b64 = lab.get("pdfFile") or ""
            if pdf_b64.startswith("data:"):
                pdf_b64 = pdf_b64.split(",", 1)[1]
            if not pdf_b64:
                raise RuntimeError(f"DPD: /label/parcel-numbers returned empty pdfFile: {lab}")
            save_pdf_cb(pdf_b64, numbers)
            return numbers

        # Fallback 2: номеров нет, но есть shipmentId — печать по shipment-ids (v1.0)
        if shipment_id:
            lab = ep.labels_by_shipment_ids(
                self.client,
                [shipment_id],
                fmt=label_size,
                start_pos=getattr(settings, "DPD_LABEL_START_POSITION", 1),
                print_format=print_format,
            )
            pdf_b64 = lab.get("pdfFile") or ""
            if pdf_b64.startswith("data:"):
                pdf_b64 = pdf_b64.split(",", 1)[1]
            if not pdf_b64:
                raise RuntimeError(f"DPD: /label/shipment-ids returned empty pdfFile: {lab}")
            save_pdf_cb(pdf_b64, numbers or [str(shipment_id)])
            return numbers

        raise RuntimeError(
            f"DPD: printed mode but neither labelFile nor parcelNumbers/shipmentId present: {first}"
        )
