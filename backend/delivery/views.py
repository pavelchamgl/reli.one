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

logger = logging.getLogger(__name__)


@extend_schema(
    summary="Seller shipping estimate: Zásilkovna + GLS (PUDO/HD)",
    description=(
        "Computes preliminary shipping prices **for both couriers at once**: "
        "**Zásilkovna** and **GLS**.\n\n"
        "**What it does**\n"
        "- Validates the request and verifies SKUs belong to the seller.\n"
        "- Splits items into parcels via courier-specific logic.\n"
        "- For each courier, calculates parcel prices (PUDO/HD) and returns "
        "**aggregated** totals per channel across all parcels.\n\n"
        "**Assumptions**\n"
        "- Currency: **EUR**.\n"
        "- COD: **disabled**.\n"
        "- Same option shape for both couriers.\n"
        "- If a courier fails (no rates/out of limits), its block contains an `error`.\n\n"
        "**Response shape**\n"
        "```\n"
        "{\n"
        "  \"couriers\": {\n"
        "    \"zasilkovna\": { \"total_parcels\": N, \"options\": [ ... ] } | { \"error\": \"...\" },\n"
        "    \"gls\":        { \"total_parcels\": N, \"options\": [ ... ] } | { \"error\": \"...\" }\n"
        "  },\n"
        "  \"meta\": { \"country\": \"RO\", \"currency\": \"EUR\" }\n"
        "}\n"
        "```"
    ),
    request=SellerShippingRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=CombinedShippingOptionsResponseSerializer,
            description="Aggregated PUDO/HD options for Zásilkovna and GLS",
        ),
        400: OpenApiResponse(description="Validation error"),
        500: OpenApiResponse(description="Internal server error"),
    },
    tags=["Delivery Calculation"],
    examples=[
        OpenApiExample(
            name="Success (both couriers)",
            summary="Both Zásilkovna and GLS returned aggregated PUDO/HD options",
            value={
                "couriers": {
                    "zasilkovna": {
                        "total_parcels": 1,
                        "options": [
                            {
                                "service": "Pick-up point",
                                "channel": "PUDO",
                                "price": 4.31,
                                "priceWithVat": 5.21,
                                "currency": "EUR",
                                "estimate": "",
                                "courier": "Zásilkovna",
                            },
                            {
                                "service": "Home Delivery",
                                "channel": "HD",
                                "price": 5.90,
                                "priceWithVat": 7.14,
                                "currency": "EUR",
                                "estimate": "",
                                "courier": "Zásilkovna",
                            },
                        ],
                    },
                    "gls": {
                        "total_parcels": 1,
                        "options": [
                            {
                                "service": "Pick-up point",
                                "channel": "PUDO",
                                "price": 5.35,
                                "priceWithVat": 6.47,
                                "currency": "EUR",
                                "estimate": "",
                                "courier": "GLS",
                            },
                            {
                                "service": "Home Delivery",
                                "channel": "HD",
                                "price": 6.46,
                                "priceWithVat": 7.82,
                                "currency": "EUR",
                                "estimate": "",
                                "courier": "GLS",
                            },
                        ],
                    },
                },
                "meta": {"country": "RO", "currency": "EUR"},
            },
        ),
        OpenApiExample(
            name="Partial success (GLS error)",
            summary="Zásilkovna priced, GLS failed (e.g., no rate for limits)",
            value={
                "couriers": {
                    "zasilkovna": {
                        "total_parcels": 1,
                        "options": [
                            {
                                "service": "Pick-up point",
                                "channel": "PUDO",
                                "price": 4.31,
                                "priceWithVat": 5.21,
                                "currency": "EUR",
                                "estimate": "",
                                "courier": "Zásilkovna",
                            },
                            {
                                "service": "Home Delivery",
                                "channel": "HD",
                                "price": 5.90,
                                "priceWithVat": 7.14,
                                "currency": "EUR",
                                "estimate": "",
                                "courier": "Zásilkovna",
                            },
                        ],
                    },
                    "gls": {"error": "GLS: no rates found for given parameters"},
                },
                "meta": {"country": "RO", "currency": "EUR"},
            },
        ),
    ],
)
class SellerShippingOptionsView(APIView):
    """
    POST /api/shipping-options/seller/

    Returns two courier blocks under `couriers`: `zasilkovna` and `gls`.
    Each block aggregates PUDO/HD prices across all auto-split parcels and
    uses the same option structure so the frontend can render them uniformly.
    """

    def post(self, request):
        # 1) Validate input (incl. that SKUs belong to the seller)
        serializer = SellerShippingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        country = data["destination_country"]
        items = data["items"]
        currency = "EUR"
        cod = False  # COD disabled; use bool for both calculators

        # Lite-проверка: все товары должны отправляться с CZ-склада продавца
        try:
            skus = [str(i["sku"]) for i in items]
            variants = (
                ProductVariant.objects
                .filter(sku__in=skus)
                .select_related("product__seller__default_warehouse")
            )
            vmap = {v.sku: v for v in variants}

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
                            f"Только отправка из Чехии. Продавец(ы) SKU {', '.join(not_cz)} не имеют чешского склада (default_warehouse.country != 'CZ')."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            logger.exception("CZ origin check failed")
            return Response({"origin": [f"CZ check failed: {e}"]}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "couriers": {"zasilkovna": {}, "gls": {}},
            "meta": {"country": country, "currency": currency},
        }

        # 2) Zásilkovna: split -> per-parcel price -> aggregate per channel
        try:
            packeta_parcels = split_packeta(country=country, items=items, cod=cod, currency=currency)
            packeta_per_parcel = [
                calc_packeta(country=country, items=p, cod=cod, currency=currency) for p in packeta_parcels
            ]
            payload["couriers"]["zasilkovna"] = combine_parcel_options(packeta_per_parcel)
        except Exception as e:
            logger.exception("Zásilkovna calculation failed: country=%s", country)
            payload["couriers"]["zasilkovna"] = {"error": str(e)}

        # 3) GLS: split -> address_bundle -> per-parcel price -> aggregate
        try:
            gls_parcels = split_gls(items)
            address_bundle = "multi" if len(gls_parcels) >= 2 else "one"
            gls_per_parcel = [
                calc_gls(country=country, items=p, currency=currency, cod=False, address_bundle=address_bundle)
                for p in gls_parcels
            ]
            payload["couriers"]["gls"] = combine_parcel_options(gls_per_parcel)
        except Exception as e:
            logger.exception("GLS calculation failed: country=%s", country)
            payload["couriers"]["gls"] = {"error": str(e)}

        return Response(payload, status=status.HTTP_200_OK)
