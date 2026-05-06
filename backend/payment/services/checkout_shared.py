"""
Общие примитивы для Stripe и PayPal checkout-сервисов.

Экспортируется:
    _D(x)                   — приведение к Decimal
    _CHANNEL_MAP            — delivery_type -> carrier channel
    CheckoutSessionBuildError — базовый класс ошибки построения сессии
    check_cz_origin_for_checkout — CZ-origin по SKU (исключение нужного подкласса)
"""
from __future__ import annotations

from decimal import Decimal
from typing import Type

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


def check_cz_origin_for_checkout(
    variant_map: dict,
    groups: list,
    *,
    error_cls: Type[CheckoutSessionBuildError],
) -> None:
    """
    CZ-origin: все SKU → seller.default_warehouse.country == 'CZ'.
    Бросает error_cls (StripeSessionBuildError / PayPalSessionBuildError), не Response.
    """
    skus_in_payload = [
        str(p["sku"])
        for g in groups
        for p in g.get("products", [])
    ]

    missing = []
    not_cz = []

    for sku in skus_in_payload:
        v = variant_map.get(sku)
        if not v:
            missing.append(sku)
            continue
        seller = getattr(v.product, "seller", None)
        dw = getattr(seller, "default_warehouse", None) if seller else None
        if not (dw and getattr(dw, "country", None) == "CZ"):
            not_cz.append(sku)

    if missing:
        raise error_cls(
            {"error": f"Unknown SKU(s): {', '.join(missing)}"},
        )
    if not_cz:
        raise error_cls(
            {
                "origin": [
                    (
                        "Только отправка из Чехии. Продавец(ы) SKU "
                        f"{', '.join(not_cz)} не имеют чешского склада "
                        "(default_warehouse.country != 'CZ')."
                    )
                ]
            },
        )
