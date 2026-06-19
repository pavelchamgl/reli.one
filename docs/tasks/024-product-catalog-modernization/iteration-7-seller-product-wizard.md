# Iteration 7 — Seller product create/edit wizard planning

**Статус:** planning-only  
**Scope:** frontend/API orchestration plan для seller product create/edit wizard  
**Язык:** документы на русском, technical terms оставлены на English

---

## Scope Iteration 7

Iteration 7 должна обновить seller create/edit UX товара поверх backend foundation из Iteration 3–6.

Что делаем:

- seller create/edit UX для товара;
- подключение category schema;
- typed attributes UI;
- stock step;
- media preview/order в рамках legacy `BaseProductImage` compatibility;
- dimensions conversion `cm/kg -> mm/g` для variant payload;
- better step-level error handling;
- явная обработка partial success после успешного `POST /api/sellers/products/`.

Что НЕ делаем:

- backend models/migrations;
- public filters/facets backend;
- checkout/payment/delivery/order/reservation;
- `ProductVariant.sku`;
- seller stock endpoint;
- import/enrichment;
- legacy cleanup;
- full admin/moderation UI;
- полноценный переход seller frontend на `ProductMedia`/`ProductDocument` write API.

---

## Current Frontend Flow Map

### Routes

Seller product flow сейчас живет в защищенных routes:

- `/seller/seller-create`;
- `/seller/seller-preview`;
- `/seller/seller-preview/:id`;
- `/seller/seller-edit/:id`;
- `/seller/edit-preview/:id`.

Routes объявлены в `Frontend/Frontend3/src/main.jsx`.

### Create components

Основная форма:

- `Frontend/Frontend3/src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx`.

Переиспользуемые блоки:

- `SellerCreateImage` — загрузка `images` в local/redux state;
- `CreateLisence` — legacy license file;
- `CreateCategoryMain` — выбор категории через существующий category selector;
- `CreateCharacInp` — legacy free-form `ProductParameter`;
- `SellerCreateVariants` и `SellerCreateVariant` — variants, price, dimensions, required `text`, optional `image`;
- `CreateFormInp`, `CheckBox` — базовые controls.

Redux state:

- `Frontend/Frontend3/src/redux/createProdPrevSlice.js`;
- slice name: `createProdPrev`;
- state branch: `create_prev`.

Текущие create fields:

- base product: `name`, `product_description`, `category`, `barcode`, `item` -> backend `article`, `additional_details`, `vat_rate`, `is_age`;
- media: `images`;
- legacy docs: `license_file`;
- legacy params: `product_parameters`;
- dimensions: `lengthMain`, `widthMain`, `heightMain`, `weightMain`;
- variants: `variantsName`, `variantsMain`;

Текущий drift, который нужно нормализовать в Iteration 7:

- create thunk может отправлять product-level `length_mm`, `weight_grams`, `height_mm`, `width_mm` в `POST /api/sellers/products/`, хотя source of truth для dimensions — variants payload;
- create slice/form используют `is_age`, а backend product payload ожидает `is_age_restricted`;
- в реализации нужно не отправлять dimensions в product create payload, конвертировать `cm/kg -> mm/g` только для variants payload и явно маппить `is_age -> is_age_restricted`.

Текущий submit orchestration находится в `fetchCreateProduct`:

1. `POST /api/sellers/products/`;
2. после получения `product.id` параллельно через `Promise.allSettled`:
   - `POST /api/sellers/products/{id}/parameters/bulk_create/`;
   - `POST /api/sellers/products/{id}/variants/bulk_create/`;
   - `POST /api/sellers/products/{id}/images/bulk_upload/`;
   - `POST /api/sellers/products/{id}/license/`, если выбран file.

### Edit components

Основная форма:

- `Frontend/Frontend3/src/Components/Seller/edit/EditGoodsForm/EditGoodsForm.jsx`.

Переиспользуемые блоки (shared с create):

