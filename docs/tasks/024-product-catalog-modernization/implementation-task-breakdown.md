# Iteration 0 — разбивка implementation tasks

**Статус:** выполнено  
**Назначение:** превратить аудит в безопасный план работ по итерациям  
**Язык реализации:** документы на русском, technical terms оставлены на английском

---

## Общие правила выполнения

- Не менять application code вне активной итерации.
- Любая migration должна иметь rollback/compatibility notes.
- Каждый шаг должен сохранять checkout, delivery, order history, GMC feed и public API.
- `ProductVariant.sku` считать immutable contract.
- Старые seller/public API contracts сохранять до отдельного frontend migration.
- Pending/rejected nested resources не должны попадать в public API.
- После каждого логического шага фиксировать commit message.

---

## Iteration 1 — Architecture decisions и базовые compatibility constraints

**Рекомендуемый агент:** Opus 4.8 High или MAX Mode для архитектурного решения; Codex 5.3 Medium для оформления docs/tasks.

### Цель

Закрыть фундаментальные решения до migrations.

### Tasks

1. Оформить ADR: ownership склада и stock path для seller-created products.
   ADR должен учитывать существующие `SellerProfile.default_warehouse` и `SellerProfile.warehouses`, а также checkout CZ-origin от `default_warehouse.country`.
2. Оформить ADR: dimensions policy — UI `cm/kg`, storage `mm/g` на `ProductVariant` для delivery.
3. Оформить ADR: typed attributes на старте только product-level; variant attributes отложены.
4. Оформить ADR: category schema inheritance для MPTT categories.
5. Оформить ADR: moderation visibility для `Brand`, `ProductMedia`, `ProductDocument`, attributes.
6. Описать compatibility contracts для `article`, `barcode`, `seller_sku`, `Brand`, `ProductExternalIdentifier`.
7. Утвердить required constraints/indexes для будущих моделей.

### Files likely touched

- `docs/adr/...`
- `docs/tasks/024-product-catalog-modernization/task.md`
- `docs/tasks/024-product-catalog-modernization/iteration-*.md`

### Do not touch

- `backend/product/models.py`
- `backend/sellers/*`
- `Frontend/Frontend3/src/*`

### Acceptance criteria

- Есть явное решение, как новый товар получает остаток или почему стартует `out_of_stock`.
- Зафиксировано, что delivery dimensions остаются на variant в `mm/g`.
- Зафиксировано, что `ProductVariant.sku` immutable.
- Зафиксированы правила public visibility для nested resources.
- Зафиксированы правила category inheritance и category null.
- Поведение при `default_warehouse=NULL` определено и включено в будущие tests.

### Rollback considerations

Documentation-only шаг. Rollback — удалить или исправить ADR-документы до старта migrations.

---

## Iteration 2 — Backend compatibility layer без изменения public behavior

**Рекомендуемый агент:** Codex 5.3 Medium.

### Цель

Добавить безопасные adapters и подготовить старый код к новым моделям без изменения поведения.

### Tasks

1. Добавить helper для выбора cover image: old images fallback + future media hook.
2. Добавить helper для GMC identifiers: `gtin/mpn/brand` с fallback на `barcode/article/static brand`.
3. Добавить helper для dimensions conversion `cm/kg <-> mm/g` на serializer/service уровне.
4. Добавить tests на текущее поведение cover image, GMC fields, SKU stability, stock visibility.
5. Не менять database schema, если adapters можно сделать без migrations.

### Files likely touched

- `backend/product/serializers.py`
- `backend/sellers/serializers.py`
- `backend/order/serializers.py`
- `backend/product/management/commands/generate_gmc_feed.py`
- `backend/product/tests*`
- `backend/order/tests*`

### Do not touch

- `ProductVariant.sku` generation.
- Delivery calculation logic.
- Seller frontend.

### Acceptance criteria

- Cover image одинаковый в list/detail/order/GMC.
- GMC feed fields не меняются случайно.
- GMC feed сохраняет один item на variant и `item_group_id=product.id`.
- Existing tests pass.

### Verification

```bash
pytest backend/product backend/order -q
python backend/manage.py generate_gmc_feed --limit 50
```

### Rollback considerations

Adapters должны быть additive. Rollback — вернуть serializers/feed helpers на старые прямые источники, не трогая данные.

---

## Iteration 3 — Stock path для seller products

**Рекомендуемый агент:** Codex 5.3 Medium; ревью Opus 4.8 High.

### Цель

Сделать создание товара совместимым с покупаемостью и reservation.

### Tasks

