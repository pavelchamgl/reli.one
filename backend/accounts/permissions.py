from rest_framework.permissions import BasePermission


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
