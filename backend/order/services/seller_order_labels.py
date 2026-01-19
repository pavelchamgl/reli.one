from __future__ import annotations

import io
import zipfile
from typing import Iterable

from django.http import FileResponse, Http404
from django.db.models import Exists, OuterRef

from delivery.models import DeliveryParcel
from order.models import Order, OrderProduct
from order.permissions_seller import get_seller_profile_for_user


class SellerOrderLabelsService:
    """
    Builds label files (PDF / ZIP) for seller-scoped orders & shipments.
    """

    @staticmethod
    def _check_order_access(order: Order, *, user) -> None:
        seller = get_seller_profile_for_user(user)
        if not seller:
            raise Http404

        allowed = OrderProduct.objects.filter(
            order=order,
            seller_profile_id=seller.id,
        ).exists()

        if not allowed:
            raise Http404

    # shipment single label

    @staticmethod
    def get_shipment_label(*, shipment_id: int, user):
        parcel = DeliveryParcel.objects.select_related("order").filter(pk=shipment_id).first()
        if not parcel or not parcel.label_file:
            raise Http404

        SellerOrderLabelsService._check_order_access(parcel.order, user=user)

        return FileResponse(
            parcel.label_file.open("rb"),
            as_attachment=True,
            filename=parcel.label_file.name.split("/")[-1],
            content_type="application/pdf",
        )

    # order labels (zip)

    @staticmethod
    def get_order_labels_zip(*, order_id: int, user):
        order = Order.objects.filter(pk=order_id).first()
        if not order:
            raise Http404

        SellerOrderLabelsService._check_order_access(order, user=user)

        parcels = DeliveryParcel.objects.filter(
            order=order,
            label_file__isnull=False,
        ).exclude(label_file="")

        if not parcels.exists():
            raise Http404

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for parcel in parcels:
                filename = parcel.label_file.name.split("/")[-1]
                zf.writestr(
                    filename,
                    parcel.label_file.open("rb").read(),
                )

        buffer.seek(0)
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"{order.order_number}.zip",
            content_type="application/zip",
        )

    # bulk orders labels

    @staticmethod
    def get_bulk_orders_labels_zip(*, order_ids: Iterable[int], user):
        seller = get_seller_profile_for_user(user)
        if not seller:
            raise Http404

        orders = (
            Order.objects
            .filter(id__in=order_ids)
            .filter(
                Exists(
                    OrderProduct.objects.filter(
                        order=OuterRef("pk"),
                        seller_profile_id=seller.id,
                    )
                )
            )
        )

        if not orders.exists():
            raise Http404

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for order in orders:
                parcels = DeliveryParcel.objects.filter(
                    order=order,
                    label_file__isnull=False,
                ).exclude(label_file="")

                for parcel in parcels:
                    filename = parcel.label_file.name.split("/")[-1]
                    path = f"{order.order_number}/{filename}"
                    zf.writestr(path, parcel.label_file.open("rb").read())

        buffer.seek(0)
        return FileResponse(
            buffer,
            as_attachment=True,
            filename="labels.zip",
            content_type="application/zip",
        )
