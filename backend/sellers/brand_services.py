from __future__ import annotations

from django.db import IntegrityError
from django.utils.text import slugify

from product.models import Brand, ProductStatus

BRAND_NAME_MIN_LENGTH = 2
BRAND_NAME_MAX_LENGTH = 150
BRAND_NAME_ERROR_MIN_LENGTH = "brand_min_length"
BRAND_NAME_ERROR_MAX_LENGTH = "brand_max_length"


def normalize_brand_name(value: str) -> str:
    return " ".join(str(value).strip().split())


def validate_brand_name_length(normalized: str) -> str | None:
    if not normalized:
        return None
    if len(normalized) < BRAND_NAME_MIN_LENGTH:
        return BRAND_NAME_ERROR_MIN_LENGTH
    if len(normalized) > BRAND_NAME_MAX_LENGTH:
        return BRAND_NAME_ERROR_MAX_LENGTH
    return None


def _build_unique_slug(name: str) -> str:
    base = slugify(name) or "brand"
    base = base[:150]
    slug = base
    counter = 2
    while Brand.objects.filter(slug=slug).exists():
        suffix = f"-{counter}"
        slug = f"{base[:160 - len(suffix)]}{suffix}"
        counter += 1
    return slug


def resolve_brand_from_text(name: str, *, user) -> Brand:
    normalized = normalize_brand_name(name)
    validation_error = validate_brand_name_length(normalized)
    if validation_error:
        raise ValueError(validation_error)

    existing = Brand.objects.filter(name__iexact=normalized).first()
    if existing:
        return existing

    slug = _build_unique_slug(normalized)
    try:
        return Brand.objects.create(
            name=normalized,
            slug=slug,
            status=ProductStatus.PENDING,
            created_by=user,
        )
    except IntegrityError:
        existing = Brand.objects.filter(name__iexact=normalized).first()
        if existing:
            return existing
        raise
