"""Парсинг env для Django settings. Без импорта Django — удобно для юнит-тестов."""

import os
from typing import Callable, Optional


def str_to_bool(value) -> bool:
    if value is None:
        return False
    return str(value).lower() in ("true", "1", "yes")


def cookie_samesite_from_env(
    name: str,
    default: str = "Lax",
    *,
    getter: Optional[Callable[..., Optional[str]]] = None,
) -> str:
    """Django ожидает 'Lax', 'Strict' или 'None' (строка) для SameSite."""
    get = getter or os.getenv
    raw = get(name, default)
    if raw is None or str(raw).strip() == "":
        return default
    raw = str(raw).strip().strip("'\"")
    if raw.lower() == "none":
        return "None"
    return raw


def int_from_env(
    name: str,
    default: int = 0,
    *,
    getter: Optional[Callable[..., Optional[str]]] = None,
) -> int:
    get = getter or os.getenv
    raw = get(name, str(default))
    if raw is None or str(raw).strip() == "":
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default
