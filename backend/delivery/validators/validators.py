import phonenumbers


def validate_phone_matches_country(phone_number: str, country_code: str):
    """
    Проверяет, соответствует ли номер телефона стране доставки.
    """
    try:
        parsed = phonenumbers.parse(phone_number, None)
        region_code = phonenumbers.region_code_for_number(parsed)
        if region_code != country_code.upper():
            return f"Phone number {phone_number} does not match destination country {country_code.upper()}."
    except phonenumbers.NumberParseException:
        return f"Invalid phone number format: {phone_number}."
    return None
