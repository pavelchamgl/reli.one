from __future__ import annotations

from django.conf import settings
from django.core.cache import cache

from .client import AresClient
from .mapping import normalize_ares_response, normalize_ico


def lookup_by_ico(ico: str, *, client: AresClient | None = None) -> dict:
    normalized_ico = normalize_ico(ico)
    cache_key = f"ares:ico:{normalized_ico}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    ares_client = client or AresClient()
    data = ares_client.get_economic_subject(normalized_ico)
    normalized = normalize_ares_response(data, queried_ico=normalized_ico)
    cache.set(cache_key, normalized, timeout=settings.ARES_CACHE_SECONDS)
    return normalized
