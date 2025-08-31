import base64
import binascii
import hashlib
import logging
from typing import Any, Dict, List, Optional

import requests
from django.conf import settings

from .errors import raise_for_response

logger = logging.getLogger(__name__)


def _sha512_digest_from_env(value: str) -> bytes:
    """
    Поддерживает:
    - 'b64:...' — base64 от sha512-digest (рекомендуемо)
    - 'hex:...' — hex от sha512-digest
    - иначе — считаем, что это сырой пароль и хэшируем на лету (dev-фолбэк)
    """
    if not value:
        raise ValueError("MYGLS_PASSWORD_SHA512 is empty")
    v = value.strip()
    if v.lower().startswith("b64:"):
        try:
            return base64.b64decode(v[4:])
        except binascii.Error as e:
            raise ValueError("Invalid base64 in MYGLS_PASSWORD_SHA512") from e
    if v.lower().startswith("hex:"):
        try:
            return bytes.fromhex(v[4:])
        except ValueError as e:
            raise ValueError("Invalid hex in MYGLS_PASSWORD_SHA512") from e
    logger.warning("MYGLS_PASSWORD_SHA512 looks like plain password. Hashing it on the fly.")
    return hashlib.sha512(v.encode("utf-8")).digest()


def _to_json_byte_array(digest: bytes) -> List[int]:
    """Пароль как byte[] в JSON → массив чисел 0..255 (требование API)."""
    return list(digest)


class MyGlsClient:
    """
    Лёгкий HTTP-клиент для MyGLS ParcelService.svc/json.
    Поддерживает два формата пароля:
      - bytes-array (стандарт по PDF) — settings.MYGLS_PASSWORD_FORMAT=bytes
      - base64-строка — settings.MYGLS_PASSWORD_FORMAT=base64
    Также опционально может слать ClientNumberList (если понадобится) —
      settings.MYGLS_INCLUDE_CLIENT_NUMBER_LIST=true
    """
    def __init__(
        self,
        base_url: str,
        username: str,
        password_sha512_env: str,
        webshop_engine: str,
        client_number: Optional[int] = None,
        timeout: int = 15,
        retries: int = 3,
        session: Optional[requests.Session] = None,
    ):
        if not (base_url and username and password_sha512_env and webshop_engine):
            raise ValueError("MyGLS client missing base settings")

        self.base_url = base_url.rstrip("/")
        self.username = username
        # На всякий случай ограничим WebshopEngine ASCII (некоторые стенды чувствительны)
        self.webshop_engine = str(webshop_engine).encode("ascii", "ignore").decode("ascii")
        self.client_number = int(client_number) if client_number else None
        self.timeout = timeout
        self.retries = retries
        self.session = session or requests.Session()

        digest = _sha512_digest_from_env(password_sha512_env)
        self.password_format = (getattr(settings, "MYGLS_PASSWORD_FORMAT", "bytes") or "bytes").lower()
        if self.password_format not in ("bytes", "base64"):
            self.password_format = "bytes"

        # Готовим два представления — выберем в _auth_payload()
        self._password_bytes_array = _to_json_byte_array(digest)
        self._password_b64_string = base64.b64encode(digest).decode("ascii")

        # Флаг отправки ClientNumberList (по умолчанию выключен — changelog: "do not use")
        self.include_client_number_list = bool(getattr(settings, "MYGLS_INCLUDE_CLIENT_NUMBER_LIST", False))

    @classmethod
    def from_settings(cls):
        required = {
            "MYGLS_API_BASE": getattr(settings, "MYGLS_API_BASE", None),
            "MYGLS_USERNAME": getattr(settings, "MYGLS_USERNAME", None),
            "MYGLS_PASSWORD_SHA512": getattr(settings, "MYGLS_PASSWORD_SHA512", None),
            "MYGLS_WEBSHOP_ENGINE": getattr(settings, "MYGLS_WEBSHOP_ENGINE", None),
        }
        missing = [k for k, v in required.items() if not v]
        if missing:
            raise ValueError(f"Missing MyGLS settings: {', '.join(missing)}")
        return cls(
            base_url=settings.MYGLS_API_BASE,
            username=settings.MYGLS_USERNAME,
            password_sha512_env=settings.MYGLS_PASSWORD_SHA512,
            webshop_engine=settings.MYGLS_WEBSHOP_ENGINE,
            client_number=getattr(settings, "MYGLS_CLIENT_NUMBER", None),
            timeout=int(getattr(settings, "MYGLS_HTTP_TIMEOUT", 15) or 15),
            retries=int(getattr(settings, "MYGLS_HTTP_RETRIES", 3) or 3),
        )

    def _auth_payload(self) -> Dict[str, Any]:
        """
        APIRequestBase: Username, Password(byte[]) и WebshopEngine обязательны. :contentReference[oaicite:3]{index=3}
        По желанию — ClientNumberList (если понадобится под конкретный стенд).
        """
        if self.password_format == "base64":
            password = self._password_b64_string  # как строка
        else:
            password = self._password_bytes_array  # как byte[]

        payload = {
            "Username": self.username,
            "Password": password,
            "WebshopEngine": self.webshop_engine,
        }
        if self.include_client_number_list and self.client_number:
            payload["ClientNumberList"] = [int(self.client_number)]
        return payload

    def _post(self, method: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/{method}"
        body = {**self._auth_payload(), **payload}
        last_exc = None
        for attempt in range(self.retries):
            try:
                resp = self.session.post(url, json=body, timeout=self.timeout)
                if resp.status_code >= 400:
                    raise_for_response(resp)
                return resp.json()
            except Exception as e:
                last_exc = e
                if attempt == self.retries - 1:
                    raise
                logger.warning("MyGLS POST %s failed (%s), retrying %d/%d", method, e, attempt + 1, self.retries)
        if last_exc:
            raise last_exc
        raise RuntimeError("Unexpected MyGLS client state")
