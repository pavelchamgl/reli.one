from __future__ import annotations
import os
import re
import time
import logging
import requests

from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

from delivery.validators.zip_validator import ZipCodeValidator


logger = logging.getLogger("delivery.georouting")


_COUNTRY_PATTERNS = {
    "NL": re.compile(r"^\d{4}[A-Z]{2}$"),
    "PL": re.compile(r"^\d{2}-?\d{3}$"),
    "LU": re.compile(r"^\d{4}$"),
    "IT": re.compile(r"^\d{5}$"),
    "BA": re.compile(r"^\d{5}$"),
    "IE": re.compile(r"^[A-Z0-9]{7}$"),
    "GR": re.compile(r"^\d{5}$"),
}


@dataclass
class ResolveResult:
    valid: bool
    normalized_postcode: Optional[str]
    country_code: str
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: str = "none"
    error: Optional[str] = None


class _TTLCache:
    def __init__(self, ttl_seconds: int = 86400, maxsize: int = 4096):
        self.ttl = ttl_seconds
        self.maxsize = maxsize
        self._store: Dict[str, Tuple[float, Any]] = {}

    def _now(self):
        return time.time()

    def get(self, key: str):
        v = self._store.get(key)
        if not v:
            return None
        exp, val = v
        if exp < self._now():
            self._store.pop(key, None)
            return None
        return val

    def set(self, key: str, value: Any):
        self._store[key] = (self._now() + self.ttl, value)
        if len(self._store) > self.maxsize:
            for k in list(self._store.keys())[: self.maxsize // 8]:
                self._store.pop(k, None)


class GeoRoutingClient:
    """
    Работает строго через:
      DPD_API_BASE=https://shipping.dpdgroup.com/api/v1.1
      DPD_TOKEN=<token>
    """

    def __init__(self):
        self.base = (os.getenv("DPD_API_BASE") or "").rstrip("/")
        if not self.base:
            raise RuntimeError("DPD_API_BASE is not configured")

        self.token = os.getenv("DPD_TOKEN")
        if not self.token:
            raise RuntimeError("DPD_TOKEN is required")

        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "Authorization": f"Bearer {self.token}",
        })

        self.timeout = float(os.getenv("DPD_TIMEOUT_READ", "5"))
        self.retries = int(os.getenv("DPD_RETRIES", "1"))
        self.cache = _TTLCache()

        logger.debug(
            "GeoRoutingClient initialized",
            extra={"base": self.base, "timeout": self.timeout, "retries": self.retries}
        )

    def _get(self, path: str, params: Dict[str, Any]):
        url = f"{self.base}{path}"
        cache_key = f"{url}|{params}"

        cached = self.cache.get(cache_key)
        if cached is not None:
            logger.debug("GeoRouting cache hit", extra={"url": url, "params": params})
            return cached

        logger.debug("GeoRouting request start", extra={"url": url, "params": params})

        last_error = None
        for attempt in range(self.retries + 1):
            try:
                r = self.session.get(url, params=params, timeout=self.timeout)
                r.raise_for_status()
                data = r.json()
                self.cache.set(cache_key, data)

                logger.debug("GeoRouting request success", extra={"url": url, "params": params})
                return data
            except Exception as e:
                last_error = e
                logger.warning(
                    "GeoRouting request attempt failed",
                    extra={"url": url, "params": params, "attempt": attempt, "error": str(e)}
                )
                time.sleep(0.3 * (attempt + 1))

        logger.warning("GeoRouting request failed permanently", extra={"url": url, "params": params, "error": str(last_error)})
        return None

    def postcode_validation(self, cc: str, pc: str):
        logger.debug("DPD postcode_validation call", extra={"country": cc, "postcode": pc})
        return self._get("/routing/postcode-validation", {"countryCode": cc, "postcode": pc})

    def get_city(self, cc: str, pc: str):
        logger.debug("DPD get_city call", extra={"country": cc, "postcode": pc})
        return self._get("/routing/get-city", {"countryCode": cc, "postcode": pc})


def _normalize_compact(v: str) -> str:
    return (v or "").upper().replace(" ", "").replace("-", "")


def _normalize_for_dpd(cc: str, zip_raw: str) -> Optional[str]:
    v = _normalize_compact(zip_raw)

    if cc == "NL":
        if re.fullmatch(r"\d{4}", v):
            return None
    if cc == "LU":
        v = re.sub(r"[^0-9]", "", v)
    if cc == "IE":
        v = v.replace(" ", "")

    pat = _COUNTRY_PATTERNS.get(cc)
    if pat and not pat.match(v):
        return None

    return v


def _fallback_local_city(cc: str, postal_code: str) -> Optional[str]:
    try:
        df = ZipCodeValidator.load_country_zip_data(cc)
    except Exception:
        logger.debug("No local zip data for country", extra={"country": cc})
        return None

    compact = _normalize_compact(postal_code)
    plain = re.sub(r"[^A-Z0-9]", "", compact)

    candidates = {compact, plain, re.sub(r"[^0-9]", "", plain)}
    for raw in df["postal_code"].astype(str):
        rc = _normalize_compact(raw)
        if rc in candidates:
            name = df.loc[df["postal_code"] == raw, "place_name"].iloc[0]
            logger.debug("Local city resolved", extra={"country": cc, "postal_code": postal_code, "city": name})
            return str(name).upper()
    return None


def resolve_postcode(
    postcode: str,
    country_code: str,
    *,
    prefer_remote: bool = False,
    local_validator=None,
) -> ResolveResult:

    cc = (country_code or "").upper()
    compact = _normalize_compact(postcode)

    logger.info("resolve_postcode called", extra={"country": cc, "postcode": postcode, "prefer_remote": prefer_remote})

    local_ok = False
    try:
        if local_validator:
            local_ok = bool(local_validator(postcode, cc))
        else:
            local_ok = ZipCodeValidator.validate_zip_exists(postcode, cc)
    except Exception as e:
        logger.warning("Local validator error", extra={"error": str(e)})

    if local_ok and not prefer_remote:
        city = _fallback_local_city(cc, postcode)
        logger.info("resolve_postcode result (local)", extra={"country": cc, "postcode": postcode, "city": city})
        return ResolveResult(
            valid=True,
            normalized_postcode=compact,
            country_code=cc,
            city=city,
            source="local",
        )

    dpd_zip = _normalize_for_dpd(cc, postcode)
    valid_remote = False
    city = None

    if dpd_zip:
        client = GeoRoutingClient()

        pv = client.postcode_validation(cc, dpd_zip)
        if pv and (pv.get("statusCode") == "OK" or pv.get("valid") is True):
            valid_remote = True

        city_data = client.get_city(cc, dpd_zip) or {}
        city = city_data.get("cityNameLocal") or city_data.get("cityNameEnglish")

    if not city:
        city = _fallback_local_city(cc, postcode)

    source = "dpd" if valid_remote else ("local" if local_ok else "none")

    logger.info(
        "resolve_postcode result",
        extra={
            "country": cc,
            "postcode": postcode,
            "valid": bool(valid_remote or local_ok),
            "source": source,
            "city": city,
        }
    )

    return ResolveResult(
        valid=bool(valid_remote or local_ok),
        normalized_postcode=compact,
        country_code=cc,
        city=city,
        source=source,
    )
