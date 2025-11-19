# delivery/services/gls_split.py
from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, List, Tuple, Optional

from py3dbp import Packer, Bin, Item

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Глобальные лимиты GLS
# ---------------------------------------------------------------------------
# HD (BusinessParcel / EuroBusinessParcel)
GLS_HD_MAX_WEIGHT_KG = Decimal("31.5")
GLS_HD_MAX_LENGTH_CM = Decimal("200.0")
GLS_HD_MAX_GIRTH_CM = Decimal("300.0")

# PUDO (ParcelShop)
GLS_PUDO_MAX_WEIGHT_KG = Decimal("20.0")
GLS_PUDO_MAX_LENGTH_CM = Decimal("100.0")
GLS_PUDO_MAX_GIRTH_CM = Decimal("300.0")

# BOX (Parcel Box / LockerDeliveryService)
# Более жёсткие лимиты по длине (входное отверстие автомата)
GLS_BOX_MAX_WEIGHT_KG = Decimal("20.0")
GLS_BOX_MAX_LENGTH_CM = Decimal("55.0")
GLS_BOX_MAX_GIRTH_CM = Decimal("300.0")


@dataclass(frozen=True)
class GlsLimits:
    max_weight_kg: Decimal
    max_length_cm: Decimal
    max_girth_cm: Decimal


LIMITS_BY_SERVICE_GLS: Dict[str, GlsLimits] = {
    "HD": GlsLimits(
        max_weight_kg=GLS_HD_MAX_WEIGHT_KG,
        max_length_cm=GLS_HD_MAX_LENGTH_CM,
        max_girth_cm=GLS_HD_MAX_GIRTH_CM,
    ),
    "PUDO": GlsLimits(
        max_weight_kg=GLS_PUDO_MAX_WEIGHT_KG,
        max_length_cm=GLS_PUDO_MAX_LENGTH_CM,
        max_girth_cm=GLS_PUDO_MAX_GIRTH_CM,
    ),
    "BOX": GlsLimits(
        max_weight_kg=GLS_BOX_MAX_WEIGHT_KG,
        max_length_cm=GLS_BOX_MAX_LENGTH_CM,
        max_girth_cm=GLS_BOX_MAX_GIRTH_CM,
    ),
}


def _girth(l_cm: Decimal, w_cm: Decimal, h_cm: Decimal) -> Decimal:
    """Обхват посылки: L + 2*(W + H)."""
    return l_cm + (w_cm + h_cm) * 2


def _variant_dims_weight(variant) -> Tuple[Decimal, Decimal, Decimal, Decimal]:
    """
    Преобразует размеры варианта:
      • мм → см
      • граммы → килограммы
    Минимум 0.1 см по каждой стороне, чтобы py3dbp не падал.
    """

    def _cm(x) -> Decimal:
        return max(Decimal(x or 0) / 10, Decimal("0.1"))

    l = _cm(variant.length_mm)
    w = _cm(variant.width_mm)
    h = _cm(variant.height_mm)
    kg = max(Decimal(variant.weight_grams or 0) / Decimal("1000"), Decimal("0.001"))
    return l, w, h, kg


# ---------------------------------------------------------------------------
# Реалистичные коробки GLS
# ---------------------------------------------------------------------------
# HD-коробки (используются для BusinessParcel/EuroBusinessParcel)
GLS_HD_CARTONS_CM: List[Tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("60"),  Decimal("40"), Decimal("40")),  # girth=220
    (Decimal("80"),  Decimal("40"), Decimal("40")),  # 240
    (Decimal("100"), Decimal("50"), Decimal("40")),  # 280
    (Decimal("120"), Decimal("50"), Decimal("40")),  # 300
    (Decimal("150"), Decimal("40"), Decimal("30")),  # 290
    (Decimal("200"), Decimal("40"), Decimal("30")),  # 340 (отсечётся по girth)
]

# PUDO-коробки (ParcelShop: длина до 100 см, вес до 20 кг)
GLS_PUDO_CARTONS_CM: List[Tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("60"),  Decimal("40"), Decimal("40")),  # girth=220
    (Decimal("80"),  Decimal("40"), Decimal("40")),  # 240
    (Decimal("100"), Decimal("50"), Decimal("40")),  # 280 (максимум по длине)
]

