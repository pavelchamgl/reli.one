from __future__ import annotations

from django.conf import settings
from django.core.cache import cache

from .client import AresClient
from .errors import AresNotFound, AresUnavailable
from .mapping import normalize_ares_response, normalize_ico, normalize_vr_representatives


def lookup_by_ico(ico: str, *, client: AresClient | None = None) -> dict:
    normalized_ico = normalize_ico(ico)
    cache_key = f"ares:ico:{normalized_ico}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    ares_client = client or AresClient()
    data = ares_client.get_economic_subject(normalized_ico)
    normalized = normalize_ares_response(data, queried_ico=normalized_ico, derive_dic_hint=False)
    normalized = _enrich_with_szr(normalized, normalized_ico, client=ares_client)
    normalized = _enrich_with_vr(normalized, normalized_ico, client=ares_client)
    normalized = _ensure_derived_dic_hint(normalized)
    cache.set(cache_key, normalized, timeout=settings.ARES_CACHE_SECONDS)
    return normalized


def _enrich_with_szr(normalized: dict, ico: str, *, client: AresClient) -> dict:
    try:
        szr_data = client.get_economic_subject_szr(ico)
    except (AresNotFound, AresUnavailable):
        return normalized

    szr_normalized = normalize_ares_response(szr_data, queried_ico=ico, derive_dic_hint=False)

    if not normalized.get("dic_hint") and szr_normalized.get("dic_hint"):
        normalized["dic_hint"] = szr_normalized["dic_hint"]
        normalized["dic_hint_source"] = szr_normalized.get("dic_hint_source")

    representatives = szr_normalized.get("representatives") or []
    if representatives:
        normalized["representatives"] = representatives

    return normalized


def _enrich_with_vr(normalized: dict, ico: str, *, client: AresClient) -> dict:
    try:
        vr_data = client.get_economic_subject_vr(ico)
    except (AresNotFound, AresUnavailable):
        return normalized

    representatives = normalize_vr_representatives(vr_data)
    if representatives:
        normalized["representatives"] = _merge_representatives(
            normalized.get("representatives") or [],
            representatives,
        )

    return normalized


def _merge_representatives(existing: list[dict], incoming: list[dict]) -> list[dict]:
    merged: list[dict] = []
    seen: set[tuple[str | None, str | None, str | None]] = set()

    for representative in [*existing, *incoming]:
        key = (
            representative.get("first_name"),
            representative.get("last_name"),
            representative.get("birth_date_hint"),
        )
        if key in seen:
            continue
        seen.add(key)
        merged.append(representative)

    return merged


def _ensure_derived_dic_hint(normalized: dict) -> dict:
    country = (normalized.get("registered_address") or {}).get("country")
    ico = normalized.get("ico") or normalized.get("business_id")
    if not normalized.get("dic_hint") and country == "CZ" and ico:
        normalized["dic_hint"] = f"CZ{ico}"
        normalized["dic_hint_source"] = "derived"
    return normalized