- `CreateCategoryMain` — на edit: `readOnlyCategory={{ id, name }}` для отображения категории без re-select; **не** читает `edit_goods` slice;
- `CreateFormInp`, `CheckBox`, `SellerCategoryAttributesFields`;
- `CreateCharacInp` / `EditGoodsParameters` — один UX для legacy characteristics; dimension rows скрыты через `sellerProductParameters.js`.

Edit-only блоки:

- `SellerEditImages` — `status: local|server`, `fetchDeleteImage`;
- `EditLicense` — `fetchDeleteLicense`;
- `EditMainVariants` / `EditVariants` — System SKU read-only, `fetchDeleteVariant`, package dimensions в variant card.

Shared validation/helpers:

- `getValidateGoods(t)` — formik schema;
- `validateAttributeDraft(..., t)`, `validateProductVariants(..., t)` — preview gate;
- `getVisibleProductParameters(parameters)` — visible-only validation legacy characteristics (dimension rows excluded).

Redux state:

- `Frontend/Frontend3/src/redux/editGoodsSlice.js`;
- slice name: `editGoodsSeller`;
- state branch: `edit_goods`.

Текущий edit load:

- `GET /api/sellers/products/{id}/`;
- данные раскладываются в `images`, `parameters`, `variantsServ`, dimensions через legacy `ProductParameter` names `Length`, `Weight`, `Width`, `Height`.

Текущий edit submit:

1. `PATCH /api/sellers/products/{id}/`;
2. optional requests:
   - `POST /api/sellers/products/{id}/license/`;
   - `POST /api/sellers/products/{id}/images/bulk_upload/`;
   - `POST /api/sellers/products/{id}/parameters/bulk_create/`;
   - `PATCH /api/sellers/products/{id}/parameters/{param_id}/`;
   - `POST /api/sellers/products/{id}/variants/bulk_create/`;
   - `PATCH /api/sellers/products/{id}/variants/{variant_id}/`.

### API helpers

Create helpers:

- `Frontend/Frontend3/src/api/seller/sellerProduct.js`;
- `postSellerProduct`;
- `postSellerImages`;
- `postSellerParameters`;
- `postSellerVariants`;
- `postSellerLisence`;
- `deleteSellerProduct`;
- `getSellerProductById`.

Edit helpers:

- `Frontend/Frontend3/src/api/seller/editProduct.js`;
- `getSellerProductById`;
- `patchProduct`;
- `patchSellerImages`.

### Current risk

Если secondary request падает после успешного `POST /api/sellers/products/`, пользователь видит общий toast:

`Error while creating the product. Please check the entered data and try again.`

При этом товар уже создан, может появиться в seller goods list и остаться доступным для edit flow. Это уже наблюдалось один раз и не воспроизвелось повторно. В Iteration 7 нужно сделать partial success явным состоянием, а не маскировать его под полный create failure.

---

## Target UX Structure

Целевой порядок шагов в create wizard:

1. Название.
2. Категория.
3. Media.
4. Price.
5. Stock.
6. Description.
7. Category attributes.
8. Dimensions.
9. Documents.
10. Additional details.

Порядок выбран так, чтобы:

- category была выбрана до schema loading;
- price/stock были ближе к покупаемости товара;
- typed attributes шли после description, когда category context уже стабилен;
- dimensions оставались явно связанными с delivery contract, но отправлялись на variant payload в `mm/g`;
- documents оставались legacy `LicenseFile` до отдельной итерации по `ProductDocument`.

---

## Component Plan

### Reuse existing components

Переиспользовать:

- `SellerCreateForm` как container для create wizard orchestration;
- `EditGoodsForm` как container для edit compatibility;
- `CreateCategoryMain` для выбора категории;
- `SellerCreateImage` / `SellerEditImages` для legacy images;
- `CreateLisence` / `EditLicense` для legacy license;
- `SellerCreateVariants` / `EditMainVariants` для variants;
- `CreateFormInp`, `CheckBox` для базовых controls;
- существующие redux hooks `useActionCreatePrev`, `useActionSellerEdit`.

### New small components

Предлагаемый минимальный набор:

