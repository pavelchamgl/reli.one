# Iteration 0 — системный аудит и декомпозиция задач

**Родительский план:** `docs/tasks/024-product-catalog-modernization/task.md`  
**Статус:** выполнено
**Рекомендуемый агент:** Codex 5.3 Medium для локального аудита; Opus 4.8 High или MAX Mode для последующего ревью  
**В этой итерации нельзя писать application code.**

---

## Цель

Получить точную карту зависимостей и список implementation tasks до любых миграций каталога, backend-правок или frontend-изменений.

Эта итерация нужна, чтобы не сломать checkout, stock reservation, delivery, order history, GMC feed, seller permissions, product detail/list/search APIs и текущий seller create/edit flow.

---

## Scope

Проанализировать:

- product data model;
- seller product creation/editing;
- stock и warehouse ownership;
- checkout и reservation;
- delivery dimensions;
- public catalog APIs;
- product detail/list/search/category frontend;
- order history;
- reviews/favorites;
- admin/moderation;
- GMC feed;
- reports/analytics, если они используют product fields.

---

## Не входит в задачу

- Не добавлять migrations.
- Не добавлять новые models.
- Не редактировать serializers/views/frontend components.
- Не делать refactor.
- Не менять данные.

В этой итерации можно создавать или обновлять только документацию внутри:

`docs/tasks/024-product-catalog-modernization/`

---

## Обязательные вопросы аудита

### 1. Stock и покупаемость товара

Ответить:

- Как seller-created product становится buyable сегодня?
- Есть ли seller-facing путь для создания `WarehouseItem`?
- `Warehouse` должен принадлежать seller, platform или external fulfillment provider?
- Какой код считает отсутствие `WarehouseItem` как `available=0`?
- Какие tests защищают reservation behavior?

Output:

- карта file/function;
- risk level;
- предложенная architecture decision task для Iteration 1.

### 2. Стабильность `ProductVariant`

Ответить:

- Где используется `ProductVariant.sku`?
- Какие flows зависят от неизменности SKU?
- Какие models напрямую ссылаются на `ProductVariant`?
- Какие serializers отдают SKU?

Output:

- SKU dependency map;
- список обязательных regression tests.

### 3. Габариты и delivery

Ответить:

- Какой checkout/payment/delivery код читает `weight_grams`, `length_mm`, `width_mm`, `height_mm`?
- Габариты фактически product-level или variant-level в текущих business flows?
- Что происходит, если габариты отсутствуют или равны нулю?

Output:

- delivery/payment dimension dependency map;
- constraint для миграции UI на см/кг.

### 4. Поведение главного фото

Ответить:

- Какой код использует `images.first()` или `order_by("id").first()`?
- Какие frontend components предполагают, что первое фото является cover?
- Какие order/history/GMC flows зависят от текущего поведения image?

Output:

- main image consumer map;
- media migration acceptance criteria.

### 5. Совместимость GMC feed

Ответить:

- Где feed читает `barcode`, `article`, category path, image, price, availability и brand?
- Какие fallbacks существуют сейчас?
- Что сломается, если добавить `Brand`, `seller_sku` или `ProductExternalIdentifier` без adapters?

Output:

- таблица зависимостей GMC fields;
- snapshot/diff verification plan.

### 6. Текущие product API contracts

Ответить:

- Какие поля отдают public product detail/list/search/category endpoints?
- Какие поля ожидают текущие frontend pages?
- Какие seller endpoints сейчас принимают product, variants, images, parameters, license?

Output:

- API contract table;
- backward compatibility requirements.

### 7. Frontend seller flow

Ответить:

- Какие Redux slices хранят product creation/edit state?
- Какие API helper functions отправляют product/media/parameters/variants/documents?
- Какие validation schemas требуют обязательные поля?
- Какие payload fields называются иначе, чем backend fields?

Output:

- frontend dependency map;
- payload compatibility risks.

### 8. Admin и moderation

Ответить:

- Как сейчас используются `status`, `approved_by`, `approved_at`, `rejected_reason`?
- Approve/reject реализованы custom actions или только ручным редактированием admin?
- Какие fields должны стать read-only или inline при добавлении media/documents/attributes?

Output:

- current moderation map;
- заметки по интеграции `ProductModerationEvent`.

### 9. Search и filters

Ответить:

- Какие search endpoints используют `ProductParameter`?
- Какие filters существуют сейчас?
- Какие fields аннотируются для price, stock, rating, ordering?
- Что должно сохраняться до внедрения typed attribute search?

Output:

- search/filter dependency map;
- facet index planning notes.

### 10. Category behavior

Ответить:

- Можно ли привязать product к non-leaf category?
- Что происходит при `category=NULL`?
- Category listing показывает товары дочерних категорий или только прямые товары категории?
- Как проектировать category attribute inheritance?

Output:

- category behavior report;
- необходимые product/category fixture scenarios.

---

## Рекомендуемые команды для discovery

Запускать из корня репозитория:

