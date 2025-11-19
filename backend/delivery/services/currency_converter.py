import logging

from decimal import Decimal, ROUND_HALF_UP
from django.core.cache import cache

from .cnb_service import get_czk_per_eur

logger = logging.getLogger(__name__)

CACHE_KEY = "czk_per_eur_rate"
CACHE_TIMEOUT_SECONDS = 86400  # 24 часа
FALLBACK_CZK_PER_EUR = Decimal("25.00")


def get_czk_to_eur_rate_cached() -> Decimal:
    """
    Возвращает CZK_per_EUR (сколько CZK за 1 EUR) с кешированием и fallback.
    При ошибках делает подробное логирование.
    """
    rate = cache.get(CACHE_KEY)
    if rate is not None:
        try:
            decimal_rate = Decimal(str(rate))
            logger.debug(f"Loaded CZK_per_EUR from cache: {decimal_rate}")
            return decimal_rate
        except Exception as e:
            logger.warning(f"Invalid cached rate ({rate!r}): {e}")

    try:
        # Получаем свежий курс CNB
        rate = get_czk_per_eur()
        cache.set(CACHE_KEY, str(rate), timeout=CACHE_TIMEOUT_SECONDS)
        logger.info(f"Fetched CNB rate CZK_per_EUR={rate} and cached for 24h")
        return rate
    except Exception as e:
        # Логируем подробно причину
        logger.error(
            f"[CNB ERROR] Failed to fetch or parse CZK/EUR rate from CNB: {e}",
            exc_info=True
        )
        logger.warning(f"Using fallback CZK_per_EUR = {FALLBACK_CZK_PER_EUR}")
        cache.set(CACHE_KEY, str(FALLBACK_CZK_PER_EUR), timeout=CACHE_TIMEOUT_SECONDS)
        return FALLBACK_CZK_PER_EUR


def convert_czk_to_eur(amount_czk: Decimal) -> Decimal:
    """
    Конвертирует сумму из CZK в EUR:
        EUR = CZK / CZK_per_EUR
    """
    if not isinstance(amount_czk, Decimal):
        amount_czk = Decimal(str(amount_czk))

    czk_per_eur = get_czk_to_eur_rate_cached()
    if czk_per_eur <= 0:
        logger.error(f"[RATE ERROR] Invalid CZK_per_EUR={czk_per_eur}, fallback used")
        czk_per_eur = FALLBACK_CZK_PER_EUR

    amount_eur = amount_czk / czk_per_eur
    result = amount_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    logger.debug(f"Converted {amount_czk} CZK → {result} EUR at rate {czk_per_eur}")
    return result


def convert_eur_to_czk(amount_eur: Decimal) -> Decimal:
    """
    Конвертирует сумму из EUR в CZK:
        CZK = EUR * CZK_per_EUR
    """
    if not isinstance(amount_eur, Decimal):
        amount_eur = Decimal(str(amount_eur))

    czk_per_eur = get_czk_to_eur_rate_cached()
    if czk_per_eur <= 0:
        logger.error(f"[RATE ERROR] Invalid CZK_per_EUR={czk_per_eur}, fallback used")
        czk_per_eur = FALLBACK_CZK_PER_EUR

    amount_czk = amount_eur * czk_per_eur
    result = amount_czk.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    logger.debug(f"Converted {amount_eur} EUR → {result} CZK at rate {czk_per_eur}")
    return result
