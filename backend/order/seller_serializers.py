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
