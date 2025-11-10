import os
import re
import logging
import pandas as pd
from typing import Dict, Set, Tuple

logger = logging.getLogger(__name__)

BASE_DIR = os.path.join(os.path.dirname(__file__), "postal_data")


class ZipCodeValidator:
    """
    Проверка существования ZIP/почтового кода на основе локальных файлов GeoNames.
    """

    _df_cache: Dict[str, pd.DataFrame] = {}
    _set_cache: Dict[str, Tuple[Set[str], Set[str]]] = {}

    @staticmethod
    def _normalize_plain(value: str) -> str:
        return re.sub(r"[^A-Z0-9]", "", (value or "").upper())

    @staticmethod
    def _normalize_compact(value: str) -> str:
        return (value or "").upper().replace(" ", "").replace("-", "")

    @classmethod
    def load_country_zip_data(cls, country_code: str) -> pd.DataFrame:
        cc = (country_code or "").upper()

        if cc in cls._df_cache:
            logger.debug(f"[ZIP] Using cached postal dataset for country={cc}")
            return cls._df_cache[cc]

        file_path = os.path.join(BASE_DIR, f"{cc}.txt")
        logger.debug(f"[ZIP] Attempting to load file: {file_path}")

        if not os.path.exists(file_path):
            logger.warning(f"[ZIP] No local ZIP dataset found for country={cc}")
            raise FileNotFoundError(f"ZIP data file not found: {file_path}")

        df = pd.read_csv(
            file_path,
            sep="\t",
            header=None,
            dtype=str,
            encoding="utf-8",
            names=[
                "country_code", "postal_code", "place_name", "admin_name1", "admin_code1",
                "admin_name2", "admin_code2", "admin_name3", "admin_code3",
                "latitude", "longitude", "accuracy"
            ]
        )

        cls._df_cache[cc] = df
        logger.info(f"[ZIP] Loaded postal data for {cc}: {len(df)} rows")
        return df

    @classmethod
    def _load_country_codes(cls, country_code: str) -> Tuple[Set[str], Set[str]]:
        cc = (country_code or "").upper()

        if cc in cls._set_cache:
            logger.debug(f"[ZIP] Using cached postal code sets for {cc}")
            return cls._set_cache[cc]

        logger.debug(f"[ZIP] Preparing ZIP code sets for {cc}")

        df = cls.load_country_zip_data(cc)
        series = df["postal_code"].fillna("").astype(str)

        full_set: Set[str] = set()
        plain_set: Set[str] = set()

        for raw in series.tolist():
            raw = raw.strip()
            if not raw:
                continue

            compact = cls._normalize_compact(raw)
            plain = cls._normalize_plain(raw)

            if compact:
                full_set.add(compact)
            if plain:
                plain_set.add(plain)

            # Для некоторых стран добавляем вариант "только цифры"
            digits = re.sub(r"[^0-9]", "", raw)
            if digits and cc in {"LU", "LV", "PL", "CZ", "SK", "NL"}:
                plain_set.add(digits)

        cls._set_cache[cc] = (full_set, plain_set)
        logger.info(f"[ZIP] Cached sets for {cc}: full={len(full_set)}, plain={len(plain_set)}")
        return full_set, plain_set

    @staticmethod
    def _gb_outward_from_plain(plain_zip: str) -> str:
        z = (plain_zip or "").upper()
        if len(z) > 3:
            outward = z[:-3]
            if 2 <= len(outward) <= 4:
                return outward
        return z

    @classmethod
    def validate_zip_exists(cls, zip_code: str, country_code: str) -> bool:
        cc = (country_code or "").upper()
        zip_input = zip_code or ""

        logger.debug(f"[ZIP] validate_zip_exists: country={cc}, zip={zip_input}")

        try:
            full_set, plain_set = cls._load_country_codes(cc)
        except FileNotFoundError:
            logger.warning(f"[ZIP] No local dataset for {cc}, skipping local validation")
            return False

        compact_in = cls._normalize_compact(zip_input)
        plain_in = cls._normalize_plain(zip_input)

        # ✅ Специальное правило для NL (Нидерланды)
        if cc == "NL":
            # Пример: "1012 LG" → "1012", "3059XS" → "3059"
            digits = re.sub(r"[^0-9]", "", compact_in)
            digits4 = digits[:4] if len(digits) >= 4 else digits
            ok = digits4 in plain_set
            logger.debug(f"[ZIP] NL check: raw={zip_input}, digits4={digits4}, result={ok}")
            return ok

        # 🇬🇧 Великобритания
        if cc == "GB":
            outward = cls._gb_outward_from_plain(plain_in)
            ok = (outward in plain_set) or (compact_in in full_set) or (plain_in in plain_set)
            logger.debug(f"[ZIP] GB check: outward={outward}, result={ok}")
            return ok

        # 🇵🇱 🇨🇿 🇸🇰 🇱🇺 🇱🇻 Цифровые индексы
        if cc in {"LU", "LV", "PL", "CZ", "SK"}:
            digits = re.sub(r"[^0-9]", "", plain_in)
            variants = {compact_in, plain_in, digits} if digits else {compact_in, plain_in}
            ok = any((v in full_set) or (v in plain_set) for v in variants)
            logger.debug(f"[ZIP] Country={cc}, variants={variants}, result={ok}")
            return ok

        # Остальные страны — прямое сравнение
        ok = (compact_in in full_set) or (plain_in in plain_set)
        logger.debug(f"[ZIP] Direct check: compact={compact_in}, plain={plain_in}, result={ok}")
        return ok

    @classmethod
    def validate_and_resolve(cls, zip_code: str, country_code: str, *, prefer_remote: bool = False):
        from delivery.services.georouting import resolve_postcode

        logger.info(
            f"[ZIP] validate_and_resolve called: country={country_code}, zip={zip_code}, prefer_remote={prefer_remote}"
        )

        result = resolve_postcode(
            postcode=zip_code,
            country_code=country_code,
            prefer_remote=prefer_remote,
            local_validator=cls.validate_zip_exists,
        )

        logger.info(
            f"[ZIP] Resolved: valid={result.valid}, source={result.source}, city={result.city}, normalized={result.normalized_postcode}"
        )

        return result
