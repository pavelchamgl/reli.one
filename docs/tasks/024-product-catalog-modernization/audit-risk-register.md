# Iteration 0 — risk register модернизации product catalog

**Статус:** выполнено  
**Scope:** риски внедрения, найденные при системном аудите  
**Формат:** severity, affected area, reason, mitigation, verification

---

## Critical risks

### C1. Новый товар продавца может быть непокупаемым

**Affected area:** seller create flow, warehouses, public stock, checkout  
**Файлы:** `backend/sellers/views.py`, `backend/warehouses/models.py`, `backend/warehouses/services/reservation.py`, `backend/product/stock_availability.py`

Сегодня seller create flow создает товар, параметры, варианты, изображения и license, но не создает `WarehouseItem`. При этом stock availability и reservation считают отсутствие `WarehouseItem` как `available=0`.

**Mitigation:**

- в Iteration 1 принять architecture decision по seller-owned warehouse или platform/fulfillment warehouse;
- добавить seller-facing endpoint или шаг wizard для `quantity_in_stock`;
- решить, стартует ли новый товар `out_of_stock` до отдельной операции склада;
- запретить автопубликацию без валидного stock path, если бизнес-правило требует покупаемость сразу.

**Verification:**

- seller создает товар с вариантом и остатком, public API показывает `in_stock`;
- seller создает товар без остатка, public API показывает `out_of_stock`;
- checkout с отсутствующим `WarehouseItem` возвращает stock error, а не создает некорректный заказ.

---

### C2. Сломается checkout/order/reviews при изменении `ProductVariant.sku`

**Affected area:** checkout, basket, payment, delivery, order history, reviews  
**Файлы:** `backend/payment/services/*`, `backend/order/models.py`, `backend/reviews/models.py`, `Frontend/Frontend3/src/redux/paymentSlice.js`, `Frontend/Frontend3/src/utils/stockAvailability.js`

`sku` — сквозной identifier варианта. Он отправляется frontend checkout payload, используется payment services, delivery services, order products и eligibility для reviews.

**Mitigation:**

- зафиксировать `ProductVariant.sku` как immutable public contract;
- не переиспользовать SKU после удаления/архивации варианта;
- если понадобится новый seller SKU, добавить отдельное поле `seller_sku`, не заменяя `sku`;
- добавить snapshot/regression tests на стабильность SKU при product edit, import и moderation.

**Verification:**

- существующий order history открывается после catalog migration;
- reviews eligibility по купленному SKU работает;
- basket/payment payload остается `{sku, quantity}`.

---

### C3. Перенос габаритов на product-level ломает delivery/payment

**Affected area:** Stripe, PayPal, DPD, GLS, Packeta/local delivery  
**Файлы:** `backend/payment/services/stripe_session.py`, `backend/payment/services/paypal_session.py`, `backend/delivery/services/*`

Delivery code читает `weight_grams`, `length_mm`, `width_mm`, `height_mm` с `ProductVariant`. UI-рекомендация про `cm/kg` удобна для seller, но storage и расчеты сейчас в `mm/g`.

**Mitigation:**

- оставить delivery dimensions на `ProductVariant` в `mm/g` до отдельного adapter;
- в seller UI показывать `cm/kg`, но сериализовать в `mm/g`;
- product-level factual dimensions можно добавить как отдельные справочные поля, не используемые checkout без adapter;
- package dimensions для delivery не переносить без тестов всех carrier flows.

**Verification:**

- Stripe и PayPal session creation проходят для DPD/GLS/Packeta;
- DPD dimension-check продолжает ловить нулевые dimensions;
- delivery split tests проходят после UI/API изменений.

---

### C4. Миграция media может поменять главное фото

**Affected area:** public list/detail, seller list, order history, GMC feed  
**Файлы:** `backend/product/serializers.py`, `backend/sellers/serializers.py`, `backend/order/serializers.py`, `backend/product/management/commands/generate_gmc_feed.py`

Сейчас cover image фактически определяется как первая запись relation или минимальный `id`. При добавлении `ProductMedia.is_main/sort_order` порядок может измениться.

**Mitigation:**

- миграция ставит `is_main=True` для старого изображения с минимальным `id`;
- `sort_order` наследует порядок старых `id`;
- оставить backward-compatible `images` relation или serializer adapter до перевода всех потребителей;
- добавить тест на одинаковый cover в list, detail, order history и GMC.