- `SellerWizardStepSection`
  - props: `title`, `status`, `errors`, `children`;
  - назначение: единая оболочка шага без изменения visual system.
- `SellerCategoryAttributesFields`
  - props: `schema`, `values`, `errors`, `onChange`, `disabled`;
  - назначение: рендер typed attributes по `data_type`.
- `SellerStockStep`
  - props: `variants`, `stockByVariantId`, `errors`, `onChange`;
  - назначение: ввод `quantity_in_stock` после создания variants или подготовка stock values до submit.
- `SellerSubmitStatusPanel`
  - props: `productId`, `stepResults`, `canRetry`, `onRetryFailedSteps`, `onOpenEdit`;
  - назначение: показать partial success и конкретные failed secondary requests.

Если хочется еще меньше файлов, `SellerWizardStepSection` можно сделать локальным компонентом рядом с create/edit form, но typed attributes и stock лучше вынести отдельно.

### Props / state

Create slice добавить в реализации:

- `attributeSchema`: response `GET /api/sellers/categories/{category_id}/attribute-schema/`;
- `attributeValues`: draft values keyed by definition id или code;
- `attributeErrors`: field-level errors;
- `stockByVariantLocalId`: quantity draft до создания variants;
- `submitStepResults`: массив `{step, status, error, response}`;
- `createdProductId`: id после успешного product create;
- `createdVariantIdsByLocalId`: mapping local variant -> backend variant;
- `partialSuccess`: boolean.

Edit slice добавить в реализации:

- `attributeSchema`;
- `attributeValues`;
- `attributeErrors`;
- `stockByVariantId`;
- `submitStepResults`;
- `partialSuccess`.

### Schema loading

Schema loading подключить после выбора категории:

- create: в `SellerCreateForm` реагировать на `category.id`;
- edit: после `fetchSellerProductById`, если есть `product.category_id` или выбранная category из `CreateCategoryMain`;
- при смене category очищать typed values, которые больше не входят в effective schema, и показывать предупреждение в step-level errors.

### Validation

Validation делать в два слоя:

- client step validation:
  - required schema attributes;
  - type validation для `text`, `number`, `boolean`, `enum`;
  - category selected;
  - media selected;
  - variants valid;
  - stock integer `>= 0`;
  - dimensions positive before conversion.
- server validation:
  - доверять `PUT /attributes/`, variants endpoint и stock endpoint как source of truth;
  - показывать field-level errors из response body там, где backend возвращает structured errors.

### Submit orchestration

Submit orchestration должен быть отдельной функцией/helper, а не размазанным `Promise.all` внутри thunk:

- `createBaseProduct`;
- `createVariants`;
- `upsertStock`;
- `saveTypedAttributes`;
- `uploadImages`;
- `saveLegacyParameters`;
- `uploadLicense`.

Для create flow порядок важен:

1. create product;
2. create variants;
3. stock по созданным variants;
4. typed attributes;
5. images;
6. legacy parameters;
7. license.

Images/parameters/license можно делать параллельно после product id, но error reporting должен оставаться per-step. Stock зависит от backend variant ids.

---

## API Integration Plan

### `GET /api/sellers/categories/{category_id}/attribute-schema/`

Когда вызывается:

- после выбора category;
- при открытии edit flow после загрузки product category;
- повторно при смене category.

Нужные данные:

- seller auth token;
- `category_id`.

Что сохранять:

- `category_id`;
- `category_name`;
- `category_allows_products`;
- `attributes[]` с `id`, `code`, `name`, `data_type`, `is_required`, `is_filterable`, `is_public`, `unit`, `group`, `sort_order`, `is_inherited`, `inherited_from_id`, `options`.

Ошибка:

- step-level error на category/attributes step;
- не блокировать уже введенные base fields;
- blocked submit, если schema нужна для required attributes и не загрузилась.

### `GET /api/sellers/products/{product_id}/attributes/`

Когда вызывается:

- edit flow после `GET /api/sellers/products/{id}/`;
- refresh после successful attributes save.

Что сохранять:

