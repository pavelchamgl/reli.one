from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, List, Tuple, Optional
from py3dbp import Packer, Bin, Item


logger = logging.getLogger(__name__)

# --- Глобальные лимиты ---
GLOBAL_PARCEL_WEIGHT_CAP_KG = Decimal("20.0")  # временно для всех сервисов

# Лимиты DPD (по прайсу)
DPD_PUDO_MAX_WEIGHT_KG = Decimal("20.0")
DPD_PUDO_MAX_LENGTH_CM = Decimal("100.0")
DPD_PUDO_MAX_GIRTH_CM  = Decimal("250.0")

DPD_HD_MAX_WEIGHT_KG   = Decimal("31.5")  # по DPD, но сейчас режем глобально до 20
DPD_HD_MAX_LENGTH_CM   = Decimal("175.0")
DPD_HD_MAX_GIRTH_CM    = Decimal("300.0")


@dataclass(frozen=True)
class DpdLimits:
    max_weight_kg: Decimal
    max_length_cm: Decimal
    max_girth_cm:  Decimal


# --- Ограничения по сервисам ---
LIMITS_BY_SERVICE: Dict[str, DpdLimits] = {
    "PUDO":    DpdLimits(DPD_PUDO_MAX_WEIGHT_KG, DPD_PUDO_MAX_LENGTH_CM, DPD_PUDO_MAX_GIRTH_CM),
    "S2S":     DpdLimits(DPD_PUDO_MAX_WEIGHT_KG, DPD_PUDO_MAX_LENGTH_CM, DPD_PUDO_MAX_GIRTH_CM),
    "S2H":     DpdLimits(DPD_PUDO_MAX_WEIGHT_KG, DPD_PUDO_MAX_LENGTH_CM, DPD_PUDO_MAX_GIRTH_CM),
    "HD":      DpdLimits(DPD_HD_MAX_WEIGHT_KG,   DPD_HD_MAX_LENGTH_CM,  DPD_HD_MAX_GIRTH_CM),
    "CLASSIC": DpdLimits(DPD_HD_MAX_WEIGHT_KG,   DPD_HD_MAX_LENGTH_CM,  DPD_HD_MAX_GIRTH_CM),
    "PRIVATE": DpdLimits(DPD_HD_MAX_WEIGHT_KG,   DPD_HD_MAX_LENGTH_CM,  DPD_HD_MAX_GIRTH_CM),
}


def _girth(l_cm: Decimal, w_cm: Decimal, h_cm: Decimal) -> Decimal:
    """Обхват посылки: L + 2*(W + H)."""
    return l_cm + (w_cm + h_cm) * 2


def _variant_dims_weight(variant) -> Tuple[Decimal, Decimal, Decimal, Decimal]:
    """
    Возвращает (L, W, H, kg) в сантиметрах/килограммах.
    Минимальная грань 0.1 см чтобы py3dbp не «съедал» нулевые размеры.
    """
    def _cm(x): return max(Decimal(x or 0) / 10, Decimal("0.1"))
    l = _cm(variant.length_mm)
    w = _cm(variant.width_mm)
    h = _cm(variant.height_mm)
    kg = max(Decimal(variant.weight_grams or 0) / Decimal("1000"), Decimal("0.001"))
    return l, w, h, kg


# --- Каталог реалистичных коробок под ограничения DPD ---
# Все размеры в см; весовой лимит задаём при создании бина (20 кг).
PICKUP_CARTONS_CM: List[Tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("60"),  Decimal("40"), Decimal("30")),  # girth=200
    (Decimal("80"),  Decimal("40"), Decimal("30")),  # 220
    (Decimal("100"), Decimal("35"), Decimal("30")),  # 230
    (Decimal("100"), Decimal("40"), Decimal("25")),  # 230
    (Decimal("90"),  Decimal("45"), Decimal("25")),  # 230
]

HD_CARTONS_CM: List[Tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("120"), Decimal("50"), Decimal("40")),  # 300
    (Decimal("150"), Decimal("40"), Decimal("30")),  # 290
    (Decimal("100"), Decimal("50"), Decimal("50")),  # 300
    (Decimal("140"), Decimal("35"), Decimal("30")),  # 270
]


def _cartons_for_service(service: str) -> List[Tuple[Decimal, Decimal, Decimal]]:
    svc = service.upper()
    cartons = (PICKUP_CARTONS_CM if svc in ("PUDO", "S2S", "S2H") else HD_CARTONS_CM)
    cartons_sorted = sorted(cartons, key=lambda x: (x[0]*x[1]*x[2]))  # компактные вперёд
    logger.debug("DPD split: cartons for %s -> %s", svc, cartons_sorted)
    return cartons_sorted


def _fits_any_carton(l: Decimal, w: Decimal, h: Decimal, cartons: List[Tuple[Decimal, Decimal, Decimal]]) -> bool:
    dims = sorted([l, w, h], reverse=True)  # L >= W >= H
    for Lc, Wc, Hc in cartons:
        box = sorted([Lc, Wc, Hc], reverse=True)
        if dims[0] <= box[0] and dims[1] <= box[1] and dims[2] <= box[2]:
            return True
    return False


def _mk_bin(name: str, L: Decimal, W: Decimal, H: Decimal, limits: DpdLimits) -> Bin:
    eff_cap = float(min(limits.max_weight_kg, GLOBAL_PARCEL_WEIGHT_CAP_KG))
    logger.debug("DPD split: add bin %s size=%sx%sx%s cm, cap=%.3f kg", name, L, W, H, eff_cap)
    return Bin(name, float(L), float(W), float(H), eff_cap)