1. Реализовать принятое решение по seller warehouse ownership.
2. Добавить seller-facing stock endpoint или расширить product creation flow отдельным stock step.
3. Сохранить `WarehouseItem` как источник availability.
4. Привязать stock rows к `SellerProfile.default_warehouse` или разрешенным `SellerProfile.warehouses`.
5. Добавить permissions: seller может управлять только своими stock rows.
6. Обновить admin для просмотра stock.
7. Добавить tests для create/update stock, missing stock, reservation, public stock fields, CZ-origin и `default_warehouse=NULL`.

### Files likely touched

- `backend/warehouses/models.py`
- `backend/warehouses/serializers.py`
- `backend/warehouses/views.py`
- `backend/sellers/views.py`
- `backend/product/stock_availability.py`
- `backend/warehouses/tests*`
- `backend/payment/test_checkout_flow.py`

### Do not touch

- Price logic.
- SKU generation.
- Delivery dimensions.

### Acceptance criteria

- Seller может задать остаток для созданного варианта.
- Товар с остатком становится `in_stock`.
- Товар без stock row остается `out_of_stock`.
- Checkout reservation работает с новым stock path.
- Checkout CZ-origin не регрессирует и behavior при `default_warehouse=NULL` покрыт.

### Verification

```bash
pytest backend/warehouses backend/payment backend/product -q
```

### Rollback considerations

Миграции stock ownership должны быть reversible там, где это возможно. Перед включением seller-facing stock endpoint оставить старое поведение missing `WarehouseItem -> out_of_stock`.

---

## Iteration 4 — Catalog normalized models: Brand, identifiers, media, documents

**Рекомендуемый агент:** Codex 5.3 Medium.

### Цель

Добавить новые модели без удаления старых полей и relation.

### Tasks

1. Добавить `Brand` со status и moderation rules.
2. Добавить `ProductExternalIdentifier` для barcode/GTIN/EAN/UPC.
3. Добавить `ProductMedia` с `media_type`, `sort_order`, `is_main`, `status`.
4. Добавить `ProductDocument` с `document_type`, `status`, file metadata.
5. Добавить `seller_sku` как optional field; `article` оставить.
6. Добавить constraints:
   - один main media на product;
   - unique external identifier по type/value или согласованной dedup policy;
   - индексы для status/sort/order.
7. Добавить data migration для old images: min id -> `is_main`, id order -> `sort_order`.
8. Перед data migration подготовить backup, dry-run на копии БД и reverse/rollback notes.
9. Добавить adapters, чтобы old serializers не потеряли данные.

### Files likely touched

- `backend/product/models.py`
- `backend/product/migrations/*`
- `backend/product/admin.py`
- `backend/product/serializers.py`
- `backend/sellers/serializers.py`
- `backend/order/serializers.py`
- `backend/product/management/commands/generate_gmc_feed.py`

### Do not touch

- Не удалять `BaseProductImage`.
- Не удалять `barcode/article`.
- Не менять checkout payload.

### Acceptance criteria

- Old API responses сохраняют cover image и documents fallback.
- Pending media/documents/brand не видны public.
- GMC feed сохраняет old identifiers через fallback.
- Data migration имеет documented backup step и rollback strategy.

### Verification

```bash
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py migrate --plan
pytest backend/product backend/order -q
python backend/manage.py generate_gmc_feed --limit 50
```

### Rollback considerations

Новые модели должны быть additive. Старые `BaseProductImage`, `barcode`, `article`, `LicenseFile` сохраняются, поэтому rollback behavior возможен через отключение новых serializers/adapters. Для data migration обязателен pre-migration backup; reverse может быть `noop` только при наличии restore plan.

---

## Iteration 5 — Category attribute schema и typed product attributes

**Рекомендуемый агент:** Codex 5.3 Medium; ревью Opus 4.8 High.

### Цель

Добавить schema-driven характеристики по категориям без регресса поиска.

### Tasks

1. Добавить `CategoryAttributeDefinition`.
2. Добавить `ProductAttributeValue` как product-level typed value.
3. Реализовать inheritance по MPTT согласно ADR.
4. Добавить validation required/filterable attributes.
5. Добавить unique `(product, attribute_definition)`.
6. Добавить indexes под filterable attributes.
7. Реализовать adapter/dual-write с `ProductParameter` или dual-read search.
8. Добавить category schema endpoint для seller form/import template.

### Files likely touched

- `backend/product/models.py`
- `backend/product/serializers.py`
- `backend/product/views.py`
- `backend/product/filters.py`
- `backend/sellers/serializers.py`
- `backend/sellers/views.py`

