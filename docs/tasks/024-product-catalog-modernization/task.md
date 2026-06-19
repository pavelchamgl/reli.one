# План модернизации товарного каталога

**Статус:** черновик после архитектурного ревью Cursor  
**Создан:** 2026-06-05  
**Обновлен:** 2026-06-05  
**Владелец:** архитектура товарного каталога  
**Рекомендуемый агент для ревью:** Opus 4.8 High или MAX Mode  
**Рекомендуемый агент для реализации:** Codex 5.3 Medium для ограниченных итераций, MAX Mode для миграций, импорта и facets

---

## Цель

Модернизировать модель товарного каталога и процесс создания товара продавцом так, чтобы платформа поддерживала:

- удобное штучное создание товаров поставщиками;
- обязательные и опциональные характеристики по категориям;
- надежные фильтры и поиск по категориям;
- понятное отображение товара на детальной странице;
- безопасную модерацию товаров, медиа и документов;
- простой массовый импорт товаров для поставщиков без технической подготовки;
- будущую автоподстановку данных по штрихкоду, ссылке с другого маркета, фото товара или AI/parser.

Все изменения должны вводиться постепенно и не ломать текущее рабочее поведение.

---

## Текущее состояние

### Основные модели

| Модель | Текущая роль |
|---|---|
| `Category` | MPTT-дерево категорий: `name`, `parent`, `image` |
| `BaseProduct` | Основной товар: название, описание, категория, продавец, `barcode`, `article`, статус, НДС, возрастное ограничение |
| `ProductParameter` | Свободные характеристики товара: `name`, `value` |
| `BaseProductImage` | Фото товара без явного порядка, главного фото и типа медиа |
| `ProductVariant` | Вариант товара: `sku`, значение варианта, цена, вес и габариты упаковки |
| `LicenseFile` | Один документ/лицензия на товар через `OneToOne` |
| `WarehouseItem` | Остаток и зарезервированное количество по складу и варианту |

Ключевые файлы:

- `backend/product/models.py`
- `backend/product/serializers.py`
- `backend/product/views.py`
- `backend/product/filters.py`
- `backend/product/admin.py`
- `backend/sellers/serializers.py`
- `backend/sellers/views.py`
- `backend/warehouses/models.py`

### Что уже хорошо

- У товара уже есть статусы модерации: `pending`, `approved`, `rejected`.
- Публичная витрина уже ограничивает обычных пользователей товарами `approved + active`.
- Остатки и резервирование вынесены в отдельный складской слой.
- Есть seller CRUD для товаров.
- Фото, характеристики, варианты и документы уже отделены от базового товара.
- Поиск уже ищет по названию, описанию, категории и свободным характеристикам.

### Ограничения текущей модели

- `ProductParameter.name/value` слишком свободный и не подходит для надежных категорийных фильтров.
- Нет нормализованной модели `Brand`.
- `article` и seller SKU смешаны по смыслу. Сейчас `article` требует ровно 10 цифр, что слишком жестко для артикула продавца.
- Фото не имеют `sort_order`, `is_main`, `media_type`, видео и статуса модерации.
- `LicenseFile` ограничивает товар одним документом.
- Размеры товара и размеры упаковки не разделены.
- Backend/API фактически используют мм/г, а для продавца удобнее см/кг.
- Форма создания товара смешивает базовые поля, документы, габариты, характеристики и дополнительные сведения.
- Создание товара продавцом сейчас не создает и не обновляет `WarehouseItem`.
- Публичные фильтры сейчас ограничены ценой и рейтингом.
- Нет слоя `draft/import/enrichment`.
- Складская политика строгая: если нет строки `WarehouseItem`, значит `available=0`; новый товар может быть видимым, но непокупаемым.
- Delivery/payment читают `ProductVariant.weight_grams`, `length_mm`, `width_mm`, `height_mm`.
- Главное фото сейчас неявное: первое `BaseProductImage` по `id` используется в листинге, истории заказа и GMC feed.
- GMC feed напрямую читает `barcode`, `article` и static brand override по seller id.

---

