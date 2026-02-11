from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
from xml.sax.saxutils import escape as xml_escape


@dataclass(frozen=True)
class GMCFeedConfig:
    public_domain: str  # e.g. "https://reli.one"
    currency: str       # e.g. "EUR"
    product_path_tpl: str = "/product/{product_id}"
    variant_param_name: str = "variant"


def _money_to_str(value: Decimal) -> str:
    return f"{value:.2f}"


def _join_url(domain: str, path: str) -> str:
    domain = domain.rstrip("/")
    if not path.startswith("/"):
        path = "/" + path
    return domain + path


def build_item_xml(
    *,
    cfg: GMCFeedConfig,
    variant_sku: str,
    title: str,
    description: str,
    product_id: int,
    image_url_abs: str,
    price: Decimal,
    availability: str,
    brand: Optional[str] = None,
    gtin: Optional[str] = None,
    mpn: Optional[str] = None,
    identifier_exists: Optional[bool] = None,
    item_group_id: Optional[str] = None,
    product_type: Optional[str] = None,
) -> str:
    link_path = cfg.product_path_tpl.format(product_id=product_id)
    link_abs = _join_url(cfg.public_domain, link_path)

    sep = "&" if "?" in link_abs else "?"
    link_abs = f"{link_abs}{sep}{cfg.variant_param_name}={xml_escape(str(variant_sku))}"

    parts = [
        "<item>",
        f"<g:id>{xml_escape(str(variant_sku))}</g:id>",
        f"<g:title>{xml_escape(title)}</g:title>",
        f"<g:description>{xml_escape(description or '')}</g:description>",
        f"<g:link>{xml_escape(link_abs)}</g:link>",
        f"<g:image_link>{xml_escape(image_url_abs)}</g:image_link>",
        f"<g:price>{_money_to_str(price)} {xml_escape(cfg.currency)}</g:price>",
        f"<g:availability>{xml_escape(availability)}</g:availability>",
        "<g:condition>new</g:condition>",
    ]

    if item_group_id:
        parts.append(f"<g:item_group_id>{xml_escape(str(item_group_id))}</g:item_group_id>")

    if brand:
        parts.append(f"<g:brand>{xml_escape(brand)}</g:brand>")

    if gtin:
        parts.append(f"<g:gtin>{xml_escape(gtin)}</g:gtin>")

    if mpn:
        parts.append(f"<g:mpn>{xml_escape(mpn)}</g:mpn>")

    if identifier_exists is not None:
        parts.append(f"<g:identifier_exists>{'true' if identifier_exists else 'false'}</g:identifier_exists>")

    if product_type:
        parts.append(f"<g:product_type>{xml_escape(product_type)}</g:product_type>")

    parts.append("</item>")
    return "\n".join(parts)


def wrap_feed_xml(*, cfg: GMCFeedConfig, items_xml: list[str]) -> str:
    items_block = "\n".join(items_xml)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n'
        "  <channel>\n"
        "    <title>Reli.one product feed</title>\n"
        f"    <link>{xml_escape(cfg.public_domain)}</link>\n"
        "    <description>Google Merchant Center feed</description>\n"
        f"{items_block}\n"
        "  </channel>\n"
        "</rss>\n"
    )
