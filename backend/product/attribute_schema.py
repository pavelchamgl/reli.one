from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Iterable

from django.db.models import Prefetch
from rest_framework import serializers

from .models import (
    BaseProduct,
    Category,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
    ProductAttributeValue,
)


@dataclass(frozen=True)
class EffectiveAttribute:
    definition: CategoryAttributeDefinition
    inherited_from_id: int | None
    is_inherited: bool


def category_allows_products(category: Category | None) -> bool:
    if category is None:
        return False
    return category.is_leaf_node() or bool(category.allows_product_assignment)


def get_effective_attribute_schema(category: Category | None) -> list[EffectiveAttribute]:
    if category is None:
        return []

    categories = list(category.get_ancestors(include_self=True))
    definitions = (
        CategoryAttributeDefinition.objects.filter(
            category__in=categories,
            is_active=True,
        )
        .select_related('category')
        .prefetch_related(
            Prefetch(
                'options',
                queryset=CategoryAttributeOption.objects.filter(is_active=True).order_by('sort_order', 'id'),
            )
        )
        .order_by('category__tree_id', 'category__lft', 'sort_order', 'id')
    )

    by_code: dict[str, EffectiveAttribute] = {}
    for definition in definitions:
        previous = by_code.get(definition.code)
        inherited_from_id = previous.definition.id if previous else None
        by_code[definition.code] = EffectiveAttribute(
            definition=definition,
            inherited_from_id=inherited_from_id,
            is_inherited=definition.category_id != category.id,
        )

    return sorted(
        by_code.values(),
        key=lambda item: (item.definition.sort_order, item.definition.id),
    )


def validate_product_attribute_payload(
    product: BaseProduct,
    payload: Iterable[dict],
) -> list[dict]:
    effective_schema = get_effective_attribute_schema(product.category)
    definitions_by_id = {item.definition.id: item.definition for item in effective_schema}
    required_ids = {item.definition.id for item in effective_schema if item.definition.is_required}

    normalized_values = []
    seen_ids = set()
    errors = {}

    for index, item in enumerate(payload):
        definition_id = item.get('attribute_definition')
        if definition_id in seen_ids:
            errors[index] = {'attribute_definition': ['Duplicate attribute in payload.']}
            continue
        seen_ids.add(definition_id)

        definition = definitions_by_id.get(definition_id)
        if definition is None:
            errors[index] = {'attribute_definition': ['Attribute is not in product category schema.']}
            continue

        try:
            normalized_values.append(_normalize_attribute_value(definition, item))
        except serializers.ValidationError as exc:
            errors[index] = exc.detail

    missing_required_ids = sorted(required_ids - seen_ids)
    if missing_required_ids:
        errors['required'] = [
            f"Missing required attribute: {definitions_by_id[definition_id].code}"
            for definition_id in missing_required_ids
        ]

    if errors:
        raise serializers.ValidationError(errors)

    return normalized_values


def _normalize_attribute_value(definition: CategoryAttributeDefinition, item: dict) -> dict:
    data_type = definition.data_type
    normalized = {
        'attribute_definition': definition,
        'value_text': '',
        'value_number': None,
        'value_boolean': None,
        'value_option': None,
        'source': item.get('source') or 'manual',
    }

    if data_type == CategoryAttributeDefinition.DataType.TEXT:
        value = item.get('value_text')
        if value is None or str(value).strip() == '':
            raise serializers.ValidationError({'value_text': ['This field is required for text attributes.']})
        normalized['value_text'] = str(value)
        return normalized

    if data_type == CategoryAttributeDefinition.DataType.NUMBER:
        value = item.get('value_number')
        try:
            normalized['value_number'] = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError({'value_number': ['A valid number is required.']})
        return normalized

    if data_type == CategoryAttributeDefinition.DataType.BOOLEAN:
        value = item.get('value_boolean')
        if not isinstance(value, bool):
            raise serializers.ValidationError({'value_boolean': ['A valid boolean is required.']})
        normalized['value_boolean'] = value
        return normalized

    if data_type == CategoryAttributeDefinition.DataType.ENUM:
        option_id = item.get('value_option')
        option = CategoryAttributeOption.objects.filter(
            pk=option_id,
            attribute_definition=definition,
            is_active=True,
        ).first()
        if option is None:
            raise serializers.ValidationError({'value_option': ['Option is not valid for this attribute.']})
        normalized['value_option'] = option
        return normalized

    raise serializers.ValidationError({'data_type': ['Unsupported attribute data type.']})


def replace_product_attribute_values(product: BaseProduct, payload: Iterable[dict]) -> list[ProductAttributeValue]:
    normalized_values = validate_product_attribute_payload(product, payload)

    ProductAttributeValue.objects.filter(product=product).delete()
    created_values = [
        ProductAttributeValue(product=product, **value)
        for value in normalized_values
    ]
    return ProductAttributeValue.objects.bulk_create(created_values)
