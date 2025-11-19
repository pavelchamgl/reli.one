import logging
from decimal import Decimal
from typing import List, Dict, Tuple

from product.models import ProductVariant
from .local_rates import calculate_shipping_options  # Packeta (Zásilkovna)

logger = logging.getLogger(__name__)

# ----- Пороговые значения Packeta (из прайса) -----
# «Обычные» (standard/oversized) — то, что можно оценивать как PUDO или HD ≤ 15 кг
NORMAL_MAX_WEIGHT_KG = Decimal("15.00")
NORMAL_MAX_SIDE_CM = Decimal("120.00")
NORMAL_MAX_SUM_SIDES_CM = Decimal("150.00")

# «Extended» — только HD, до 30 кг
EXT_MAX_WEIGHT_KG = Decimal("30.00")
EXT_MAX_SIDE_CM = Decimal("120.00")
EXT_MAX_SUM_SIDES_CM = Decimal("999.00")  # крупногабарит Packeta (только HD)

# Тип для состояния «ящика» (внутренний контейнер в процессе упаковки)
# (L, W, H, weight, items)
ParcelState = Tuple[Decimal, Decimal, Decimal, Decimal, List[Dict]]


# ===================== ВСПОМОГАТЕЛЬНЫЕ =====================

def _get_variant_map(skus: List[str]):
    """Достаём все варианты одним запросом, мапим по SKU (строка!)."""
    variants = ProductVariant.objects.filter(sku__in=skus)
    return {str(v.sku): v for v in variants}


def _dims_kg(v: ProductVariant):
    """Возвращает (L, W, H, KG) в сантиметрах и килограммах из миллиметров/граммов."""
    L = (Decimal(v.length_mm or 0) / Decimal("10"))
    W = (Decimal(v.width_mm or 0) / Decimal("10"))
    H = (Decimal(v.height_mm or 0) / Decimal("10"))
    KG = (Decimal(v.weight_grams or 0) / Decimal("1000"))
    return L, W, H, KG


def _fits(l: Decimal, w: Decimal, h: Decimal, kg: Decimal,
          max_kg: Decimal, max_side: Decimal, max_sum: Decimal) -> bool:
    """Проверка лимитов: вес, максимальная сторона и сумма сторон."""
    sum_sides = l + w + h
    max_s = max(l, w, h)
    return (kg <= max_kg) and (max_s <= max_side) and (sum_sides <= max_sum)


def _try_place_into_bins(unit: Dict,
                         bins: List[ParcelState],
                         vmap,
                         max_kg: Decimal,
                         max_side: Decimal,
                         max_sum: Decimal) -> bool:
    """
    Пытается положить юнит в существующие «ящики» (посылки) по жадной стратегии «рост по высоте».
    Если помещается — обновляет габариты/вес и добавляет юнит, возвращает True.
    """
    v = vmap[unit["sku"]]
    l, w, h, kg = _dims_kg(v)

    for idx, (bl, bw, bh, bkg, items_list) in enumerate(bins):
        nl = max(bl, l)
        nw = max(bw, w)
        nh = bh + h
        nkw = bkg + kg

        if _fits(nl, nw, nh, nkw, max_kg, max_side, max_sum):
            bins[idx] = (nl, nw, nh, nkw, items_list + [unit])
            return True

    return False


