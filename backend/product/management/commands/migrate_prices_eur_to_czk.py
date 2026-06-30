from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal, ROUND_CEILING
from pathlib import Path
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from delivery.services.cnb_service import CnbRateNotAvailableError, get_czk_per_eur_for_date
from product.models import ProductVariant

PRAGUE_TZ = ZoneInfo("Europe/Prague")
ARTIFACTS_DIR = Path(settings.BASE_DIR) / "_migration_artifacts"


def _migration_id(migration_date: date, executed_at: datetime) -> str:
    return f"{migration_date.isoformat()}-{executed_at.strftime('%H%M%S')}-prague"


def _ceil_eur_to_czk(price_eur: Decimal, rate) -> Decimal:
    rate_dec = rate if isinstance(rate, Decimal) else Decimal(str(rate))
    return (price_eur * rate_dec).quantize(Decimal("1"), rounding=ROUND_CEILING)


class Command(BaseCommand):
    help = "Migrate ProductVariant.price from EUR to CZK using CNB fixing for migration date."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            dest="migration_date",
            help="Migration date YYYY-MM-DD (staging/tests only; forbidden when DEBUG=False).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print migration plan and rate without writing to DB.",
        )
        parser.add_argument(
            "--backup-path",
            default="",
            help="Path to backup JSON (default: _migration_artifacts/price_migration_backup_<date>.json).",
        )
        parser.add_argument(
            "--report-path",
            default="",
            help="Path to audit report JSON (default: _migration_artifacts/price_migration_report_<date>.json).",
        )
        parser.add_argument(
            "--allow-rerun",
            action="store_true",
            help="Allow rerun when report for migration_date already exists.",
        )
        parser.add_argument(
            "--reverse",
            action="store_true",
            help="Restore EUR prices from backup JSON.",
        )
        parser.add_argument(
            "--rate",
            dest="manual_rate",
            help="Manual CZK/EUR rate override.",
        )
        parser.add_argument(
            "--force-manual-rate",
            action="store_true",
            help="Use --rate instead of CNB (emergency only).",
        )

    def handle(self, *args, **options):
        if options["reverse"]:
            self._handle_reverse(options)
            return

        migration_date = self._resolve_migration_date(options)
        backup_path = self._resolve_path(
            options["backup_path"],
            f"price_migration_backup_{migration_date.isoformat()}.json",
        )
        report_path = self._resolve_path(
            options["report_path"],
            f"price_migration_report_{migration_date.isoformat()}.json",
        )

        if report_path.exists() and not options["allow_rerun"] and not options["dry_run"]:
            raise CommandError(
                f"Report already exists for {migration_date}: {report_path}. "
                "Use --allow-rerun to override."
            )

        rate_info = self._fetch_rate(migration_date, options)
        variants = list(ProductVariant.objects.select_related("product").order_by("id"))
        rows = []
        price_eur_values: list[Decimal] = []
        price_czk_values: list[Decimal] = []

        for variant in variants:
            price_eur = variant.price
            price_czk = _ceil_eur_to_czk(price_eur, rate_info["czk_per_eur"])
            price_eur_values.append(price_eur)
            price_czk_values.append(price_czk)
            rows.append(
                {
                    "variant_id": variant.id,
                    "sku": variant.sku,
                    "price_eur_before": str(price_eur),
                    "price_czk_after": str(price_czk),
                }
            )

        if options["dry_run"]:
            self.stdout.write(
                f"[DRY-RUN] date={migration_date} rate={rate_info['czk_per_eur']} "
                f"source={rate_info['source']} variants={len(rows)}"
            )
            if rows:
                sample = rows[0]
                self.stdout.write(
                    f"  sample sku={sample['sku']} "
                    f"{sample['price_eur_before']} EUR -> {sample['price_czk_after']} CZK"
                )
            return

        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_payload = {
            "backup_version": "1",
            "migration_date": migration_date.isoformat(),
            "timezone": "Europe/Prague",
            "rate": rate_info,
            "rows": [
                {
                    "variant_id": row["variant_id"],
                    "sku": row["sku"],
                    "price_eur": row["price_eur_before"],
                }
                for row in rows
            ],
        }
        backup_path.write_text(
            json.dumps(backup_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        with transaction.atomic():
            for variant, row in zip(variants, rows, strict=True):
                variant.price = Decimal(row["price_czk_after"])
                variant.save(update_fields=["price"])

        executed_at = datetime.now(PRAGUE_TZ)
        report_payload = {
            "report_version": "1",
            "migration_id": _migration_id(migration_date, executed_at),
            "executed_at": executed_at.isoformat(),
            "migration_date": migration_date.isoformat(),
            "timezone": "Europe/Prague",
            "rate": rate_info,
            "policy": {
                "from_currency": "EUR",
                "to_currency": "CZK",
                "rounding": "ROUND_CEILING to whole CZK",
                "fx_markup_applied": False,
                "acquiring_applied": False,
            },
            "summary": {
                "variants_total": len(rows),
                "variants_updated": len(rows),
                "variants_skipped": 0,
                "price_eur_min": str(min(price_eur_values)) if price_eur_values else None,
                "price_eur_max": str(max(price_eur_values)) if price_eur_values else None,
                "price_czk_min": str(min(price_czk_values)) if price_czk_values else None,
                "price_czk_max": str(max(price_czk_values)) if price_czk_values else None,
            },
            "artifacts": {
                "backup_path": str(backup_path),
                "report_path": str(report_path),
                "dry_run": False,
            },
            "rows_sample": rows[:5],
            "rows_full_in_backup": True,
        }
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(
            json.dumps(report_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        self.stdout.write(
            f"[MIGRATION] date={migration_date} rate={rate_info['czk_per_eur']} "
            f"({rate_info['source']}) updated={len(rows)} report={report_path}"
        )

    def _handle_reverse(self, options):
        backup_path = Path(options["backup_path"] or "")
        if not backup_path.is_file():
            raise CommandError("--reverse requires existing --backup-path")

        backup = json.loads(backup_path.read_text(encoding="utf-8"))
        rows = backup.get("rows") or []
        with transaction.atomic():
            for row in rows:
                variant = ProductVariant.objects.filter(id=row["variant_id"]).first()
                if variant is None:
                    continue
                variant.price = Decimal(str(row["price_eur"]))
                variant.save(update_fields=["price"])

        self.stdout.write(f"[MIGRATION-REVERSE] restored={len(rows)} from={backup_path}")

    def _resolve_migration_date(self, options) -> date:
        if options["migration_date"]:
            if not settings.DEBUG:
                raise CommandError(
                    "--date is only allowed on staging/tests (DEBUG=True). "
                    "On production omit --date and run after 15:00 Europe/Prague."
                )
            return date.fromisoformat(options["migration_date"])
        return datetime.now(PRAGUE_TZ).date()

    def _resolve_path(self, explicit: str, default_name: str) -> Path:
        if explicit:
            return Path(explicit)
        return ARTIFACTS_DIR / default_name

    def _fetch_rate(self, migration_date: date, options) -> dict:
        fetched_at = datetime.now(PRAGUE_TZ)
        api_url = (
            f"https://api.cnb.cz/cnbapi/exrates/daily?date={migration_date.isoformat()}&lang=EN"
        )

        if options["force_manual_rate"]:
            if not options["manual_rate"]:
                raise CommandError("--force-manual-rate requires --rate")
            rate = Decimal(str(options["manual_rate"]))
            return {
                "source": "manual_override",
                "cnb_valid_for": migration_date.isoformat(),
                "currency_pair": "EUR/CZK",
                "czk_per_eur": str(rate),
                "fetched_at": fetched_at.isoformat(),
                "api_url": api_url,
            }

        try:
            rate = get_czk_per_eur_for_date(migration_date)
        except CnbRateNotAvailableError as exc:
            raise CommandError(
                f"CNB rate for {migration_date} is not available yet ({exc}). "
                "Run again after 15:00 Europe/Prague on the same day."
            ) from exc

        return {
            "source": "cnb_json_api",
            "cnb_valid_for": migration_date.isoformat(),
            "currency_pair": "EUR/CZK",
            "czk_per_eur": str(rate),
            "fetched_at": fetched_at.isoformat(),
            "api_url": api_url,
        }