## Нерушимые инварианты совместимости

Эти ограничения должны сохраняться на всем пути миграции, пока отдельная задача явно не изменит их с тестами и rollback-планом.

1. **Покупаемость товара:** вариант товара покупаем только при наличии валидного пути к `WarehouseItem`. Новый seller-flow должен либо создавать/обновлять остаток, либо явно оставлять товар в состоянии `out_of_stock`.
2. **Стабильность SKU:** существующие значения `ProductVariant.sku` нельзя менять. Checkout, reviews, order history, stock reservation и payment завязаны на них.
3. **Габариты доставки:** delivery/payment должны продолжать получать `ProductVariant.weight_grams`, `length_mm`, `width_mm`, `height_mm`, пока все связанные участки не мигрированы.
4. **Главное фото:** выбранное главное фото должно быть детерминированным и одинаковым для public listing, product detail, order history и GMC feed.
5. **GMC:** feed должен сохранять поведение GTIN/MPN/brand через compatibility adapters и fallbacks; один `<item>` на `ProductVariant`, `item_group_id=product.id` и item count на товар должны сохраняться.
6. **Публичная видимость:** public API не должен отдавать `pending/rejected` media, documents, brands, draft/enrichment payloads или `reserved_quantity`.
7. **Legacy search:** поиск по `ProductParameter` должен работать до внедрения typed attribute search.

---

## Целевая архитектура

### Главный принцип

Разделить:

1. финальные одобренные данные каталога;
2. seller draft;
3. внешние источники данных и импорт;
4. схемы характеристик категорий;
5. типизированные значения характеристик.

Это не позволит данным из штрихкода, фото, ссылки или массового импорта напрямую попадать в публичный товар без проверки.

### Целевые сущности

#### `Brand`

Нормализованный справочник брендов для фильтров, деталки, GMC feed и импорта.

Поля:

- `name`
- `slug`
- `status`: `active` / `pending` / `rejected`
- `aliases`
- `created_by`
- `created_at`

Правила:

- `BaseProduct.brand = ForeignKey(Brand, null=True, blank=True)`.
- Новый бренд может проходить модерацию.
- `pending/rejected` brand не должен попадать в public detail/list/search/GMC, если это не разрешено отдельной политикой.

#### `ProductExternalIdentifier`

Идентификаторы для enrichment, дедупликации и фидов.

Поля:

- `product`
- `identifier_type`: `gtin`, `ean`, `upc`, `mpn`, `seller_sku`, `marketplace_item_id`, `other`
- `value`
- `source`
- `is_primary`

Правила:

- `barcode` оставить на переходный период.
- `mpn` и seller SKU добавлять через новую структуру, но с fallback на старые поля.

#### Seller SKU

Артикул продавца, отдельный от платформенного SKU.

Подход:

- Добавить `seller_sku` на product-level или variant-level после отдельного решения.
- Если product-level, сделать уникальность `(seller, seller_sku)`.
- Не требовать ровно 10 цифр.
- `ProductVariant.sku` оставить платформенным SKU для checkout/order.
- `article` не менять на ранних итерациях: он required в текущих seller serializers/frontend и используется как MPN fallback в GMC.

#### `CategoryAttributeDefinition`

Описание характеристик, ожидаемых в категории.

Поля:

- `category`
- `slug`
- `name`
- `description`
- `data_type`: `text`, `number`, `boolean`, `enum`, `multiselect`, `date`
- `unit`: `cm`, `kg`, `inch`, `W` и т.д.
- `is_required`
- `is_filterable`
- `is_variant_attribute`
- `is_public`
- `sort_order`
- `validation_rules`
- `version`
- `is_active`

Правила:

- На первой фазе характеристики считать только product-level.
- `is_variant_attribute` отложить, пока не будет отдельного дизайна `ProductVariantAttributeValue`.
- Нужно заранее определить наследование по MPTT: наследуются ли характеристики от родителей, обязан ли товар быть в leaf category, что делать с `category=NULL`.
- `slug` должен быть стабильным и удобным для импорта.
- Изменение версии схемы не должно автоматически делать старые approved-товары невалидными.

