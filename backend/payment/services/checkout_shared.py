"""
Общие примитивы для Stripe и PayPal checkout-сервисов.

Экспортируется:
    _D(x)                   — приведение к Decimal
    _CHANNEL_MAP            — delivery_type -> carrier channel
    CheckoutSessionBuildError — базовый класс ошибки построения сессии
"""
from __future__ import annotations

from decimal import Decimal

_CHANNEL_MAP: dict[int, str] = {
    1: "PUDO",
    2: "HD",
}


def _D(x) -> Decimal:
    return x if isinstance(x, Decimal) else Decimal(str(x))


class CheckoutSessionBuildError(Exception):
    """
    Бизнес-ошибка при построении checkout-сессии (Stripe или PayPal).
    Несёт HTTP-код и тело ответа; HTTP-слой (Response) формируется во view.
    """

    def __init__(self, detail: dict, http_status: int = 400):
        self.detail = detail
        self.http_status = http_status
        super().__init__(str(detail))