def _pack_units(units: List[Dict],
                vmap,
                max_kg: Decimal,
                max_side: Decimal,
                max_sum: Decimal) -> List[List[Dict]]:
    """
    Упаковка юнитов в несколько посылок с заданными лимитами.
    Эвристика:
      - сортируем по убыванию объёма (L*W*H) и веса (крупные вперёд),
      - кладём в первый «ящик», куда влезает; иначе открываем новый.
    """
    def _key(u: Dict):
        vv = vmap[u["sku"]]
        L, W, H, KG = _dims_kg(vv)
        return (-(L * W * H), -KG)

    units_sorted = sorted(units, key=_key)

    bins: List[ParcelState] = []  # (L, W, H, kg, items)
    for u in units_sorted:
        placed = _try_place_into_bins(u, bins, vmap, max_kg, max_side, max_sum)
        if not placed:
            L, W, H, KG = _dims_kg(vmap[u["sku"]])
            # открываем новый «ящик»
            bins.append((L, W, H, KG, [u]))

    parcels: List[List[Dict]] = []
    for i, (l, w, h, kg, items_list) in enumerate(bins, start=1):
        parcels.append(items_list)
        logger.info(
            "shipping_split Packeta pack parcel #%d: %d items weight=%.3f kg size=%.1fx%.1fx%.1f cm (sum=%.1f, max=%.1f)",
            i, len(items_list), kg, l, w, h, (l + w + h), max(l, w, h)
        )
    return parcels


# ===================== ОСНОВНОЙ СПЛИТ =====================

def split_items_into_parcels(country: str, items: List[Dict], cod: bool, currency: str) -> List[List[Dict]]:
    """
    Двухступенчатый сплит для Packeta (Zásilkovna):

      1) Разворачиваем вход в unit-товары: [{"sku": "...", "quantity": 1}, ...].
      2) Делим на две очереди по ОДИНОЧНЫМ лимитам:
         - normal: то, что само по себе влазит в «обычные» (≤15 кг, Σ≤150, max side ≤120)
         - extended: всё остальное (только HD Extended)
      3) Упаковываем normal в посылки `_pack_units(... NORMAL ...)`.
      4) Упаковываем extended в посылки `_pack_units(... EXT ...)`.
      5) Возвращаем список посылок: List[List[Dict]].

    Важно: возвращаем всегда список посылок, где каждая посылка — список юнитов
           вида {"sku": <str>, "quantity": 1}. Никакой лишней вложенности.
    """
    # 0) нормализуем вход
    skus = [str(it["sku"]) for it in items]
    vmap = _get_variant_map(skus)

    # 1) разворачиваем в юниты
    units: List[Dict] = []
    for it in items:
        qty = int(it["quantity"])
        sku = str(it["sku"])
        units.extend([{"sku": sku, "quantity": 1} for _ in range(qty)])

    if not units:
        logger.info("shipping_split Packeta: empty units -> empty parcels")
        return []

    # 2) по одиночным лимитам делим на normal/extended
    normal_units: List[Dict] = []
    extended_units: List[Dict] = []

    for u in units:
        v = vmap[u["sku"]]
        L, W, H, KG = _dims_kg(v)
        if _fits(L, W, H, KG, NORMAL_MAX_WEIGHT_KG, NORMAL_MAX_SIDE_CM, NORMAL_MAX_SUM_SIDES_CM):
            normal_units.append(u)
        else:
            extended_units.append(u)

    # 3) упаковываем normal
    normal_parcels: List[List[Dict]] = []
    if normal_units:
        normal_parcels = _pack_units(
            normal_units, vmap,
            NORMAL_MAX_WEIGHT_KG, NORMAL_MAX_SIDE_CM, NORMAL_MAX_SUM_SIDES_CM
        )

    # 4) упаковываем extended
    ext_parcels: List[List[Dict]] = []
    if extended_units:
        ext_parcels = _pack_units(
            extended_units, vmap,
            EXT_MAX_WEIGHT_KG, EXT_MAX_SIDE_CM, EXT_MAX_SUM_SIDES_CM
        )

    parcels = normal_parcels + ext_parcels

    # 5) финальная нормализация: каждая посылка — это List[Dict], без двойных/тройных вложенностей
    normalized: List[List[Dict]] = []
    for p in parcels:
        if not p:
            continue
        if isinstance(p, dict):
            normalized.append([p])
        elif isinstance(p, list) and p and isinstance(p[0], dict):
            normalized.append(p)
        elif isinstance(p, list) and p and isinstance(p[0], list):
            # разворачиваем внутреннюю вложенность
            flat: List[Dict] = []
            for sub in p:
                if isinstance(sub, dict):
                    flat.append(sub)
                elif isinstance(sub, list):
                    flat.extend([x for x in sub if isinstance(x, dict)])
            if flat:
                normalized.append(flat)
        else:
            logger.warning("shipping_split Packeta: unexpected parcel shape -> %s", type(p))

    logger.info(
        "shipping_split Packeta split done: %d parcels total (normal=%d, extended=%d)",
        len(normalized), len(normal_parcels), len(ext_parcels)
    )
    return normalized


