# delivery/services/gls_rates.py
from __future__ import annotations

import logging
from decimal import Decimal, ROUND_UP, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from django.conf import settings

from product.models import ProductVariant
from delivery.models import ShippingRate
from delivery.services.currency_converter import convert_czk_to_eur
from delivery.services.gls_split import split_items_into_parcels_gls

logger = logging.getLogger(__name__)

COURIER_CODE_GLS = "gls"
VAT_RATE = getattr(settings, "VAT_RATE", Decimal("0.21"))

# Лимиты GLS (логика категорий, не влияет на split — он уже соблюдает лимиты per-service)
GLS_MAX_WEIGHT_CZ_KG = Decimal("40.0")
GLS_MAX_WEIGHT_EU_KG = Decimal("31.5")
GLS_MAX_SIDE_CM = Decimal("200.0")
GLS_MAX_SUM_SIDES_CM = Decimal("300.0")

# Скидка для PUDO / Locker относительно HD (BP / EuroBusinessParcel)
GLS_PUDO_DISCOUNT_CZK = Decimal("27.00")

# Надбавки
GLS_FUEL_PCT = Decimal(str(getattr(settings, "GLS_FUEL_PCT", "0.011")))
GLS_TOLL_PER_KG_CZK = Decimal(str(getattr(settings, "GLS_TOLL_PER_KG_CZK", "1.47")))


def _ceil_kg(x: Decimal) -> Decimal:
    return x.to_integral_value(rounding=ROUND_UP)


def _toll_surcharge_czk(weight_kg: Decimal) -> Decimal:
    """
    Платная дорога: ceil(kg) * 1.47 CZK, с округлением до копеек.
    """
    return (_ceil_kg(weight_kg) * GLS_TOLL_PER_KG_CZK).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def _weight_tag_gls(weight_kg: Decimal) -> str:
    """
    Тэг веса, как в таблице тарифов GLS.
    """
    if weight_kg <= Decimal("5"):
        return "5"
    if weight_kg <= Decimal("10"):
        return "10"
    if weight_kg <= Decimal("20"):
        return "20"
    if weight_kg <= Decimal("31.5"):
        return "31_5"
    return "over_limit"


def _gls_category_HD(
    country: str,
    weight: Decimal,
    max_side: Decimal,
    sum_sides: Decimal,
) -> str:
    """
    Категория для HD (BusinessParcel / EuroBusinessParcel):
      • CZ: до 40 кг
      • EU: до 31.5 кг
      • L <= 200, L+W+H <= 300
      • standard: до 15 кг и sum<=150
      • oversized: всё остальное в рамках лимитов
    """
    max_weight = GLS_MAX_WEIGHT_CZ_KG if country.upper() == "CZ" else GLS_MAX_WEIGHT_EU_KG

    if weight > max_weight or max_side > GLS_MAX_SIDE_CM or sum_sides > GLS_MAX_SUM_SIDES_CM:
        raise ValueError(
            f"GLS HD: package exceeds allowed dimensions/weight "
            f"(w={weight}, max_side={max_side}, sum={sum_sides})"
        )

    if weight <= Decimal("15") and sum_sides <= Decimal("150"):
        return "standard"
    return "oversized"


def _gls_pudo_allowed(weight: Decimal, max_side: Decimal) -> bool:
    """
    Базовая проверка для PUDO:
      • вес до 20 кг
      • по габаритам используем те же лимиты, что для HD (2 м / 3 м по сумме),
        более жёстких ограничений в прайсе нет.
    """
    if weight > Decimal("20"):
        return False
    if max_side > GLS_MAX_SIDE_CM:
        return False
    return True


def _pick_rate_HD(
    country: str,
    category: str,
    weight_tag: str,
    address_bundle: str,
) -> ShippingRate:
    """
    Берём тариф HD из БД (BusinessParcel / EuroBusinessParcel).
    """
    try:
        return (
            ShippingRate.objects.select_related("courier_service")
            .get(
                courier_service__code__iexact=COURIER_CODE_GLS,
                country=country.upper(),
                channel="HD",
                category=category,
                weight_limit=weight_tag,
                address_bundle=address_bundle,
            )
        )
    except ShippingRate.DoesNotExist as e:
        raise ValueError(
            f"No GLS HD rate for {country.upper()} cat={category} "
            f"tag={weight_tag} bundle={address_bundle}"
        ) from e


