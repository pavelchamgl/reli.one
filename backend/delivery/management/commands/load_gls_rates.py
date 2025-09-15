from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from order.models import CourierService
from delivery.models import ShippingRate


"""
Ожидаемый JSON (только базовые HD-цены в CZK):

{
  "courier_code": "gls",
  "domestic": {
    "country": "CZ",
    "hd": {
      "one":  { "5": 82.0, "10": 92.0, "20": 107.0, "31_5": 132.0 },
      "multi":{ "5": 62.0, "10": 72.0, "20": 87.0,  "31_5": 112.0 }
    }
  },
  "export": [
    { "country": "RO", "hd": { "5": 151.0, "10": 270.0, "20": 400.0, "31_5": 599.0 } },
    ...
  ]
}

— Пишем ТОЛЬКО HD (GLS Business*/EuroBusiness Parcel).
— Для каждой записи создаём обе категории: "standard" и "oversized" (цена одинаковая).
— address_bundle:
    • domestic: пишем и "one", и "multi" если обе есть в JSON (если "multi" нет — пропускаем).
    • export:   по умолчанию только "one". Флаг --with-export-multi продублирует цены как "multi".
— Экспортный PUDO НЕ сохраняем (он считается динамически в рантайме из настроек).
"""

WEIGHT_LIMITS: Tuple[str, ...] = ("5", "10", "20", "31_5")
CATEGORIES: Tuple[str, ...] = ("standard", "oversized")
COUNTRY_ALIAS = {"UK": "GB"}  # на случай, если в JSON попадётся UK


def _ensure_gls(courier_code: str) -> CourierService:
    obj, _ = CourierService.objects.get_or_create(
        code=courier_code.lower(),
        defaults={"name": courier_code.upper(), "active": True},
    )
    return obj


def _norm_country(code: str) -> str:
    code = (code or "").strip().upper()
    return COUNTRY_ALIAS.get(code, code)


def _read_json(path: Path) -> dict:
    if not path.exists():
        raise CommandError(f"JSON file not found: {path}")
    if path.suffix.lower() != ".json":
        raise CommandError("Only .json is supported")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise CommandError(f"Invalid JSON: {e}") from e


def _validate_weights(map_or_list) -> None:
    """Проверяем, что ключи весов строго '5','10','20','31_5'."""
    keys = set(map_or_list.keys())
    want = set(WEIGHT_LIMITS)
    if keys != want:
        raise CommandError(f"Weight keys must be {sorted(want)}, got {sorted(keys)}")


def _choose_countries(all_countries: Iterable[str], only: str | None) -> List[str]:
    if not only:
        return sorted({c.upper() for c in all_countries})
    return [c.strip().upper() for c in only.split(",") if c.strip()]


def _upsert_one_weight_step(
    courier: CourierService,
    *,
    country: str,
    weight_limit: str,
    price: Decimal,
    address_bundle: str,
) -> tuple[int, int]:
    """
    Создаёт/обновляет ставки HD для обеих категорий с одинаковой ценой.
    Возвращает (created, updated).
    """
    created = updated = 0
    for category in CATEGORIES:
        obj, was_created = ShippingRate.objects.update_or_create(
            courier_service=courier,
            country=country,
            channel="HD",
            category=category,
            weight_limit=weight_limit,
            address_bundle=address_bundle,
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
    help = (
        "Load GLS HD base rates (CZK) from JSON. "
        "Writes both categories (standard/oversized). "
        "Export PUDO is NOT stored (computed at runtime)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--json", required=True, help="Path to JSON file.")
        parser.add_argument(
            "--countries",
            help="Limit to ISO2 countries (comma-separated), e.g. RO,DE,AT.",
        )
        parser.add_argument(
            "--with-export-multi",
            dest="with_export_multi",
            action="store_true",
            help="Also create export rates with address_bundle='multi' (duplicate prices).",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete ALL existing rates for this courier before loading.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show actions without writing to DB.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        path = Path(opts["json"])
        data = _read_json(path)

        courier_code = (data.get("courier_code") or "gls").lower()
        courier = _ensure_gls(courier_code)

        domestic = data.get("domestic") or {}
        export = data.get("export") or []

        only_countries = opts.get("countries")
        with_export_multi = bool(opts.get("with_export_multi"))
        do_reset = bool(opts.get("reset"))
        dry_run = bool(opts.get("dry_run"))

        # wipe old if requested
        if do_reset:
            qs = ShippingRate.objects.filter(courier_service=courier)
            cnt = qs.count()
            if dry_run:
                self.stdout.write(self.style.WARNING(f"[dry-run] Would delete {cnt} existing {courier.code} rates"))
            else:
                qs.delete()
                self.stdout.write(self.style.WARNING(f"Deleted {cnt} existing {courier.code} rates"))

        created_total = updated_total = 0

        # --- Domestic (CZ) ---
        if domestic:
            cz = _norm_country(domestic.get("country", "CZ"))
            hd = domestic.get("hd") or {}
            for bundle_key in ("one", "multi"):
                wl_map = hd.get(bundle_key)
                if not wl_map:
                    continue
                _validate_weights(wl_map)
                for wl, price in wl_map.items():
                    price_dec = Decimal(str(price))
                    if dry_run:
                        self.stdout.write(f"[dry-run] domestic HD {cz} ≤{wl}: {price_dec} CZK (bundle={bundle_key})")
                    else:
                        c, u = _upsert_one_weight_step(
                            courier,
                            country=cz,
                            weight_limit=wl,
                            price=price_dec,
                            address_bundle=bundle_key,
                        )
                        created_total += c
                        updated_total += u

        # --- Export (only 'one' by default) ---
        exp_list = export if isinstance(export, list) else []
        exp_countries_all = [ _norm_country(x.get("country","")) for x in exp_list if x.get("country") ]
        exp_countries = _choose_countries(exp_countries_all, only_countries)

        bundles = ["one", "multi"] if with_export_multi else ["one"]

        for row in exp_list:
            country = _norm_country(row.get("country",""))
            if not country or country not in exp_countries:
                continue

            hd = row.get("hd") or {}
            _validate_weights(hd)

            for wl, price in hd.items():
                price_dec = Decimal(str(price))
                for bundle in bundles:
                    if dry_run:
                        self.stdout.write(f"[dry-run] export HD {country} ≤{wl}: {price_dec} CZK (bundle={bundle})")
                    else:
                        c, u = _upsert_one_weight_step(
                            courier,
                            country=country,
                            weight_limit=wl,
                            price=price_dec,
                            address_bundle=bundle,
                        )
                        created_total += c
                        updated_total += u

        msg = f"Created: {created_total}, updated: {updated_total}"
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"[dry-run] Done. {msg}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Loaded {courier.code.upper()} rates. {msg}"))

        self.stdout.write(
            "Note: export PUDO & surcharges are computed at runtime from Django settings."
        )
