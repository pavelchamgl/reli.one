from __future__ import annotations

from typing import Any, Optional

from accounts.choices import UserRole
from accounts.models import CustomUser
from .audit_context import get_current_user
from .models import (
    SellerOnboardingApplication,
    OnboardingAuditLog,
    OnboardingActorType,
)


def _actor_type_for_user(user: Optional[CustomUser]) -> str:
    if not user:
        return OnboardingActorType.SYSTEM
    if user.role == UserRole.SELLER:
        return OnboardingActorType.SELLER
    return OnboardingActorType.ADMIN


def log_onboarding_event(
    *,
    application: SellerOnboardingApplication,
    event_type: str,
    payload: dict[str, Any] | None = None,
    actor: Optional[CustomUser] = None,
    actor_type: Optional[str] = None,
) -> None:
    """
    Универсальная запись события в аудит-лог.
    actor/actor_type можно передать явно (из сервисов approve/reject/submit),
    или оставить пустым — тогда возьмём thread-local current user.
    """
    if actor is None:
        actor = get_current_user()

    if actor_type is None:
        actor_type = _actor_type_for_user(actor)

    OnboardingAuditLog.objects.create(
        application=application,
        actor_type=actor_type,
        actor=actor,
        event_type=event_type,
        payload=payload or {},
    )
