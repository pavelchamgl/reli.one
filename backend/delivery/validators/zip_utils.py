from __future__ import annotations


def uppercase_zip(value: str | None) -> str | None:
    """Только верхний регистр, формат (пробелы/дефисы) не трогаем."""
    if value is None:
        return None
    return str(value).upper()
