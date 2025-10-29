from __future__ import annotations

import json
import logging
from typing import Callable, List, Optional, Dict, Any

from django.conf import settings

from .client import DpdClient
from . import endpoints as ep
from .utils import brief_receiver

log = logging.getLogger(__name__)

def _extract_shipment_id(sr: dict | None) -> Optional[int]:
    if not sr:
        return None
    # Иногда shipmentId на верхнем уровне, иногда внутри "shipment"
    sid = sr.get("shipmentId")
    if sid:
        try:
            return int(sid)
        except Exception:
            return None
    inner = (sr.get("shipment") or {}).get("shipmentId")
    try:
        return int(inner) if inner is not None else None
    except Exception:
        return None

def _extract_parcel_numbers(sr: dict | None) -> List[str]:
    if not sr:
        return []
    # 1) parcelResults (классика)
    out: List[str] = []
    for p in (sr.get("parcelResults") or []):
        pn = p.get("parcelNumber")
        if pn:
            out.append(pn)
    if out:
        return out
    # 2) fallback: shipment.parcels
    sp = (sr.get("shipment") or {}).get("parcels") or []
    for p in sp:
        pn = p.get("parcelNumber")
        if pn:
            out.append(pn)
    return out

class DpdService:
    """
    Высокоуровневый сервис для DPD Shipping API:
      - Собирает shipment и вызывает /shipments
      - Обрабатывает labelFile / parcelNumbers / shipmentId
      - Сохраняет PDF через save_pdf_cb
      - Пишет подробные DEBUG-логи
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
        additional_service: Optional[dict] = None,
    ) -> List[str]:
        """
        Создаёт и печатает отправление.
        """
        save_mode = (getattr(settings, "DPD_SHIP_SAVE_MODE", "printed") or "printed").lower()
        label_size = (fmt or getattr(settings, "DPD_LABEL_SIZE", "A6"))
        print_format = getattr(settings, "DPD_PRINT_FORMAT", "pdf").lower()

        # --- DEBUG: лог входных данных ---
        try:
            log.debug(
                "DPD build shipment: saveMode=%s printFormat=%s labelSize=%s main=%s add=%s receiver=%s parcels=%s",
                save_mode,
                print_format,
                label_size,
                main_codes,
                additional_service,
                brief_receiver(receiver),
                parcels,
            )
            # краткий help-заголовок
            total_w = sum(float(p.get("weight") or p.get("weight_kg") or 0.0) for p in parcels or [])
            log.debug("DPD create: %s | %s %s | parcels=%d | weight_total=%.2f kg",
                      receiver.get("name"), receiver.get("city"), receiver.get("zipCode"),
                      len(parcels or []), total_w)
        except Exception:
            pass

        # --- Сборка shipment ---
        shipment = {
            "numOrder": max(1, min(99, int(num_order or 1))),
            "senderAddressId": int(getattr(settings, "DPD_SENDER_ADDRESS_ID", 1)),
            "receiver": receiver,
            "parcels": [{"weight": float(p.get("weight", p.get("weight_kg")))} for p in parcels or []],
            "service": {"mainServiceElementCodes": list(main_codes or [])},
            "saveMode": save_mode,
            "printFormat": print_format,
            "labelSize": label_size,
            "extendShipmentData": True,
        }
        if additional_service:
            shipment["service"]["additionalService"] = additional_service

        # --- Вызов /shipments ---
        api_res = ep.create_shipments(self.client, [shipment])
        self._last_raw = api_res

        results = api_res.get("shipmentResults") or []
        if not results:
            log.error("DPD /shipments returned no results: %s", json.dumps(api_res)[:1200])
            raise RuntimeError("DPD: empty shipmentResults")

        first = results[0]

        # --- Проверка на ошибки ---
        if first.get("errors"):
            log.error("DPD /shipments errors: %s", json.dumps(first.get("errors"))[:1000])
            raise RuntimeError(f"DPD /shipments errors: {first.get('errors')}")

        # --- Извлечения полей ---
        shipment_id = _extract_shipment_id(first)   # <— критично
        numbers = _extract_parcel_numbers(first)
        has_label_inline = bool(first.get("labelFile"))

        log.debug(
            "DPD parsed: shipmentId=%s numbers=%s hasLabel=%s",
            shipment_id,
            numbers,
            has_label_inline,
        )

        # --- DRAFT MODE ---
        if save_mode == "draft":
            log.debug("DPD draft mode active, returning numbers only")
            return numbers

        # --- LABELFILE (встроенный PDF) ---
        label_b64 = first.get("labelFile") or ""
        if label_b64:
            # поддержка префикса "data:"
            if label_b64.startswith("data:"):
                label_b64 = label_b64.split(",", 1)[1]
            log.debug("DPD received inline labelFile, saving via callback")
            # для имени файла — используем номера, либо shipment_id
            name_hint = numbers or ([str(shipment_id)] if shipment_id else ["label"])
            save_pdf_cb(label_b64, name_hint)
            return numbers

        # --- FALLBACK 1: /label/parcel-numbers ---
        if numbers:
            lab = ep.labels_by_parcel_numbers(
                self.client,
                numbers,
                fmt=label_size,
                start_pos=getattr(settings, "DPD_LABEL_START_POSITION", 1),
                print_format=print_format,
            )
            pdf_b64 = (lab.get("pdfFile") or "").split(",", 1)[-1]
            if not pdf_b64:
                log.error("DPD /label/parcel-numbers empty pdfFile: %s", json.dumps(lab)[:800])
                raise RuntimeError("DPD: /label/parcel-numbers returned empty pdfFile")
            log.debug("DPD label fetched by parcel-numbers, saving via callback")
            save_pdf_cb(pdf_b64, numbers)
            return numbers

        # --- FALLBACK 2: /label/shipment-ids ---
        if shipment_id:
            lab = ep.labels_by_shipment_ids(
                self.client,
                [shipment_id],
                fmt=label_size,
                start_pos=getattr(settings, "DPD_LABEL_START_POSITION", 1),
                print_format=print_format,
            )
            pdf_b64 = (lab.get("pdfFile") or "").split(",", 1)[-1]
            if not pdf_b64:
                log.error("DPD /label/shipment-ids empty pdfFile: %s", json.dumps(lab)[:800])
                raise RuntimeError("DPD: /label/shipment-ids returned empty pdfFile")
            log.debug("DPD label fetched by shipmentId, saving via callback")
            save_pdf_cb(pdf_b64, [str(shipment_id)])
            return numbers

        # --- Если ничего не вернулось ---
        log.error(
            "DPD printed but no label/parcelNumbers/shipmentId. first=%s",
            json.dumps(first)[:1200],
        )
        raise RuntimeError(
            "DPD: printed mode but neither labelFile nor parcelNumbers/shipmentId"
        )
