from __future__ import annotations

from decimal import Decimal
from typing import Dict, List

from product.models import ProductVariant

# Жёсткие лимиты GLS (могут быть продублированы в settings и использованы здесь)
MAX_WEIGHT_KG = Decimal("31.5")
MAX_SIDE_CM = Decimal("120")
MAX_SUM_SIDES_CM = Decimal("300")


def _variant_map(skus: List[str]) -> Dict[str, ProductVariant]:
    qs = ProductVariant.objects.filter(sku__in=skus)
    return {v.sku: v for v in qs}


def _dims_w(variant: ProductVariant):
    """
    Возвращает (L, W, H, weight_kg) в сантиметрах и килограммах.
    """
    L = Decimal(variant.length_mm or 0) / Decimal("10")
    W = Decimal(variant.width_mm or 0) / Decimal("10")
    H = Decimal(variant.height_mm or 0) / Decimal("10")
    Wkg = Decimal(variant.weight_grams or 0) / Decimal("1000")
    return L, W, H, Wkg


def _fits(dim_triplet, weight_kg: Decimal) -> bool:
    L, W, H = dim_triplet
    sum_sides = L + W + H
    max_side = max(L, W, H)
    return (
        weight_kg <= MAX_WEIGHT_KG
        and max_side <= MAX_SIDE_CM
        and sum_sides <= MAX_SUM_SIDES_CM
    )


def split_items_into_parcels_gls(items: List[Dict[str, int]]) -> List[List[Dict[str, int]]]:
    """
    Очень простой жадный алгоритм «складываем стопкой по высоте»:
    - собираем юнит-позиции (quantity=1),
    - пытаемся добавлять в текущую посылку,
    - если выходим за лимиты — начинаем новую.

    Возвращает список посылок, каждая — список юнит-товаров вида {"sku": ..., "quantity": 1}.
    """
    skus = [it["sku"] for it in items]
    vm = _variant_map(skus)

    units: List[Dict[str, int]] = []
    for it in items:
        units.extend([{"sku": it["sku"], "quantity": 1}] * int(it["quantity"]))

    parcels: List[List[Dict[str, int]]] = []
    cur: List[Dict[str, int]] = []
    cur_w = Decimal("0")
    cur_dims = [Decimal("0"), Decimal("0"), Decimal("0")]  # L, W, H

    for u in units:
        v = vm[u["sku"]]
        L, W, H, Wkg = _dims_w(v)

        new_w = cur_w + Wkg
        new_dims = [
            max(cur_dims[0], L),
            max(cur_dims[1], W),
            cur_dims[2] + H,  # «стопка» по высоте
        ]

        if not _fits(new_dims, new_w):
            if cur:
                parcels.append(cur)
            cur = [u]
            cur_w = Wkg
            cur_dims = [L, W, H]
        else:
            cur.append(u)
            cur_w = new_w
            cur_dims = new_dims

    if cur:
        parcels.append(cur)

    return parcels
