from rest_framework.permissions import BasePermission

from warehouses.models import WarehouseItem


class IsSellerWarehouseOwner(BasePermission):
    """
    Разрешает доступ только продавцу, который связан с товарами на складе.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_seller()

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if isinstance(obj, WarehouseItem):
            return obj.product_variant.product.seller.user == request.user

        return False
