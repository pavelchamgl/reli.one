from __future__ import annotations

import copy
import json
import logging
import requests

from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .utils import brief_receiver

log = logging.getLogger(__name__)

def json_dumps_safe(data) -> str:
    """Безопасный json.dumps для логов."""
    try:
        return json.dumps(data, ensure_ascii=False)
    except Exception:
        return "<unserializable>"

class DpdClient:
    """
    Обёртка над DPD Shipping API (v1.x):
    - Берёт токен, base URL, таймауты и ретраи из settings
    - Детальное логирование тела запроса и ответа (без токена)
    """

    def __init__(
        self,
        base: str | None = None,
        token: str | None = None,
        timeout_connect: int | None = None,
        timeout_read: int | None = None,
        retries: int | None = None,
    ):
        self.base = (base or settings.DPD_API_BASE).rstrip("/")
        self.token = token or settings.DPD_TOKEN
        self.timeout = (
            timeout_connect or settings.DPD_TIMEOUT_CONNECT,
            timeout_read or settings.DPD_TIMEOUT_READ,
        )

        self.session = requests.Session()

        # Ретраи на временные ошибки
        retry = Retry(
            total=retries or settings.DPD_RETRIES,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(["GET", "POST", "PATCH", "PUT"]),
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def post(self, path: str, json: dict | list) -> dict:
        """
        Универсальный POST-запрос к DPD API с логированием тела и ответа.
        """
        url = f"{self.base}{path}"

        # --- НЕ мутируем исходный json ---
        safe_payload = copy.deepcopy(json)

        # --- Короткий предзапросный лог (для людей) ---
        try:
            if isinstance(safe_payload, dict) and "shipments" in safe_payload and safe_payload["shipments"]:
                sh = safe_payload["shipments"][0]
                rcvr = sh.get("receiver", {})
                parcels = sh.get("parcels") or []
                log.debug(
                    "DPD → POST %s | receiver: %s | parcels=%d",
                    url,
                    brief_receiver(rcvr),
                    len(parcels),
                )
            else:
                log.debug("DPD → POST %s | (no shipments)", url)
        except Exception:
            log.debug("DPD → POST %s | (receiver log failed)", url)

        # --- Полный предзапросный лог ТОЛЬКО реального JSON ---
        try:
            log.debug("DPD → POST %s body=%s", url, json_dumps_safe(safe_payload))
        except Exception:
            log.debug("DPD → POST %s body=<unserializable>", url)

        # --- Отправка запроса ---
        r = self.session.post(
            url,
            json=safe_payload,
            headers=self._headers(),
            timeout=self.timeout,
        )

        raw_text = None
        try:
            raw_text = r.text[:1200]
        except Exception:
            pass

        # --- Проверка статуса ---
        try:
            r.raise_for_status()
        except requests.HTTPError:
            log.warning("DPD ← %s HTTP %s body=%s", url, r.status_code, raw_text)
            raise

        # --- Парсим JSON ---
        try:
            resp = r.json()
        except Exception:
            log.warning("DPD ← %s non-JSON body=%s", url, raw_text)
            raise

        # --- Сжатый пост-лог результата ---
        try:
            sr = (resp.get("shipmentResults") or [None])[0]
            if sr:
                sid = sr.get("shipmentId")
                if not sid:
                    sid = (sr.get("shipment") or {}).get("shipmentId")
                snippet = {
                    "numOrder": sr.get("numOrder"),
                    "shipmentId": sid,
                    "hasLabelFile": bool(sr.get("labelFile")),
                    "errors": sr.get("errors"),
                    "parcelResults": None,
                }
                prs = sr.get("parcelResults") or []
                if prs:
                    snippet["parcelResults"] = [{"parcelNumber": p.get("parcelNumber")} for p in prs]
            else:
                snippet = None
            log.debug("DPD ← %s HTTP %s snippet=%s", url, r.status_code, json_dumps_safe(snippet))
        except Exception:
            log.debug("DPD ← %s HTTP %s resp=%s", url, r.status_code, json_dumps_safe(resp))

        return resp
