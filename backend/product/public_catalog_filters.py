from __future__ import annotations

from decimal import Decimal, InvalidOperation

from django.db.models import Count, Max, Min, Q

from .attribute_schema import get_effective_attribute_schema
from .models import Brand, Category, CategoryAttributeDefinition, ProductStatus
from .stock_availability import (
    STOCK_FEW_LEFT_THRESHOLD,
    STOCK_STATUS_FEW_LEFT,
    STOCK_STATUS_IN_STOCK,
    STOCK_STATUS_OUT_OF_STOCK,
)


ATTRIBUTE_PARAM_PREFIX = "attr["
ATTRIBUTE_PARAM_SUFFIX = "]"


def apply_public_catalog_filters(qs, query_params, category: Category | None = None):
    qs = _apply_brand_filters(qs, query_params)
    qs = _apply_rating_filter(qs, query_params)
    qs = _apply_stock_filters(qs, query_params)
    qs = _apply_attribute_filters(qs, query_params, category)
    return qs.distinct()


def build_category_facets(category: Category, products_qs) -> dict:
    price_range = products_qs.aggregate(
        min=Min("final_min_price"),
        max=Max("final_min_price"),
    )
    rating_range = products_qs.aggregate(
        min=Min("rating"),
        max=Max("rating"),
    )

    brand_rows = (
        Brand.objects.filter(
            products__in=products_qs,
            status=ProductStatus.APPROVED,
        )
        .values("id", "name", "slug")
        .annotate(count=Count("products", distinct=True))
        .order_by("name", "id")
    )

    attributes = []
    for effective_attribute in get_effective_attribute_schema(category):
        definition = effective_attribute.definition
        if not _is_public_filterable_definition(definition):
            continue
        attributes.append(_build_attribute_facet(definition, products_qs, effective_attribute.is_inherited))

    return {
        "category": {
            "id": category.id,
            "name": category.name,
        },
        "price": {
            "min": _decimal_to_string(price_range["min"]),
            "max": _decimal_to_string(price_range["max"]),
        },
        "brands": list(brand_rows),
        "stock": {
            "options": [
                {"value": STOCK_STATUS_IN_STOCK, "label": "In stock"},
                {"value": STOCK_STATUS_FEW_LEFT, "label": "Few left"},
                {"value": STOCK_STATUS_OUT_OF_STOCK, "label": "Out of stock"},
            ],
        },
        "rating": {
            "min": _decimal_to_string(rating_range["min"]),
            "max": _decimal_to_string(rating_range["max"]),
        },
        "attributes": attributes,
    }


def _apply_brand_filters(qs, query_params):
    brand_id = query_params.get("brand_id")
    brand = query_params.get("brand")

    if brand_id:
        try:
            brand_id = int(brand_id)
        except (TypeError, ValueError):
            return qs.none()
        qs = qs.filter(brand_id=brand_id, brand__status=ProductStatus.APPROVED)

    if brand:
        qs = qs.filter(
            Q(brand__slug=brand) | Q(brand__name__iexact=brand),
            brand__status=ProductStatus.APPROVED,
        )

    return qs


def _apply_rating_filter(qs, query_params):
    min_rating = query_params.get("min_rating")
    if min_rating in (None, ""):
        return qs
    try:
        return qs.filter(rating__gte=Decimal(str(min_rating)))
    except (InvalidOperation, TypeError, ValueError):
        return qs.none()


def _apply_stock_filters(qs, query_params):
    in_stock = query_params.get("in_stock")
    stock_status = query_params.get("stock_status")

    if in_stock not in (None, ""):
        parsed = _parse_bool(in_stock)
        if parsed is None:
            return qs.none()
        if parsed:
            qs = qs.filter(total_available_quantity__gt=0)
        else:
            qs = qs.filter(total_available_quantity__lte=0)

    if stock_status:
        if stock_status == STOCK_STATUS_IN_STOCK:
            qs = qs.filter(total_available_quantity__gt=STOCK_FEW_LEFT_THRESHOLD)
        elif stock_status == STOCK_STATUS_FEW_LEFT:
            qs = qs.filter(
                total_available_quantity__gt=0,
                total_available_quantity__lte=STOCK_FEW_LEFT_THRESHOLD,
            )
        elif stock_status == STOCK_STATUS_OUT_OF_STOCK:
            qs = qs.filter(total_available_quantity__lte=0)
        else:
            return qs.none()

    return qs


def _apply_attribute_filters(qs, query_params, category: Category | None):
    filters_by_code = _extract_attribute_filters(query_params)
    if not filters_by_code:
        return qs

    definitions_by_code = {
        item.definition.code: item.definition
        for item in get_effective_attribute_schema(category)
        if _is_public_filterable_definition(item.definition)
    }

    for code, filters in filters_by_code.items():
        definition = definitions_by_code.get(code)
        if definition is None:
            return qs.none()
        qs = _apply_single_attribute_filter(qs, definition, filters)

    return qs