### Do not touch

- Variant-level attributes.
- Existing ProductParameter search до готовности typed search.

### Acceptance criteria

- Для category можно получить schema обязательных и filterable attributes.
- Старые товары не становятся invalid без explicit revalidation step.
- Search по старым параметрам работает.

### Verification

```bash
pytest backend/product backend/sellers -q
```

### Rollback considerations

Typed attributes добавлять без удаления `ProductParameter`. При rollback public/search flows продолжают читать старые параметры.

---

## Iteration 6 — Public filters, facets и search upgrade

**Рекомендуемый агент:** Codex 5.3 Medium.

### Цель

Добавить category-specific filters по typed attributes и брендам.

### Tasks

1. Расширить filters: brand, price, rating, stock, typed attributes.
2. Добавить facet metadata endpoint для category page.
3. Оптимизировать queries через indexes/Exists/Subquery.
4. Добавить performance smoke на реалистичном объеме данных.
5. Сохранить fallback search по `ProductParameter`.
6. Обновить schema docs.

### Files likely touched

- `backend/product/filters.py`
- `backend/product/views.py`
- `backend/product/serializers.py`
- `backend/product/tests*`

### Do not touch

- Seller create form до frontend iteration.
- Checkout/payment.

### Acceptance criteria

- Category page может получить доступные filters/facets.
- Фильтрация по нескольким attributes возвращает корректные товары.
- Query count/performance зафиксированы.

### Verification

```bash
pytest backend/product -q
python backend/manage.py spectacular --file /tmp/schema_new.yml
```

### Rollback considerations

Facet endpoints и filters должны отключаться без изменения existing list/detail/search contracts.

---

## Iteration 7 — Seller frontend: new create/edit wizard

**Рекомендуемый агент:** Sonnet 4.6 Medium или Codex 5.3 Medium для frontend; browser QA обязателен.

### Цель

Перевести форму продавца на удобную структуру: основная информация, media, price/stock, description, attributes, product dimensions, package dimensions, documents, additional info.

### Tasks

1. Получать category schema после выбора категории.
2. Показывать typed attributes по category.
3. Разделить UI units `cm/kg` и backend units `mm/g`.
4. Добавить stock quantity step.
5. Добавить media preview/order/main photo.
6. Добавить documents upload by type.
7. Сохранить compatibility payload со старыми endpoints до backend switch.
8. Исправить legacy payload mismatches и validation bugs отдельными small commits.

### Files likely touched

- `Frontend/Frontend3/src/redux/createProdPrevSlice.js`
- `Frontend/Frontend3/src/redux/editGoodsSlice.js`
- `Frontend/Frontend3/src/api/seller/sellerProduct.js`
- `Frontend/Frontend3/src/Components/Seller/create/*`
- `Frontend/Frontend3/src/Components/Seller/edit/*`

### Do not touch

- Buyer checkout unless API contract changes approved.

### Acceptance criteria

- Seller может создать товар с category schema, images, variant, dimensions, stock.
- Preview media показывается сразу.
- Product remains buyable after approval if stock > 0.
- Old edit flow не теряет existing product data.

### Verification

```bash
npm --prefix Frontend/Frontend3 test
npm --prefix Frontend/Frontend3 run build
```

Плюс browser smoke по create/edit flow.

### Rollback considerations

Сохранять старый create/edit route или feature flag до подтверждения нового wizard. Backend compatibility payload не удалять.

### Iteration 7.7 — Seller product media: main image и порядок

**Документ:** `iteration-7-7-seller-product-media-order-and-main-image.md`  
**Статус:** запланировано (отдельная задача после 7.6)

Цель: явное сохранение `is_main` и `sort_order` при create/edit, dual-write в `ProductMedia`, reorder endpoint, обновление cover helper, **Gallery UX** (main badge, order numbers, lightbox, drag-and-drop upload/reorder).

Зависит от: Iteration 4 (`ProductMedia`), Iteration 7 wizard (images step).  
Не заменяет: Iteration 10 cleanup legacy `BaseProductImage`.

---

## Iteration 8 — Admin/moderation upgrade

**Статус:** done (repo-scope)  
**Детальная спецификация:** [iteration-8-admin-moderation-upgrade.md](./iteration-8-admin-moderation-upgrade.md)  
**Рекомендуемый агент:** Codex 5.3 Medium.

### Цель

Сделать модерацию новых ресурсов управляемой.

### Tasks