def split_items_into_parcels_dpd(
    items: List[Dict[str, int]],
    variant_map: Dict[str, "ProductVariant"],
    service: str = "HD",
    country: Optional[str] = None,
) -> List[List[Dict[str, int]]]:
    svc = service.upper()
    if svc not in LIMITS_BY_SERVICE:
        raise ValueError(f"Unknown DPD service: {service!r}")
    limits = LIMITS_BY_SERVICE[svc]

    logger.info("DPD split start: service=%s, country=%s, items=%s", svc, country, items)

    cartons = _cartons_for_service(svc)

    # Подготовим атомарные единицы
    atomics: List[Tuple[str, Decimal, Decimal, Decimal, Decimal]] = []
    for it in items:
        sku = it["sku"]
        qty = int(it.get("quantity", 0))
        if qty <= 0:
            continue
        v = variant_map[sku]
        l, w, h, kg = _variant_dims_weight(v)
        logger.debug("DPD split item: sku=%s qty=%s dims=%sx%sx%s cm weight=%s kg", sku, qty, l, w, h, kg)

        if kg > GLOBAL_PARCEL_WEIGHT_CAP_KG:
            raise ValueError(f"DPD: SKU {sku} weighs {kg} kg > {GLOBAL_PARCEL_WEIGHT_CAP_KG} kg (per-unit)")

        if not _fits_any_carton(l, w, h, cartons):
            raise ValueError(
                f"DPD: SKU {sku} size {l}×{w}×{h} cm doesn't fit any {svc} carton "
                f"(max length={limits.max_length_cm} cm, max girth={limits.max_girth_cm} cm)"
            )

        for _ in range(qty):
            atomics.append((sku, l, w, h, kg))

    if not atomics:
        logger.info("DPD split: no atomics (empty items)")
        return []

    parcels: List[List[Tuple[str, Decimal, Decimal, Decimal, Decimal]]] = []
    remaining = list(atomics)
    safety_counter = 0

    while remaining:
        safety_counter += 1
        if safety_counter > 1000:
            raise RuntimeError("DPD packing: safety guard triggered")
        logger.debug("DPD split loop #%d: remaining items=%d", safety_counter, len(remaining))

        packer = Packer()

        # Партия коробок (по одной каждого типоразмера)
        for idx, (Lc, Wc, Hc) in enumerate(cartons):
            packer.add_bin(_mk_bin(f"{svc}-bin-{idx}", Lc, Wc, Hc, limits))

        # Все оставшиеся предметы
        for i, (sku, l, w, h, kg) in enumerate(remaining):
            packer.add_item(Item(
                name=f"{sku}#{i}",
                width=float(l),
                height=float(w),
                depth=float(h),
                weight=float(kg),
            ))

        packer.pack(bigger_first=True, distribute_items=True, number_of_decimals=2)

        packed_names = set()
        used_bins = 0

        for b in packer.bins:
            if not b.items:
                continue
            used_bins += 1
            bin_weight = sum(Decimal(str(it.weight)) for it in b.items)
            L = Decimal(str(b.width))
            W = Decimal(str(b.height))
            H = Decimal(str(b.depth))
            g = _girth(L, W, H)
            logger.info(
                "DPD split bin: %s items=%d weight=%.3f kg size=%sx%sx%s cm girth=%.1f (limits: L<=%s, girth<=%s, weight<=%s)",
                b.name, len(b.items), bin_weight, L, W, H, g,
                limits.max_length_cm, limits.max_girth_cm, min(limits.max_weight_kg, GLOBAL_PARCEL_WEIGHT_CAP_KG)
            )

            # страховка от перенабора по весу
            while bin_weight > min(limits.max_weight_kg, GLOBAL_PARCEL_WEIGHT_CAP_KG) + Decimal("0.001") and b.items:
                b.items.sort(key=lambda it: Decimal(str(it.weight)), reverse=True)
                itm = b.items.pop(0)
                packer.unfit_items.append(itm)
                bin_weight = sum(Decimal(str(x.weight)) for x in b.items)
                logger.debug("DPD split: pop overweight item %s, new bin_weight=%.3f", itm.name, bin_weight)

            packed_names.update(x.name for x in b.items)
            parcels.append([(x.name.split("#")[0], Decimal(str(x.width)),
                             Decimal(str(x.height)), Decimal(str(x.depth)),
                             Decimal(str(x.weight))) for x in b.items])

        logger.debug("DPD split: used_bins=%d, packed_names=%d", used_bins, len(packed_names))

        name_to_atom = {f"{sku}#{i}": (sku, l, w, h, kg)
                        for i, (sku, l, w, h, kg) in enumerate(remaining)}
        new_remaining: List[Tuple[str, Decimal, Decimal, Decimal, Decimal]] = [
            atom for nm, atom in name_to_atom.items() if nm not in packed_names
        ]

        if len(new_remaining) == len(remaining):
            bad = new_remaining[0]
            sku, l, w, h, kg = bad
            logger.error("DPD packing error: can't place %s (dims %sx%sx%s cm, %s kg)", sku, l, w, h, kg)
            raise ValueError(
                f"DPD packing error: SKU {sku} (size {l}×{w}×{h} cm, {kg} kg) "
                f"couldn't be placed into any {svc} carton."
            )

        remaining = new_remaining

    # Агрегация {sku, quantity}
    result: List[List[Dict[str, int]]] = []
    for idx, packed in enumerate(parcels, start=1):
        counter: Dict[str, int] = {}
        for sku, *_ in packed:
            counter[sku] = counter.get(sku, 0) + 1
        result.append([{"sku": s, "quantity": q} for s, q in counter.items()])
        logger.info("DPD split parcel #%d contents: %s", idx, result[-1])

    logger.info("DPD split done: parcels=%d", len(result))
    return result
