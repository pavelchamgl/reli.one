from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


class SocialLoginResponseMixin:
    """
    Mixin to override get_response and return JWT access and refresh tokens
    along with basic user info.
    """
    def get_response(self):
        user = self.user
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "pk": user.pk,
        })
