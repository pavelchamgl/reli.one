from rest_framework.permissions import BasePermission

from accounts.choices import UserRole


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.SELLER)


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role in [UserRole.MANAGER, UserRole.ADMIN]
        )
