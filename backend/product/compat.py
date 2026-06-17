from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from django.conf import settings


def get_product_cover_image(product):
    """
    Compatibility hook for the current cover-image contract.

    Today the cover is the oldest BaseProductImage. Future ProductMedia support
    can be added here without changing list/detail/order/GMC consumers.
    """
    # Django stores prefetched related managers here; use it only as an
    # optimization and keep the DB fallback below as the source of truth.
    cached_images = getattr(product, "_prefetched_objects_cache", {}).get("images")
    if cached_images is not None:
        ordered = sorted(cached_images, key=lambda image: image.pk or 0)
        return ordered[0] if ordered else None

    return product.images.order_by("id").first()


def get_product_cover_image_url(product, *, request=None, absolute: bool = True) -> Optional[str]:
    image = get_product_cover_image(product)
    if not image or not getattr(image, "image", None):
        return None

    url = image.image.url
    if absolute and request is not None:
        return request.build_absolute_uri(url)
    return url


@dataclass(frozen=True)
class GMCProductIdentifiers:
    gtin: Optional[str]
    mpn: Optional[str]
    brand: Optional[str]
    identifier_exists: bool


def get_static_gmc_brand(product) -> Optional[str]:
    mapping = getattr(settings, "GMC_STATIC_BRANDS", None) or {}
    seller = getattr(product, "seller", None)
    seller_id = getattr(seller, "id", None)
    return mapping.get(seller_id)


def get_gmc_product_identifiers(product) -> GMCProductIdentifiers:
    """
    Compatibility hook for future Brand/ProductExternalIdentifier models.

    Current behavior is intentionally preserved:
    barcode -> GTIN, article -> MPN, static seller override -> brand.
    """
    gtin = (getattr(product, "barcode", "") or "").strip() or None
    mpn = (getattr(product, "article", "") or "").strip() or None
    brand = get_static_gmc_brand(product)
    identifier_exists = bool(gtin or (brand and mpn))
    return GMCProductIdentifiers(
        gtin=gtin,
        mpn=mpn,
        brand=brand,
        identifier_exists=identifier_exists,
    )


def cm_to_mm(value) -> int:
    return int((Decimal(str(value)) * Decimal("10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def mm_to_cm(value) -> Decimal:
    return (Decimal(int(value)) / Decimal("10")).quantize(Decimal("0.1"))


def kg_to_grams(value) -> int:
    return int((Decimal(str(value)) * Decimal("1000")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def grams_to_kg(value) -> Decimal:
    return (Decimal(int(value)) / Decimal("1000")).quantize(Decimal("0.001"))
