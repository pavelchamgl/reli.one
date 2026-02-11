from __future__ import annotations

from pathlib import Path
from typing import Optional

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Prefetch

from product.feed_gmc import GMCFeedConfig, build_item_xml, wrap_feed_xml
from product.models import BaseProduct, ProductVariant, ProductStatus


def _get_public_domain() -> str:
    domain = getattr(settings, "PUBLIC_DOMAIN", None)
    if domain:
        return str(domain).rstrip("/")
    return "https://example.com"


def _get_currency() -> str:
    return getattr(settings, "FEED_CURRENCY", "EUR")


def _get_output_path() -> Path:
    rel = getattr(settings, "GMC_FEED_RELATIVE_PATH", "feeds/google.xml")
    return Path(settings.MEDIA_ROOT) / rel


def _pick_main_image_abs(public_domain: str, product: BaseProduct) -> Optional[str]:
    img = product.images.order_by("id").first()
    if not img or not getattr(img, "image", None):
        return None
    return public_domain.rstrip("/") + img.image.url


def _brand_static_override(product: BaseProduct) -> Optional[str]:
    mapping = getattr(settings, "GMC_STATIC_BRANDS", None) or {}
    seller = getattr(product, "seller", None)
    seller_id = getattr(seller, "id", None)
    if seller_id in mapping:
        return mapping[seller_id]
    return None


def _product_type_from_category(product: BaseProduct) -> Optional[str]:
    c = getattr(product, "category", None)
    if not c:
        return None

    name = getattr(c, "name", None)
    if not name:
        return None

    parts = [str(name)]
    parent = getattr(c, "parent", None)
    while parent:
        pname = getattr(parent, "name", None)
        if pname:
            parts.append(str(pname))
        parent = getattr(parent, "parent", None)

    parts.reverse()
    return " > ".join(parts)


class Command(BaseCommand):
    help = "Generate Google Merchant Center feed XML into MEDIA_ROOT/feeds/google.xml"

    def add_arguments(self, parser):
        parser.add_argument("--category-id", type=int, default=None)
        parser.add_argument("--limit", type=int, default=None)

    def handle(self, *args, **options):
        public_domain = _get_public_domain()
        currency = _get_currency()
        output_path = _get_output_path()

        cfg = GMCFeedConfig(
            public_domain=public_domain,
            currency=currency,
            product_path_tpl="/product/{product_id}",
            variant_param_name="variant",
        )

        # ---- IMPORTANT: filter ONLY selected sellers (Nutristar) ----
        only_seller_ids = getattr(settings, "GMC_ONLY_SELLER_IDS", None)
        if not only_seller_ids:
            # Safe default: if not configured, do NOT filter
            only_seller_ids = []

        qs = (
            BaseProduct.objects.filter(status=ProductStatus.APPROVED, is_active=True)
            .select_related("category", "seller")
            .prefetch_related(
                "images",
                Prefetch("variants", queryset=ProductVariant.objects.all().order_by("id")),
            )
            .order_by("id")
        )

        if only_seller_ids:
            qs = qs.filter(seller_id__in=only_seller_ids)

        if options.get("category_id"):
            qs = qs.filter(category_id=options["category_id"])

        if options.get("limit"):
            qs = qs[: options["limit"]]

        items_xml: list[str] = []
        skipped_no_image = 0
        skipped_no_price = 0

        for product in qs.iterator(chunk_size=200):
            image_abs = _pick_main_image_abs(public_domain, product)
            if not image_abs:
                skipped_no_image += 1
                continue

            gtin = (getattr(product, "barcode", "") or "").strip() or None
            mpn_base = (getattr(product, "article", "") or "").strip() or None

            # Brand for Nutristar (seller_id=43) -> "Nutristar"
            brand = _brand_static_override(product)

            product_type = _product_type_from_category(product)

            for v in product.variants.all():
                price = getattr(v, "price_with_acquiring", None)
                if price is None:
                    skipped_no_price += 1
                    continue

                mpn = mpn_base

                # Correct identifier_exists logic
                if gtin:
                    identifier_exists = True
                elif brand and mpn:
                    identifier_exists = True
                else:
                    identifier_exists = False

                t = (product.name or "").strip()
                vtxt = (getattr(v, "text", None) or getattr(v, "name", None) or "").strip()
                title = f"{t} – {vtxt}" if (t and vtxt) else (t or vtxt)

                item_xml = build_item_xml(
                    cfg=cfg,
                    variant_sku=str(v.sku),
                    title=title,
                    description=getattr(product, "product_description", "") or "",
                    product_id=product.id,
                    image_url_abs=image_abs,
                    price=price,
                    availability="in stock",
                    brand=brand,
                    gtin=gtin,
                    mpn=mpn,
                    identifier_exists=identifier_exists,
                    item_group_id=str(product.id),
                    product_type=product_type,
                )
                items_xml.append(item_xml)

        xml = wrap_feed_xml(cfg=cfg, items_xml=items_xml)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(xml, encoding="utf-8")

        self.stdout.write(self.style.SUCCESS(f"Feed generated: {output_path}"))
        self.stdout.write(
            f"Items: {len(items_xml)} | Skipped(no image): {skipped_no_image} | Skipped(no price): {skipped_no_price}"
        )
        self.stdout.write(
            f"Public URL should be: {public_domain}/media/{output_path.relative_to(settings.MEDIA_ROOT)}"
        )