# BOX-коробки (ParcelBox: длина до 55 см, вес до 20 кг)
# Отдельный набор под ограничения автомата (входной проём).
GLS_BOX_CARTONS_CM: List[Tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("55"), Decimal("40"), Decimal("40")),  # girth=215
    (Decimal("45"), Decimal("35"), Decimal("25")),  # girth=165
    (Decimal("35"), Decimal("30"), Decimal("20")),  # girth=145
]


def _cartons_for_service_gls(service: str, limits: GlsLimits) -> List[Tuple[Decimal, Decimal, Decimal]]:
    """
    Возвращает отсортированный и ОТФИЛЬТРОВАННЫЙ список коробок,
    подходящих под лимиты GLS (длина и girth) для конкретного сервиса.
    """
    svc = service.upper()
    if svc == "PUDO":
        base_cartons = GLS_PUDO_CARTONS_CM
    elif svc == "BOX":
        base_cartons = GLS_BOX_CARTONS_CM
    else:
        # по умолчанию HD
        base_cartons = GLS_HD_CARTONS_CM

    cartons_sorted = sorted(base_cartons, key=lambda x: (x[0] * x[1] * x[2]))

    filtered: List[Tuple[Decimal, Decimal, Decimal]] = []
    for Lc, Wc, Hc in cartons_sorted:
        g = _girth(Lc, Wc, Hc)
        if g <= limits.max_girth_cm and max(Lc, Wc, Hc) <= limits.max_length_cm:
            filtered.append((Lc, Wc, Hc))
        else:
            logger.debug(
                "GLS split: skip carton %sx%sx%s cm (girth=%.1f) "
                "exceeds limits L<=%s, girth<=%s (service=%s)",
                Lc,
                Wc,
                Hc,
                g,
                limits.max_length_cm,
                limits.max_girth_cm,
                svc,
            )

    if not filtered:
        raise ValueError(f"GLS: no cartons fit limits for service {svc}")

    logger.debug("GLS split: cartons for %s -> %s", svc, filtered)
    return filtered


def _fits_any_carton(
    l: Decimal,
    w: Decimal,
    h: Decimal,
    cartons: List[Tuple[Decimal, Decimal, Decimal]],
) -> bool:
    """Проверка, что единица товара влезает хотя бы в одну коробку."""
    dims = sorted([l, w, h], reverse=True)
    for Lc, Wc, Hc in cartons:
        box = sorted([Lc, Wc, Hc], reverse=True)
        if dims[0] <= box[0] and dims[1] <= box[1] and dims[2] <= box[2]:
            return True
    return False


def _mk_bin_gls(name: str, L: Decimal, W: Decimal, H: Decimal, limits: GlsLimits) -> Bin:
    """Создаёт Bin для py3dbp с ограничением по весу из лимитов сервиса."""
    eff_cap = float(limits.max_weight_kg)
    logger.debug(
        "GLS split: add bin %s size=%sx%sx%s cm, cap=%.3f kg",
        name,
        L,
        W,
        H,
        eff_cap,
    )
    return Bin(name, float(L), float(W), float(H), eff_cap)


def _calc_fill_efficiency(bin_obj: Bin) -> Decimal:
    """
    Рассчитывает процент заполнения коробки (fill efficiency).
    = (сумма объёмов предметов / объём коробки) * 100
    """
    if not bin_obj.items:
        return Decimal("0.0")

    total_item_volume = sum(
        Decimal(str(it.width)) * Decimal(str(it.height)) * Decimal(str(it.depth))
        for it in bin_obj.items
    )
    bin_volume = (
        Decimal(str(bin_obj.width))
        * Decimal(str(bin_obj.height))
        * Decimal(str(bin_obj.depth))
    )

    if bin_volume == 0:
        return Decimal("0.0")

    efficiency = (total_item_volume / bin_volume) * Decimal("100")
    return efficiency.quantize(Decimal("0.1"))


