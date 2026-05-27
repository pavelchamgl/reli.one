"""Парсинг env для Django settings. Без импорта Django — удобно для юнит-тестов."""

import os
from typing import Callable, List, Optional, Sequence

DEFAULT_CORS_ALLOWED_ORIGINS = (
    "https://reli.one",
    "https://www.reli.one",
    "http://45.147.248.21:8081",
)
LOCAL_DEV_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


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


def resolve_cors_allowed_origins(
    *,
    debug: bool,
    enable_e2e_endpoints: bool,
    cors_allowed_origins_env: str = "",
    default_origins: Sequence[str] = DEFAULT_CORS_ALLOWED_ORIGINS,
    local_dev_origins: Sequence[str] = LOCAL_DEV_CORS_ORIGINS,
) -> List[str]:
    """Build CORS allowlist: env override, then optional local Vite origins for dev/e2e."""
    if cors_allowed_origins_env.strip():
        origins = [
            origin.strip()
            for origin in cors_allowed_origins_env.split(",")
            if origin.strip()
        ]
    else:
        origins = list(default_origins)

    if debug or enable_e2e_endpoints:
        for origin in local_dev_origins:
            if origin not in origins:
                origins.append(origin)

    return origins