# ===================== АГРЕГАЦИЯ И ГЛАВНАЯ ОБЁРТКА =====================

def combine_parcel_options(per_parcel_opts: List[List[Dict]]):
    """
    Складывает цены по всем посылкам, объединяет оценки.
    На выход для UI: { total_parcels, options: [ {channel, price, priceWithVat, ...}, ... ] }
    """
    from decimal import Decimal as D

    agg = {}
    for opts in per_parcel_opts:
        # opts — это список опций для одной посылки (PUDO и/или HD)
        for opt in opts:
            ch = opt["channel"]  # "PUDO" | "HD"
            entry = agg.setdefault(
                ch,
                {
                    "courier": opt.get("courier", "Zásilkovna"),
                    "service": opt["service"],
                    "channel": ch,
                    "price": D("0"),
                    "priceWithVat": D("0"),
                    "currency": opt["currency"],
                    "estimates": set(),
                },
            )
            entry["price"] += D(str(opt["price"]))
            entry["priceWithVat"] += D(str(opt["priceWithVat"]))
            if opt.get("estimate"):
                entry["estimates"].add(opt["estimate"])

    result = []
    for ch, data in agg.items():
        # Определяем, является ли хотя бы одна PUDO-посылка oversize
        is_oversize_pudo = False
        if ch == "PUDO":
            # простая эвристика: цена base > 120 CZK или вес > 5 кг в любой посылке
            # (эти данные можно передавать через opt, если хочешь точнее)
            if any(opt.get("isOversize") and opt["channel"] == "PUDO" for opts in per_parcel_opts for opt in opts):
                is_oversize_pudo = True

        option = {
            "courier": data["courier"],
            "service": data["service"],
            "channel": ch,
            "price": float(Decimal(data["price"]).quantize(Decimal("0.01"))),
            "priceWithVat": float(Decimal(data["priceWithVat"]).quantize(Decimal("0.01"))),
            "currency": data["currency"],
            "estimate": ", ".join(sorted(data["estimates"])),
        }

        # добавляем флаг только если канал PUDO
        if ch == "PUDO":
            option["isOversizePudo"] = is_oversize_pudo

        result.append(option)

    return {"total_parcels": len(per_parcel_opts), "options": result}


def calculate_order_shipping(country: str, items: List[Dict], cod: bool, currency: str):
    """
    Главная обёртка для Packeta: делает сплит и считает стоимость каждой посылки
    через local_rates.calculate_shipping_options, после чего агрегирует.
    """
    parcels = split_items_into_parcels(country, items, cod, currency)

    # !!! КЛЮЧЕВОЕ: гарантируем, что передаём в local_rates список «малых» посылок,
    #     где каждая посылка — это List[Dict], а не List[List[...]].
    per_parcel_opts: List[List[Dict]] = []
    for idx, parcel in enumerate(parcels, start=1):
        if not isinstance(parcel, list) or (parcel and isinstance(parcel[0], list)):
            logger.error("shipping_split Packeta: parcel #%d has wrong shape, skipping: %r", idx, type(parcel))
            continue
        try:
            opts = calculate_shipping_options(country=country, items=parcel, cod=cod, currency=currency)
            per_parcel_opts.append(opts)
        except Exception as e:
            logger.exception("Packeta parcel calculation failed: %s", e)

    return combine_parcel_options(per_parcel_opts)