#### `AttributeOption`

Варианты значений для `enum/multiselect`.

Поля:

- `attribute_definition`
- `value`
- `label`
- `sort_order`
- `aliases`
- `is_active`

#### `ProductAttributeValue`

Типизированное значение характеристики товара.

Поля:

- `product`
- `attribute_definition`
- `value_text`
- `value_number`
- `value_boolean`
- `value_option`
- `value_options`
- `unit`
- `source`
- `confidence_score`
- `created_at`
- `updated_at`

Правила:

- Для filterable-полей использовать typed columns, а не только JSON.
- `ProductParameter` оставить как legacy до завершения миграции поиска.
- Для single-value атрибутов нужна уникальность `(product, attribute_definition)`.
- Для facets нужны индексы по числовым, boolean и option-значениям.

#### `ProductMedia`

Медиа товара: фото, видео, порядок, главное фото, модерация.

Поля:

- `product`
- `file`
- `media_type`: `image` / `video`
- `sort_order`
- `is_main`
- `alt_text`
- `status`: `pending` / `approved` / `rejected`
- `rejected_reason`
- `source`

Правила миграции:

- Существующие `BaseProductImage` можно перенести в `ProductMedia`.
- `is_main=True` ставить на изображение с минимальным `id` у товара.
- Compatibility adapters должны кормить текущих потребителей `images.first()` до их миграции.
- Нужна проверка, что у товара максимум одно главное approved image.

#### `ProductDocument`

Множественные документы товара.

Поля:

- `product`
- `document_type`: `certificate`, `license`, `manual`, `declaration`, `other`
- `file`
- `name`
- `status`: `pending` / `approved` / `rejected`
- `rejected_reason`
- `expires_at`

Правила:

- Старый `LicenseFile` переносить как `ProductDocument(document_type=license)`.
- Public serializers должны отдавать только approved documents.

#### Габариты товара и упаковки

Цель: разделить фактические размеры товара и упаковочные размеры.

Seller UI:

- `product_length_cm`
- `product_width_cm`
- `product_height_cm`
- `product_weight_kg`
- `package_length_mm`
- `package_width_mm`
- `package_height_mm`
- `package_weight_kg`

Правила:

- Delivery-critical габариты должны оставаться доступными на `ProductVariant` в мм/г.
- UI может принимать см/кг, но backend должен безопасно конвертировать в поля, нужные delivery/payment.
- Нельзя заменить variant package dimensions на product-level поля без отдельной миграции delivery/payment.

#### Склад продавца и остатки

Это архитектурное решение должно быть принято до изменения seller-flow.

Нужно решить:

- `Warehouse` принадлежит seller, platform или external fulfillment provider?
- Какой warehouse используется при создании остатка продавцом?
- Seller self-service пишет `WarehouseItem` напрямую или через stock service/API?

Минимальные требования:

- Должен быть понятный путь создания/обновления `WarehouseItem`.
- Если остаток не указан, товар явно стартует как `out_of_stock`.
- Stock API не раскрывает `reserved_quantity`.

#### `ProductDraft`

Черновик товара до создания или обновления финального `BaseProduct`.

Поля:

- `seller`
- `product` nullable для редактирования существующего товара
- `status`: `draft`, `validating`, `ready_for_review`, `submitted`, `accepted`, `rejected`
- `payload`
- `validation_errors`
- `created_by`
- `submitted_at`
- `created_at`
- `updated_at`

Использование:

- ручное создание товара;
- массовый импорт;
- заполнение по штрихкоду, ссылке или фото;
- возможная модерация изменений существующего товара.

Нужен явный contract materialization: когда `payload` превращается в `BaseProduct`, `ProductMedia`, `ProductDocument`, `ProductAttributeValue`, `ProductVariant`, `WarehouseItem`.

#### `ProductDataSource`

Сырой и нормализованный результат внешних источников.

Поля:

