from rest_framework.permissions import BasePermission

from order.models import OrderProduct


class CanCreateReview(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        product_id = view.kwargs.get('product_id')

        return OrderProduct.objects.filter(
            order__user=user,
            product_id=product_id,
            received=True
        ).exists()
