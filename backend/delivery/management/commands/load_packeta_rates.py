from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Dict, Tuple, List

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
- Пишем оба channel: PUDO и HD.
- Категории управляются флагом CLI: --categories (по умолчанию только 'standard').
- address_bundle всегда 'one' для Zásilkovna (входит в уникальный ключ).
"""

COURIER_DEFAULT_NAME = "Zásilkovna"

# фиксированный whitelist ключей и их порядок
PUDO_KEYS: Tuple[str, ...] = ("5", "10", "15")
HD_KEYS:   Tuple[str, ...] = ("1", "2", "5", "10", "15", "30", "50")

# допустимые категории в нашей модели
ALLOWED_CATEGORIES: Tuple[str, ...] = ("standard", "oversized")


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

    bad_pudo = [str(k) for k in pudo.keys() if str(k) not in PUDO_KEYS]
    bad_hd   = [str(k) for k in hd.keys()   if str(k) not in HD_KEYS]

    if strict and (bad_pudo or bad_hd):
        raise CommandError(
            f"{country}: unexpected weight keys. "
            f"PUDO allowed {PUDO_KEYS}, got {sorted(map(str, pudo.keys()))}; "
            f"HD allowed {HD_KEYS}, got {sorted(map(str, hd.keys()))}"
        )


def _upsert_one(
    courier: CourierService,
    *,
    country: str,
    channel: str,
    category: str,
    weight_limit: str,
    price: Decimal,
) -> Tuple[int, int]:
    """Создаёт/обновляет одну запись (на 1 категорию). Возвращает (created, updated)."""
    created = updated = 0
    obj, was_created = ShippingRate.objects.update_or_create(
        courier_service=courier,
        country=country,
        channel=channel,
        category=category,
        weight_limit=weight_limit,
        address_bundle="one",  # часть уникального ключа
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
    help = "Load Packeta/Zásilkovna rates from JSON into ShippingRate (categories controlled via --categories)."

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
        parser.add_argument(
            "--categories",
            default="standard",  # важно: по умолчанию только standard, чтобы не плодить дубли
            help="Comma-separated categories to import (default: standard). Example: standard,oversized",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        path = Path(opts["json"])
        data = _read_json(path)

        # разбор категорий из CLI
        categories: List[str] = [
            c.strip() for c in str(opts.get("categories", "standard")).split(",") if c.strip()
        ]
        for c in categories:
            if c not in ALLOWED_CATEGORIES:
                raise CommandError(f"Unknown category '{c}'. Allowed: {ALLOWED_CATEGORIES}")

        courier_code = data["courier_code"]
        countries_block = data["countries"]

        courier = _ensure_courier(courier_code)

        # фильтр стран (если указан)
        only = None
        if opts.get("countries"):
            only = [x.strip().upper() for x in opts["countries"].split(",") if x.strip()]

        # reset при необходимости
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
            pudo = block.get("pudo", {})
            for wl in PUDO_KEYS:
                if wl not in map(str, pudo.keys()):
                    # пропускаем отсутствующие веса (файл может не содержать все)
                    continue
                price_dec = Decimal(str(pudo[wl]))
                if opts.get("dry_run"):
                    self.stdout.write(f"[dry-run] {courier_code} {country} PUDO ≤{wl}: {price_dec} CZK")
                else:
                    for cat in categories:
                        c, u = _upsert_one(
                            courier,
                            country=country,
                            channel="PUDO",
                            category=cat,
                            weight_limit=wl,
                            price=price_dec,
                        )
                        created_total += c
                        updated_total += u

            # HD
            hd = block.get("hd", {})
            for wl in HD_KEYS:
                if wl not in map(str, hd.keys()):
                    continue
                price_dec = Decimal(str(hd[wl]))
                if opts.get("dry_run"):
                    self.stdout.write(f"[dry-run] {courier_code} {country} HD   ≤{wl}: {price_dec} CZK")
                else:
                    for cat in categories:
                        c, u = _upsert_one(
                            courier,
                            country=country,
                            channel="HD",
                            category=cat,
                            weight_limit=wl,
                            price=price_dec,
                        )
                        created_total += c
                        updated_total += u

        msg = f"Created: {created_total}, updated: {updated_total}"
        if opts.get("dry_run"):
            self.stdout.write(self.style.SUCCESS(f"[dry-run] Done. {msg}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Loaded Packeta/Zásilkovna rates. {msg}"))