- existing typed values keyed by `attribute_definition` id;
- `value_text`, `value_number`, `value_boolean`, `value_option`.

Ошибка:

- показать warning в attributes step;
- не блокировать редактирование legacy fields.

### `PUT /api/sellers/products/{product_id}/attributes/`

Когда вызывается:

- create flow после product create и category schema validation;
- edit flow при сохранении, если typed attributes были изменены.

Payload:

```json
[
  {"attribute_definition": 10, "value_text": "Steel"},
  {"attribute_definition": 11, "value_number": "80"},
  {"attribute_definition": 12, "value_boolean": true},
  {"attribute_definition": 13, "value_option": 25}
]
```

Ошибка:

- сохранить `productId`;
- отметить attributes step как failed;
- показать field-level errors;
- дать action retry only failed attributes save.

### `PUT /api/sellers/products/{product_id}/variants/{variant_id}/stock/`

Когда вызывается:

- create flow после успешного create variants;
- edit flow для existing variant stock updates;
- optional after adding new variants in edit.

Payload:

```json
{"quantity_in_stock": 12}
```

Optional:

```json
{"quantity_in_stock": 12, "warehouse_id": 5}
```

Что сохранять:

- `warehouse_id`;
- `variant_id`;
- `sku`;
- `quantity_in_stock`;
- `available_quantity`;
- не показывать и не хранить `reserved_quantity` в public UI; seller response может вернуть его, но UI не должен переносить это в public state.

Ошибка:

- если нет default warehouse, показать step-level error с текстом про warehouse setup;
- не повторять product create;
- retry только stock step.

### Existing product create/edit endpoints

`POST /api/sellers/products/`

Когда:

- первый backend step create flow.

Payload сейчас:

- `name`;
- `product_description`;
- `barcode`;
- `article`;
- `additional_details`;
- `vat_rate`;
- `is_age_restricted`;
- `category`.

Важно:

- не отправлять dimensions на product-level как source of truth;
- dimensions должны идти в variants payload.
- текущий frontend state `is_age` нужно явно маппить в backend field `is_age_restricted`.

`PATCH /api/sellers/products/{id}/`

Когда:

- edit base product fields.

Ошибка:

- если base product patch failed, можно остановить весь submit до secondary steps.

### Existing variants endpoints

`POST /api/sellers/products/{id}/variants/bulk_create/`

Payload:

```json
[
  {
    "name": "Size",
    "text": "M",
    "price": "99.99",
    "weight_grams": 1250,
    "width_mm": 120,
    "height_mm": 80,
    "length_mm": 200
  }
]
```

Rules:

- backend генерирует `sku`;
- `ProductVariant.sku` не задавать и не менять;
- `text` обязателен (непустая строка);
- `image` опционален; допустимы `text` и `image` одновременно;
- все варианты одного товара имеют одинаковый `name` (ось вариации, например «Color»);
- `price`, `weight_grams`, `width_mm`, `height_mm`, `length_mm` обязательны и > 0.

`PATCH /api/sellers/products/{id}/variants/{variant_id}/`

Когда:

- edit existing variants.

### Existing parameters endpoint

`POST /api/sellers/products/{id}/parameters/bulk_create/`

Назначение в Iteration 7:

- сохранить legacy `ProductParameter` compatibility;
- не заменять typed attributes;
- не удалять старый fallback.

Payload:

```json
[
  {"name": "Length", "value": "20"},
  {"name": "Weight", "value": "1.25"}
]
```

### Existing images endpoint

`POST /api/sellers/products/{id}/images/bulk_upload/`

Payload:

```json
{"images": [{"image": "data:image/png;base64,..."}]}
```

Iteration 7 behavior:

- использовать legacy `BaseProductImage`;
- первый image в массиве остается legacy cover по min id / insertion order behavior;
- не переключать seller UI на `ProductMedia`.

### Existing license endpoint

`POST /api/sellers/products/{id}/license/`

Payload:

```json
{"name": "certificate.pdf", "file": "data:application/pdf;base64,..."}
```

