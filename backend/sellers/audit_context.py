from __future__ import annotations

import threading
from typing import Optional

from accounts.models import CustomUser

_local = threading.local()


def set_current_user(user: Optional[CustomUser]) -> None:
    _local.user = user


def get_current_user() -> Optional[CustomUser]:
    return getattr(_local, "user", None)


def clear_current_user() -> None:
    """
    Явно очищает текущего пользователя из thread-local.
    Важно для DRF finalize_response / middleware.
    """
    if hasattr(_local, "user"):
        delattr(_local, "user")
