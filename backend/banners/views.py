from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiExample,
)

from .models import Banner
from .serializers import BannerSerializer

example_item = {
    "id": 12,
    "title": "Nutristar",
    "alt": "Trusted Czech Supplements",
    "link_url": "https://reli.one/c/nutristar",
    "image": "https://cdn.example.com/media/banners/webp/1a2b3c.webp",
    "sort_order": 10
}


@extend_schema_view(
    list=extend_schema(
        tags=["Banners"],
        operation_id="listBanners",
        summary="Retrieve active banners (WebP 1230×400)",
        description=(
            "Returns a list of **active banners** with automatically generated images "
            "in **WebP 1230×400** format.\n\n"
            "### Image format\n"
            "- Field `image` contains an absolute URL to the generated WebP file.\n"
            "- Images are generated automatically when uploading an original file "
            "via the admin panel.\n\n"
            "### Ordering\n"
            "- Results are ordered by `sort_order` ascending, then `created_at` descending.\n\n"
            "### Pagination\n"
            "- If DRF pagination is enabled (PageNumberPagination, LimitOffsetPagination, etc.), "
            "the response will be wrapped into the standard structure (`count`, `next`, "
            "`previous`, `results`).\n\n"
            "### Recommendations\n"
            "- It is recommended to serve these images via CDN and configure cache headers "
            "(`Cache-Control`, `ETag`, `Last-Modified`)."
        ),
        responses={200: BannerSerializer(many=True)},
        auth=[],
        examples=[
            OpenApiExample(
                name="List (no pagination)",
                summary="Response example without pagination",
                value=[example_item],
                response_only=True,
            ),
            OpenApiExample(
                name="List (with pagination)",
                summary="Response example with PageNumberPagination",
                value={
                    "count": 1,
                    "next": None,
                    "previous": None,
                    "results": [example_item],
                },
                response_only=True,
            ),
        ],
    )
)
class BannerViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Public endpoint for retrieving banners for the storefront.
    """
    permission_classes = [AllowAny]
    serializer_class = BannerSerializer

    def get_queryset(self):
        return (
            Banner.objects
            .filter(is_active=True, image_webp__isnull=False)
            .order_by("sort_order", "-created_at")
        )