- `draft`
- `source_type`: `manual`, `bulk_import`, `barcode`, `marketplace_url`, `photo`, `ai_parser`
- `source_value`
- `raw_payload`
- `normalized_payload`
- `confidence_score`
- `status`: `pending`, `parsed`, `failed`, `needs_review`, `accepted`
- `error_message`
- `created_by`
- `created_at`

Правило: внешний источник предлагает данные, но не публикует товар напрямую.

#### `ProductImportBatch` и `ProductImportRow`

Массовая загрузка поставщиками.

`ProductImportBatch`:

- `seller`
- `category`
- `status`
- `source_file`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `created_by`
- `created_at`

`ProductImportRow`:

- `batch`
- `row_number`
- `raw_payload`
- `normalized_payload`
- `validation_errors`
- `draft`
- `status`

Правила:

- Шаблоны Excel/CSV должны быть category-specific.
- Ошибки должны быть понятны поставщику.
- Валидные строки создают drafts/pending products, но не публикуются напрямую.

#### `ProductModerationEvent`

Audit trail модерации.

Поля:

- `product`
- `draft`
- `actor`
- `event_type`: `submitted`, `approved`, `rejected`, `requested_changes`, `edited`
- `message`
- `before_snapshot`
- `after_snapshot`
- `created_at`

Должен дополнять текущие `approved_by`, `approved_at`, `rejected_reason`, а не создавать конфликтующее состояние.

---

## Целевой порядок seller form

1. Название товара
2. Бренд
3. Категория
4. Тип товара, если нужен категории
5. Главное фото и дополнительные media
6. Цена
7. Остаток
8. Краткое описание
9. Полное описание
10. Характеристики по категории
11. Габариты товара
12. Габариты упаковки
13. Документы
14. Дополнительные сведения в accordion

Дополнительные сведения:

- страна производства;
- гарантия;
- HS/TARIC/customs code;
- НДС;
- материал упаковки;
- примечание продавца.

---

## Итерации

Каноническая карта итераций после System Audit:

| Iteration | Канонический смысл | Статус |
| --- | --- | --- |
| 0 | Системный аудит и декомпозиция | выполнено |
| 1 | Architecture decisions и базовые compatibility constraints | следующий шаг |
| 2 | Backend compatibility layer без изменения public behavior | после ADR |
| 3 | Stock path для seller products | после ADR по складам |
| 4 | Catalog normalized models: Brand, identifiers, media, documents | после compatibility layer |
| 5 | Category attribute schema и typed product attributes | после решений по category inheritance |
| 6 | Public filters, facets и search upgrade | после typed attributes |
| 7 | Seller frontend: new create/edit wizard | после backend API/schema |
| 8 | Admin/moderation upgrade | после новых nested resources |
| 9 | Import/enrichment foundation | после draft/materialization contract |
| 10 | Cleanup и legacy migration | только после compatibility-релизов |

Эта таблица является source of truth для всех документов задачи. Старый порядок `task.md` был пересобран после ревью Iteration 0, чтобы `Iteration 1` не означала одновременно ADR и миграции.

### Iteration 0 — системный аудит и декомпозиция

Цель: до изменений кода получить карту зависимостей и точные задачи реализации.

Действия:

- Проверить использования ключевых моделей и полей.
- Построить карты зависимостей для product, seller-flow, warehouse, checkout, delivery, GMC, order history, search, admin.
- Явно проверить seller-to-warehouse ownership и путь создания `WarehouseItem`.
- Проверить зависимости delivery/payment от variant dimensions.
- Проверить зависимости GMC от `barcode`, `article`, image, brand.
- Проверить зависимости `ProductVariant.sku` в reviews, orders, checkout, stock reservation.
- Зафиксировать текущие frontend payload fields для `article`, dimensions, variants, images.
- Превратить план в конкретные implementation tasks.

Acceptance criteria:

- [ ] Есть dependency map.
- [ ] Есть risk register.
- [ ] Есть implementation task breakdown для Iterations 1-10.
- [ ] Есть отдельное архитектурное решение по seller warehouse/stock path.
- [ ] Для каждой будущей задачи указаны ограничения, проверки и acceptance criteria.

