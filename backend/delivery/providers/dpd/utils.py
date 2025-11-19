from __future__ import annotations

import re
import logging
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

# === МАСКИРОВАНИЕ КОНТАКТОВ ===

def mask_email(email: Optional[str]) -> Optional[str]:
    """
    Маскирует email: ivan.petrov@example.com → iv***@example.com
    Возвращает None для пустых значений, и '***' для явно невалидных строк.
    """
    if not email:
        return None
    try:
        name, domain = str(email).split("@", 1)
        name = name.strip()
        domain = domain.strip()
        if not name or not domain:
            return "***"
        # имя: если 1–2 символа, заменяем полностью на ***
        if len(name) <= 2:
            name_masked = "***"
        else:
            name_masked = name[:2] + "***"
        return f"{name_masked}@{domain}"
    except Exception:
        return "***"


def mask_phone(phone: Optional[str]) -> Optional[str]:
    """
    Маскирует телефон:
      '+420777181001' → '+420*******001'
      '420777181001'  → '420*******001'
    Для очень коротких номеров возвращает '***'.
    """
    if not phone:
        return None
    s = str(phone).strip()
    plus = s.startswith("+")
    digits = re.sub(r"\D", "", s)
    if len(digits) <= 6:
        return "***"
    masked = digits[:3] + "*" * (len(digits) - 6) + digits[-3:]
    return ("+" if plus else "") + masked


# === КОРОТКАЯ ИНФОРМАЦИЯ О ПОЛУЧАТЕЛЕ (ДЛЯ ЛОГОВ) ===

def brief_receiver(receiver: Dict[str, Any] | None, *, mask_contacts: bool = True) -> str:
    """
    Возвращает краткое человекочитаемое описание адреса получателя для логов.
    Контакты (email/phone) по умолчанию маскируются.
    Примеры:
      {'name': 'Test', 'city': 'Praha', 'zipCode': '14700'} → "Test | 14700 Praha"
      {'name': 'Jan', 'street': 'Na Lysinách', 'houseNo': '551/34', ...}
        → "Jan | Na Lysinách 551/34 | 14700 Praha | CZ | iv***@example.com"
    """
    if not receiver or not isinstance(receiver, dict):
        return "<no receiver>"

    try:
        name = (receiver.get("name") or "").strip()
        contact_name = (receiver.get("contactName") or "").strip()
        street = (receiver.get("street") or "").strip()
        house = (receiver.get("houseNo") or "").strip()
        city = (receiver.get("city") or "").strip()
        zip_code = (receiver.get("zipCode") or receiver.get("zip") or "").strip()
        country = (receiver.get("countryCode") or "").strip()
        email = (receiver.get("contactEmail") or "").strip()
        phone = (receiver.get("contactPhone") or "").strip()
        phone_prefix = (receiver.get("contactPhonePrefix") or "").strip()

        # Маскируем контакты, если включено
        if mask_contacts:
            email_out = mask_email(email) if email else ""
            # Склеиваем префикс и номер только для маскировки и отображения
            phone_full = (phone_prefix + phone) if phone_prefix and not phone.startswith("+") else phone or ""
            phone_out = mask_phone(phone_full) if phone_full else ""
        else:
            email_out = email
            phone_out = (phone_prefix + phone) if phone_prefix and not phone.startswith("+") else (phone or "")

        parts = []
        if name:
            parts.append(name)
        elif contact_name:
            parts.append(contact_name)

        line2 = " ".join(x for x in [street, house] if x).strip()
        if line2:
            parts.append(line2)

        line3 = " ".join(x for x in [zip_code, city] if x).strip()
        if line3:
            parts.append(line3)

        if country:
            parts.append(country)

        contact_str = " ".join(x for x in [email_out, phone_out] if x).strip()
        if contact_str:
            parts.append(contact_str)

        return " | ".join(p for p in parts if p)
    except Exception as e:
        return f"<invalid receiver: {e}>"


# === ПРОСТАЯ ВАЛИДАЦИЯ ДАННЫХ ===

def validate_iso_country(code: str) -> bool:
    """
    Простейшая проверка ISO-кода страны (две заглавные буквы).
    """
    if not code or not isinstance(code, str):
        return False
    code = code.strip().upper()
    return bool(re.fullmatch(r"[A-Z]{2}", code))


def safe_get(d: dict, *keys: str) -> Any:
    """
    Безопасно достаёт значение по цепочке ключей.
      safe_get({"a": {"b": 1}}, "a", "b") → 1
    Возвращает None при любом несоответствии.
    """
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def trim_dict(d: dict, max_len: int = 800) -> dict:
    """
    Возвращает копию словаря с укороченными строковыми значениями для логов.
    """
    res = {}
    for k, v in d.items():
        if isinstance(v, str) and len(v) > max_len:
            res[k] = v[:max_len] + "..."
        else:
            res[k] = v
    return res


def debug_dict(d: dict, *, max_str_len: int = 80) -> str:
    """
    Возвращает безопасное короткое представление словаря для логов:
      - сортирует ключи
      - ограничивает длину строковых значений
      - не разворачивает глубоко вложенные структуры
    """
    try:
        pairs = []
        for k in sorted(d.keys(), key=lambda x: str(x)):
            v = d[k]
            if isinstance(v, (str, int, float)):
                s = str(v)
                if len(s) > max_str_len:
                    s = s[: max_str_len - 3] + "..."
                pairs.append(f"{k}={s}")
            elif isinstance(v, dict):
                pairs.append(f"{k}={{...}}")
            elif isinstance(v, list):
                pairs.append(f"{k}=[{len(v)}]")
            else:
                pairs.append(f"{k}=({type(v).__name__})")
        return ", ".join(pairs)
    except Exception:
        return str(d)[:500]
