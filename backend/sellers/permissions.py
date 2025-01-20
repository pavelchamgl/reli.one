from rest_framework.permissions import BasePermission

from product.models import (
    BaseProduct,
    ProductParameter
)


class IsSellerOwner(BasePermission):
    """
    Разрешает доступ только продавцу, который владеет ресурсом
    (BaseProduct или ProductParameter).
    """

    def has_permission(self, request, view):
        # Разрешаем только аутентифицированным (и, возможно, проверяем is_seller())
        return request.user.is_authenticated and request.user.is_seller()

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Если объект - это продукт
        if isinstance(obj, BaseProduct):
            return obj.seller.user == request.user

        # Если объект - это параметр продукта
        if isinstance(obj, ProductParameter):
            # Проверяем владельца через product
            return obj.product.seller.user == request.user

        # Если объект другого типа - отказываем
        return False
