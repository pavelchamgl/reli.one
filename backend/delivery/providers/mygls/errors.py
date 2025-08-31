class MyGlsError(Exception):
    """Базовое исключение MyGLS."""


class MyGlsBadRequest(MyGlsError):
    pass


class MyGlsAuthError(MyGlsError):
    pass


class MyGlsServerError(MyGlsError):
    pass


def raise_for_response(resp):
    """
    Преобразует HTTP-ошибки к понятным исключениям.
    """
    code = getattr(resp, "status_code", None)
    try:
        data = resp.json()
    except Exception:
        data = None

    message = None
    if isinstance(data, dict):
        message = data.get("Message") or data.get("ErrorMessage") or str(data)
    elif isinstance(data, list):
        message = str(data)

    if code and 400 <= code < 500:
        if code in (401, 403):
            raise MyGlsAuthError(message or f"Auth error {code}")
        raise MyGlsBadRequest(message or f"Bad request {code}")
    if code and code >= 500:
        raise MyGlsServerError(message or f"Server error {code}")
