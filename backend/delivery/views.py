import logging

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, extend_schema, OpenApiExample

from product.models import ProductVariant

from .serializers import (
    SellerShippingRequestSerializer,
    CombinedShippingOptionsResponseSerializer,
)
from .services.shipping_split import (
    split_items_into_parcels as split_packeta,
    combine_parcel_options,
)
from .services.local_rates import calculate_shipping_options as calc_packeta
from .services.gls_split import split_items_into_parcels_gls as split_gls
from .services.gls_rates import calculate_gls_shipping_options as calc_gls
from .services.dpd_rates import (
    calculate_order_shipping_dpd as calc_dpd_wrap,  # DPD wrapper: split + aggregate
)

logger = logging.getLogger(__name__)


@extend_schema(
    operation_id="seller_shipping_options",
    summary="Seller shipping estimate (Zásilkovna, DPD, GLS)",
    description=(
        "Returns a preliminary shipping estimate across Zásilkovna, DPD, and GLS.\n\n"
        "What it does:\n"
        "• Validates input and ensures all SKUs ship from the seller's CZ warehouse.\n"
        "• Splits items into parcels with courier-specific rules.\n"
        "• Computes PUDO/HD prices and returns aggregated totals per channel.\n\n"
        "Assumptions:\n"
        "• Currency: EUR (CZK→EUR conversion happens internally).\n"
        "• COD is disabled.\n"
        "• Each courier block contains: service, channel, price, priceWithVat, currency, estimate, courier.\n"
        "• If pricing fails for a courier, that block has an 'error' field.\n\n"
        "DPD specifics:\n"
        "• Limits: PUDO ≤ 20 kg, HD ≤ 31.5 kg; volumetric weight uses SHIPMENT_VOLUME_FACTOR.\n"
        "• DPD wrapper splits & aggregates internally and returns parcel counts per channel.\n"
        "• To keep contract consistent (single integer), total_parcels is max of PUDO/HD counts."
    ),
    request=SellerShippingRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=CombinedShippingOptionsResponseSerializer,
            description="Aggregated PUDO/HD options for Zásilkovna, DPD and GLS",
        ),
        400: OpenApiResponse(description="Validation error"),
        500: OpenApiResponse(description="Internal server error"),
    },
    tags=["Delivery Calculation"],
    examples=[
        # ---- Request example (ONLY request) ----
        OpenApiExample(
            name="Request: simple",
            summary="Minimal request payload",
            value={
                "seller_id": 7,
                "destination_country": "CZ",
                "items": [{"sku": "240819709", "quantity": 1}]
            },
            request_only=True,
        ),

        # ---- Response examples (ONLY responses) ----
        OpenApiExample(
            name="Response: all couriers OK",
            summary="Zásilkovna, DPD, and GLS returned aggregated PUDO/HD options",
            value={
                "couriers": {
                    "zasilkovna": {
                        "total_parcels": 1,
                        "options": [
                            {"service": "Pick-up point","channel": "PUDO","price": 4.31,"priceWithVat": 5.21,"currency": "EUR","estimate": "","courier": "Zásilkovna"},
                            {"service": "Home Delivery","channel": "HD","price": 5.90,"priceWithVat": 7.14,"currency": "EUR","estimate": "","courier": "Zásilkovna"},
                        ],
                    },
                    "dpd": {
                        "total_parcels": 1,
                        "options": [
                            {"service": "Pick-up point","channel": "PUDO","price": 3.70,"priceWithVat": 4.48,"currency": "EUR","estimate": "","courier": "DPD"},
                            {"service": "Home Delivery","channel": "HD","price": 4.77,"priceWithVat": 5.77,"currency": "EUR","estimate": "","courier": "DPD"},
                        ],
                    },
                    "gls": {
                        "total_parcels": 1,
                        "options": [
                            {"service": "Pick-up point","channel": "PUDO","price": 5.35,"priceWithVat": 6.47,"currency": "EUR","estimate": "","courier": "GLS"},
                            {"service": "Home Delivery","channel": "HD","price": 6.46,"priceWithVat": 7.82,"currency": "EUR","estimate": "","courier": "GLS"},
                        ],
                    },
                },
                "meta": {"country": "CZ", "currency": "EUR"},
            },
            response_only=True,
        ),
        OpenApiExample(
            name="Response: partial (GLS failed)",
            summary="Zásilkovna and DPD priced; GLS failed (no rate for limits)",
            value={
                "couriers": {
                    "zasilkovna": {
                        "total_parcels": 1,
                        "options": [
                            {"service": "Pick-up point","channel": "PUDO","price": 4.31,"priceWithVat": 5.21,"currency": "EUR","estimate": "","courier": "Zásilkovna"},
                            {"service": "Home Delivery","channel": "HD","price": 5.90,"priceWithVat": 7.14,"currency": "EUR","estimate": "","courier": "Zásilkovna"},
                        ],
                    },
                    "dpd": {
                        "total_parcels": 1,
                        "options": [
                            {"service": "Pick-up point","channel": "PUDO","price": 3.70,"priceWithVat": 4.48,"currency": "EUR","estimate": "","courier": "DPD"},
                            {"service": "Home Delivery","channel": "HD","price": 4.77,"priceWithVat": 5.77,"currency": "EUR","estimate": "","courier": "DPD"},
                        ],
                    },
                    "gls": {"error": "GLS: no rates found for given parameters"},
                },
                "meta": {"country": "CZ", "currency": "EUR"},
            },
            response_only=True,
        ),
    ],
)
class SellerShippingOptionsView(APIView):
    """
    POST /api/shipping-options/seller/

    Returns three blocks under `couriers`: `zasilkovna`, `dpd`, `gls`.
    Each block uses the same shape: `total_parcels` (int) + `options` (PUDO/HD list).
    """

    def post(self, request):
        # 1) Validate input
        serializer = SellerShippingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        country = data["destination_country"].upper()  # (1) country to UPPER once
        items = data["items"]
        currency = "EUR"
        cod = False  # can be turned on later via a flag if needed
        seller_id = data.get("seller_id")  # (3) add seller_id to logs

        logger.info(
            "SellerShippingOptions start seller_id=%s country=%s items=%s",
            seller_id, country, items
        )

        # 2) Origin check: all items must ship from the seller's CZ default warehouse
        try:
            skus = [str(i["sku"]) for i in items]
            variants = (
                ProductVariant.objects
                .filter(sku__in=skus)
                .select_related("product__seller__default_warehouse")
            )
            vmap = {v.sku: v for v in variants}

            # (4) explicit missing SKUs report
            missing = [str(it["sku"]) for it in items if str(it["sku"]) not in vmap]
            if missing:
                return Response(
                    {"items": [f"Unknown SKUs: {', '.join(missing)}"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            not_cz = []
            for it in items:
                v = vmap.get(str(it["sku"]))
                seller = getattr(getattr(v, "product", None), "seller", None) if v else None
                dw = getattr(seller, "default_warehouse", None) if seller else None
                if not (dw and getattr(dw, "country", None) == "CZ"):
                    not_cz.append(str(it["sku"]))

            if not_cz:
                return Response(
                    {
                        "origin": [
                            "CZ origin only. These SKUs do not have a seller default CZ warehouse: "
                            + ", ".join(not_cz)
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            logger.exception("CZ origin check failed")
            return Response({"origin": [f"CZ check failed: {e}"]}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "couriers": {"zasilkovna": {}, "dpd": {}, "gls": {}},
            "meta": {"country": country, "currency": currency},
        }

        # 3) Zásilkovna: split -> per-parcel -> aggregate
        try:
            packeta_parcels = split_packeta(country=country, items=items, cod=cod, currency=currency)
            packeta_per_parcel = [
                calc_packeta(country=country, items=p, cod=cod, currency=currency)
                for p in packeta_parcels
            ]
            payload["couriers"]["zasilkovna"] = combine_parcel_options(packeta_per_parcel)
        except Exception as e:
            logger.exception("Zásilkovna calculation failed: country=%s", country)
            payload["couriers"]["zasilkovna"] = {"error": str(e)}

        # 4) DPD: wrapper handles split & aggregation internally (PUDO + HD)
        try:
            dpd_summary = calc_dpd_wrap(
                country=country, items=items, cod=cod, currency=currency, variant_map=vmap
            )
            totals = dpd_summary.get("total_parcels") or {}
            total_parcels_unified = max(totals.values()) if totals else 0  # single int for UI
            payload["couriers"]["dpd"] = {
                "total_parcels": total_parcels_unified,
                "options": dpd_summary.get("options", []),
            }
        except Exception as e:
            logger.exception("DPD calculation failed: country=%s", country)
            payload["couriers"]["dpd"] = {"error": str(e)}

        # 5) GLS: split -> address_bundle -> per-parcel -> aggregate
        try:
            gls_parcels = split_gls(items)
            address_bundle = "multi" if len(gls_parcels) >= 2 else "one"
            gls_per_parcel = [
                calc_gls(
                    country=country, items=p, currency=currency,
                    cod=cod,  # (2) pass cod through
                    address_bundle=address_bundle
                )
                for p in gls_parcels
            ]
            payload["couriers"]["gls"] = combine_parcel_options(gls_per_parcel)
        except Exception as e:
            logger.exception("GLS calculation failed: country=%s", country)
            payload["couriers"]["gls"] = {"error": str(e)}

        return Response(payload, status=status.HTTP_200_OK)
