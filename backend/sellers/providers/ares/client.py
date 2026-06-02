from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .errors import AresNotFound, AresUnavailable

log = logging.getLogger(__name__)


class AresClient:
    """Minimal ARES REST client for sanitized seller onboarding lookup."""

    def __init__(
        self,
        base: str | None = None,
        timeout_connect: int | None = None,
        timeout_read: int | None = None,
        retries: int | None = None,
    ) -> None:
        self.base = (base or settings.ARES_API_BASE).rstrip("/")
        self.timeout = (
            timeout_connect if timeout_connect is not None else settings.ARES_HTTP_TIMEOUT_CONNECT,
            timeout_read if timeout_read is not None else settings.ARES_HTTP_TIMEOUT_READ,
        )

        self.session = requests.Session()
        retry = Retry(
            total=retries if retries is not None else settings.ARES_HTTP_RETRIES,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(["GET"]),
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def get_economic_subject(self, ico: str) -> dict[str, Any]:
        url = f"{self.base}/ekonomicke-subjekty/{ico}"
        try:
            response = self.session.get(
                url,
                headers={"Accept": "application/json"},
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            log.warning("ARES lookup unavailable for ico=%s: %s", ico, exc.__class__.__name__)
            raise AresUnavailable("ARES request failed.") from exc

        if response.status_code == 404:
            raise AresNotFound("IČO was not found in ARES.")

        if response.status_code >= 500 or response.status_code == 429:
            log.warning("ARES lookup unavailable for ico=%s: HTTP %s", ico, response.status_code)
            raise AresUnavailable("ARES returned temporary error.")

        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            log.warning("ARES lookup failed for ico=%s: HTTP %s", ico, response.status_code)
            raise AresUnavailable("ARES returned an unexpected error.") from exc

        try:
            data = response.json()
        except ValueError as exc:
            log.warning("ARES lookup returned non-JSON response for ico=%s", ico)
            raise AresUnavailable("ARES returned invalid JSON.") from exc

        if not isinstance(data, dict):
            raise AresUnavailable("ARES returned unexpected payload.")
        return data