Iteration 7 behavior:

- оставить legacy `LicenseFile` OneToOne limitation;
- если license уже есть, edit flow должен не пытаться создать дубликат без удаления/замены.

---

## Data Mapping

### Category schema -> UI fields

`attributes[]` сортировать по:

1. `group`;
2. `sort_order`;
3. `id`.

UI field key:

- prefer `attribute.id` для payload;
- `code` использовать для local dictionary/debug labels/import-friendly state.

Required:

- `is_required=true` -> required marker и client validation.

Inherited:

- `is_inherited=true` можно показывать мягко, но не делать отдельным UX blocker.

### Typed controls

- `text` -> text input или textarea, если `validation_rules.ui_widget=textarea` появится позже;
- `number` -> numeric input, сохранять string до submit, отправлять как decimal-compatible string;
- `boolean` -> checkbox/toggle;
- `enum` -> select/radio, value хранить как option id, label показывать пользователю.

Unsupported future types:

- не рендерить как editable field;
- показать disabled row с message “unsupported attribute type” только в seller UI, если такой тип появится.

### `cm/kg -> mm/g`

UI показывает:

- length/width/height в `cm`;
- weight в `kg`.

Backend variants payload требует:

- `length_mm`;
- `width_mm`;
- `height_mm`;
- `weight_grams`.

Conversion:

- `cm -> mm`: `Math.round(Number(value) * 10)`;
- `kg -> grams`: `Math.round(Number(value) * 1000)`;
- значения должны быть `> 0`;
- не менять delivery/payment logic.

### Stock quantity

UI:

- integer input `quantity_in_stock`;
- minimum `0`;
- желательно per variant, даже если сейчас чаще один variant.

Backend:

- после variant creation вызвать stock endpoint per variant id;
- `quantity_in_stock` обязателен в create-flow: UI и `fetchCreateProduct` не пропускают пустой stock step.

### Media first image

Iteration 7 (временный компромисс):

- использовать existing images order в `bulk_upload`;
- первый выбранный image должен оставаться первым в request;
- не ломать legacy cover helper.

Полноценная реализация main image, `sort_order` и sync в `ProductMedia` вынесена в отдельную задачу:

- `docs/tasks/024-product-catalog-modernization/iteration-7-7-seller-product-media-order-and-main-image.md`

### Documents

Iteration 7:

- использовать legacy `LicenseFile`;
- показывать ограничение “один документ”;
- валидация frontend должна соответствовать backend `LicenseFile` limitations;
- legacy `LicenseFile` write endpoint принимает PDF, JPG/JPEG и PNG по MIME;
- frontend validation разрешает JPG, JPEG, PNG, PDF и запрещает DOCX;
- не переходить на `ProductDocument`.

---

## Error Handling Plan

### Step-level errors

Каждый step должен иметь свое состояние:

- `idle`;
- `validating`;
- `saving`;
- `saved`;
- `failed`;
- `skipped`.

Ошибки хранить по step:

- `base_product`;
- `variants`;
- `stock`;
- `attributes`;
- `images`;
- `parameters`;
- `license`.

### Partial success после product create

Если `POST /api/sellers/products/` успешен, но secondary steps failed:

- не показывать “product creation failed”;
- показать “Товар создан, но часть данных не сохранилась”;
- показать `productId`;
- предложить:
  - retry failed steps;
  - open edit flow;
  - go to seller goods list.

Нельзя повторять `POST /api/sellers/products/` при retry secondary steps. Retry должен использовать existing `productId`.

### Пользовательское сообщение

Пример:

`Товар создан, но не удалось сохранить: stock, attributes. Проверьте поля и повторите сохранение этих шагов.`

### Как избежать дублей

- После успешного product create сохранить `createdProductId` в redux/local state.
- Если `createdProductId` есть, submit button не должен снова создавать base product.
- Retry должен вызывать только failed step handlers.
- Для license учитывать OneToOne: если previous attempt succeeded, retry не должен повторно создавать license.
- Для images/parameters, где endpoints additive, retry должен понимать, какие steps уже succeeded, иначе возможны дубли.

