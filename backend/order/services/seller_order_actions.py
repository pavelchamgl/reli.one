from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction
from django.http import Http404
from rest_framework.exceptions import PermissionDenied, ValidationError

from delivery.models import DeliveryParcel
from order.models import (
    Order,
    OrderEvent,
    OrderStatus,
    ProductStatus,
    OrderProduct,
)
from order.permissions_seller import get_seller_profile_for_user
from order.services.seller_order_detail import SellerOrderDetailService


@dataclass(frozen=True)
class ActionResult:
    order: Order
    seller_profile_id: int


class SellerOrderActionsService:
    STATUS_PENDING = "Pending"
    STATUS_PROCESSING = "Processing"
    STATUS_SHIPPED = "Shipped"
    STATUS_DELIVERED = "Delivered"
    STATUS_CANCELLED = "Cancelled"

    @staticmethod
    def _get_status(name: str) -> OrderStatus:
        status = OrderStatus.objects.filter(name=name).first()
        if not status:
            raise ValidationError({"detail": f"OrderStatus '{name}' is missing in DB"})
        return status

    @staticmethod
    def _get_order_for_seller_locked(*, order_id: int, user) -> tuple[Order, int]:
        """
        Postgres-safe locking strategy:
        1) Verify seller ownership via EXISTS (no DISTINCT, no JOINs)
        2) Lock Order row by PK only
        """
        seller_profile = get_seller_profile_for_user(user)
        if not seller_profile:
            raise PermissionDenied("User is not a seller")

        allowed = OrderProduct.objects.filter(
            order_id=order_id,
            seller_profile_id=seller_profile.id,
        ).exists()

        if not allowed:
            raise Http404

        order = (
            Order.objects
            .select_for_update()
            .filter(pk=order_id)
            .first()
        )
        if not order:
            raise Http404

        return order, seller_profile.id

    @staticmethod
    def confirm_order(*, order_id: int, user) -> dict:
        with transaction.atomic():
            order, seller_profile_id = SellerOrderActionsService._get_order_for_seller_locked(
                order_id=order_id,
                user=user,
            )

            current = order.order_status.name if order.order_status else ""
            if current != SellerOrderActionsService.STATUS_PENDING:
                raise ValidationError({
                    "detail": (
                        f"Order status must be "
                        f"'{SellerOrderActionsService.STATUS_PENDING}', got '{current}'"
                    )
                })

            order.order_status = SellerOrderActionsService._get_status(
                SellerOrderActionsService.STATUS_PROCESSING
            )
            order.save(update_fields=["order_status"])

            if not OrderEvent.objects.filter(
                order=order,
                type=OrderEvent.Type.ORDER_ACKNOWLEDGED,
            ).exists():
                OrderEvent.objects.create(
                    order=order,
                    type=OrderEvent.Type.ORDER_ACKNOWLEDGED,
                    meta={"source": "seller_action"},
                )

        order, seller_profile_id = SellerOrderDetailService.get_order_for_seller(
            order_id=order_id,
            user=user,
        )
        return SellerOrderDetailService.build_payload(
            order=order,
            seller_profile_id=seller_profile_id,
            user=user,
        )

    @staticmethod
    def mark_as_shipped(*, order_id: int, user) -> dict:
        with transaction.atomic():
            order, seller_profile_id = SellerOrderActionsService._get_order_for_seller_locked(
                order_id=order_id,
                user=user,
            )

            current = order.order_status.name if order.order_status else ""
            if current != SellerOrderActionsService.STATUS_PROCESSING:
                raise ValidationError({
                    "detail": (
                        f"Order status must be "
                        f"'{SellerOrderActionsService.STATUS_PROCESSING}', got '{current}'"
                    )
                })

            parcels = list(DeliveryParcel.objects.filter(order=order))
            if not parcels:
                raise ValidationError({
                    "detail": "Cannot mark order as shipped without delivery parcels"
                })

            order.order_status = SellerOrderActionsService._get_status(
                SellerOrderActionsService.STATUS_SHIPPED
            )
            order.save(update_fields=["order_status"])

            if not OrderEvent.objects.filter(
                order=order,
                type=OrderEvent.Type.SHIPMENT_CREATED,
            ).exists():
                OrderEvent.objects.create(
                    order=order,
                    type=OrderEvent.Type.SHIPMENT_CREATED,
                    meta={"source": "seller_action"},
                )

            has_tracking = any((p.tracking_number or "").strip() for p in parcels)
            if has_tracking and not OrderEvent.objects.filter(
                order=order,
                type=OrderEvent.Type.TRACKING_UPLOADED,
            ).exists():
                OrderEvent.objects.create(
                    order=order,
                    type=OrderEvent.Type.TRACKING_UPLOADED,
                    meta={"source": "seller_action"},
                )

        order, seller_profile_id = SellerOrderDetailService.get_order_for_seller(
            order_id=order_id,
            user=user,
        )
        return SellerOrderDetailService.build_payload(
            order=order,
            seller_profile_id=seller_profile_id,
            user=user,
        )

    @staticmethod
    def cancel_order(*, order_id: int, user) -> dict:
        is_admin = bool(
            getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
        if not is_admin:
            raise PermissionDenied("Only admin can cancel orders")

        with transaction.atomic():
            order = (
                Order.objects
                .select_for_update()
                .filter(pk=order_id)
                .first()
            )
            if not order:
                raise Http404

            current = order.order_status.name if order.order_status else ""
            if current in (
                SellerOrderActionsService.STATUS_DELIVERED,
                SellerOrderActionsService.STATUS_CANCELLED,
            ):
                raise ValidationError({
                    "detail": f"Cannot cancel order in status '{current}'"
                })

            order.order_status = SellerOrderActionsService._get_status(
                SellerOrderActionsService.STATUS_CANCELLED
            )
            order.save(update_fields=["order_status"])

            order.order_products.update(status=ProductStatus.CANCELED)

            OrderEvent.objects.create(
                order=order,
                type=OrderEvent.Type.CANCELLED,
                meta={"source": "admin_action"},
            )

        seller_profile = get_seller_profile_for_user(user)
        if seller_profile:
            order, seller_profile_id = SellerOrderDetailService.get_order_for_seller(
                order_id=order_id,
                user=user,
            )
            return SellerOrderDetailService.build_payload(
                order=order,
                seller_profile_id=seller_profile_id,
                user=user,
            )

        return {
            "id": order_id,
            "status": SellerOrderActionsService.STATUS_CANCELLED,
        }
