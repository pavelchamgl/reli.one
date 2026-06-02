from __future__ import annotations

import re
from typing import Any

from .errors import AresInvalidIco

ICO_WEIGHTS = (8, 7, 6, 5, 4, 3, 2)

LEGAL_FORM_MAP = {
    "112": "s.r.o. (Czech Republic / Slovakia)",
    "121": "a.s. (Czech Republic)",
    "101": "fyzická osoba podnikající",
    "706": "spolek",
}


def normalize_ico(value: str | int | None) -> str:
    if value is None:
        raise AresInvalidIco("IČO is required.")

    normalized = re.sub(r"[\s\-_/\.]", "", str(value))
    if not re.fullmatch(r"\d{8}", normalized or ""):
        raise AresInvalidIco("IČO must contain exactly 8 digits.")
    if not is_valid_ico_checksum(normalized):
        raise AresInvalidIco("IČO checksum is invalid.")
    return normalized


def is_valid_ico_checksum(ico: str) -> bool:
    if not re.fullmatch(r"\d{8}", ico or ""):
        return False

    checksum_sum = sum(int(digit) * weight for digit, weight in zip(ico[:7], ICO_WEIGHTS))
    check_digit = (11 - (checksum_sum % 11)) % 10
    return check_digit == int(ico[7])


def normalize_ares_response(data: dict[str, Any], *, queried_ico: str) -> dict[str, Any]:
    subject = _extract_szr_subject(data)
    source = subject or data
    sidlo = source.get("sidlo") if isinstance(source.get("sidlo"), dict) else {}
    legal_form_code = _as_string(source.get("pravniForma"))
    warnings: list[str] = []

    address = _normalize_address(sidlo, warnings)
    if not address["street"] or not address["city"] or not address["zip_code"] or not address["country"]:
        warnings.append("registered_address_partial")

    is_active = not bool(source.get("datumZaniku"))
    if not is_active:
        warnings.append("company_inactive")

    ico = _as_string(source.get("ico")) or queried_ico

    return {
        "found": True,
        "ico": ico,
        "business_id": ico,
        "company_name": _as_string(source.get("obchodniJmeno")),
        "legal_form_code": legal_form_code,
        "legal_form": LEGAL_FORM_MAP.get(legal_form_code),
        "registered_address": address,
        "dic_hint": _as_string(source.get("dic")) or _as_string(data.get("dic")),
        "is_active": is_active,
        "representatives": _normalize_szr_representatives(data),
        "warnings": warnings,
    }


def _extract_szr_subject(data: dict[str, Any]) -> dict[str, Any] | None:
    for record in _iter_szr_records(data):
        ezp = record.get("ezp") if isinstance(record.get("ezp"), dict) else {}
        subject = ezp.get("subjektEzp")
        if isinstance(subject, dict):
            return subject
    return None


def _normalize_szr_representatives(data: dict[str, Any]) -> list[dict[str, str | None]]:
    representatives: list[dict[str, str | None]] = []

    for record in _iter_szr_records(data):
        ezp = record.get("ezp") if isinstance(record.get("ezp"), dict) else {}
        person = ezp.get("osobaEzp")
        if not isinstance(person, dict):
            continue

        first_name = _first_string(person, "jmeno", "first_name", "firstName")
        last_name = _first_string(person, "prijmeni", "last_name", "lastName")
        role_hint = _first_string(person, "role", "role_hint", "funkce", "typRole", "typAngazma")

        nested_person = person.get("fyzickaOsoba") if isinstance(person.get("fyzickaOsoba"), dict) else {}
        first_name = first_name or _first_string(nested_person, "jmeno", "first_name", "firstName")
        last_name = last_name or _first_string(nested_person, "prijmeni", "last_name", "lastName")

        if first_name or last_name or role_hint:
            representatives.append(
                {
                    "first_name": first_name,
                    "last_name": last_name,
                    "role_hint": role_hint,
                }
            )

    return representatives


def _iter_szr_records(data: dict[str, Any]) -> list[dict[str, Any]]:
    records = data.get("zaznamy")
    if not isinstance(records, list):
        return []
    return [record for record in records if isinstance(record, dict)]


def _normalize_address(sidlo: dict[str, Any], warnings: list[str]) -> dict[str, str | None]:
    country = _normalize_country(sidlo.get("kodStatu"))
    if country is None and sidlo.get("nazevStatu"):
        warnings.append("registered_address_country_unmapped")

    return {
        "street": _build_street(sidlo),
        "city": _as_string(sidlo.get("nazevObce")),
        "zip_code": _normalize_zip(sidlo.get("psc")),
        "country": country,
    }


def _build_street(sidlo: dict[str, Any]) -> str | None:
    street_name = _as_string(sidlo.get("nazevUlice")) or _as_string(sidlo.get("nazevCastiObce"))
    house_number = _as_string(sidlo.get("cisloDomovni"))
    orientation_number = _as_string(sidlo.get("cisloOrientacni"))

    number = None
    if house_number and orientation_number:
        number = f"{house_number}/{orientation_number}"
    elif house_number:
        number = house_number
    elif orientation_number:
        number = orientation_number

    if street_name and number:
        return f"{street_name} {number}"
    return street_name or number


def _normalize_zip(value: Any) -> str | None:
    text = _as_string(value)
    if text is None:
        return None
    return re.sub(r"\s+", "", text)


def _normalize_country(value: Any) -> str | None:
    text = _as_string(value)
    if text is None:
        return None
    if text.upper() == "CZ":
        return "CZ"
    if text == "203":
        return "CZ"
    return text.upper() if len(text) == 2 else None


def _first_string(data: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = _as_string(data.get(key))
        if value:
            return value
    return None


def _as_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