---

## Edit Flow Plan

### Must-have для create flow

- category schema loading после category selection;
- typed attributes UI;
- typed attributes validation;
- submit typed attributes после product create;
- stock step после variants create;
- dimensions conversion перед variants payload;
- partial success UI;
- retry failed secondary steps без duplicate product create.

### Must-have для edit compatibility

- existing edit form продолжает открывать старые товары;
- old `ProductParameter` отображается и сохраняется как раньше;
- existing images/license/variants edit не ломается;
- typed attributes load не блокирует edit legacy fields;
- если category отсутствует или schema не загружается, edit flow остается доступен для legacy fields.

### Nice-to-have для полноценного edit attributes/media/stock

- edit typed attributes через `GET/PUT /attributes/`;
- show current stock per variant, если API дает или добавить read helper в будущей итерации;
- update stock for existing variants;
- better media reorder UI;
- document replacement UX для legacy license;
- full ProductMedia/ProductDocument transition после отдельного backend write API решения.

---

## Test / QA Plan

### Build

```bash
npm --prefix Frontend/Frontend3 run build
```

### Existing Playwright smoke

```bash
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
```

### Frontend tests to add

Если в проекте есть подходящий unit/component test harness:

- API helper tests:
  - schema endpoint helper builds correct URL;
  - attributes payload mapping;
  - dimensions conversion;
  - partial success result aggregation.
- Component tests:
  - `SellerCategoryAttributesFields` renders `text/number/boolean/enum`;
  - required attributes show validation error;
  - enum options render labels and submit option id.

Если unit harness нет или нестабилен:

- добавить minimal Playwright smoke под seller route только при наличии stable auth/test users;
- иначе зафиксировать manual QA checklist.

### Manual browser checklist

1. Seller login.
2. Открыть `/seller/seller-create`.
3. Выбрать category и убедиться, что schema загружена.
4. Заполнить required typed attributes.
5. Добавить image; убедиться, что первый image остается первым.
6. Добавить price/variant.
7. Заполнить stock.
8. Заполнить dimensions в `cm/kg`; проверить в Network, что variants payload ушел в `mm/g`.
9. Добавить license, если файл валиден.
10. Создать товар.
11. Проверить seller goods list.
12. Открыть edit и убедиться, что legacy fields не потерялись.
13. Смоделировать failure secondary request и проверить partial success UI.

### Backend regression tests to repeat

```bash
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api -v 1
```

Не запускать и не исправлять `warehouses payment` failures, если они совпадают с documented follow-up из Iteration 5.5.

---

## Iteration Slicing

### 7A — API client helpers

- Добавить frontend API helpers для:
  - category schema;
  - product attributes get/put;
  - variant stock put.
- Добавить pure mapping helpers:
  - schema -> fields;
  - draft -> attributes payload;
  - `cm/kg -> mm/g`;
  - step result aggregation.

### 7B — Category schema UI

- Подключить schema loading после category selection.
- Добавить `SellerCategoryAttributesFields`.
- Отображать required/filterable/public metadata только как UI context, не менять backend schema.

### 7C — Typed attributes submit

- Добавить state для typed values.
- Валидировать required/type.
- Отправлять `PUT /attributes/` после product create.
- Edit flow: load existing attributes, но save можно оставить limited, если scope нужно удержать.

### 7D — Stock step

- Добавить stock input per variant.
- После `bulk_create variants` вызвать stock endpoint per backend variant.
- Показать error, если seller default warehouse отсутствует.

### 7E — Error handling

- Вынести submit orchestration.
- Ввести step-level results.
- Сделать partial success panel и retry failed steps.
- Убрать общий misleading toast для secondary failures.

### 7F — Edit compatibility

- Убедиться, что old products открываются.
- Подключить attributes read без блокировки legacy edit.
- Не ломать images/license/parameters/variants.

### 7G — Browser QA

- Build.
- Existing Playwright smoke.
- Manual seller create/edit checklist.
- Network evidence для product/variants/attributes/stock/images/license.

