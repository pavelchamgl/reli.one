from rest_framework import serializers

from .models import Order


class SellerOrderListSerializer(serializers.ModelSerializer):
    order_date = serializers.DateTimeField(read_only=True)
    products_count = serializers.IntegerField(read_only=True)

    purchase_excl_vat = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    sales_incl_vat = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_incl_vat_plus_delivery = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    status = serializers.CharField(source="order_status.name", read_only=True)

    branch = serializers.SerializerMethodField()
    dispatch_before = serializers.DateField(read_only=True, allow_null=True)

    has_tracking = serializers.BooleanField(read_only=True)
    has_label = serializers.BooleanField(read_only=True)

    can_download_label = serializers.BooleanField(read_only=True)
    can_cancel = serializers.SerializerMethodField()

    def get_can_cancel(self, obj):
        return bool(self.context.get("can_cancel", False))

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "order_date",
            "products_count",
            "purchase_excl_vat",
            "sales_incl_vat",
            "total_incl_vat_plus_delivery",
            "status",
            "branch",
            "dispatch_before",
            "has_tracking",
            "has_label",
            "can_download_label",
            "can_cancel",
        ]

    def get_branch(self, obj):
        branch_id = getattr(obj, "branch_id", None)
        branch_name = getattr(obj, "branch_name", None)
        if not branch_id and not branch_name:
            return None
        return {"id": branch_id, "name": branch_name}


class SellerOrderBranchSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class SellerOrderCustomerSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    phone = serializers.CharField()


class SellerOrderDeliveryTypeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class SellerOrderCourierServiceSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField(allow_null=True, required=False)


class SellerOrderDeliveryAddressSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.CharField()
    phone = serializers.CharField()
    street = serializers.CharField()
    city = serializers.CharField()
    zip_code = serializers.CharField()
    country = serializers.CharField()


class SellerOrderDeliverySerializer(serializers.Serializer):
    delivery_type = SellerOrderDeliveryTypeSerializer(allow_null=True)
    courier_service = SellerOrderCourierServiceSerializer(allow_null=True)
    pickup_point_id = serializers.CharField(allow_null=True, required=False)
    delivery_address = SellerOrderDeliveryAddressSerializer(allow_null=True)


class SellerOrderTotalsSerializer(serializers.Serializer):
    purchase_excl_vat = serializers.CharField()
    sales_incl_vat = serializers.CharField()
    total_incl_vat_plus_delivery = serializers.CharField()
    delivery_cost = serializers.CharField()
    currency = serializers.CharField(allow_null=True)


class SellerOrderSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    order_number = serializers.CharField()
    order_date = serializers.DateTimeField()
    status = serializers.CharField(allow_null=True)

    customer = SellerOrderCustomerSerializer()
    delivery = SellerOrderDeliverySerializer()
    branch = SellerOrderBranchSerializer(allow_null=True)
    totals = SellerOrderTotalsSerializer()


class SellerOrderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    sku = serializers.CharField(allow_null=True)
    name = serializers.CharField(allow_null=True)
    variant_name = serializers.CharField(allow_null=True)  # <-- NEW
    quantity = serializers.IntegerField()
    unit_price_gross = serializers.CharField()
    vat_rate = serializers.CharField()
    line_total_gross = serializers.CharField()
    line_total_net = serializers.CharField()
    warehouse = SellerOrderBranchSerializer(allow_null=True)


class SellerShipmentCarrierSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class SellerShipmentItemSerializer(serializers.Serializer):
    # aggregated one row per order_product_id
    order_product_id = serializers.IntegerField()
    sku = serializers.CharField(allow_null=True)   # <-- NEW
    name = serializers.CharField(allow_null=True)  # <-- NEW
    quantity = serializers.IntegerField()


class SellerShipmentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    carrier = SellerShipmentCarrierSerializer(allow_null=True)
    tracking_number = serializers.CharField(allow_null=True)
    has_tracking = serializers.BooleanField()
    has_label = serializers.BooleanField()
    label_url = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)
    warehouse = SellerOrderBranchSerializer(allow_null=True)
    items = SellerShipmentItemSerializer(many=True)


class SellerOrderEventSerializer(serializers.Serializer):
    type = serializers.CharField(allow_null=True)
    label = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)
    meta = serializers.JSONField()


class SellerOrderActionsSerializer(serializers.Serializer):
    can_confirm = serializers.BooleanField()
    can_mark_shipped = serializers.BooleanField()
    can_download_label = serializers.BooleanField()
    can_cancel = serializers.BooleanField()
    next_action = serializers.CharField(allow_null=True)


class SellerOrderDetailSerializer(serializers.Serializer):
    summary = SellerOrderSummarySerializer()
    items = SellerOrderItemSerializer(many=True)
    shipments = SellerShipmentSerializer(many=True)
    timeline = SellerOrderEventSerializer(many=True)
    actions = SellerOrderActionsSerializer()
