from __future__ import annotations

import logging
from typing import Any, Optional, Union

from accounts.choices import UserRole
from accounts.models import CustomUser

from .audit_context import get_current_user, is_audit_disabled
from .models import (
    SellerOnboardingApplication,
    OnboardingAuditLog,
    OnboardingActorType,
)


logger = logging.getLogger('audit')


def _actor_type_for_user(user: Optional[CustomUser]) -> str:
    if not user:
        return OnboardingActorType.SYSTEM
    if user.role == UserRole.SELLER:
        return OnboardingActorType.SELLER
    return OnboardingActorType.ADMIN


def _actor_snapshot(user: Optional[CustomUser]) -> dict[str, Any]:
    """
    Снимок данных пользователя для аудит-лога.
    Хранится независимо от жизненного цикла пользователя.
    """
    if not user:
        return {}

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


def log_onboarding_event(
    *,
    application: Union[SellerOnboardingApplication, int, None],
    event_type: str,
    payload: dict[str, Any] | None = None,
    actor: Optional[CustomUser] = None,
    actor_type: Optional[str] = None,
) -> None:
    """
    Универсальная запись события в аудит-лог.

    actor/actor_type можно передать явно (approve/reject/submit),
    либо оставить пустым — тогда берётся thread-local current user.
    """

    # 🔒 КЛЮЧЕВОЕ: во время каскадных delete аудиты не пишем вообще
    if is_audit_disabled():
        logger.debug("Audit skipped: cascade delete in progress")
        return

    if not application:
        return

    app_id = application if isinstance(application, int) else application.pk

    # Доп. защита (полезна вне delete-сценариев)
    if not SellerOnboardingApplication.objects.filter(pk=app_id).exists():
        return

    if actor is None:
        actor = get_current_user()

    if actor_type is None:
        actor_type = _actor_type_for_user(actor)

    OnboardingAuditLog.objects.create(
        application_id=app_id,
        actor_type=actor_type,
        actor=actor,
        actor_snapshot=_actor_snapshot(actor),
        event_type=event_type,
        payload=payload or {},
    )