1. [x] Добавить admin inlines для brand/media/documents/attributes.
2. [x] Добавить moderation actions approve/reject (`services_moderation.py` + custom admin URLs).
3. [ ] Согласовать `ProductModerationEvent` — **deferred** (используются `approved_by/approved_at/rejected_reason`).
4. [x] Сделать readonly/audit fields для moderation history.
5. [x] Добавить фильтры admin по pending media/documents/brand.

### Files likely touched

- `backend/product/admin.py`
- `backend/product/models.py`
- `backend/product/serializers.py`
- `backend/sellers/views.py`

### Do not touch

- Public API behavior без tests visibility.

### Acceptance criteria

- Moderator видит pending nested resources.
- Public API не показывает pending/rejected nested resources.
- Rejection reason сохраняется и доступен seller.

### Verification

```bash
pytest backend/product backend/sellers -q
```

### Rollback considerations

Admin/moderation actions делать additive. При rollback public visibility filters должны оставаться строгими.

---

## Iteration 9 — Import/enrichment foundation

**Рекомендуемый агент:** Opus 4.8 High для архитектуры, Codex 5.3 Medium для реализации.

### Цель

Подготовить массовую загрузку, barcode/link/photo enrichment и non-technical supplier workflow.

### Tasks

1. Добавить `ProductDraft` с source metadata: manual, barcode, external link, photo, bulk import.
2. Добавить import template endpoint по category schema.
3. Добавить import job model и status lifecycle.
4. Добавить validation report: row errors, missing required attributes, duplicate identifiers.
5. Добавить materialization contract draft -> product/media/attributes/stock.
6. Добавить adapters для future enrichment providers.
7. Не подключать внешние enrichment APIs в этой итерации без отдельной задачи.

### Files likely touched

- `backend/product/models.py`
- `backend/product/serializers.py`
- `backend/product/views.py`
- `backend/sellers/views.py`
- `backend/sellers/serializers.py`
- `docs/tasks/024-product-catalog-modernization/*`

### Do not touch

- Production checkout/payment/delivery flows.
- Existing approved products без explicit migration.

### Acceptance criteria

- Supplier может получить template по category.
- Import validation объясняет ошибки простым языком.
- Draft publish создает те же сущности, что manual create.
- Barcode/link/photo source можно сохранить как metadata даже без enrichment.

### Verification

```bash
pytest backend/product backend/sellers -q
```

### Rollback considerations

Draft/import models не должны автоматически публиковать товары. Rollback — остановить import jobs и оставить manual create flow.

---

## Iteration 10 — Cleanup и legacy migration

**Рекомендуемый агент:** Codex 5.3 Medium; ревью Opus 4.8 High.

### Цель

Удалять legacy только после подтвержденной совместимости.

### Tasks

1. Сравнить old/new API snapshots.
2. Сравнить GMC XML snapshots.
3. Перевести consumers с `ProductParameter` на typed attributes.
4. Перевести consumers с `BaseProductImage` на `ProductMedia`.
5. Перевести license consumers на `ProductDocument`.
6. Удалять legacy fields/models только отдельной migration после двух релизов совместимости.
7. Перед destructive migration выполнить backup и dry-run на копии БД.

### Acceptance criteria

- Нет consumers старых relation/fields.
- API schema changes задокументированы.
- GMC feed стабилен.
- Checkout/order/reviews не регрессируют.
- Backup/restore plan утвержден до destructive cleanup.

### Verification

```bash
rg -n "ProductParameter|BaseProductImage|LicenseFile|images\\.first|barcode|article" backend Frontend/Frontend3/src
pytest backend/product backend/order backend/payment backend/warehouses backend/delivery -q
python backend/manage.py generate_gmc_feed --limit 50
```

### Rollback considerations

Legacy cleanup делать только после snapshot-compatible релизов. Rollback после удаления legacy требует restore migration или backup, поэтому cleanup должен быть отдельным релизом с заранее проверенным restore plan.

---

## Минимальный порядок коммитов

1. `docs: add product catalog system audit`
2. `docs: record catalog architecture decisions`
3. `test: cover catalog compatibility contracts`
4. `feat: add seller stock management path`
5. `feat: add normalized product media and identifiers`
6. `feat: add category attribute schema`
7. `feat: add category facets and typed filters`
8. `feat: update seller product creation flow`
9. `feat: add catalog moderation tools`
10. `feat: add product import draft foundation`
11. `chore: migrate legacy catalog data and cleanup`

---

## Следующий практический шаг после Iteration 0

Перед кодом выполнить Iteration 1: создать ADR-документы по stock ownership, dimensions policy, attribute scope, category inheritance и moderation visibility. После утверждения ADR можно переходить к backend compatibility tests/adapters.
