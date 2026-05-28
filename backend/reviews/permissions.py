from rest_framework.permissions import BasePermission

from order.models import OrderProduct
from order.order_status_names import OrderStatusName
from product.models import ProductVariant
from reviews.models import Review


class CanCreateReview(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        sku = request.data.get('sku')

        if not sku:
            return False

        sku = sku.strip('"')

        # Проверка наличия варианта продукта
        try:
            product_variant = ProductVariant.objects.get(sku=sku)
        except ProductVariant.DoesNotExist:
            return False

        # Заказ должен быть в статусе Closed (см. order.order_status_names.OrderStatusName)
        order_products = OrderProduct.objects.filter(
            order__user=user,  # Проверка, что заказ принадлежит пользователю
            product=product_variant,  # Проверка, что продукт в заказе соответствует варианту
            order__order_status__name=OrderStatusName.CLOSED
        )

        # Если такой заказ найден, разрешить создание отзыва
        if order_products.exists():
            # Проверка, что этот пользователь ещё не оставил отзыв для данного продукта
            if not Review.objects.filter(author=user, product_variant=product_variant).exists():
                return True
            return False  # Отказать в создании отзыва, если он уже был
        return False