### Iteration 1 — Architecture decisions и базовые compatibility constraints

Цель: закрыть архитектурные решения до migrations и application code.

Действия:

- Оформить ADR по seller warehouse ownership и stock path.
- Учесть существующие `SellerProfile.default_warehouse` и `SellerProfile.warehouses`.
- Определить поведение при `default_warehouse=NULL`.
- Оформить ADR по dimensions policy: seller UI показывает `cm/kg`, delivery/payment storage остается `ProductVariant.*_mm/weight_grams`.
- Оформить ADR по scope typed attributes: first phase только product-level.
- Оформить ADR по category inheritance для MPTT и behavior для `category=NULL`/non-leaf categories.
- Оформить ADR по public visibility для pending/rejected brand/media/documents.
- Утвердить constraints/indexes для будущих моделей.
- Зафиксировать backup/reversibility policy для data migrations.

Ограничения:

- Не писать application code.
- Не создавать migrations.
- Не менять backend/frontend contracts.

Acceptance criteria:

- [ ] У каждого архитектурного решения есть ADR.
- [ ] Stock path переиспользует или явно согласует `default_warehouse/warehouses`.
- [ ] Checkout CZ-origin от `default_warehouse.country` не ломается.
- [ ] `ProductVariant.sku`, `article`, `barcode` остаются совместимыми.
- [ ] Есть единые constraints для Iterations 2-10.

### Iteration 2 — Backend compatibility layer без изменения public behavior

Цель: безопасно отдавать новые данные, сохраняя старый frontend/API контракт.

Действия:

- Добавить serializers для brands, attributes, media, documents.
- Добавить category schema endpoint для seller form.
- Добавить compatibility adapters для media/documents/attributes.
- Добавить GMC adapters:
  - GTIN из external identifiers с fallback на `barcode`;
  - MPN из identifiers/seller SKU с fallback на `article`;
  - brand из normalized brand с fallback на static seller override.
- Добавить main-image helper, чтобы list/detail/order/GMC совпадали.
- Добавить draft-aware seller endpoint или transitional endpoint.
- Сохранить существующие endpoints.

Ограничения:

- Текущий seller create/edit не должен сломаться.
- Public detail/list/search/category должны открывать старые товары.
- Checkout/order продолжают использовать `ProductVariant.sku`.
- Delivery/payment получают variant dimensions в мм/г.
- Public serializers не отдают pending/rejected media, documents, brands и draft/enrichment payloads.

Acceptance criteria:

- [ ] Старый product detail работает.
- [ ] Category endpoint отдает attribute schema.
- [ ] Seller permissions не регрессируют.
- [ ] Public users видят только `approved + active`.
- [ ] GMC feed генерируется и сохраняет identifier/brand behavior через fallbacks.
- [ ] Главное фото одинаково для public list, detail, order history, GMC.
- [ ] Public responses не содержат `reserved_quantity`.

### Iteration 3 — Stock path для seller products

Цель: сделать создание товара совместимым с покупаемостью и reservation.

Действия:

- Реализовать утвержденный stock path для seller-created products.
- Создавать или обновлять `WarehouseItem` через service/API, а не напрямую из frontend.
- Привязать stock rows к `SellerProfile.default_warehouse` или разрешенному `warehouses`.
- Определить behavior при `default_warehouse=NULL`.
- Сохранить старое поведение: missing `WarehouseItem` означает `out_of_stock`.
- Покрыть reservation и public stock tests.

Ограничения:

- Не менять `ProductVariant.sku`.
- Не переносить delivery dimensions.
- Не обходить CZ-origin checkout policy.

Acceptance criteria:

- [ ] Seller может задать stock для своего варианта.
- [ ] Товар с валидным stock path становится buyable.
- [ ] Товар без stock row остается `out_of_stock`.
- [ ] Checkout CZ-origin проходит для товара с остатком на корректном складе.
- [ ] `default_warehouse=NULL` покрыт тестом и документирован.

### Iteration 4 — Catalog normalized models: Brand, identifiers, media, documents

Цель: добавить новые модели без удаления legacy-моделей и без изменения public behavior.

