from rest_framework.permissions import BasePermission

from product.models import BaseProduct


class IsSellerOwner(BasePermission):
    """
    Разрешает доступ только пользователю, который является
    'seller_profile.user' для данного продукта.
    """

    def has_permission(self, request, view):
        # Для object-level проверки обычно возвращают True или проверяют is_authenticated
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        obj - это экземпляр BaseProduct, когда мы делаем retrieve, update, destroy.
        """
        if not request.user.is_authenticated:
            return False

        if not isinstance(obj, BaseProduct):
            return False

        # Проверяем, совпадает ли user из seller_profile c request.user
        return obj.seller.user == request.user