---

## Acceptance Criteria

- Seller create flow позволяет выбрать category и загрузить effective schema.
- Required typed attributes валидируются на клиенте и backend.
- `text`, `number`, `boolean`, `enum` controls работают.
- Typed attributes сохраняются через `PUT /api/sellers/products/{product_id}/attributes/`.
- Variant dimensions отправляются в backend как `mm/g`, UI остается `cm/kg`.
- Stock сохраняется через seller stock endpoint после создания variant.
- Product create не повторяется при retry secondary steps.
- Partial success показывается явно: пользователь понимает, что product создан, но отдельные steps failed.
- Legacy `ProductParameter` fallback не удален.
- Legacy `BaseProductImage` upload и first-image cover behavior не сломаны.
- Legacy `LicenseFile` OneToOne behavior сохранен.
- Edit flow открывает старые товары без typed attributes.
- Existing public API response shape не меняется.
- Frontend build проходит.
- Existing catalog regression smoke проходит.

---

## Risks / Known Limitations

- Legacy license endpoint ограничен `LicenseFile` OneToOne; множественные документы через `ProductDocument` не входят в Iteration 7.
- ProductMedia write API еще не используется seller frontend; media order/main остается legacy behavior через `BaseProductImage`.
- Full edit flow для typed attributes/media/stock может потребовать отдельный follow-up, если объем станет больше безопасной итерации.
- Old `ProductParameter` остается compatibility fallback и не удаляется.
- Stock read для edit может быть ограничен текущими responses; если API не дает полный current stock state для всех variants, в Iteration 7 можно сделать create must-have, а edit stock — nice-to-have.
- Secondary endpoints `parameters` и `images` additive; retry без step state может создать дубли.
- Existing create/edit forms содержат смешанные concerns; полная декомпозиция UI должна быть ограничена, чтобы не превратить Iteration 7 в redesign.
- Intermittent seller creation toast пока Low severity; исправлять нужно через partial success orchestration, а не через blind catch-all toast.

---

## Implementation Prompt

```text
Ты работаешь в репозитории /Users/pavel/Documents/Projects/reli.one.

Задача: выполнить Iteration 7 — Seller product create/edit wizard по плану:
docs/tasks/024-product-catalog-modernization/iteration-7-seller-product-wizard.md

ВАЖНО:
- Работай строго в scope Iteration 7.
- Не меняй backend models/migrations.
- Не меняй checkout/payment/delivery/order/reservation logic.
- Не меняй ProductVariant.sku generation.
- Не меняй seller stock endpoint.
- Не меняй public filters/facets backend.
- Не удаляй ProductParameter и legacy fallback.
- Не переключай seller frontend на ProductMedia/ProductDocument write API.
- Не делай full admin/moderation UI.
- Не делай import/enrichment.

Перед изменениями изучи:
- docs/tasks/024-product-catalog-modernization/task.md
- docs/tasks/024-product-catalog-modernization/implementation-task-breakdown.md
- docs/tasks/024-product-catalog-modernization/iteration-5-category-attributes.md
- docs/tasks/024-product-catalog-modernization/iteration-6-public-filters-facets-search.md
- docs/tasks/024-product-catalog-modernization/iteration-5-5-catalog-regression-smoke.md
- docs/tasks/024-product-catalog-modernization/iteration-7-seller-product-wizard.md
- Frontend/Frontend3/src/redux/createProdPrevSlice.js
- Frontend/Frontend3/src/redux/editGoodsSlice.js
- Frontend/Frontend3/src/api/seller/sellerProduct.js
- Frontend/Frontend3/src/api/seller/editProduct.js
- Frontend/Frontend3/src/Components/Seller/create/
- Frontend/Frontend3/src/Components/Seller/edit/
- backend/sellers/urls.py
- backend/sellers/views.py
- backend/sellers/serializers.py

Реализация:
1. Добавь frontend API helpers для:
   - GET /api/sellers/categories/{category_id}/attribute-schema/
   - GET /api/sellers/products/{product_id}/attributes/
   - PUT /api/sellers/products/{product_id}/attributes/
   - PUT /api/sellers/products/{product_id}/variants/{variant_id}/stock/
2. Добавь small helpers для:
   - schema -> UI fields;
   - typed attributes draft -> PUT payload;
   - cm/kg -> mm/g;
   - step-level submit result aggregation.
3. Подключи schema loading после выбора category в create flow.
4. Добавь typed attributes UI для text/number/boolean/enum.
5. Добавь stock step per variant.
6. Обнови create submit orchestration:
   - сначала POST product;
   - затем variants;
   - затем stock;
   - затем typed attributes;
   - затем images/parameters/license;
   - не повторяй POST product при retry secondary failures.
7. Сделай partial success UI:
   - если product создан, но secondary step failed, показать product id и failed steps;
   - дать retry failed steps или перейти в edit/goods list;
   - не показывать misleading “product creation failed” для secondary failures.
8. Edit flow:
   - должен открывать old products без typed attributes;
   - load attributes, если category есть;
   - не ломать existing images/license/parameters/variants edit.
9. Не меняй public API response shape.

Проверки:
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api -v 1
git diff --check

Не запускать и не исправлять warehouses/payment failures, если они совпадают с documented follow-up из Iteration 5.5.

Финальный ответ:
- какие frontend files изменены;
- какие API helpers/components/state добавлены;
- как решен partial success;
- какие проверки прошли;
- что НЕ менялось;
- рекомендуемый commit message.
```