**Verification:**

- snapshot старого cover image совпадает с новым;
- GMC XML image link не меняется случайно.

---

### C5. GMC feed потеряет `gtin/mpn/brand`

**Affected area:** Google Merchant Center feed  
**Файлы:** `backend/product/management/commands/generate_gmc_feed.py`, `backend/backend/settings.py`

Feed сейчас читает `barcode` как `gtin`, `article` как `mpn`, brand через static override по seller id. Если перенести эти данные в новые модели без adapter, feed станет хуже или сломается.

**Mitigation:**

- добавить GMC adapter в той же итерации, где появляются `Brand`, `seller_sku`, `ProductExternalIdentifier`;
- fallback сохраняет старые `barcode/article/GMC_STATIC_BRANDS`;
- сделать XML snapshot/diff до и после.

**Verification:**

- `generate_gmc_feed --limit 50` дает идентичный или явно задокументированно улучшенный XML;
- Nutristar static brand сохраняется до approved normalized brand.

---

### C6. Variant-level attributes конфликтуют с текущей моделью вариантов

**Affected area:** product model, variants, attributes, import  
**Файлы:** `backend/product/models.py`

Текущий `ProductVariant` — одноосевая модель: все варианты одного товара имеют один `name`, а значение задается через text или image. `CategoryAttributeDefinition.is_variant_attribute` без отдельной модели `ProductVariantAttributeValue` создаст неясную границу данных.

**Mitigation:**

- в Iteration 1 зафиксировать: typed attributes на старте только product-level;
- `is_variant_attribute` отложить или создать отдельный ADR;
- не смешивать EAV для товара и redesign вариантов в одной итерации.

**Verification:**

- product-level attributes отображаются и фильтруются без изменения variant clean logic;
- variants create/edit tests продолжают проходить.

---

### C7. Stock path может рассинхронизироваться с существующим `SellerProfile.default_warehouse`

**Affected area:** seller stock, checkout CZ-origin, warehouses  
**Файлы:** `backend/sellers/models.py`, `backend/warehouses/models.py`, `backend/payment/services/stripe_session.py`, `backend/payment/services/paypal_session.py`

У продавца уже есть `default_warehouse` FK и `warehouses` M2M. Checkout проверяет CZ-origin через `seller.default_warehouse.country`. Если новый stock path создаст `WarehouseItem` на складе, не связанном с `default_warehouse/warehouses`, товар может иметь остаток, но checkout будет заблокирован или даст противоречивую origin-политику.

**Mitigation:**

- в ADR Iteration 1 проектировать stock ownership вокруг существующих `default_warehouse/warehouses`;
- определить, когда stock row можно создавать на `default_warehouse`, а когда на одном из `warehouses`;
- явно описать behavior при `default_warehouse=NULL`;
- не вводить новый seller warehouse слой без adapter для CZ-origin.

**Verification:**

- `WarehouseItem` для seller-created product создается против `default_warehouse` или разрешенного `warehouses`;
- checkout CZ-origin проходит для товара с CZ default warehouse;
- checkout behavior при `default_warehouse=NULL` покрыт тестом;
- stock availability не показывает товар buyable, если origin policy не позволяет checkout.

---

## Medium risks

### M1. `article` нельзя сразу заменить на `seller_sku`

**Affected area:** seller create/edit, GMC, public product detail  
**Reason:** `article` required in seller serializers и используется GMC as `mpn`.

**Mitigation:** добавить `seller_sku` как optional field, оставить `article` deprecated but required до синхронного frontend/backend migration.

**Verification:** старый seller create payload продолжает создавать товар.

---

### M2. Pending/rejected brand/media/documents могут попасть в public API

**Affected area:** product detail/list, GMC, moderation  
**Reason:** новые вложенные resources будут иметь свой status, но public visibility сейчас фильтрует только `BaseProduct`.

**Mitigation:** serializers/querysets должны фильтровать approved nested resources; rejected/pending не отдавать public users и feed.

**Verification:** public API не содержит pending media/documents/brand.

---

### M3. Typed attributes могут ухудшить поиск

**Affected area:** search API, seller list, category listing  
**Reason:** `SearchView` ищет по `ProductParameter.name/value`. Если перестать писать параметры до нового search index, будет регресс.

