from __future__ import annotations

import threading
from contextlib import contextmanager
from typing import Optional

from accounts.models import CustomUser

_local = threading.local()


# -----------------------------
# current user
# -----------------------------
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


# -----------------------------
# audit disable flag
# -----------------------------
def _get_audit_depth() -> int:
    return int(getattr(_local, "audit_disabled_depth", 0) or 0)


def disable_audit() -> None:
    """
    Disables audit logging for the current thread.
    Uses depth counter to be safe for nested calls.
    """
    _local.audit_disabled_depth = _get_audit_depth() + 1


def enable_audit() -> None:
    """
    Re-enables audit logging for the current thread.
    """
    depth = _get_audit_depth()
    if depth <= 1:
        if hasattr(_local, "audit_disabled_depth"):
            delattr(_local, "audit_disabled_depth")
    else:
        _local.audit_disabled_depth = depth - 1


def is_audit_disabled() -> bool:
    return _get_audit_depth() > 0


@contextmanager
def audit_disabled():
    """
    Context manager helper if you ever need to disable audit in code.
    """
    disable_audit()
    try:
        yield
    finally:
        enable_audit()