Действия:

- Добавить `Brand`.
- Добавить external identifiers.
- Добавить product media.
- Добавить product documents.
- Добавить `seller_sku` как optional field, не заменяя `article`.
- Добавить `created_at`/`updated_at` на `BaseProduct`, если утверждено.
- Добавить constraints/indexes для main media, identifiers, statuses.
- Зарегистрировать модели в admin.
- Сделать data migration media: минимальный old image id -> `is_main`, порядок id -> `sort_order`.
- Перед data migration подготовить backup, dry-run на копии БД и reverse/rollback plan.

Ограничения:

- Не удалять `BaseProductImage`, `LicenseFile`, `barcode`, `article`.
- Не менять public serializer output без adapters.
- Не менять `ProductVariant.sku`.

Acceptance criteria:

- [ ] Миграции применяются чисто.
- [ ] Старые product APIs сохраняют response shape.
- [ ] Главное фото одинаково для public list, detail, order history, GMC.
- [ ] Pending/rejected brand/media/documents не видны public.
- [ ] Data migration имеет rollback notes и backup-шаг.

### Iteration 5 — Category attribute schema и typed product attributes

Цель: добавить category-driven typed attributes без регресса поиска.

Действия:

- Добавить category attribute definitions/options.
- Добавить typed product attribute values.
- Зафиксировать, что first-phase attributes только product-level.
- Реализовать inheritance по MPTT согласно ADR.
- Добавить category schema endpoint для seller form/import templates.
- Сохранить `ProductParameter` search fallback до typed search.
- Добавить indexes для filterable attributes.

Ограничения:

- Не делать variant-level attributes без отдельного дизайна.
- Не отключать legacy parameters до готовности typed search.

Acceptance criteria:

- [ ] Category endpoint отдает attribute schema.
- [ ] Required attributes валидируются.
- [ ] Старые товары не становятся invalid без explicit revalidation.
- [ ] Search не регрессирует при переходном периоде.

### Iteration 6 — Public filters, facets и search upgrade

Цель: добавить фильтры по нормализованным характеристикам.

Действия:

- Добавить facet metadata endpoint по категории.
- Добавить фильтры по brand, price, availability, rating, category attributes.
- Добавить query support для typed attribute values.
- Спроектировать indexes для facet queries.
- Сделать realistic-volume query checks или описать performance risk.

Ограничения:

- Не строить новые filters по свободным `ProductParameter`.
- Не ломать price/acquiring behavior.
- Не отключать текущий search по `ProductParameter` до typed search.

Acceptance criteria:

- [ ] Category API отдает facets.
- [ ] Фильтры по enum/boolean/number attributes работают.
- [ ] Фильтр по brand работает.
- [ ] Search возвращает products/categories.
- [ ] Query performance приемлем или риск задокументирован.

### Iteration 7 — Seller frontend: new create/edit wizard

Цель: перестроить форму вокруг category schema и безопасного порядка UX.

Действия:

- Переставить поля по целевому порядку.
- Добавить brand selection/suggestion.
- Загружать category attribute schema после выбора категории.
- Рендерить характеристики по `data_type`.
- Разделить product dimensions и package dimensions.
- Перенести advanced fields в accordion.
- Поддержать media preview, ordering, main photo, video, если backend готов.
- Добавить stock quantity через утвержденный stock path.
- Сохранять legacy-compatible variant payload до завершения миграции.
- Не менять `article`, если backend/frontend/GMC не обновляются синхронно.

Ограничения:

- Текущий preview/submission flow должен работать до полного перехода.
- Enrichment/import data не публикуются напрямую.
- Товар нельзя показывать как buyable без валидного `WarehouseItem`.

Acceptance criteria:

- [ ] Seller может вручную создать товар.
- [ ] Required category attributes валидируются.
- [ ] Seller может загрузить и упорядочить media.
- [ ] Товар уходит в pending/moderation state.
- [ ] Seller не может редактировать чужой товар.
- [ ] Seller может задать stock через утвержденный путь или товар явно `out_of_stock`.
- [ ] Variant package dimensions совместимы с delivery/payment.

