from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Tuple

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from order.models import CourierService
from delivery.models import ShippingRate

"""
Ожидаемый JSON (цены в CZK, без НДС):

{
  "courier_code": "zasilkovna",
  "countries": [
    {
      "country": "CZ",
      "pudo": { "5": 62.0, "10": 120.0, "15": 120.0 },
      "hd":   { "1": 89.0, "2": 89.0, "5": 89.0, "10": 130.0, "15": 130.0, "30": 250.0 }
    },
    ...
  ]
}

Правила:
- Пишем оба channel: PUDO и HD
- Для КАЖДОГО тарифа создаём обе категории: "standard" и "oversized" (цены одинаковые),
  чтобы рантайм-логика категоризации всегда находила запись.
- address_bundle всегда "one" для Zásilkovna.
"""

COURIER_DEFAULT_NAME = "Zásilkovna"
PUDO_KEYS: Tuple[str, ...] = ("5", "10", "15")
HD_KEYS:   Tuple[str, ...] = ("1", "2", "5", "10", "15", "30")
CATS:      Tuple[str, ...] = ("standard", "oversized")


def _ensure_courier(code: str) -> CourierService:
    obj, _ = CourierService.objects.get_or_create(
        code=code,
        defaults={"name": COURIER_DEFAULT_NAME, "active": True},
    )
    return obj


def _read_json(path: Path) -> Dict:
    if not path.exists():
        raise CommandError(f"JSON file not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise CommandError(f"Invalid JSON: {e}")
    if "courier_code" not in data or "countries" not in data:
        raise CommandError("JSON must contain 'courier_code' and 'countries' fields")
    return data


def _validate_tables(country_block: Dict, strict: bool = True) -> None:
    country = country_block.get("country")
    pudo = country_block.get("pudo", {})
    hd   = country_block.get("hd", {})

    bad_pudo = [k for k in pudo.keys() if str(k) not in PUDO_KEYS]
    bad_hd   = [k for k in hd.keys()   if str(k) not in HD_KEYS]

    if strict and (bad_pudo or bad_hd):
        raise CommandError(
            f"{country}: unexpected weight keys. "
            f"PUDO allowed {PUDO_KEYS}, got {sorted(pudo.keys())}; "
            f"HD allowed {HD_KEYS}, got {sorted(hd.keys())}"
        )


def _upsert(
    courier: CourierService,
    *,
    country: str,
    channel: str,
    weight_limit: str,
    price: Decimal,
) -> tuple[int, int]:
    created = updated = 0
    for cat in CATS:
        obj, was_created = ShippingRate.objects.update_or_create(
            courier_service=courier,
            country=country,
            channel=channel,
            category=cat,
            weight_limit=weight_limit,
            address_bundle="one",  # обязательно для уникального ключа
            defaults={
                "price": price,
                "cod_fee": Decimal("0.00"),
                "estimate": "",
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


class Command(BaseCommand):
    help = "Load Packeta/Zásilkovna rates from JSON into ShippingRate (both categories mirror the same price)."

    def add_arguments(self, parser):
        parser.add_argument("--json", required=True, help="Path to JSON file (see module docstring).")
        parser.add_argument(
            "--countries",
            help="Limit to specific ISO2 countries, comma-separated (e.g. CZ,RO). Defaults to all in file.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing rates for this courier before loading.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be written without touching DB.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        path = Path(opts["json"])
        data = _read_json(path)

        courier_code = data["courier_code"]
        countries_block = data["countries"]

        courier = _ensure_courier(courier_code)

        # filter countries (if provided)
        only = None
        if opts.get("countries"):
            only = [x.strip().upper() for x in opts["countries"].split(",") if x.strip()]

        if opts.get("reset"):
            qs = ShippingRate.objects.filter(courier_service=courier)
            cnt = qs.count()
            if opts.get("dry_run"):
                self.stdout.write(self.style.WARNING(f"[dry-run] Would delete {cnt} existing {courier_code} rates"))
            else:
                qs.delete()
                self.stdout.write(self.style.WARNING(f"Deleted {cnt} existing {courier_code} rates"))

        created_total = updated_total = 0

        for block in countries_block:
            country = block["country"].upper()
            if only and country not in only:
                continue

            _validate_tables(block, strict=True)

            # PUDO
            for wl, price in block.get("pudo", {}).items():
                wl_str = str(wl)
                price_dec = Decimal(str(price))
                if opts.get("dry_run"):
                    self.stdout.write(f"[dry-run] {courier_code} {country} PUDO ≤{wl_str}: {price_dec} CZK")
                else:
                    c, u = _upsert(courier, country=country, channel="PUDO",
                                   weight_limit=wl_str, price=price_dec)
                    created_total += c
                    updated_total += u

            # HD
            for wl, price in block.get("hd", {}).items():
                wl_str = str(wl)
                price_dec = Decimal(str(price))
                if opts.get("dry_run"):
                    self.stdout.write(f"[dry-run] {courier_code} {country} HD   ≤{wl_str}: {price_dec} CZK")
                else:
                    c, u = _upsert(courier, country=country, channel="HD",
                                   weight_limit=wl_str, price=price_dec)
                    created_total += c
                    updated_total += u

        msg = f"Created: {created_total}, updated: {updated_total}"
        if opts.get("dry_run"):
            self.stdout.write(self.style.SUCCESS(f"[dry-run] Done. {msg}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Loaded Packeta/Zásilkovna rates. {msg}"))
