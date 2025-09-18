from __future__ import annotations

import time
import requests
import base64, binascii, hashlib, logging

from typing import Any, Dict, Optional, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)


def _as_sha512_bytes(value: str) -> bytes:
    """
    Поддерживаем форматы в .env:
      - 'b64:<base64(sha512(password))>'
      - 'hex:<hex(sha512(password))>'
      - 'raw:<plain_password>'  ИЛИ просто '<plain_password>'
      - также примем '<base64(sha512)>' или '<hex(sha512)>' без префикса
    Возвращаем digest длиной 64 байта.
    """
    v = (value or "").strip()
    if not v:
        return b""

    low = v.lower()
    if low.startswith("b64:") or low.startswith("base64:"):
        b = base64.b64decode(v.split(":", 1)[1], validate=True)
        if len(b) != 64:
            raise ValueError("MYGLS_PASSWORD_SHA512(b64): decoded length != 64")
        return b
    if low.startswith("hex:"):
        b = binascii.unhexlify(v.split(":", 1)[1])
        if len(b) != 64:
            raise ValueError("MYGLS_PASSWORD_SHA512(hex): decoded length != 64")
        return b
    if low.startswith("raw:"):
        return hashlib.sha512(v.split(":", 1)[1].encode("utf-8")).digest()

    # без префикса — попробуем как b64/hex, затем как плейн
    try:
        b = base64.b64decode(v, validate=True)
        if len(b) == 64:
            return b
    except Exception:
        pass
    try:
        b = binascii.unhexlify(v)
        if len(b) == 64:
            return b
    except Exception:
        pass
    return hashlib.sha512(v.encode("utf-8")).digest()


def _normalize_base_json(base_url: str) -> str:
    base = (base_url or "").strip().rstrip("/")
    if not base:
        raise ValueError("MYGLS_API_BASE is not set. Example: https://api.test.mygls.cz")
    low = base.lower()
    if low.endswith("/parcelservice.svc/json"):
        return base
    if low.endswith("/parcelservice.svc"):
        return base + "/json"
    return base + "/ParcelService.svc/json"


class MyGlsClient:
    def __init__(
        self,
        base_url: str,
        username: str,
        password_env_value: str,
        webshop_engine: str,
        client_number: str,
        type_of_printer: str = "A4_2x2",
        timeout: int = 15,
        retries: int = 2,
        session: Optional[requests.Session] = None,
    ):
        self.base_json = _normalize_base_json(base_url)
        self.username = (username or "").strip()
        self.password_bytes = _as_sha512_bytes(password_env_value)
        self.webshop_engine = (webshop_engine or "").strip()
        self.client_number = str(client_number or "").strip()
        self.type_of_printer = type_of_printer
        self.timeout = int(timeout or 15)
        self.retries = int(retries or 2)
        self.session = session or requests.Session()
        # стабильные заголовки на все вызовы
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"CZShop-MyGLS/1.0 ({self.webshop_engine})",
        })

        # Жёстко валидируем, чтоб не было "Webshop engine is required!"
        if not self.webshop_engine:
            raise ValueError("MYGLS_WEBSHOP_ENGINE is empty. Set it in env/settings.")

    @classmethod
    def from_settings(cls) -> "MyGlsClient":
        return cls(
            getattr(settings, "MYGLS_API_BASE", ""),
            getattr(settings, "MYGLS_USERNAME", ""),
            getattr(settings, "MYGLS_PASSWORD_SHA512", ""),
            getattr(settings, "MYGLS_WEBSHOP_ENGINE", ""),
            getattr(settings, "MYGLS_CLIENT_NUMBER", ""),
            getattr(settings, "MYGLS_TYPE_OF_PRINTER", "A4_2x2"),
            int(getattr(settings, "MYGLS_HTTP_TIMEOUT", 15) or 15),
            int(getattr(settings, "MYGLS_HTTP_RETRIES", 2) or 2),
        )

    def _auth_payload(self) -> Dict[str, Any]:
        """
        Минимальный корректный набор полей для JSON-профиля:
        Username, Password(byte[]), WebshopEngine.
        НИЧЕГО про ClientNumber/ClientNumberList не отправляем.
        """
        return {
            "Username": self.username,
            "Password": list(self.password_bytes),   # sha512 digest как массив чисел 0..255
            "WebshopEngine": self.webshop_engine,
        }

    # удобный алиас для сервис-слоя
    def auth_base(self) -> Dict[str, Any]:
        return self._auth_payload()

    def debug_preview(self, payload: dict) -> dict:
        preview = dict(payload)
        if "Password" in preview:
            preview["Password"] = "<bytes:{}>".format(len(self.password_bytes or b""))
        if "ParcelList" in preview:
            preview["ParcelList"] = f"<list:{len(preview['ParcelList'])}>"
        return preview

    def _post(self, method: str, body: Dict[str, Any], corr_id: Optional[str] = None) -> Tuple[int, Dict[str, Any]]:
        """
        Универсальный POST: возвращает (status_code, json).
        Тело запроса всегда включает auth-блок (Username/Password/WebshopEngine).
        """
        url = f"{self.base_json}/{method}"
        payload = {**self._auth_payload(), **(body or {})}
        last_exc: Optional[Exception] = None

        for attempt in range(1, self.retries + 1):
            try:
                t0 = time.perf_counter()
                r = self.session.post(url, json=payload, timeout=self.timeout)
                dt = (time.perf_counter() - t0) * 1000

                try:
                    data = r.json()
                except Exception:
                    data = {"raw": r.text}

                status_code = r.status_code

                # Телеметрия в DEBUG — всегда
                logger.debug(
                    "id=%s MyGLS POST %s status=%s ms=%.1f attempt=%s timeout=%s body_keys=%s",
                    corr_id or "-", method, status_code, dt, attempt, self.timeout, list(payload.keys())
                )

                # 5xx → можно повторить (кроме последней попытки)
                if 500 <= status_code < 600:
                    if attempt < self.retries:
                        logger.warning(
                            "id=%s MyGLS POST %s HTTP_%s ms=%.1f retry %d/%d",
                            corr_id or "-", method, status_code, dt, attempt, self.retries
                        )
                        continue
                    else:
                        logger.warning(
                            "id=%s MyGLS POST %s HTTP_%s ms=%.1f (final attempt)",
                            corr_id or "-", method, status_code, dt
                        )

                # 4xx → просто подсветить
                elif status_code >= 400:
                    logger.warning(
                        "id=%s MyGLS POST %s HTTP_%s ms=%.1f",
                        corr_id or "-", method, status_code, dt
                    )

                return status_code, data

            except requests.Timeout as e:
                last_exc = e
                logger.warning(
                    "id=%s MyGLS POST %s timeout after %ss (url=%s) attempt %d/%d",
                    corr_id or "-", method, self.timeout, url, attempt, self.retries
                )
                # после таймаута пробуем ещё раз, если есть попытки
                continue

            except Exception as e:
                last_exc = e
                logger.warning(
                    "id=%s MyGLS POST %s failed (%s) attempt %d/%d",
                    corr_id or "-", method, e, attempt, self.retries
                )
                # для сетевых/прочих ошибок тоже даём шанс ретрая
                continue

        # Если все попытки исчерпаны — бросаем последнюю ошибку
        if last_exc:
            raise last_exc
        raise RuntimeError("Unexpected MyGlsClient state")
