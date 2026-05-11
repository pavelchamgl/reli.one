"""
Доступ к вспомогательным HTTP-эндпоинтам интеграций курьеров (dev/staging).

В production по умолчанию выключено. Не полагаться на security through obscurity:
маршруты не регистрируются, если флаги выключены.
"""
from __future__ import annotations

from django.conf import settings


def include_dev_courier_tooling() -> bool:
    """Включить ли URL из ``delivery.api.dev_views`` (MyGLS/DPD sandbox-вызовы)."""
    if getattr(settings, "DEBUG", False):
        return True
    return getattr(settings, "ENABLE_DELIVERY_DEV_ENDPOINTS", False)
