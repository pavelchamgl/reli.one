from __future__ import annotations

import logging
import requests

from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

log = logging.getLogger(__name__)


class DpdClient:
    """
    Обёртка над DPD Shipping API (v1.x):
    - Базовый URL и токен берём из settings
    - Общие заголовки, таймауты, ретраи
    """

    def __init__(self, base: str | None = None, token: str | None = None,
                 timeout_connect: int | None = None, timeout_read: int | None = None,
                 retries: int | None = None):
        self.base = (base or settings.DPD_API_BASE).rstrip("/")
        self.token = token or settings.DPD_TOKEN
        self.timeout = (timeout_connect or settings.DPD_TIMEOUT_CONNECT, timeout_read or settings.DPD_TIMEOUT_READ)

        self.session = requests.Session()
        # Ретраи на "сетевые"/временные коды
        retry = Retry(
            total=retries or settings.DPD_RETRIES,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(["GET", "POST", "PATCH", "PUT"])
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
        url = f"{self.base}{path}"
        r = self.session.post(url, json=json, headers=self._headers(), timeout=self.timeout)
        try:
            r.raise_for_status()
        except requests.HTTPError:
            # лог без токена
            body = None
            try:
                body = r.text[:1000]
            except Exception:
                pass
            log.warning("DPD POST %s failed: %s %s", url, r.status_code, body)
            raise
        return r.json()
