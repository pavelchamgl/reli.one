from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, List, Tuple

from py3dbp import Packer, Bin, Item

# Глобальный лимит по весу для всех сервисов (требование: считать только до 20 кг)
GLOBAL_PARCEL_WEIGHT_CAP_KG = Decimal("20.0")

# Лимиты из DPD (см. прайс/описания)
DPD_PUDO_MAX_WEIGHT_KG = Decimal("20.0")
DPD_PUDO_MAX_LENGTH_CM = Decimal("100.0")
DPD_PUDO_MAX_GIRTH_CM  = Decimal("250.0")

DPD_HD_MAX_WEIGHT_KG   = Decimal("31.5")
DPD_HD_MAX_LENGTH_CM   = Decimal("175.0")
DPD_HD_MAX_GIRTH_CM    = Decimal("300.0")

@dataclass(frozen=True)
class DpdLimits:
    max_weight_kg: Decimal
    max_length_cm: Decimal
    max_girth_cm:  Decimal

LIMITS_BY_SERVICE = {
    "PUDO":    DpdLimits(DPD_PUDO_MAX_WEIGHT_KG, DPD_PUDO_MAX_LENGTH_CM, DPD_PUDO_MAX_GIRTH_CM),
    "S2S":     DpdLimits(DPD_PUDO_MAX_WEIGHT_KG, DPD_PUDO_MAX_LENGTH_CM, DPD_PUDO_MAX_GIRTH_CM),
    "S2H":     DpdLimits(DPD_PUDO_MAX_WEIGHT_KG, DPD_PUDO_MAX_LENGTH_CM, DPD_PUDO_MAX_GIRTH_CM),
    "HD":      DpdLimits(DPD_HD_MAX_WEIGHT_KG,   DPD_HD_MAX_LENGTH_CM,  DPD_HD_MAX_GIRTH_CM),
    "CLASSIC": DpdLimits(DPD_HD_MAX_WEIGHT_KG,   DPD_HD_MAX_LENGTH_CM,  DPD_HD_MAX_GIRTH_CM),
    "PRIVATE": DpdLimits(DPD_HD_MAX_WEIGHT_KG,   DPD_HD_MAX_LENGTH_CM,  DPD_HD_MAX_GIRTH_CM),
}

def _girth(l_cm: Decimal, w_cm: Decimal, h_cm: Decimal) -> Decimal:
    return l_cm + (w_cm + h_cm) * 2

def _variant_dims_weight(variant) -> Tuple[Decimal, Decimal, Decimal, Decimal]:
    l = Decimal(variant.length_mm or 0) / 10
    w = Decimal(variant.width_mm  or 0) / 10
    h = Decimal(variant.height_mm or 0) / 10
    kg = Decimal(variant.weight_grams or 0) / Decimal("1000")
    return l, w, h, kg


def _make_bin(name: str, limits: DpdLimits, capacity_kg: Decimal) -> Bin:
    """
    Бин под упаковку: вместимость = MIN(суммарный вес оставшихся единиц,
                                       лимит сервиса,
                                       глобальный лимит 20 кг)
    Размеры бина берём по лимиту сервиса (как и раньше), этого достаточно для py3dbp.
    """
    eff_cap = min(capacity_kg, limits.max_weight_kg, GLOBAL_PARCEL_WEIGHT_CAP_KG)
    L = float(limits.max_length_cm)
    W = float(limits.max_length_cm)
    H = float(limits.max_length_cm)
    return Bin(name, L, W, H, float(eff_cap))


