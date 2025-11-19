import logging

from rest_framework import serializers

from delivery.helpers import (
    validate_gls_pickup_point_type,
    DELIVERY_TYPE_PUDO,
    DELIVERY_TYPE_HD,
)

logger = logging.getLogger(__name__)


class DeliveryAddressSerializer(serializers.Serializer):
    street = serializers.CharField()
    city = serializers.CharField()
    zip = serializers.CharField()
    country = serializers.CharField(
        help_text="ISO 3166-1 alpha-2 code (e.g., 'SK', 'CZ')"
    )


class ProductItemSerializer(serializers.Serializer):
    sku = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)


class GroupSerializer(serializers.Serializer):
    seller_id = serializers.IntegerField()

    delivery_type = serializers.IntegerField(
        help_text="1 = PUDO, 2 = Home Delivery"
    )

    delivery_mode = serializers.ChoiceField(
        choices=["shop", "box"],
        required=False,
        help_text=(
            "Required ONLY for GLS PUDO (courier_service = 3 AND delivery_type = 1). "
            "Must be one of: ['shop', 'box']. "
            "Forbidden for GLS HD. Ignored for Packeta and DPD."
        )
    )

    courier_service = serializers.IntegerField(
        help_text="2 = Packeta, 3 = GLS, 4 = DPD"
    )

    delivery_address = DeliveryAddressSerializer(
        required=False,
        help_text="Required for Home Delivery (delivery_type = 2)."
    )

    pickup_point_id = serializers.CharField(
        required=False,
        help_text="Required for PUDO (delivery_type = 1)."
    )

    products = ProductItemSerializer(
        many=True,
        help_text="List of SKU + quantity for this seller group."
    )

    def validate(self, data):
        courier = data.get("courier_service")
        delivery_type = data.get("delivery_type")
        delivery_mode = data.get("delivery_mode")

        # normalize courier_code for downstream services/helpers
        if courier == 3:
            data["courier_code"] = "gls"
        elif courier == 2:
            data["courier_code"] = "packeta"
        elif courier == 4:
            data["courier_code"] = "dpd"

        is_gls = (courier == 3)

        # -----------------------------------------------------
        # GLS HD — delivery_mode запрещён
        # -----------------------------------------------------
        if is_gls and delivery_type == DELIVERY_TYPE_HD:
            if delivery_mode:
                raise serializers.ValidationError(
                    "delivery_mode must not be provided for GLS Home Delivery."
                )

        # -----------------------------------------------------
        # GLS PUDO — delivery_mode обязателен + SHOP/BOX check
        # -----------------------------------------------------
        if is_gls and delivery_type == DELIVERY_TYPE_PUDO:
            logger.info(f"[VALIDATION] GLS PUDO validation triggered for mode={delivery_mode}")

            # No mode provided
            if not delivery_mode:
                raise serializers.ValidationError(
                    "For GLS PUDO, delivery_mode must be 'shop' or 'box'."
                )

            # Determine root_country:
            root_country = self.context.get("root_country")

            # If not present, derive from top-level serializer
            if not root_country:
                try:
                    session = self.parent.parent  # SessionInputSerializer
                    root_country = session.initial_data["delivery_address"]["country"]
                except Exception:
                    root_country = None

            if not root_country:
                raise serializers.ValidationError(
                    "Cannot determine root_country for GLS PUDO validation."
                )

            # Determine index of this group (for error messages)
            try:
                idx = self.parent.initial_data.index(self.initial_data)
            except Exception:
                idx = 0

            # Perform actual GLS shop/box validation
            validate_gls_pickup_point_type(
                group=data,
                idx=idx,
                delivery_mode=delivery_mode,
                root_country=root_country,
            )

        return data


class SessionInputSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()
    delivery_address = DeliveryAddressSerializer(required=True)
    groups = GroupSerializer(
        many=True,
        help_text=(
            "Each group represents one seller. Delivery is calculated per group, "
            "and one order per group will be created after successful payment."
        )
    )


class StripeSessionOutputSerializer(serializers.Serializer):
    checkout_url = serializers.CharField()
    session_id = serializers.CharField()
    session_key = serializers.CharField()


class PayPalSessionOutputSerializer(serializers.Serializer):
    approval_url = serializers.CharField()
    order_id = serializers.CharField()
    session_key = serializers.CharField()
    session_id = serializers.CharField()
