from __future__ import annotations

from typing import Any

from accounts.choices import UserRole
from accounts.models import CustomUser
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from product.attribute_schema import category_allows_products
from product.models import BaseProduct, ProductStatus


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def validate_product_before_approve(product: BaseProduct) -> list[str]:
    errors: list[str] = []

    if _is_blank(product.name):
        errors.append("Product name is required.")
    if _is_blank(product.product_description):
        errors.append("Product description is required.")
    if product.category_id is None:
        errors.append("Category is required.")
    elif not category_allows_products(product.category):
        errors.append("Category does not allow product assignment.")
    if not product.variants.exists():
        errors.append("At least one variant is required.")

    return errors


@transaction.atomic
def approve_product(product: BaseProduct, moderator: CustomUser) -> BaseProduct:
    if moderator.role not in (UserRole.MANAGER, UserRole.ADMIN):
        raise ValidationError({"detail": "Only manager/admin can approve."})

    product = BaseProduct.objects.select_for_update().get(pk=product.pk)

    if product.status not in (ProductStatus.PENDING, ProductStatus.REJECTED):
        raise ValidationError({"detail": "Only pending/rejected products can be approved."})

    errors = validate_product_before_approve(product)
    if errors:
        raise ValidationError({"detail": errors})

    product.status = ProductStatus.APPROVED
    product.approved_by = moderator
    product.approved_at = timezone.now()
    product.rejected_reason = None
    product.save(update_fields=["status", "approved_by", "approved_at", "rejected_reason"])

    return product


@transaction.atomic
def reject_product(product: BaseProduct, moderator: CustomUser, reason: str) -> BaseProduct:
    if moderator.role not in (UserRole.MANAGER, UserRole.ADMIN):
        raise ValidationError({"detail": "Only manager/admin can reject."})
    if _is_blank(reason):
        raise ValidationError({"rejected_reason": "Rejected reason is required."})

    product = BaseProduct.objects.select_for_update().get(pk=product.pk)

    if product.status not in (ProductStatus.PENDING, ProductStatus.APPROVED):
        raise ValidationError({"detail": "Only pending/approved products can be rejected."})

    product.status = ProductStatus.REJECTED
    product.approved_by = moderator
    product.approved_at = timezone.now()
    product.rejected_reason = reason.strip()
    product.save(update_fields=["status", "approved_by", "approved_at", "rejected_reason"])

    return product
