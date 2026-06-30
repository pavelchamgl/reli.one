from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP

import requests

# Официальный ежедневный курс от Чешского национального банка
CNB_TXT_URL = (
    "https://www.cnb.cz/en/financial-markets/foreign-exchange-market/"
    "central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt"
)
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


def get_czk_per_eur_for_date(target_date: date) -> Decimal:
    """CNB fixing на конкретную дату через JSON API."""
    date_str = target_date.isoformat()
    url = f"{CNB_JSON_API_BASE}?date={date_str}&lang=EN"
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    try:
        return _parse_eur_rate_from_cnb_payload(response.json())
    except CnbRateNotAvailableError:
        raise
    except Exception as exc:
        raise CnbRateNotAvailableError(
            f"CNB rate for {date_str} is not available: {exc}"
        ) from exc


def get_czk_per_eur() -> Decimal:
    """
    Возвращает курс CZK_per_EUR (сколько чешских крон за 1 евро) как Decimal.
    Основано на daily.txt CNB:
      Country|Currency|Amount|Code|Rate
    где Rate — CZK за Amount единиц валюты.
    Для EUR обычно Amount = 1, Rate ≈ 24–30 CZK.
    """
    response = requests.get(CNB_TXT_URL, timeout=5)
    response.raise_for_status()

    lines = response.text.strip().splitlines()
    for line in lines:
        parts = line.split('|')
        # Ищем строку для EUR
        if len(parts) >= 5 and parts[3].strip().upper() == "EUR":
            amount = Decimal(parts[2].strip())
            rate_czk_per_amount_eur = Decimal(parts[4].replace(",", ".").strip())

            if amount <= 0:
                raise ValueError("Invalid 'Amount' in CNB daily.txt")

            czk_per_eur = rate_czk_per_amount_eur / amount

            # Простая валидация: курс должен быть в диапазоне 10–100 CZK
            if not (Decimal("10") <= czk_per_eur <= Decimal("100")):
                raise ValueError(f"Suspicious CZK/EUR rate parsed: {czk_per_eur}")

            return czk_per_eur.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)

    raise RuntimeError("EUR line not found in CNB daily.txt")