### Iteration 8 — Admin/moderation upgrade

Цель: сделать новые данные управляемыми и модерируемыми.

Действия:

- Улучшить product admin fieldsets.
- Добавить admin для brands, attributes, options, media, documents, drafts, imports.
- Добавить moderation event tracking.
- Определить связь `Brand.status`, `ProductMedia.status`, `ProductDocument.status` с `ProductStatus`.
- Убедиться, что `ProductModerationEvent` не конфликтует с `approved_by`, `approved_at`, `rejected_reason`.

Acceptance criteria:

- [ ] Admin видит core data, media, documents, attributes.
- [ ] Rejection reason/comment сохраняется.
- [ ] Moderation history видна.
- [ ] Existing product status behavior сохраняется.
- [ ] Правила public visibility для pending/rejected brands/media/documents ясны.

### Iteration 9 — Import/enrichment foundation

Цель: подготовить массовый импорт и future enrichment по barcode/link/photo.

Действия:

- Генерировать category-specific Excel/CSV templates.
- Поддержать import batch upload.
- Валидировать строки по category schema.
- Нормализовать brand, identifiers, attributes, dimensions, document/media references.
- Показывать row-level errors.
- Создавать drafts или pending products только после review/confirmation.
- Сохранять provenance по строкам.
- Использовать `ProductDataSource` для barcode/link/photo inputs.
- Хранить raw и normalized payloads.
- Не писать source data напрямую в public product fields.

Ограничения:

- Импорт не публикует товары напрямую.
- Поставщик не должен знать внутренний JSON.

Acceptance criteria:

- [ ] Supplier скачивает template категории.
- [ ] Supplier загружает заполненный template.
- [ ] Invalid rows показывают понятные ошибки.
- [ ] Valid rows становятся drafts/pending products.
- [ ] Import batch хранит status и row counts.
- [ ] Import не создает buyable stock без валидного stock path.

### Iteration 10 — Cleanup и legacy migration

Цель: перенести старые данные и постепенно снизить зависимость от legacy-моделей.

Действия:

- Перенести `ProductParameter` в typed attributes, где есть definitions.
- Перенести `BaseProductImage` в `ProductMedia`.
- Перенести `LicenseFile` в `ProductDocument`.
- Первое изображение по минимальному `id` сделать `ProductMedia.is_main=True`.
- Сохранить compatibility relations/adapters до миграции list/detail/order/GMC.
- Добавить compatibility checks.
- Удалять/deprecate legacy write paths только после завершения frontend/API migration.
- Перед destructive cleanup подготовить backup, dry-run на копии БД и restore plan.

Ограничения:

- Никаких destructive migrations без backup/rollback plan.
- Старые product pages должны работать.

Acceptance criteria:

- [ ] Legacy data представлена в новых моделях.
- [ ] Compatibility serializers работают.
- [ ] Нет checkout/order regression.
- [ ] Cleanup plan утвержден перед удалением старых полей/моделей.
- [ ] Все существующие `ProductVariant.sku` неизменны.
- [ ] GMC feed output идентичен или diff осознанно задокументирован.
- [ ] Main image behavior сохранен для list/detail/order/GMC.
- [ ] Search не регрессирует при переходе с legacy parameters на typed attributes.

---

## Сквозные требования

### Backward compatibility

- Existing detail/list/search/category responses работают на переходном периоде.
- Checkout/order используют стабильный `ProductVariant.sku`.
- Public visibility остается `approved + active`.
- `article` и `barcode` доступны до миграции frontend/API/GMC fallbacks.
- `ProductParameter` search доступен до typed search.
- Потребители изображений получают детерминированное главное фото.

### Security и ownership

- Seller может менять только свои products, drafts, media, documents, imports.
- Staff/Admin/Manager visibility остается role-controlled.
- Public API не раскрывает `reserved_quantity`.
- Public API не раскрывает pending/rejected media, documents, brands, drafts, raw source payloads или чужие import errors.

### Stock и checkout

