import json
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.core.management.base import BaseCommand, CommandError

from order.models import CourierService
from delivery.models import ShippingRate


def q2(x) -> Decimal:
    return Decimal(str(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# Доместик (CZ -> CZ): границы в прайсе совпадают с нашей сеткой
DOMESTIC_LIMIT_MAP = {
    Decimal("1.0"): "1",
    Decimal("3.0"): "3",
    Decimal("10.0"): "10",
    Decimal("20.0"): "20",
    Decimal("31.5"): "31_5",
}

# Экспорт: прайс даёт 0–1, 1–3, 3–10, 10–20, 20–31.5
INTERNATIONAL_LIMIT_MAP = {
    Decimal("1.0"): "1",
    Decimal("3.0"): "3",
    Decimal("10.0"): "10",
    Decimal("20.0"): "20",
    Decimal("31.5"): "31_5",
}


def _norm_limit_key(k) -> Decimal:
    """ '1'->1, 1->1, '31_5'->31.5, '31.5'->31.5 """
    s = str(k).strip().replace("_", ".")
    return Decimal(s)


def map_limit_code(is_intl: bool, threshold_kg: Decimal) -> str:
    """
    threshold_kg — правый порог интервала из JSON (1, 3, 5, 10, 20, 31.5).
    Возвращает код для ShippingRate.weight_limit.
    """
    table = INTERNATIONAL_LIMIT_MAP if is_intl else DOMESTIC_LIMIT_MAP
    if threshold_kg in table:
        return table[threshold_kg]
    for bound in sorted(table.keys()):
        if threshold_kg <= bound:
            return table[bound]
    return "over_limit"


def upsert_rate(
    *,
    courier: CourierService,
    country: str,
    channel: str,          # "HD" | "PUDO"
    weight_code: str,
    price_czk,
    bundle: str = "one",
):
    ShippingRate.objects.update_or_create(
        courier_service=courier,
        country=country.upper(),
        channel=channel,
        category="standard",
        weight_limit=weight_code,
        address_bundle=bundle,
        defaults={
            "category": "standard",
            "price": q2(price_czk),    # CZK, без конверсии
            "cod_fee": Decimal("0.00"),
            "estimate": "",
            "address_bundle": bundle,
        },
    )


class Command(BaseCommand):
    help = "Load DPD tariffs from dpd_rates.json (CZK) into ShippingRate."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default="delivery/data/dpd_rates.json",
            help="Path to dpd_rates.json",
            dest="path",
        )
        parser.add_argument(
            "--courier-name",
            default="DPD",
            help="CourierService.name to attach rates to (must exist)",
            dest="courier_name",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.exists():
            raise CommandError(f"File not found: {path}")

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise CommandError(f"JSON parse error: {e}")

        try:
            courier = CourierService.objects.get(name=options["courier_name"])
        except CourierService.DoesNotExist:
            raise CommandError(f"CourierService '{options['courier_name']}' not found")

        created_before = ShippingRate.objects.filter(courier_service=courier).count()

        # === 1) Domestic CZ ===
        domestic = data.get("domestic") or {}
        cz_block = domestic.get("CZ") or domestic.get("cz")
        if cz_block:
            # classic -> HD
            for limit_key, price in (cz_block.get("classic") or {}).items():
                thr = _norm_limit_key(limit_key)
                weight_code = map_limit_code(False, thr)
                upsert_rate(courier=courier, country="CZ", channel="HD",
                            weight_code=weight_code, price_czk=price)

            # shop2shop -> PUDO (hand-in ≤ 20 кг)
            for limit_key, price in (cz_block.get("shop2shop") or {}).items():
                thr = _norm_limit_key(limit_key)
                if thr > Decimal("20"):
                    continue
                weight_code = map_limit_code(False, thr)
                upsert_rate(courier=courier, country="CZ", channel="PUDO",
                            weight_code=weight_code, price_czk=price)

            # shop2home -> HD (hand-in ≤ 20 кг)
            for limit_key, price in (cz_block.get("shop2home") or {}).items():
                thr = _norm_limit_key(limit_key)
                if thr > Decimal("20"):
                    continue
                weight_code = map_limit_code(False, thr)
                upsert_rate(courier=courier, country="CZ", channel="HD",
                            weight_code=weight_code, price_czk=price)

        # === 2) Export Classic + Pickup hand-in ===
        export = data.get("export") or {}

        # classic -> HD
        for cc, block in export.items():
            for limit_key, price in (block.get("classic") or {}).items():
                thr = _norm_limit_key(limit_key)
                weight_code = map_limit_code(True, thr)
                upsert_rate(courier=courier, country=cc, channel="HD",
                            weight_code=weight_code, price_czk=price)

        # pickup_handin -> HD (обычно до 10 кг; оставим ≤20 как верхнюю страховку)
        for cc, block in export.items():
            handin = block.get("pickup_handin") or {}
            for limit_key, price in handin.items():
                thr = _norm_limit_key(limit_key)
                if thr > Decimal("20"):
                    continue
                weight_code = map_limit_code(True, thr)
                upsert_rate(courier=courier, country=cc, channel="HD",
                            weight_code=weight_code, price_czk=price)

        # === 3) Hand-in cluster overrides (имеют приоритет над export.pickup_handin)
        cluster = data.get("handin_cluster") or {}

        # S2S -> PUDO (обычно до 10 кг в JSON)
        s2s_countries = set(cluster.get("s2s_countries") or [])
        s2s_table = cluster.get("shop2shop") or {}
        for cc in s2s_countries:
            table = s2s_table.get(cc) or {}
            for limit_key, price in table.items():
                thr = _norm_limit_key(limit_key)
                if thr > Decimal("20"):
                    continue
                weight_code = map_limit_code(True, thr)
                upsert_rate(courier=courier, country=cc, channel="PUDO",
                            weight_code=weight_code, price_czk=price)

        # S2H -> HD (обычно до 10 кг в JSON)
        s2h_countries = set(cluster.get("s2h_countries") or [])
        s2h_table = cluster.get("shop2home") or {}
        for cc in s2h_countries:
            table = s2h_table.get(cc) or {}
            for limit_key, price in table.items():
                thr = _norm_limit_key(limit_key)
                if thr > Decimal("20"):
                    continue
                weight_code = map_limit_code(True, thr)
                upsert_rate(courier=courier, country=cc, channel="HD",
                            weight_code=weight_code, price_czk=price)

        created_after = ShippingRate.objects.filter(courier_service=courier).count()
        delta = created_after - created_before
        self.stdout.write(self.style.SUCCESS(
            f"DPD rates loaded/upserted (CZK). total_now={created_after}, delta={delta}"
        ))
