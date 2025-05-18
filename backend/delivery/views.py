import logging

from decimal import Decimal
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, extend_schema, OpenApiExample

from .serializers import (
    SellerShippingRequestSerializer,
    ShippingOptionsResponseSerializer,
)
from .services.shipping_split import split_items_into_parcels, combine_parcel_options
from .services.local_rates import calculate_shipping_options

logger = logging.getLogger(__name__)


@extend_schema(
    summary="Calculate Zásilkovna shipping options for a seller and destination",
    description=(
        "Calculates and returns available shipping options (Pick-up point - PUDO and Home Delivery - HD) "
        "for the specified seller and destination country.\n\n"
        "**Note:** This endpoint exclusively supports shipping calculations for the Zásilkovna courier service. "
        "Prices are returned in EUR, including both base price and price with VAT.\n\n"
        "**Features:**\n"
        "- Automatically splits items into multiple parcels if package limits are exceeded.\n"
        "- Returns total parcel count and aggregated shipping prices (with and without VAT).\n"
        "- Aggregated prices are **summed across all parcels for each delivery channel (PUDO, HD)**.\n"
        "- Provides combined delivery estimates for all parcels.\n\n"
        "Courier Service: **Zásilkovna only**  \n"
        "Pricing Currency: **EUR**  \n"
        "Validation: **Ensures SKUs belong to the specified seller.**"
    ),
    request=SellerShippingRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=ShippingOptionsResponseSerializer,
            description="Shipping options calculated successfully for Zásilkovna courier service"
        ),
        400: OpenApiResponse(description="Validation error or invalid input"),
        500: OpenApiResponse(description="Internal server error during shipping calculation"),
    },
    tags=['Delivery Calculation']
)
class SellerShippingOptionsView(APIView):
    """
    POST /api/shipping-options/seller/
    Accepts seller_id, destination country, and a list of items with SKU and quantity.
    Returns available shipping options (PUDO and HD) for each calculated parcel with prices in EUR, including VAT.
    """

    def post(self, request):
        # 1. Валидация входных данных
        serializer = SellerShippingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        seller_id = data['seller_id']
        destination_country = data['destination_country']
        items = data['items']

        logger.info("Starting shipping calculation for seller_id=%s, destination_country=%s", seller_id,
                    destination_country)

        try:
            # 2. Сплитим товары на посылки
            parcels = split_items_into_parcels(
                country=destination_country,
                items=items,
                cod=Decimal("0.00"),  # Наложенный платеж отключен
                currency='EUR'
            )

            all_parcel_options = []

            # 3. Считаем стоимость доставки для каждой посылки
            for idx, parcel in enumerate(parcels, start=1):
                logger.info("Calculating shipping options for parcel #%s with %s items", idx, len(parcel))
                options = calculate_shipping_options(
                    country=destination_country,
                    items=parcel,
                    cod=Decimal("0.00"),
                    currency='EUR'
                )
                all_parcel_options.append(options)

            # 4. Суммируем все варианты доставки по всем посылкам
            result = combine_parcel_options(all_parcel_options)

            logger.info("Shipping options successfully calculated for seller_id=%s", seller_id)
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Shipping calculation failed for seller_id=%s, country=%s", seller_id, destination_country)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)