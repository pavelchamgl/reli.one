import stripe
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import PromoSerializer
from backend import settings
from django.shortcuts import render


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stripe_coupons(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY_TEST
    coupons = stripe.Coupon.list(limit=3)
    print(stripe.Coupon.list(limit=3))
    return JsonResponse({'coupons': coupons})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_stripe_coupons(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY_TEST

    coupon_code = request.data.get('code')
    percent_off = request.data.get('percent_off')
    max_usage = request.data.get('max_usage')
    used_count = request.data.get('used_count')

    stripe.Coupon.create(
        id=coupon_code,
        percent_off=percent_off,
        max_redemptions=max_usage,
        redeem_by=used_count,
    )
