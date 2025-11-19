import requests

from decimal import Decimal, ROUND_HALF_UP

# Официальный ежедневный курс от Чешского национального банка
CNB_TXT_URL = (
    "https://www.cnb.cz/en/financial-markets/foreign-exchange-market/"
    "central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt"
)


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
