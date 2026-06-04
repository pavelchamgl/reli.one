class AresError(Exception):
    """Base error for ARES lookup failures."""

    code = "ares_error"
    detail = "ARES lookup failed."


class AresInvalidIco(AresError):
    code = "ares_invalid_ico"
    detail = "Invalid Czech IČO."


class AresNotFound(AresError):
    code = "ares_not_found"
    detail = "Company was not found in ARES."


class AresUnavailable(AresError):
    code = "ares_unavailable"
    detail = "ARES is currently unavailable."
