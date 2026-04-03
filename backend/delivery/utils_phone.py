import re


def normalize_phone_number(value: str) -> str:
    if not value:
        return value

    value = value.strip()
    has_plus = value.startswith("+")
    digits = re.sub(r"\D", "", value)

    if has_plus:
        return f"+{digits}"
    return digits
