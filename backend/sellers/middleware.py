from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin

from .audit_context import set_current_user


class CurrentUserAuditMiddleware(MiddlewareMixin):
    """
    Сохраняет request.user в thread-local, чтобы сигналы могли понять
    кто сделал изменение (seller/admin).

    Важно: добавить этот middleware ДО любых view, которые меняют onboarding.
    """

    def process_request(self, request):
        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            set_current_user(user)
        else:
            set_current_user(None)

    def process_response(self, request, response):
        set_current_user(None)
        return response

    def process_exception(self, request, exception):
        set_current_user(None)
        return None