def _apply_single_attribute_filter(qs, definition: CategoryAttributeDefinition, filters: dict):
    data_type = definition.data_type
    exact = filters.get("exact")

    if data_type == CategoryAttributeDefinition.DataType.ENUM:
        if exact in (None, ""):
            return qs.none()
        option_filter = Q(attribute_values__value_option__value=exact) | Q(attribute_values__value_option__label__iexact=exact)
        try:
            option_filter |= Q(attribute_values__value_option_id=int(exact))
        except (TypeError, ValueError):
            pass
        return qs.filter(
            Q(attribute_values__attribute_definition=definition)
            & Q(attribute_values__value_option__is_active=True)
            & option_filter
        )

    if data_type == CategoryAttributeDefinition.DataType.BOOLEAN:
        parsed = _parse_bool(exact)
        if parsed is None:
            return qs.none()
        return qs.filter(
            attribute_values__attribute_definition=definition,
            attribute_values__value_boolean=parsed,
        )

    if data_type == CategoryAttributeDefinition.DataType.NUMBER:
        qs = qs.filter(attribute_values__attribute_definition=definition)
        if exact not in (None, ""):
            exact_value = _parse_decimal(exact)
            if exact_value is None:
                return qs.none()
            qs = qs.filter(attribute_values__value_number=exact_value)
        if filters.get("min") not in (None, ""):
            min_value = _parse_decimal(filters["min"])
            if min_value is None:
                return qs.none()
            qs = qs.filter(attribute_values__value_number__gte=min_value)
        if filters.get("max") not in (None, ""):
            max_value = _parse_decimal(filters["max"])
            if max_value is None:
                return qs.none()
            qs = qs.filter(attribute_values__value_number__lte=max_value)
        return qs

    if data_type == CategoryAttributeDefinition.DataType.TEXT:
        if exact in (None, ""):
            return qs.none()
        return qs.filter(
            attribute_values__attribute_definition=definition,
            attribute_values__value_text__iexact=exact,
        )

    return qs.none()


def _extract_attribute_filters(query_params) -> dict[str, dict]:
    filters_by_code: dict[str, dict] = {}

    for key in query_params:
        if not key.startswith(ATTRIBUTE_PARAM_PREFIX) or not key.endswith(ATTRIBUTE_PARAM_SUFFIX):
            continue
        raw_code = key[len(ATTRIBUTE_PARAM_PREFIX):-len(ATTRIBUTE_PARAM_SUFFIX)]
        value = query_params.get(key)

        if raw_code.endswith("_min"):
            code = raw_code[:-4]
            lookup = "min"
        elif raw_code.endswith("_max"):
            code = raw_code[:-4]
            lookup = "max"
        else:
            code = raw_code
            lookup = "exact"

        if not code:
            continue
        filters_by_code.setdefault(code, {})[lookup] = value

    return filters_by_code


def _build_attribute_facet(definition: CategoryAttributeDefinition, products_qs, is_inherited: bool) -> dict:
    facet = {
        "id": definition.id,
        "code": definition.code,
        "name": definition.name,
        "data_type": definition.data_type,
        "unit": definition.unit,
        "sort_order": definition.sort_order,
        "is_inherited": is_inherited,
    }

    if definition.data_type == CategoryAttributeDefinition.DataType.ENUM:
        counts = {
            row["value_option_id"]: row["count"]
            for row in definition.product_values.filter(product__in=products_qs)
            .values("value_option_id")
            .annotate(count=Count("product_id", distinct=True))
        }
        facet["options"] = [
            {
                "id": option.id,
                "value": option.value,
                "label": option.label,
                "sort_order": option.sort_order,
                "count": counts.get(option.id, 0),
            }
            for option in definition.options.filter(is_active=True).order_by("sort_order", "id")
        ]
    elif definition.data_type == CategoryAttributeDefinition.DataType.BOOLEAN:
        counts = {
            row["value_boolean"]: row["count"]
            for row in definition.product_values.filter(product__in=products_qs)
            .values("value_boolean")
            .annotate(count=Count("product_id", distinct=True))
        }
        facet["options"] = [
            {"value": True, "label": "Yes", "count": counts.get(True, 0)},
            {"value": False, "label": "No", "count": counts.get(False, 0)},
        ]
    elif definition.data_type == CategoryAttributeDefinition.DataType.NUMBER:
        value_range = definition.product_values.filter(product__in=products_qs).aggregate(
            min=Min("value_number"),
            max=Max("value_number"),
        )
        facet["min"] = _decimal_to_string(value_range["min"])
        facet["max"] = _decimal_to_string(value_range["max"])
    elif definition.data_type == CategoryAttributeDefinition.DataType.TEXT:
        facet["aggregation"] = "not_available"

    return facet


def _is_public_filterable_definition(definition: CategoryAttributeDefinition) -> bool:
    return bool(definition.is_active and definition.is_public and definition.is_filterable)


def _parse_bool(value) -> bool | None:
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return None


def _parse_decimal(value) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _decimal_to_string(value) -> str | None:
    if value is None:
        return None
    return str(value)
