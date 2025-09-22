from django.db.models import Q
from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiExample,
    OpenApiParameter,
)
from drf_spectacular.types import OpenApiTypes

from .models import Banner
from .serializers import BannerSerializer

example_item = {
    "id": 12,
    "title": "Nutristar",
    "alt": "Trusted Czech Supplements",
    "link_url": "https://reli.one/c/nutristar",
    "image_url": "https://cdn.example.com/media/banners/webp/desktop.webp",
    "image_url_mobile": "https://cdn.example.com/media/banners/webp/mobile.webp",
    "sort_order": 10,
    "seller_id": 42,
}


@extend_schema_view(
    list=extend_schema(
        tags=["Banners"],
        operation_id="listBanners",
        summary="Retrieve active banners (desktop & mobile)",
        description=(
            "Returns a list of **active banners** ordered by `sort_order` (asc) and then "
            "`created_at` (desc).\n\n"
            "### Image fields\n"
            "- `image_url` — desktop WebP (1230×400). Backward-compatible field kept for existing clients.\n"
            "- `image_url_mobile` — mobile WebP. May be `null` if a mobile image is not provided.\n\n"
            "### Device selector (query parameter)\n"
            "Use `?device=mobile` to substitute `image_url` with the mobile URL **when available**. "
            "If `image_url_mobile` is missing, `image_url` remains the desktop URL.\n\n"
            "### Pagination\n"
            "If DRF pagination is enabled, the response follows the standard structure "
            "(`count`, `next`, `previous`, `results`).\n\n"
            "### Caching recommendations\n"
            "Serve images via a CDN and configure caching headers (e.g. `Cache-Control`, `ETag`, `Last-Modified`)."
        ),
        parameters=[
            OpenApiParameter(
                name="device",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                enum=["desktop", "mobile"],
                description=(
                    "Optional view selector. When `mobile`, the `image_url` field is replaced with "
                    "`image_url_mobile` if available. Default: `desktop`."
                ),
            ),
        ],
        responses={200: BannerSerializer(many=True)},
        auth=[],  # public endpoint (optional)
        examples=[
            OpenApiExample(
                name="List (no pagination, default desktop)",
                summary="Desktop view — both URLs included",
                value=[example_item],
                response_only=True,
            ),
            OpenApiExample(
                name="List (pagination enabled)",
                summary="Paginated response",
                value={
                    "count": 1,
                    "next": None,
                    "previous": None,
                    "results": [example_item],
                },
                response_only=True,
            ),
            OpenApiExample(
                name="List (device=mobile)",
                summary="`image_url` is substituted with the mobile URL when available",
                value=[{
                    "id": 12,
                    "title": "Nutristar",
                    "alt": "Trusted Czech Supplements",
                    "link_url": "https://reli.one/c/nutristar",
                    "image_url": "https://cdn.example.com/media/banners/webp/mobile.webp",
                    "image_url_mobile": "https://cdn.example.com/media/banners/webp/mobile.webp",
                    "sort_order": 10,
                    "seller_id": 42,
                }],
                response_only=True,
            ),
        ],
    )
)
class BannerViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = BannerSerializer

    def get_queryset(self):
        return (
            Banner.objects
            .filter(is_active=True)
            .filter(Q(image_webp__isnull=False) | Q(image_webp_mobile__isnull=False))
            .order_by("sort_order", "-created_at")
        )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        device = (request.query_params.get("device") or "desktop").lower()

        def _patch_item(item: dict):
            mobile = item.get("image_url_mobile")
            if device == "mobile" and mobile:
                item["image_url"] = mobile

        data = response.data
        if isinstance(data, list):
            for it in data:
                _patch_item(it)
        elif isinstance(data, dict) and isinstance(data.get("results"), list):
            for it in data["results"]:
                _patch_item(it)

        return response