```bash
rg -n "BaseProduct|ProductVariant|ProductParameter|BaseProductImage|LicenseFile|Category|WarehouseItem" backend Frontend/Frontend3/src docs
rg -n "sku|article|barcode|weight_grams|length_mm|width_mm|height_mm|quantity_in_stock|reserved_quantity" backend Frontend/Frontend3/src
rg -n "images\\.first|order_by\\(\"id\"\\)\\.first|image_url|get_image|license_file|product_parameters" backend Frontend/Frontend3/src
rg -n "generate_gmc_feed|GMC|gtin|mpn|brand|identifier_exists" backend
rg -n "ProductStatus|approved_by|approved_at|rejected_reason|pending|approved|rejected" backend/product backend/sellers
rg -n "postSellerProduct|postSellerImages|postSellerParameters|postSellerVariants|postSellerLisence|getSellerProductById" Frontend/Frontend3/src
rg -n "SearchView|CategoryBaseProductListView|BaseProductDetailAPIView|BaseProductFilter|build_public_products_queryset" backend/product backend/sellers
rg -n "create_reservation|InsufficientStockError|available_quantity|stock_status|checkout|stripe|paypal" backend
rg -n "DPD|GLS|Packeta|delivery|weight_grams|length_mm|width_mm|height_mm" backend/delivery backend/payment
```

Опциональные schema/test checks:

```bash
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py spectacular --file /tmp/schema_before_catalog_modernization.yml
python backend/manage.py generate_gmc_feed --limit 50
pytest backend/product/test_catalog_api.py backend/product/test_stock_availability_api.py -q
pytest backend/warehouses/tests_reservation.py backend/payment/test_checkout_flow.py -q
```

Если команда не запускается из-за отсутствующих локальных сервисов или env, не менять код. Нужно записать причину и недостающий prerequisite.

---

## Обязательные output-файлы

Создать:

1. `docs/tasks/024-product-catalog-modernization/audit-dependency-map.md`
2. `docs/tasks/024-product-catalog-modernization/audit-risk-register.md`
3. `docs/tasks/024-product-catalog-modernization/implementation-task-breakdown.md`

Application code не менять.

---

## Содержание output-файлов

### `audit-dependency-map.md`

Должен включать:

- model dependency map;
- backend endpoint/serializer/filter map;
- frontend seller-flow map;
- checkout/stock/delivery map;
- GMC feed map;
- order/reviews/favorites map;
- admin/moderation map.

### `audit-risk-register.md`

Должен включать:

- risks по severity;
- affected files;
- почему важно;
- mitigation;
- required tests/checks.

Обязательные риски, которые нужно включить и уточнить:

- отсутствующий seller stock path;
- стабильность `ProductVariant.sku`;
- variant package dimensions для delivery/payment;
- main image migration;
- GMC feed compatibility;
- backward compatibility поля `article`;
- visibility pending media/document/brand;
- migration поиска с `ProductParameter`;
- category attribute inheritance;
- EAV/facet performance.

### `implementation-task-breakdown.md`

Должен включать по одной implementation task на каждую итерацию:

- objective;
- context;
- вероятные files/modules;
- files/modules, которые нельзя трогать;
- exact constraints;
- acceptance criteria;
- verification commands;
- recommended agent/model;
- rollback considerations.

---

## Definition of Done

- [x] Application code не изменен.
- [x] Dependency map покрывает backend, frontend, DB, admin, checkout, delivery, stock, GMC, order history, search и seller flow.
- [x] Risk register создан с severity и mitigations.
- [x] Implementation task breakdown создан для Iterations 1-10.
- [x] Seller warehouse/stock ownership вынесен как explicit architectural decision.
- [x] Main image, GMC, SKU, dimensions и public visibility invariants включены в будущие acceptance criteria.
- [x] Все команды, которые не удалось выполнить, задокументированы с причиной.

Примечание: optional schema/test checks из раздела discovery в этой итерации не запускались, потому что задача была documentation-only audit без изменения application code. Неуспешных команд не было.

---

## Prompt для агента, который выполняет эту итерацию

```text
Выполни Iteration 0 по файлу:
docs/tasks/024-product-catalog-modernization/iteration-0-system-audit.md

Не пиши application code.
Не создавай migrations.
Не делай refactor.

Создай только documentation outputs внутри docs/tasks/024-product-catalog-modernization/:
- audit-dependency-map.md
- audit-risk-register.md
- implementation-task-breakdown.md

Используй docs/tasks/024-product-catalog-modernization/task.md как source of truth.

Особое внимание:
- seller stock path и WarehouseItem creation;
- стабильность ProductVariant.sku;
- delivery/payment package dimensions;
- main image behavior;
- GMC feed compatibility;
- article/barcode backward compatibility;
- pending media/document/brand public visibility;
- ProductParameter search migration;
- category attribute inheritance;
- EAV/facet performance.

Верни findings first, ordered by severity, затем список созданных/обновленных documentation files и verification notes.
```
