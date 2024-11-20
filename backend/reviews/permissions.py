from rest_framework.permissions import BasePermission

from order.models import OrderProduct
from product.models import ProductVariant


class CanCreateReview(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        sku = request.data.get('sku')

        if not sku:
            return False

        try:
            product_variant = ProductVariant.objects.get(sku=sku)
        except ProductVariant.DoesNotExist:
            return False

        # Проверяем, купил ли пользователь этот вариант продукта и имеет ли заказ статус 'Closed'
        has_purchased = OrderProduct.objects.filter(
            order__user=user,
            product=product_variant,
            order__order_status__name='Closed'
        ).exists()

        return has_purchased
