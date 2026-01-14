from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional

from django.db.models import Prefetch
from django.http import Http404

from delivery.models import DeliveryParcel
from ..models import Order, OrderProduct
from ..permissions_seller import get_seller_profile_for_user


@dataclass(frozen=True)
class MoneyTotals:
    purchase_excl_vat: Decimal
    sales_incl_vat: Decimal
    total_incl_vat_plus_delivery: Decimal
    delivery_cost: Decimal
    currency: Optional[str]


class SellerOrderDetailService:
    """
    Seller-scoped Order Detail builder.
    """

    @staticmethod
    def _d(value: Any) -> Decimal:
        if value is None:
            return Decimal("0.00")
        if isinstance(value, Decimal):
            return value
        try:
            return Decimal(str(value))
        except Exception:
            return Decimal("0.00")

    @staticmethod
    def _net_from_gross(gross: Decimal, vat_rate: Decimal) -> Decimal:
        vr = SellerOrderDetailService._d(vat_rate)
        if vr <= 0:
            return gross
        return gross / (Decimal("1.0") + (vr / Decimal("100.0")))

    @staticmethod
    def _join_non_empty(parts: list[str | None]) -> str:
        return " ".join([p.strip() for p in parts if p and str(p).strip()]).strip()

    @staticmethod
    def get_order_for_seller(*, order_id: int, user) -> tuple[Order, int]:
        seller_profile = get_seller_profile_for_user(user)
        if not seller_profile:
            raise Http404

        qs = (
            Order.objects
            .filter(
                pk=order_id,
                order_products__seller_profile_id=seller_profile.id,
            )
            .distinct()
            .select_related(
                "order_status",
                "delivery_type",
                "courier_service",
                "delivery_address",
                "payment",
            )
            .prefetch_related(
                Prefetch(
                    "order_products",
                    queryset=OrderProduct.objects.select_related(
                        "product",              # ProductVariant
                        "product__product",     # BaseProduct
                        "warehouse",
                        "seller_profile",
                    ),
                ),
                "events",
            )
        )

        order = qs.first()
        if not order:
            raise Http404

        return order, seller_profile.id

    @staticmethod
    def calculate_totals(*, order: Order, seller_profile_id: int) -> MoneyTotals:
        sales_gross = Decimal("0.00")
        purchase_net = Decimal("0.00")

        for op in order.order_products.all():
            if op.seller_profile_id != seller_profile_id:
                continue

            qty = int(op.quantity or 0)
            unit_gross = SellerOrderDetailService._d(op.product_price)
            line_gross = unit_gross * Decimal(qty)
            sales_gross += line_gross

            variant = op.product
            base = getattr(variant, "product", None) if variant else None
            vat_rate = getattr(base, "vat_rate", None) if base else None

            purchase_net += SellerOrderDetailService._net_from_gross(line_gross, SellerOrderDetailService._d(vat_rate))

        delivery_cost = SellerOrderDetailService._d(order.delivery_cost)
        total_plus_delivery = sales_gross + delivery_cost

        currency = None
        if order.payment_id:
            currency = getattr(order.payment, "currency", None)

        return MoneyTotals(
            purchase_excl_vat=purchase_net.quantize(Decimal("0.01")),
            sales_incl_vat=sales_gross.quantize(Decimal("0.01")),
            total_incl_vat_plus_delivery=total_plus_delivery.quantize(Decimal("0.01")),
            delivery_cost=delivery_cost.quantize(Decimal("0.01")),
            currency=currency,
        )

    @staticmethod
    def get_branch(*, order: Order, seller_profile_id: int) -> Optional[dict]:
        parcel = DeliveryParcel.objects.filter(order=order).select_related("warehouse").first()
        if parcel and parcel.warehouse_id:
            return {"id": parcel.warehouse_id, "name": getattr(parcel.warehouse, "name", "")}

        for op in order.order_products.all():
            if op.seller_profile_id != seller_profile_id:
                continue
            if op.warehouse_id:
                return {"id": op.warehouse_id, "name": getattr(op.warehouse, "name", "")}

        return None

    @staticmethod
    def get_shipments(*, order: Order) -> list[dict]:
        """
        Shipments list, supports multiple parcels per order.
        Shipment items are aggregated: one row per order_product_id.
        """
        parcels = (
            DeliveryParcel.objects
            .filter(order=order)
            .select_related("service", "warehouse")
            .prefetch_related(
                "items__order_product__product__product"  # items -> OrderProduct -> ProductVariant -> BaseProduct
            )
        )

        shipments: list[dict] = []
        for p in parcels:
            carrier = {"id": p.service_id, "name": getattr(p.service, "name", "")} if p.service_id else None

            tracking_number = p.tracking_number or None
            label_url = p.label_file.url if p.label_file and hasattr(p.label_file, "url") else None

            wh = {"id": p.warehouse_id, "name": getattr(p.warehouse, "name", "")} if p.warehouse_id else None

            # Aggregate items by order_product_id
            aggregated: dict[int, dict] = {}
            for it in p.items.all():
                op = it.order_product
                if not op:
                    continue

                op_id = op.id
                qty = int(it.quantity or 0)

                if op_id not in aggregated:
                    variant = op.product  # ProductVariant
                    base = getattr(variant, "product", None) if variant else None

                    base_name = getattr(base, "name", None) if base else None
                    variant_name = getattr(variant, "name", None) if variant else None
                    variant_text = getattr(variant, "text", None) if variant else None

                    full_name = SellerOrderDetailService._join_non_empty(
                        [base_name, variant_name, variant_text]
                    )

                    aggregated[op_id] = {
                        "order_product_id": op_id,
                        "sku": getattr(variant, "sku", None),
                        "name": full_name,
                        "quantity": 0,
                    }

                aggregated[op_id]["quantity"] += qty

            shipments.append(
                {
                    "id": p.id,
                    "carrier": carrier,
                    "tracking_number": tracking_number,
                    "has_tracking": bool(tracking_number),
                    "has_label": bool(label_url),
                    "label_url": label_url,
                    "created_at": p.created_at,
                    "warehouse": wh,
                    "items": list(aggregated.values()),
                }
            )

        return shipments

    @staticmethod
    def get_timeline(*, order: Order) -> list[dict]:
        events = order.events.all().order_by("created_at")

        label_map = {
            "order_created": "Order created",
            "payment_confirmed": "Payment confirmed",
            "order_acknowledged": "Order acknowledged",
            "shipment_created": "Shipment created",
            "tracking_uploaded": "Tracking uploaded",
            "delivered": "Delivered",
            "cancelled": "Cancelled",
        }

        timeline: list[dict] = []
        for ev in events:
            ev_type = ev.type
            timeline.append(
                {
                    "type": ev_type,
                    "label": label_map.get(ev_type, ev_type),
                    "created_at": ev.created_at,
                    "meta": ev.meta or {},
                }
            )
        return timeline

    @staticmethod
    def get_actions(*, order: Order, shipments: list[dict], user) -> dict:
        status_name = (getattr(order.order_status, "name", "") or "").lower()

        is_admin = bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))
        has_any_label = any(s.get("has_label") for s in shipments)

        can_confirm = status_name == "pending"
        can_mark_shipped = status_name == "processing"
        can_download_label = has_any_label
        can_cancel = is_admin

        next_action = None
        if can_confirm:
            next_action = "Confirm order"
        elif can_mark_shipped:
            next_action = "Mark as shipped"

        return {
            "can_confirm": can_confirm,
            "can_mark_shipped": can_mark_shipped,
            "can_download_label": can_download_label,
            "can_cancel": can_cancel,
            "next_action": next_action,
        }

    @staticmethod
    def build_payload(*, order: Order, seller_profile_id: int, user) -> dict:
        totals = SellerOrderDetailService.calculate_totals(order=order, seller_profile_id=seller_profile_id)
        branch = SellerOrderDetailService.get_branch(order=order, seller_profile_id=seller_profile_id)
        shipments = SellerOrderDetailService.get_shipments(order=order)
        timeline = SellerOrderDetailService.get_timeline(order=order)
        actions = SellerOrderDetailService.get_actions(order=order, shipments=shipments, user=user)

        dt = order.delivery_type
        cs = order.courier_service
        da = order.delivery_address

        summary = {
            "id": order.id,
            "order_number": order.order_number,
            "order_date": order.order_date,
            "status": getattr(order.order_status, "name", None),
            "customer": {
                "first_name": order.first_name,
                "last_name": order.last_name,
                "email": order.customer_email,
                "phone": str(order.phone_number) if order.phone_number else "",
            },
            "delivery": {
                "delivery_type": {"id": dt.id, "name": dt.name} if dt else None,
                "courier_service": {"id": cs.id, "name": cs.name, "code": cs.code} if cs else None,
                "pickup_point_id": order.pickup_point_id,
                "delivery_address": {
                    "full_name": da.full_name,
                    "email": da.email,
                    "phone": str(da.phone),
                    "street": da.street,
                    "city": da.city,
                    "zip_code": da.zip_code,
                    "country": da.country,
                } if da else None,
            },
            "branch": branch,
            "totals": {
                "purchase_excl_vat": str(totals.purchase_excl_vat),
                "sales_incl_vat": str(totals.sales_incl_vat),
                "total_incl_vat_plus_delivery": str(totals.total_incl_vat_plus_delivery),
                "delivery_cost": str(totals.delivery_cost),
                "currency": totals.currency,
            },
        }

        # Product items
        items_payload: list[dict] = []
        for op in order.order_products.all():
            if op.seller_profile_id != seller_profile_id:
                continue

            variant = op.product
            base = getattr(variant, "product", None) if variant else None

            sku = getattr(variant, "sku", None)
            base_name = getattr(base, "name", None) if base else None
            qty = int(op.quantity or 0)

            unit_gross = SellerOrderDetailService._d(op.product_price)
            line_gross = unit_gross * Decimal(qty)

            vat_rate = SellerOrderDetailService._d(getattr(base, "vat_rate", None) if base else None)
            line_net = SellerOrderDetailService._net_from_gross(line_gross, vat_rate)

            wh = {"id": op.warehouse_id, "name": getattr(op.warehouse, "name", "")} if op.warehouse_id else None

            variant_name = SellerOrderDetailService._join_non_empty(
                [getattr(variant, "name", None), getattr(variant, "text", None)]
            )

            items_payload.append(
                {
                    "id": op.id,
                    "sku": sku,
                    "name": base_name,
                    "variant_name": variant_name,
                    "quantity": qty,
                    "unit_price_gross": str(unit_gross.quantize(Decimal("0.01"))),
                    "vat_rate": str(vat_rate.quantize(Decimal("0.01"))),
                    "line_total_gross": str(line_gross.quantize(Decimal("0.01"))),
                    "line_total_net": str(line_net.quantize(Decimal("0.01"))),
                    "warehouse": wh,
                }
            )

        return {
            "summary": summary,
            "items": items_payload,
            "shipments": shipments,
            "timeline": timeline,
            "actions": actions,
        }
