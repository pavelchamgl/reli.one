# Iteration 3 — Stock path для seller products

**Статус:** готово к ревью перед реализацией  
**Scope:** backend seller-facing stock path  
**В этой итерации нельзя менять frontend, checkout, delivery, price logic, SKU generation и database schema.**

---

## Цель

Добавить безопасный путь, через который продавец может задать или обновить остаток для своего `ProductVariant`, не ломая текущую модель доступности, reservation и `CZ-origin` checkout policy.

---

## Решение для реализации

Добавить отдельный seller-facing endpoint на уровне variant:

`PUT /api/sellers/products/{product_pk}/variants/{variant_pk}/stock/`

Endpoint должен:

- принимать `quantity_in_stock`;
- опционально принимать `warehouse_id`;
- если `warehouse_id` не передан, использовать `seller_profile.default_warehouse`;
- если `warehouse_id` передан, разрешать склад только если `warehouse == seller_profile.default_warehouse` или `warehouse in seller_profile.warehouses`;
- создавать или обновлять `WarehouseItem`;
- менять только `quantity_in_stock`, не сбрасывая существующий `reserved_quantity`;
- возвращать seller-facing stock row с `reserved_quantity` для своего stock row;
- не раскрывать `reserved_quantity` в public API.

---

## Правила ownership и permissions

- Только authenticated seller может вызывать endpoint.
- Seller может менять stock только для варианта своего товара.
- Seller не может создать stock row на чужом складе.
- При `default_warehouse=NULL` и без `warehouse_id` endpoint возвращает validation error.
- `default_warehouse=NULL` не меняет public stock logic: `stock_availability.py` остается завязан только на `WarehouseItem`.
- Lookup-порядок реализации: сначала получить product из seller-scoped queryset, затем получить variant только как `ProductVariant(pk=variant_pk, product=product)`.

---

## Что не менять

- Не менять `ProductVariant.sku`.
- Не менять `ProductVariant` dimensions.
- Не менять checkout/payment/delivery logic.
- Не менять `stock_availability.py`.
- Не создавать migrations.
- Не менять seller frontend.
- Не менять поведение missing `WarehouseItem -> out_of_stock`.

---

## Вероятные файлы

- `backend/sellers/serializers.py`
- `backend/sellers/views.py`
- `backend/sellers/urls.py`
- `backend/warehouses/models.py` только если нужен read-only import, без изменения модели
- `backend/warehouses/admin.py` только если нужен безопасный list/search polish
- `backend/sellers/test_product_stock_api.py` или близкий test module

---

## Acceptance criteria

- Seller может создать `WarehouseItem` для своего variant через default warehouse.
- Seller может обновить существующий `WarehouseItem`.
- Seller может указать warehouse из `seller_profile.warehouses`.
- `warehouse_id` разрешен, если склад равен `default_warehouse` или входит в `seller_profile.warehouses`.
- Seller не может использовать чужой warehouse.
- Seller не может менять stock чужого product/variant.
- Если нет `default_warehouse` и `warehouse_id` не передан, возвращается `400`.
- Update stock сохраняет существующий `reserved_quantity`.
- Seller response содержит `reserved_quantity` для своего stock row.
- Public API не раскрывает `reserved_quantity`.
- Product без `WarehouseItem` остается `out_of_stock`.
- Product с `WarehouseItem.quantity_in_stock > reserved_quantity` становится `in_stock` в public API.
- Checkout `CZ-origin` не меняется и не обходится.

---

## Обязательные tests

- create stock on default warehouse;
- update stock on default warehouse;
- create stock on allowed warehouse from `seller_profile.warehouses`;
- reject foreign warehouse;
- reject foreign product/variant;
- reject variant that belongs to another product even if seller owns both products;
- reject missing default warehouse without `warehouse_id`;
- update stock preserves existing `reserved_quantity`;
- seller response includes `reserved_quantity`;
- public API still does not expose `reserved_quantity`;
- public category/detail stock fields reflect created stock;
- missing `WarehouseItem` remains `out_of_stock`.
- reservation after seller-created `WarehouseItem` uses existing reservation path.
- exact route test: `PUT /api/sellers/products/{product_pk}/variants/{pk}/stock/`.

---

## Verification commands

```bash
python3 backend/manage.py test sellers.test_product_stock_api product.test_stock_availability_api warehouses.tests_reservation -v 1
python3 backend/manage.py test payment.test_checkout_flow delivery.test_seller_shipping -v 1
python3 backend/manage.py makemigrations --check --dry-run
git diff --check
```

---

## Rollback

Rollback is additive:

- remove stock endpoint route/action;
- remove stock serializer/tests;
- existing `WarehouseItem`, reservation and public stock behavior remain unchanged.