**Mitigation:** staged dual-read/dual-write: старые `ProductParameter` продолжают жить до готовности typed attribute search.

**Verification:** search по старым характеристикам возвращает те же товары после migration.

---

### M4. Facet filtering на EAV может быть медленным

**Affected area:** category filters, search filters, DB indexes  
**Reason:** фильтрация по нескольким typed attributes через EAV потребует несколько JOIN/EXISTS.

**Mitigation:** спроектировать indexes до реализации: `(attribute_definition, value_*)`, partial indexes для filterable attributes, возможно denormalized facet cache.

**Verification:** explain/analyze или нагрузочный smoke на реалистичном объеме.

---

### M5. Category inheritance не определен

**Affected area:** category schema, import templates, seller create form  
**Reason:** MPTT есть, но attribute definitions и category descendants не используются.

**Mitigation:** решить, наследуются ли attributes от parent categories; определить правила для non-leaf и category null.

**Verification:** fixtures leaf category, parent category, category null, deleted category.

---

### M6. ProductDraft payload может разойтись с materialized models

**Affected area:** draft/import/barcode/photo/link enrichment  
**Reason:** черновик в JSON и typed models могут стать двумя источниками истины.

**Mitigation:** описать materialization contract: draft payload -> BaseProduct/media/attributes/variants/stock; обратная валидация перед publish.

**Verification:** draft edit/publish повторно валидирует schema и не теряет данные.

---

### M7. Документы сейчас ограничены одним `LicenseFile`

**Affected area:** documents, admin, seller flow  
**Reason:** новая структура хочет certificates/licenses/instructions, но текущая модель OneToOne.

**Mitigation:** вводить `ProductDocument` как новую модель с type/status/order; старый license endpoint оставить adapter/fallback.

**Verification:** старый license upload работает; новые документы не видны public до approved.

---

### M8. GMC feed item count может измениться при adapter migration

**Affected area:** Google Merchant Center feed  
**Reason:** текущий feed эмитит один `<item>` на каждый `ProductVariant` и связывает варианты через `item_group_id=product.id`; миграция identifiers/media не должна превратить товар в один item.

**Mitigation:** GMC adapter должен работать внутри цикла по variants и сохранять `variant.sku`, `price_with_acquiring`, `item_group_id`.

**Verification:** snapshot/diff проверяет не только поля `gtin/mpn/brand/image`, но и item count на товар.

---

### M9. Data migrations требуют backup и reverse strategy

**Affected area:** `ProductMedia` migration, legacy cleanup  
**Reason:** перенос old images/documents/parameters и destructive cleanup нельзя безопасно откатить без backup/dry-run.

**Mitigation:** для media migration и cleanup добавить pre-migration backup, dry-run на копии БД, reversible migration где возможно, `reverse_code` или явный `RunPython.noop` с restore plan.

**Verification:** migration plan содержит backup step; rollback behavior описан до production run.

---

## Low risks

### L1. Нет `created_at/updated_at` на `BaseProduct`

**Impact:** сложнее audit/moderation/import deduplication.

**Mitigation:** добавить non-breaking timestamps в ранней миграции.

---

### L2. Current seller create form отправляет лишние dimensions в product create

**Impact:** backend `ProductCreateSerializer` их игнорирует, а фактические dimensions пишутся как параметры и в variants.

**Mitigation:** при redesign формы явно разделить product dimensions, package dimensions и variant delivery dimensions.

---

### L3. Есть риск naming mismatch и legacy typo

**Impact:** `postSellerLisence`, `is_age` vs `is_age_restricted`, barcode handler bug в seller form усложняют migration.

**Mitigation:** включить frontend payload cleanup в отдельную итерацию после backend compatibility layer.

---

### L4. Category list не включает descendant products

**Impact:** будущие category facets могут отличаться от текущей выдачи.

**Mitigation:** решить expected behavior перед фасетами: direct only или descendants.

---

## Общие проверки для следующих итераций

```bash
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py migrate --plan
python backend/manage.py migrate
pytest backend/product backend/order backend/payment backend/warehouses backend/delivery -q
python backend/manage.py generate_gmc_feed --limit 50
python backend/manage.py spectacular --file /tmp/schema_new.yml
```

Если команда требует env/services и не запускается локально, фиксировать prerequisite в отчете итерации, не менять код ради обхода.
