import phonenumbers
from phonenumbers import (
    NumberParseException,
    PhoneNumberFormat,
    region_code_for_number,
)


class PhoneValidationError(ValueError):
    """Raised when phone validation fails."""
    pass


def normalize_phone_number(phone: str, country_code: str | None = None) -> str:
    """
    Normalize a raw phone number into E.164 format.

    Examples:
        777123456 + CZ -> +420777123456
        +420777123456 -> +420777123456
    """
    raw = (phone or "").strip()
    region = (country_code or "").upper().strip() or None

    if not raw:
        raise PhoneValidationError("Phone number is required.")

    try:
        parsed = phonenumbers.parse(raw, region)
    except NumberParseException as exc:
        raise PhoneValidationError("Phone number format is invalid.") from exc

    if not phonenumbers.is_possible_number(parsed):
        raise PhoneValidationError("Phone number is not possible.")

    if not phonenumbers.is_valid_number(parsed):
        raise PhoneValidationError("Phone number is not valid.")

    return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)


def validate_phone_matches_country(
        phone: str,
        country_code: str | None,
        *,
        strict_region_match: bool = False,
) -> str | None:
    """
    Validate phone against the delivery country.

    Returns:
        None if valid.
        Error message string if invalid.

    Behavior:
    - always validates phone structure and normalizes parsing using the provided country
    - optionally enforces that the phone region belongs to the same country

    Example:
        validate_phone_matches_country("+420777123456", "CZ") -> None
        validate_phone_matches_country("+421901123456", "CZ", strict_region_match=True)
            -> "Phone number does not belong to country CZ."
    """
    region = (country_code or "").upper().strip()

    if not region:
        return "Country code is required for phone validation."

    try:
        raw = (phone or "").strip()
        if not raw:
            return "Phone number is required."

        parsed = phonenumbers.parse(raw, region)
    except NumberParseException:
        return "Phone number format is invalid."

    if not phonenumbers.is_possible_number(parsed):
        return f"Phone number is not possible for country {region}."

    if not phonenumbers.is_valid_number(parsed):
        return f"Phone number is not valid for country {region}."

    detected_region = (region_code_for_number(parsed) or "").upper()

    if strict_region_match and detected_region and detected_region != region:
        return f"Phone number does not belong to country {region}."

    return None


def normalize_and_validate_phone(
        phone: str,
        country_code: str | None,
        *,
        strict_region_match: bool = False,
) -> str:
    """
    Full phone validation + normalization for API usage.

    Returns:
        E.164 normalized phone number, e.g. +420777123456

    Raises:
        PhoneValidationError
    """
    error = validate_phone_matches_country(
        phone,
        country_code,
        strict_region_match=strict_region_match,
    )
    if error:
        raise PhoneValidationError(error)

    return normalize_phone_number(phone, country_code)
