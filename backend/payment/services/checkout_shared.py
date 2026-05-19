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
from typing import TYPE_CHECKING, Type

from django.conf import settings

if TYPE_CHECKING:
    from product.models import ProductVariant

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


def create_checkout_stock_reservation_if_enabled(
    *,
    session_key: str,
    payment_system: str,
    groups: list,
    variant_map: dict[str, "ProductVariant"],
    error_cls: Type[CheckoutSessionBuildError],
) -> None:
    """
    Reserve stock after checkout validation, before PSP session creation.

    No-op when ``STOCK_RESERVATION_ENABLED`` is False (preserves legacy behaviour).
    Maps ``InsufficientStockError.detail`` to HTTP 409 via ``error_cls``.
    """
    if not getattr(settings, "STOCK_RESERVATION_ENABLED", False):
        return

    from warehouses.exceptions import InsufficientStockError
    from warehouses.services.reservation import StockReservationService

    try:
        StockReservationService.create_reservation(
            session_key=session_key,
            payment_system=payment_system,
            groups=groups,
            variant_map=variant_map,
        )
    except InsufficientStockError as exc:
        raise error_cls({"stock": exc.detail}, http_status=409) from exc


def confirm_checkout_stock_reservation_if_enabled(session_key: str) -> None:
    """
    Confirm a PENDING reservation after successful payment webhook.

    No-op when ``STOCK_RESERVATION_ENABLED`` is False or reservation is missing
    (legacy checkouts). Idempotent when reservation is already CONFIRMED/RELEASED.
    """
    if not getattr(settings, "STOCK_RESERVATION_ENABLED", False):
        return

    from warehouses.services.reservation import StockReservationService

    StockReservationService.confirm_reservation(session_key)


def release_checkout_stock_reservation_if_enabled(session_key: str | None) -> None:
    """
    Release a PENDING reservation on payment failure / cancel / expiry webhook.

    No-op when flag is off or ``session_key`` is empty.
    """
    if not getattr(settings, "STOCK_RESERVATION_ENABLED", False):
        return
    if not session_key:
        return

    from warehouses.services.reservation import StockReservationService

    StockReservationService.release_reservation(session_key)