# --------------------------------------------------------------------------
# Вспомогательные расчёты для одной посылки
# --------------------------------------------------------------------------
def _calc_hd_for_parcel(
    *,
    country: str,
    parcel: Dict[str, Any],
    cod: bool,
    currency: str,
    address_bundle: str,
) -> Dict[str, Any]:
    """
    Возвращает dict с NET/GROSS по HD для одной посылки.
    """
    weight = parcel.get("weight_kg", Decimal("0"))
    L = parcel.get("length_cm", Decimal("0"))
    W = parcel.get("width_cm", Decimal("0"))
    H = parcel.get("height_cm", Decimal("0"))
    sum_sides = parcel.get("sum_sides", L + W + H)
    max_side = max(L, W, H)

    tag = _weight_tag_gls(weight)
    category = _gls_category_HD(country, weight, max_side, sum_sides)
    rate = _pick_rate_HD(country, category, tag, address_bundle)

    base_czk = rate.price
    cod_fee = rate.cod_fee if cod else Decimal("0")
    fuel_czk = (base_czk * GLS_FUEL_PCT).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    toll_czk = _toll_surcharge_czk(weight)

    total_czk = base_czk + cod_fee + fuel_czk + toll_czk

    net_eur = convert_czk_to_eur(total_czk).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    gross_eur = (net_eur * (Decimal("1") + VAT_RATE)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    logger.info(
        "GLS HD parcel: weight=%s kg, size=%sx%sx%s cm, sum=%s -> "
        "base=%s CZK, fuel=%s, toll=%s, cod=%s, total=%s CZK (%.2f EUR net)",
        weight,
        L,
        W,
        H,
        sum_sides,
        base_czk,
        fuel_czk,
        toll_czk,
        cod_fee,
        total_czk,
        net_eur,
    )

    return {
        "courier": rate.courier_service.name or "GLS",
        "service": "Home Delivery",
        "channel": "HD",
        "price": net_eur,
        "priceWithVat": gross_eur,
        "currency": currency,
        "estimate": rate.estimate or "",
        "base_czk": base_czk,
        "total_czk": total_czk,
    }


def _calc_pudo_for_parcel(
    *,
    country: str,
    parcel: Dict[str, Any],
    currency: str,
    address_bundle: str,
) -> Dict[str, Any]:
    """
    PUDO считаем «налёту» по формуле:
      base_PUDO = base_HD - 27 CZK  (но не ниже нуля)
    Для надбавок (fuel/toll) используем тот же принцип, что и для HD.
    COD для PUDO не поддерживаем.
    """
    weight = parcel.get("weight_kg", Decimal("0"))
    L = parcel.get("length_cm", Decimal("0"))
    W = parcel.get("width_cm", Decimal("0"))
    H = parcel.get("height_cm", Decimal("0"))
    sum_sides = parcel.get("sum_sides", L + W + H)
    max_side = max(L, W, H)

    if not _gls_pudo_allowed(weight, max_side):
        raise ValueError(
            f"GLS PUDO: package exceeds PUDO limits (weight={weight}, max_side={max_side})"
        )

    tag = _weight_tag_gls(weight)
    # Категория берётся как у HD — скидка применяется к тому же базовому тарифу
    category = _gls_category_HD(country, weight, max_side, sum_sides)
    hd_rate = _pick_rate_HD(country, category, tag, address_bundle)

    base_czk = hd_rate.price - GLS_PUDO_DISCOUNT_CZK
    if base_czk < 0:
        base_czk = Decimal("0")

    fuel_czk = (base_czk * GLS_FUEL_PCT).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    toll_czk = _toll_surcharge_czk(weight)
    cod_fee = Decimal("0")  # COD для PUDO не допускаем

    total_czk = base_czk + fuel_czk + toll_czk + cod_fee

    net_eur = convert_czk_to_eur(total_czk).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    gross_eur = (net_eur * (Decimal("1") + VAT_RATE)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    logger.info(
        "GLS PUDO parcel: weight=%s kg, size=%sx%sx%s cm, sum=%s -> "
        "base=%s CZK (HD-%s), fuel=%s, toll=%s, total=%s CZK (%.2f EUR net)",
        weight,
        L,
        W,
        H,
        sum_sides,
        base_czk,
        GLS_PUDO_DISCOUNT_CZK,
        fuel_czk,
        toll_czk,
        total_czk,
        net_eur,
    )

    return {
        "courier": hd_rate.courier_service.name or "GLS",
        "service": "Pick-up point",
        "channel": "PUDO",
        "price": net_eur,
        "priceWithVat": gross_eur,
        "currency": currency,
        "estimate": "",  # в прайсе GLS для PSD/Locker отдельного estimate нет
        "base_czk": base_czk,
        "total_czk": total_czk,
    }


# --------------------------------------------------------------------------
# Публичная функция: полный расчёт по заказу
# --------------------------------------------------------------------------
def calculate_gls_shipping_options(
    *,
    country: str,
    items: List[Dict[str, Any]],
    currency: str,
    cod: bool = False,
    variant_map: Optional[Dict[str, ProductVariant]] = None,
    address_bundle: str = "one",
) -> Dict[str, Any]:
    """
    Возвращает агрегированные опции по GLS:
      {
        "options": [
          {... PUDO ...},
          {... HD ...}
        ],
        "total_parcels": {
          "PUDO": N_pudo,
          "HD":   N_hd,
        }
      }

    Логика:
      • сначала делаем split под HD-лимиты (service="HD");
      • отдельно делаем split под PUDO-лимиты (service="PUDO");
      • для каждой посылки считаем стоимость по своему каналу;
      • суммируем NET по каналам и один раз начисляем VAT;
      • PUDO показываем только если посчитать удалось для КАЖДОЙ PUDO-посылки.
    """

    # Если вариант-мэп не передали — пусть split сам достанет варианты
    parcels_hd = split_items_into_parcels_gls(
        items, variant_map=variant_map, service="HD", country=country
    )
    if not parcels_hd:
        raise ValueError("GLS: split(HD) returned no parcels")

    parcels_pudo = []
    try:
        parcels_pudo = split_items_into_parcels_gls(
            items, variant_map=variant_map, service="PUDO", country=country
        )
    except Exception as e:
        # Теоретически PUDO может не поддерживаться по каким-то причинам,
        # тогда просто логируем и продолжаем только с HD.
        logger.info("GLS: PUDO split failed, will use HD only: %s", e)

    logger.info(
        "GLS aggregate: HD parcels=%d, PUDO parcels=%d",
        len(parcels_hd),
        len(parcels_pudo),
    )

    per_channel_net: Dict[str, Decimal] = {"HD": Decimal("0.00"), "PUDO": Decimal("0.00")}
    last_meta: Dict[str, Dict[str, Any]] = {}
    channels_ok: Dict[str, bool] = {"HD": True, "PUDO": True}

    # --- HD ---
    for p in parcels_hd:
        try:
            o = _calc_hd_for_parcel(
                country=country,
                parcel=p,
                cod=cod,
                currency=currency,
                address_bundle=address_bundle,
            )
            per_channel_net["HD"] += o["price"]
            last_meta["HD"] = {
                "courier": o.get("courier", "GLS"),
                "service": o.get("service", "Home Delivery"),
                "estimate": o.get("estimate", ""),
            }
        except Exception as e:
            logger.error("GLS: HD calculation failed for parcel %s: %s", p, e)
            channels_ok["HD"] = False
            break

    # --- PUDO ---
    if parcels_pudo:
        for p in parcels_pudo:
            try:
                o = _calc_pudo_for_parcel(
                    country=country,
                    parcel=p,
                    currency=currency,
                    address_bundle=address_bundle,
                )
                per_channel_net["PUDO"] += o["price"]
                last_meta["PUDO"] = {
                    "courier": o.get("courier", "GLS"),
                    "service": o.get("service", "Pick-up point"),
                    "estimate": o.get("estimate", ""),
                }
            except Exception as e:
                logger.info("GLS: PUDO calculation failed for parcel %s: %s", p, e)
                channels_ok["PUDO"] = False
                break
    else:
        channels_ok["PUDO"] = False

    options: List[Dict[str, Any]] = []
    total_parcels = {
        "HD": len(parcels_hd) if channels_ok["HD"] else 0,
        "PUDO": len(parcels_pudo) if (parcels_pudo and channels_ok["PUDO"]) else 0,
    }

    # Собираем HD
    if channels_ok["HD"] and per_channel_net["HD"] > 0:
        net = per_channel_net["HD"].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        gross = (net * (Decimal("1") + VAT_RATE)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        meta = last_meta.get("HD", {})
        options.append(
            {
                "courier": meta.get("courier", "GLS"),
                "service": meta.get("service", "Home Delivery"),
                "channel": "HD",
                "price": net,
                "priceWithVat": gross,
                "currency": currency,
                "estimate": meta.get("estimate", ""),
            }
        )

    # Собираем PUDO
    if channels_ok["PUDO"] and per_channel_net["PUDO"] > 0:
        net = per_channel_net["PUDO"].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        gross = (net * (Decimal("1") + VAT_RATE)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        meta = last_meta.get("PUDO", {})
        options.append(
            {
                "courier": meta.get("courier", "GLS"),
                "service": meta.get("service", "Pick-up point"),
                "channel": "PUDO",
                "price": net,
                "priceWithVat": gross,
                "currency": currency,
                "estimate": meta.get("estimate", ""),
            }
        )

    if not options:
        raise ValueError("GLS: no available options in aggregate")

    logger.info("GLS aggregate done: options=%s, totals=%s", options, total_parcels)
    return {"options": options, "total_parcels": total_parcels}
