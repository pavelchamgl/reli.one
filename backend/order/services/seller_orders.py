from __future__ import annotations

from decimal import Decimal

from django.db.models import (
    BooleanField,
    Case,
    DecimalField,
    Exists,
    ExpressionWrapper,
    F,
    OuterRef,
    Q,
    Subquery,
    Sum,
    Value,
    When,
    IntegerField,
    DateField,
)
from django.db.models.functions import Coalesce

from ..models import Order, OrderProduct
from ..permissions_seller import get_seller_profile_for_user
from delivery.models import DeliveryParcel


# ======= Common decimal fields =======
DEC_12_2 = DecimalField(max_digits=12, decimal_places=2)
DEC_8_4 = DecimalField(max_digits=8, decimal_places=4)


class SellerOrderQueryService:
    """
    Оптимальный queryset для Seller Order List.

    Гарантии:
    - seller scoped
    - per-item VAT (корректно при разных VAT в одном заказе)
    - product_price считается как GROSS (incl VAT + acquiring)
    """

    # Base queryset
    @staticmethod
    def base_queryset_for_user(user):
        seller_profile = get_seller_profile_for_user(user)
        if not seller_profile:
            return Order.objects.none()

        return (
            Order.objects
            .filter(order_products__seller_profile_id=seller_profile.id)
            .distinct()
        )

    # Annotations
    @staticmethod
    def annotate_for_list(qs, *, seller_profile_id: int | None):
        """
        Аннотации под Seller Order List:
        - products_count
        - sales_incl_vat (gross)
        - purchase_excl_vat (net, per-item VAT aware)
        - total_incl_vat_plus_delivery
        - has_tracking / has_label
        - branch
        - UI flags
        """

        # seller-scoped filter for aggregates
        seller_filter = Q()
        if seller_profile_id:
            seller_filter = Q(order_products__seller_profile_id=seller_profile_id)

        # Products count
        products_count = Coalesce(
            Sum("order_products__quantity", filter=seller_filter),
            Value(0, output_field=IntegerField()),
            output_field=IntegerField(),
        )

        # GROSS per line
        gross_line = ExpressionWrapper(
            F("order_products__product_price") * F("order_products__quantity"),
            output_field=DEC_12_2,
        )

        sales_incl_vat = Coalesce(
            Sum(gross_line, filter=seller_filter),
            Value(Decimal("0.00"), output_field=DEC_12_2),
            output_field=DEC_12_2,
        )

        # NET per line (PER-ITEM VAT)
        # vat_rate is stored on BaseProduct
        vat_rate = Coalesce(
            F("order_products__product__product__vat_rate"),
            Value(0),
        )

        vat_multiplier = ExpressionWrapper(
            Value(1, output_field=DEC_8_4)
            + (vat_rate / Value(100, output_field=DEC_8_4)),
            output_field=DEC_8_4,
        )

        net_line = ExpressionWrapper(
            gross_line / vat_multiplier,
            output_field=DEC_12_2,
        )

        purchase_excl_vat = Coalesce(
            Sum(net_line, filter=seller_filter),
            Value(Decimal("0.00"), output_field=DEC_12_2),
            output_field=DEC_12_2,
        )

        # Total incl VAT + delivery
        total_incl_vat_plus_delivery = Coalesce(
            F("group_subtotal"),
            ExpressionWrapper(
                sales_incl_vat
                + Coalesce(
                    F("delivery_cost"),
                    Value(Decimal("0.00"), output_field=DEC_12_2),
                ),
                output_field=DEC_12_2,
            ),
            output_field=DEC_12_2,
        )

        # Parcels
        parcel_qs = DeliveryParcel.objects.filter(order=OuterRef("pk"))

        has_tracking = Exists(
            parcel_qs.filter(tracking_number__isnull=False).exclude(tracking_number="")
        )
        has_label = Exists(
            parcel_qs.filter(label_file__isnull=False).exclude(label_file="")
        )

        # Branch
        parcel_wh_id = Subquery(
            parcel_qs.exclude(warehouse__isnull=True).values("warehouse_id")[:1]
        )
        parcel_wh_name = Subquery(
            parcel_qs.exclude(warehouse__isnull=True).values("warehouse__name")[:1]
        )

        item_wh_id = Subquery(
            OrderProduct.objects
            .filter(order_id=OuterRef("pk"), **({"seller_profile_id": seller_profile_id} if seller_profile_id else {}))
            .exclude(warehouse__isnull=True)
            .values("warehouse_id")[:1]
        )
        item_wh_name = Subquery(
            OrderProduct.objects
            .filter(order_id=OuterRef("pk"), **({"seller_profile_id": seller_profile_id} if seller_profile_id else {}))
            .exclude(warehouse__isnull=True)
            .values("warehouse__name")[:1]
        )

        # Final annotate
        qs = qs.annotate(
            products_count=products_count,
            sales_incl_vat=sales_incl_vat,
            purchase_excl_vat=purchase_excl_vat,
            total_incl_vat_plus_delivery=total_incl_vat_plus_delivery,
            has_tracking=has_tracking,
            has_label=has_label,
            branch_id=Coalesce(parcel_wh_id, item_wh_id),
            branch_name=Coalesce(parcel_wh_name, item_wh_name),
            dispatch_before=Value(None, output_field=DateField()),
            can_download_label=Case(
                When(has_label=True, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
            can_cancel=Value(False, output_field=BooleanField()),
        )

        return qs
