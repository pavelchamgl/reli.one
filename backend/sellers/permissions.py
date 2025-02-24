from rest_framework.permissions import BasePermission

from product.models import (
    BaseProduct,
    ProductParameter,
    ProductVariant
)


class IsSellerOwner(BasePermission):
    """
    Разрешает доступ только продавцу, который владеет ресурсом
    (BaseProduct, ProductParameter или ProductVariant).
    """

    def has_permission(self, request, view):
        # Разрешаем только аутентифицированным, которые являются продавцами
        return request.user.is_authenticated and request.user.is_seller()

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Если объект - это продукт
        if isinstance(obj, BaseProduct):
            return obj.seller.user == request.user

        # Если объект - это параметр продукта
        if isinstance(obj, ProductParameter):
            return obj.product.seller.user == request.user

        # Если объект - это вариант продукта
        if isinstance(obj, ProductVariant):
            return obj.product.seller.user == request.user

        # Если объект другого типа - запрещаем
        return False
