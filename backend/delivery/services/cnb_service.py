from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

import requests

CNB_JSON_API_BASE = "https://api.cnb.cz/cnbapi/exrates/daily"


class CnbRateNotAvailableError(RuntimeError):
    """CNB fixing for the requested date is not available yet."""


def _parse_eur_rate_from_cnb_payload(payload: dict) -> Decimal:
    rates = payload.get("rates") or []
    for item in rates:
        if str(item.get("currencyCode", "")).upper() != "EUR":
            continue
        amount = Decimal(str(item.get("amount", 1)))
        rate_czk_per_amount_eur = Decimal(str(item.get("rate")))
        if amount <= 0:
            raise ValueError("Invalid 'amount' in CNB JSON response")
        czk_per_eur = rate_czk_per_amount_eur / amount
        if not (Decimal("10") <= czk_per_eur <= Decimal("100")):
            raise ValueError(f"Suspicious CZK/EUR rate parsed: {czk_per_eur}")
        return czk_per_eur.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    raise CnbRateNotAvailableError("EUR rate not found in CNB response")


def _extract_eur_valid_for(payload: dict) -> Optional[str]:
    for item in payload.get("rates") or []:
        if str(item.get("currencyCode", "")).upper() == "EUR":
            return item.get("validFor")
    return None


def _fetch_cnb_daily_json(*, target_date: date | None = None) -> tuple[Decimal, Optional[str]]:
    params = {"lang": "EN"}
    if target_date is not None:
        params["date"] = target_date.isoformat()
    response = requests.get(CNB_JSON_API_BASE, params=params, timeout=5)
    response.raise_for_status()
    payload = response.json()
    rate = _parse_eur_rate_from_cnb_payload(payload)
    return rate, _extract_eur_valid_for(payload)


def get_czk_per_eur_for_date(target_date: date) -> Decimal:
    """CNB fixing на конкретную дату через JSON API."""
    try:
        rate, _ = _fetch_cnb_daily_json(target_date=target_date)
        return rate
    except CnbRateNotAvailableError:
        raise
    except Exception as exc:
        raise CnbRateNotAvailableError(
            f"CNB rate for {target_date.isoformat()} is not available: {exc}"
        ) from exc


def get_czk_per_eur() -> Decimal:
    """Возвращает CZK_per_EUR (сколько CZK за 1 EUR) через CNB JSON API."""
    rate, _ = _fetch_cnb_daily_json()
    return rate