def split_items_into_parcels_dpd(
    items: List[Dict[str, int]],
    variant_map: Dict[str, "ProductVariant"],
    service: str = "HD",
) -> List[List[Dict[str, int]]]:
    svc = service.upper()
    if svc not in LIMITS_BY_SERVICE:
        raise ValueError(f"Unknown DPD service: {service!r}")
    limits = LIMITS_BY_SERVICE[svc]

    # Подготовка атомарных единиц
    atomics: List[Tuple[str, Decimal, Decimal, Decimal, Decimal]] = []
    for it in items:
        sku = it["sku"]
        qty = int(it["quantity"])
        v = variant_map[sku]
        l, w, h, kg = _variant_dims_weight(v)

        # Жёсткая проверка: одна единица не может быть > 20 кг (глобальный лимит)
        if kg > GLOBAL_PARCEL_WEIGHT_CAP_KG:
            raise ValueError(
                f"DPD: item {sku} weighs {kg} kg which exceeds global 20 kg cap for {service}"
            )

        for _ in range(qty):
            atomics.append((sku, l, w, h, kg))

    # Жёсткие pre-checks на каждый атомарный предмет — до вызова py3dbp
    eff_weight_limit = min(limits.max_weight_kg, GLOBAL_PARCEL_WEIGHT_CAP_KG)
    for sku, l, w, h, kg in atomics:
        long_edge = max(l, w, h)
        short_edge = min(l, w, h)
        mid_edge = (l + w + h) - long_edge - short_edge
        girth = _girth(long_edge, short_edge, mid_edge)

        if kg > eff_weight_limit:
            raise ValueError(f"DPD: item {sku} weighs {kg} kg which exceeds {eff_weight_limit} kg for {service}")
        if long_edge > limits.max_length_cm or girth > limits.max_girth_cm:
            raise ValueError(
                f"DPD: item {sku} exceeds size limits for {service} "
                f"(L={long_edge} cm, girth={girth} cm; max L={limits.max_length_cm} cm, max girth={limits.max_girth_cm} cm)"
            )

    parcels: List[List[Tuple[str, Decimal, Decimal, Decimal, Decimal]]] = []
    remaining = list(atomics)

    while remaining:
        packer = Packer()

        # Суммарный вес оставшихся, чтобы не ограничивать бин меньше, чем нужно,
        # но при этом соблюсти лимит 20 кг + лимит сервиса
        cap_kg = sum(x[4] for x in remaining) or Decimal("0.01")
        packer.add_bin(_make_bin("dpd-bin", limits, cap_kg))

        # Добавляем предметы
        for idx, (sku, l, w, h, kg) in enumerate(remaining):
            packer.add_item(Item(
                name=f"{sku}#{idx}",
                width=float(l),
                height=float(w),
                depth=float(h),
                weight=float(kg or Decimal("0.001")),
            ))

        packer.pack(bigger_first=True, number_of_decimals=2)
        used_bin = packer.bins[0]
        packed_names = {it.name for it in used_bin.items}

        name_to_atom = {f"{sku}#{i}": (sku, l, w, h, kg)
                        for i, (sku, l, w, h, kg) in enumerate(remaining)}
        packed, new_remaining = [], []
        for nm, atom in name_to_atom.items():
            (packed if nm in packed_names else new_remaining).append(atom)

        # Валидация веса/габаритов уже у собранного бина
        if packed:
            # считаем по самим предметам, а не по used_bin.items (устраняет зацикливание)
            def approx_stats_from_items(items):
                # консервативно: берём максимум длинной грани среди предметов,
                # и максимальные «среднюю»/«короткую» (upper-bound для габаритов)
                long_edges  = [max(l, w, h) for _, l, w, h, _ in items]
                short_edges = [min(l, w, h) for _, l, w, h, _ in items]
                mid_edges   = [ (l + w + h) - max(l,w,h) - min(l,w,h) for _, l, w, h, _ in items]
                if not items:
                    return Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0")
                L = max(long_edges)
                W = max(mid_edges)
                H = max(short_edges)
                total_kg = sum(x[4] for x in items)
                return L, W, H, total_kg

            eff_weight_limit = min(limits.max_weight_kg, GLOBAL_PARCEL_WEIGHT_CAP_KG)

            # безопасный цикл: пока есть перевес/негабарит — вынимаем «худший» предмет
            while True:
                L, W, H, total_kg = approx_stats_from_items(packed)
                g = _girth(L, W, H)
                overweight = total_kg > eff_weight_limit
                oversize   = (L > limits.max_length_cm) or (g > limits.max_girth_cm)
                if not (overweight or oversize):
                    break
                if not packed:
                    break  # защита

                if overweight:
                    # снять самый тяжёлый
                    packed.sort(key=lambda t: t[4], reverse=True)
                else:
                    # снять с наибольшей длинной гранью
                    packed.sort(key=lambda t: max(t[1], t[2], t[3]), reverse=True)

                new_remaining.append(packed.pop(0))

            if not packed:
                sku, l, w, h, kg = remaining[0]
                long_edge = max(l, w, h)
                short_edge = min(l, w, h)
                mid_edge = (l + w + h) - long_edge - short_edge
                raise ValueError(
                    f"DPD: item {sku} exceeds limits for {service} "
                    f"(weight={kg} kg > {GLOBAL_PARCEL_WEIGHT_CAP_KG} kg or "
                    f"L={long_edge} cm / girth={_girth(long_edge, short_edge, mid_edge)} cm)"
                )

        parcels.append(packed)
        remaining = new_remaining

    # Группируем обратно в {sku, quantity}
    result: List[List[Dict[str, int]]] = []
    for packed in parcels:
        counter: Dict[str, int] = {}
        for sku, *_ in packed:
            counter[sku] = counter.get(sku, 0) + 1
        result.append([{"sku": s, "quantity": q} for s, q in counter.items()])
    return result

