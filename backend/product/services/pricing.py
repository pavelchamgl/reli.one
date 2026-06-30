from __future__ import annotations

from decimal import Decimal, ROUND_CEILING

from django.conf import settings

from delivery.services.currency_converter import get_czk_to_eur_rate_cached


def get_display_currency(request) -> str:
    """query ?currency= → header X-Display-Currency → DEFAULT_DISPLAY_CURRENCY."""
    default = getattr(settings, "DEFAULT_DISPLAY_CURRENCY", "CZK")
    supported = set(getattr(settings, "SUPPORTED_DISPLAY_CURRENCIES", ["CZK"]))
    if request is None:
        return default
    raw = (
        (
            request.query_params.get("currency")
            if hasattr(request, "query_params")
            else request.GET.get("currency")
        )
        or request.headers.get("X-Display-Currency")
        or ""
    )
    code = raw.strip().upper()
    return code if code in supported else default


def convert_canonical_amount(amount_czk, currency: str) -> Decimal:
    """Канон CZK → валюта показа."""
    amount = amount_czk if isinstance(amount_czk, Decimal) else Decimal(str(amount_czk))
    code = (currency or "CZK").upper()

    if code == "CZK":
        return amount.quantize(Decimal("1"), rounding=ROUND_CEILING)

    if code == "EUR":
        rate = get_czk_to_eur_rate_cached()
        markup = Decimal(str(getattr(settings, "FX_RATE_MARKUP", "0.30")))
        eff = rate - markup
        if eff <= 0:
            eff = rate
        eur = (amount / eff).quantize(Decimal("0.01"), rounding=ROUND_CEILING)
        return eur

    return amount.quantize(Decimal("1"), rounding=ROUND_CEILING)
