from __future__ import annotations

from typing import Optional

from rest_framework.permissions import BasePermission

from sellers.models import SellerProfile


def get_seller_profile_for_user(user) -> Optional[SellerProfile]:
    if not user or not user.is_authenticated:
        return None

    # 1) Частый вариант: user.seller_profile (OneToOne)
    sp = getattr(user, "seller_profile", None) or getattr(user, "sellerprofile", None)
    if sp:
        return sp

    # 2) Вариант: SellerProfile.user FK/OneToOne
    try:
        return SellerProfile.objects.get(user=user)
    except SellerProfile.DoesNotExist:
        return None


class IsSeller(BasePermission):
    """
    Минимальная проверка "пользователь — продавец".
    Не завязываемся на роль, только на наличие SellerProfile.
    """

    def has_permission(self, request, view) -> bool:
        return get_seller_profile_for_user(request.user) is not None
