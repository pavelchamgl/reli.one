from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to admins.
    """
    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_admin()


class IsManager(BasePermission):
    """
    Allows access only to managers.
    """
    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_manager()


class IsCustomer(BasePermission):
    """
    Allows access only to customers.
    """
    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_customer()


class IsSeller(BasePermission):
    """
    Allows access only to sellers.
    """
    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_seller()
