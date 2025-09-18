import logging

from decimal import Decimal, ROUND_HALF_UP
from django.core.cache import cache
from .cnb_service import get_czk_to_eur_rate

logger = logging.getLogger(__name__)

CACHE_KEY = "czk_to_eur_rate"
CACHE_TIMEOUT_SECONDS = 86400  # 24 hours


def get_czk_to_eur_rate_cached():
    rate = cache.get(CACHE_KEY)
    if rate is None:
        try:
            rate = get_czk_to_eur_rate()
            cache.set(CACHE_KEY, rate, timeout=CACHE_TIMEOUT_SECONDS)
            logger.info(f"Fetched and cached CZK to EUR rate: {rate}")
        except Exception as e:
            logger.warning(f"Failed to fetch CZK to EUR rate: {e}")
            rate = 25.0  # Fallback rate
            logger.info(f"Using fallback CZK to EUR rate: {rate}")
    return Decimal(str(rate))


def convert_czk_to_eur(amount_czk: Decimal) -> Decimal:
    rate = get_czk_to_eur_rate_cached()
    logger.info(f"CZK→EUR rate used: {rate}")
    if not isinstance(rate, Decimal):
        rate = Decimal(str(rate))
    amount_eur = amount_czk / rate
    return amount_eur.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
