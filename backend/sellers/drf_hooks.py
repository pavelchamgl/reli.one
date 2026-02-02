from rest_framework.views import APIView

from .audit_context import set_current_user, clear_current_user


class AuditAPIView(APIView):
    """
    Базовый APIView:
    - после DRF/JWT-аутентификации кладёт request.user в audit context
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)

        if request.user and request.user.is_authenticated:
            set_current_user(request.user)
        else:
            set_current_user(None)

    def finalize_response(self, request, response, *args, **kwargs):
        try:
            return super().finalize_response(request, response, *args, **kwargs)
        finally:
            clear_current_user()