def split_items_into_parcels_gls(
    items: List[Dict[str, int]],
    variant_map: Optional[Dict[str, "ProductVariant"]] = None,
    service: str = "HD",
    country: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Возвращает список посылок для GLS в формате, удобном для тарификатора.

    Каждая посылка — dict формата:
    {
        "items": [{"sku": "...", "quantity": N}, ...],
        "weight_kg": Decimal,
        "length_cm": Decimal,
        "width_cm": Decimal,
        "height_cm": Decimal,
        "sum_sides": Decimal,  # L + W + H
        "girth_cm": Decimal,   # L + 2*(W + H)
        "fill": Decimal,       # заполняемость коробки в %
    }

    Параметр service:
      • "HD"   — сплит по лимитам BusinessParcel/EuroBusinessParcel
      • "PUDO" — сплит по лимитам ParcelShop (≤20 кг, L≤100 см)
      • "BOX"  — сплит по лимитам Parcel Box (≤20 кг, L≤55 см)
    """
    svc = service.upper()
    if svc not in LIMITS_BY_SERVICE_GLS:
        raise ValueError(f"Unknown GLS service: {service!r}")

    limits = LIMITS_BY_SERVICE_GLS[svc]

    if variant_map is None:
        from product.models import ProductVariant

        skus = [str(it["sku"]) for it in items]
        variant_map = {v.sku: v for v in ProductVariant.objects.filter(sku__in=skus)}

    logger.info("GLS split start: service=%s, country=%s, items=%s", svc, country, items)

    cartons = _cartons_for_service_gls(svc, limits)

    # Подготовим атомарные юниты: поштучно каждая единица товара
    atomics: List[Tuple[str, Decimal, Decimal, Decimal, Decimal]] = []
    for it in items:
        sku = str(it["sku"])
        qty = int(it.get("quantity", 0))
        if qty <= 0:
            continue

        v = variant_map[sku]
        l, w, h, kg = _variant_dims_weight(v)
        logger.debug(
            "GLS split item: sku=%s qty=%s dims=%sx%sx%s cm weight=%s kg",
            sku,
            qty,
            l,
            w,
            h,
            kg,
        )

        # Жёстная проверка веса на уровне юнита
        if kg > limits.max_weight_kg:
            raise ValueError(
                f"GLS {svc}: SKU {sku} weighs {kg} kg > {limits.max_weight_kg} kg (per-unit)"
            )

        # Проверка влезания в любую коробку данного сервиса
        if not _fits_any_carton(l, w, h, cartons):
            raise ValueError(
                f"GLS {svc}: SKU {sku} size {l}×{w}×{h} cm doesn't fit any carton "
                f"(max length={limits.max_length_cm} cm, max girth={limits.max_girth_cm} cm)"
            )

        for _ in range(qty):
            atomics.append((sku, l, w, h, kg))

    if not atomics:
        logger.info("GLS split: no atomics (empty items)")
        return []

    parcels: List[Dict[str, Any]] = []
    remaining = list(atomics)
    safety_counter = 0

    while remaining:
        safety_counter += 1
        if safety_counter > 1000:
            raise RuntimeError(f"GLS {svc} packing: safety guard triggered")

        logger.debug(
            "GLS split loop #%d (service=%s): remaining items=%d",
            safety_counter,
            svc,
            len(remaining),
        )

        packer = Packer()

        # Добавляем все коробки для сервиса
        for idx, (Lc, Wc, Hc) in enumerate(cartons):
            packer.add_bin(_mk_bin_gls(f"{svc}-bin-{idx}", Lc, Wc, Hc, limits))

        # Добавляем все оставшиеся предметы
        for i, (sku, l, w, h, kg) in enumerate(remaining):
            packer.add_item(
                Item(
                    name=f"{sku}#{i}",
                    width=float(l),
                    height=float(w),
                    depth=float(h),
                    weight=float(kg),
                )
            )

        packer.pack(bigger_first=True, distribute_items=True, number_of_decimals=2)

        packed_names = set()

        for b in packer.bins:
            if not b.items:
                continue

            bin_weight = sum(Decimal(str(it.weight)) for it in b.items)
            L = Decimal(str(b.width))
            W = Decimal(str(b.height))
            H = Decimal(str(b.depth))
            g = _girth(L, W, H)
            fill_eff = _calc_fill_efficiency(b)

            logger.info(
                "GLS split bin (%s): %s items=%d weight=%.3f kg "
                "size=%sx%sx%s cm girth=%.1f (fill=%.1f%%, limits: L<=%s, girth<=%s, weight<=%s)",
                svc,
                b.name,
                len(b.items),
                bin_weight,
                L,
                W,
                H,
                g,
                fill_eff,
                limits.max_length_cm,
                limits.max_girth_cm,
                limits.max_weight_kg,
            )

            # Проверка/коррекция веса: если перевес — выкидываем самые тяжёлые элементы обратно
            while bin_weight > limits.max_weight_kg + Decimal("0.001") and b.items:
                b.items.sort(key=lambda it: Decimal(str(it.weight)), reverse=True)
                itm = b.items.pop(0)
                packer.unfit_items.append(itm)
                bin_weight = sum(Decimal(str(x.weight)) for x in b.items)
                logger.debug(
                    "GLS split (%s): pop overweight item %s, new bin_weight=%.3f",
                    svc,
                    itm.name,
                    bin_weight,
                )

            if not b.items:
                # Если всё выкинули из-за веса — этот bin пропускаем
                continue

            # Базовая проверка лимитов коробки (на случай патологий)
            if g > limits.max_girth_cm or max(L, W, H) > limits.max_length_cm:
                logger.error(
                    "GLS packing error (%s): bin %s exceeds limits "
                    "(size=%sx%sx%s cm, girth=%.1f, limits: L<=%s, girth<=%s)",
                    svc,
                    b.name,
                    L,
                    W,
                    H,
                    g,
                    limits.max_length_cm,
                    limits.max_girth_cm,
                )
                raise ValueError(
                    f"GLS packing error ({svc}): bin {b.name} exceeds GLS limits "
                    f"(size {L}×{W}×{H} cm, girth {g})"
                )

            # Собираем имена упакованных юнитов
            packed_names.update(x.name for x in b.items)

            # Агрегируем по SKU внутри посылки
            sku_counter: Dict[str, int] = {}
            for x in b.items:
                sku_name = x.name.split("#")[0]
                sku_counter[sku_name] = sku_counter.get(sku_name, 0) + 1

            items_list = [{"sku": s, "quantity": q} for s, q in sku_counter.items()]

            parcel_info: Dict[str, Any] = {
                "items": items_list,
                "weight_kg": bin_weight.quantize(Decimal("0.001")),
                "length_cm": L,
                "width_cm": W,
                "height_cm": H,
                "sum_sides": L + W + H,
                "girth_cm": g,
                "fill": fill_eff,
            }
            parcels.append(parcel_info)

        # Пересобираем remaining, выбрасывая уже упакованные
        name_to_atom = {
            f"{sku}#{i}": (sku, l, w, h, kg)
            for i, (sku, l, w, h, kg) in enumerate(remaining)
        }
        new_remaining: List[Tuple[str, Decimal, Decimal, Decimal, Decimal]] = [
            atom for nm, atom in name_to_atom.items() if nm not in packed_names
        ]

        if len(new_remaining) == len(remaining):
            # Ничего не упаковали — тупик, вываливаем ошибку
            bad = new_remaining[0]
            sku, l, w, h, kg = bad
            logger.error(
                "GLS packing error (%s): can't place %s (dims %sx%sx%s cm, %s kg)",
                svc,
                sku,
                l,
                w,
                h,
                kg,
            )
            raise ValueError(
                f"GLS packing error ({svc}): SKU {sku} (size {l}×{w}×{h} cm, {kg} kg) "
                f"couldn't be placed into any carton."
            )

        remaining = new_remaining

    # Финальный лог по посылкам
    for idx, parcel in enumerate(parcels, start=1):
        logger.info("GLS split (%s) parcel #%d contents: %s", svc, idx, parcel["items"])

    logger.info("GLS split done: service=%s, parcels=%d", svc, len(parcels))
    return parcels