---

## Read-only Review Prompt

```text
Ты работаешь в репозитории /Users/pavel/Documents/Projects/reli.one.

Проведи read-only review реализации Iteration 7 — Seller product create/edit wizard.

Документ плана:
docs/tasks/024-product-catalog-modernization/iteration-7-seller-product-wizard.md

Режим:
- Read-only review: не вноси изменения.
- Сначала findings, потом вопросы/риски, потом краткий summary.
- Проверяй только scope Iteration 7.

Scope constraints:
- Backend models/migrations не должны быть изменены.
- Checkout/payment/delivery/order/reservation logic не должны быть изменены.
- ProductVariant.sku generation не должен быть изменен.
- Seller stock endpoint не должен быть изменен.
- Public filters/facets backend не должен быть изменен.
- ProductParameter legacy fallback не должен быть удален.
- Seller frontend не должен быть полностью переключен на ProductMedia/ProductDocument write API.
- Existing public API response shape не должен измениться.

Что проверить:
1. Category schema:
   - schema грузится после category selection;
   - required/type validation работает;
   - category change не оставляет invalid stale typed values.
2. Typed attributes:
   - text/number/boolean/enum controls корректны;
   - PUT /api/sellers/products/{product_id}/attributes/ payload соответствует backend contract;
   - enum отправляет option id.
3. Dimensions:
   - UI остается cm/kg;
   - variants payload отправляет length_mm/width_mm/height_mm/weight_grams;
   - значения positive и округляются безопасно.
4. Stock:
   - stock вызывается после создания backend variants;
   - retry stock не создает новый product;
   - отсутствие default warehouse показано как step-level error.
5. Submit orchestration:
   - POST product не повторяется при retry secondary failures;
   - partial success явно показан пользователю;
   - failed secondary steps можно отличить от base product failure;
   - additive endpoints не создают дубли при retry.
6. Legacy compatibility:
   - BaseProductImage/images behavior сохранен;
   - первый image остается legacy cover;
   - LicenseFile OneToOne limitation учтена;
   - ProductParameter остается;
   - edit old products без typed attributes работает.
7. Tests/QA:
   - frontend build;
   - existing Playwright smoke;
   - backend regression smoke/category attributes/seller stock tests;
   - manual QA checklist evidence, если автоматизация ограничена.

Команды для проверки:
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api -v 1
git diff --check

Не запускать и не исправлять warehouses/payment failures, если они совпадают с documented follow-up из Iteration 5.5.
```