- Seller product creation должен иметь утвержденный путь создания/обновления stock или явно стартовать `out_of_stock`.
- `WarehouseItem` ownership и seller/platform warehouse semantics должны быть решены до self-service stock.
- Reservation logic остается authoritative.
- Stock APIs не раскрывают `reserved_quantity`.

### Delivery и payment

- Package dimensions для checkout/delivery остаются на `ProductVariant` в мм/г до завершения миграции.
- UI conversion см/кг должен быть loss-safe и покрыт тестами.
- DPD/GLS/Packeta/Stripe/PayPal session builders проверяются после изменений габаритов.

### GMC feed

- Feed generation сохраняет GTIN, MPN, brand, image, title, availability через adapters.
- Feed эмитит один `<item>` на `ProductVariant`, сохраняет `item_group_id=product.id`; snapshot проверяет item count на товар.
- Static seller brand overrides остаются fallback.
- Feed diffs ревьюятся перед deploy.

### Auditability

Отслеживать:

- product submitted;
- product approved/rejected;
- media/document rejected;
- import batch created;
- enrichment source accepted/rejected.

### Data quality

Можно добавить внутренний quality score:

- required attributes заполнены;
- main photo есть;
- brand есть;
- description есть;
- dimensions есть;
- documents приложены, если нужны.

### Legal/content safety

Marketplace URL и AI/photo enrichment использовать как помощник заполнения. Seller должен проверить и подтвердить итоговые данные, особенно descriptions и images.

### Units

- Seller UI: см и кг.
- API names должны явно включать units.
- Internal storage должен быть единым и задокументированным.

### Attribute versioning

Изменение category schema не делает старые approved-товары невалидными без явного шага revalidation.

### Constraints и indexes

До миграций решить:

- `ProductMedia`: максимум одно main media на товар.
- `ProductAttributeValue`: одно значение на `(product, attribute_definition)` для single-value.
- `ProductExternalIdentifier`: уникальность по type/value и связь с product.
- Facet fields: indexes для number, boolean, option, multiselect.
- Category definitions: уникальность category/slug/version и inheritance behavior.

---

## Базовые проверки

```bash
# Миграции
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py migrate --plan
python backend/manage.py migrate

# Критичные backend-домены
pytest backend/product backend/order backend/payment backend/warehouses backend/delivery -q

# Catalog и stock contracts
pytest backend/product/test_catalog_api.py backend/product/test_stock_availability_api.py -q
pytest backend/warehouses/tests_reservation.py backend/payment/test_checkout_flow.py -q

# GMC feed
python backend/manage.py generate_gmc_feed --limit 50

# Public API schema
python backend/manage.py spectacular --file /tmp/schema_new.yml
```

Дополнительные проверки:

- сравнить GMC XML с pre-change snapshot;
- сравнить JSON shape для detail/list/search/category;
- проверить order history image/name/SKU;
- проверить старые seller create/edit payloads;
- проверить, что новый товар либо buyable через `WarehouseItem`, либо явно `out_of_stock`.

---

## Prompt для повторного ревью

```text
Review docs/tasks/024-product-catalog-modernization/task.md.

Do not write implementation code.

Work in architecture/code-review mode. Findings first, ordered by severity.

Check especially:
- WarehouseItem creation and seller stock ownership;
- ProductVariant.sku stability;
- delivery/payment package dimensions;
- main image migration;
- GMC feed compatibility;
- article/barcode backward compatibility;
- pending media/document/brand public visibility;
- ProductParameter search migration;
- category attribute inheritance;
- EAV/facet performance.

Expected output:
- critical findings;
- medium/low risks;
- missing dependencies;
- suggested changes to the plan;
- recommended verification checks.
```

---

## Следующий шаг

Выполнить `Iteration 0 — System Audit` по файлу:

`docs/tasks/024-product-catalog-modernization/iteration-0-system-audit.md`

Результатом должны быть:

1. `audit-dependency-map.md`
2. `audit-risk-register.md`
3. `implementation-task-breakdown.md`

Только после этого можно переходить к реализации `Iteration 1`.
