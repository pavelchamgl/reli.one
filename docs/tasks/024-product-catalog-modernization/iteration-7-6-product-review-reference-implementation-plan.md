# Iteration 7.6 — Product Review Reference Implementation Plan

## Цель

Изучить reference-проект `docs/design-references/v0-product-review/` и подготовить план приведения seller product review/preview pages к согласованной визуальной структуре Product Review.

Reference используется только как визуальный и структурный ориентир для контентной части страницы. Не переносим Next.js app router, Tailwind-конфигурацию, header/sidebar/footer, зависимости и placeholder assets как архитектуру основного приложения.

## Reference-Файлы

- `docs/design-references/v0-product-review/README.md`
- `docs/design-references/v0-product-review/app/page.tsx`
- `docs/design-references/v0-product-review/app/globals.css`
- `docs/design-references/v0-product-review/components/seller/ProductReviewPage.tsx`
- `docs/design-references/v0-product-review/components/seller/ProductGallery.tsx`
- `docs/design-references/v0-product-review/components/seller/ProductInfo.tsx`
- `docs/design-references/v0-product-review/components/seller/ProductTabs.tsx`
- `docs/design-references/v0-product-review/components/seller/PreviewBanner.tsx`
- `docs/design-references/v0-product-review/components/seller/ReviewActions.tsx`
- `docs/design-references/v0-product-review/components/ui/button.tsx`

## Что Использовать Из Reference

Используем:

- общую композицию центральной content area;
- preview banner;
- two-column product layout;
- sticky gallery на desktop;
- product info block;
- variant selector/read-only pills;
- stock badges;
- delivery block;
- tabs/description structure;
- tables для characteristics / additional seller details / documents;
- review actions: back + submit for moderation;
- пропорции, отступы и визуальную логику контента.

Не используем:

- header из reference;
- footer из reference;
- sidebar/navigation из reference;
- Next.js app router;
- Tailwind/shadcn setup как зависимость;
- remote logo/assets из reference;
- mock data;
- package/config files reference-проекта.

## Визуальная Структура Product Review

### 1. Existing Seller Layout Shell

Внешний layout должен оставаться из текущего Reli.one frontend. Reference header не переносится.

Текущие страницы:

- `/seller/seller-preview`
- `/seller/seller-preview/:id`
- `/seller/edit-preview/:id`

должны использовать существующую seller-навигацию и общий layout приложения.

### 2. Preview Banner

Верхний информационный блок:

- предупреждает, что это preview/review перед модерацией;
- объясняет, что товар будет выглядеть так после approval;
- показывает статус draft/preview.

Нужен новый компонент или отдельный блок внутри seller preview.

### 3. Breadcrumb

Reference показывает путь формата:

```text
Home / Entrance Doors / Door Metal
```

Для seller preview breadcrumb можно сделать локальным внутри content area. Не менять глобальный routing или nav.

### 4. Main Product Area

Desktop-структура:

```text
[ Product gallery / sticky left ] [ Product info + characteristics + actions / right ]
```

Mobile-структура:

```text
Preview banner
Gallery
Product info
Characteristics / seller details / documents
Actions
```

### 5. Product Gallery

Функции:

- main image;
- thumbnails;
- active image;
- previous/next controls;
- image counter или активная рамка.

### 6. Product Info Block

Функции:

- rating readonly;
- product name;
- category;
- price;
- without VAT;
- variant selector;
- stock label;
- disabled add-to-cart / preview-only button;
- delivery block.

Важно: seller preview не должен запускать basket/checkout behavior.

### 7. Variants / Stock Badges

Reference показывает варианты как selectable pills/cards:

- variant label;
- price;
- stock status;
- selected state.

Для seller preview selection должен быть локальным UI-state без URL/basket side effects.

### 8. Description / Tabs

Reference содержит tab-like блок:

- Description;
- Reviews или Characteristics/Documents в отдельной реализации.

В seller preview можно сохранить product-detail ощущение, но reviews должны быть read-only/disabled либо скрыты, если нет смысла.

### 9. Characteristics / Seller Details / Documents

Reference содержит таблицы:

- Parameters / Characteristics;
- Additional Seller Details;
- Documents.

Для нашей модели это естественная зона для:

- typed category attributes;
- legacy `product_parameters`;
- `additional_details`;
- `country_of_origin`;
- `warranty_months`;
- `barcode`;
- `article`;
- `is_age_restricted`;
- package dimensions per variant;
- license/document link.

### 10. Review Actions

Actions:

- Back to editing;
- Submit for moderation;
- loading state;
- done/error state.

Текущая orchestration create/edit должна сохраниться.

## Сопоставление Существующей Архитектуры Frontend

| Reference block | Current frontend | Reuse | Комментарий |
|---|---|---:|---|
| Page shell | Seller pages/layout | Частично | Header/sidebar/footer reference не переносить |
| Preview banner | Нет отдельного аналога | Нет | Создать seller preview banner |
| Breadcrumb | `CustomBreadcrumbs`, local seller nav | Частично | Для preview лучше local breadcrumb |
| Gallery | `ProductImages.jsx` | Частично | Сейчас завязан на `state.products.product` |
| Product info | `ProductNameRate.jsx` | Частично | Содержит basket/add-to-cart side effects |
| Variant selector | `ProdCharackButtons.jsx` | Частично | Нужно read-only поведение |
| Stock badge | `StockBadge.jsx` | Да | Можно переиспользовать |
| Delivery block | `ProductNameRate.jsx` markup/assets | Частично | Взять визуальный блок без checkout logic |
| Description | `ProductCharak.jsx` | Частично | Сейчас читает Redux public product |
| Parameters | `ProductCharak.jsx` | Частично | Можно повторить table style |
| Seller details | `SellerReviewSummary.jsx` | Частично | Данные полезны, layout нужно изменить |
| Documents | `ProductCharak.jsx`, license UI | Частично | Нужен read-only document row |
| Actions | `SellerPreviewPage.jsx`, `SellerEditPreview.jsx` | Да | Сохранить submit/retry flow |

## Что Уже Можно Переиспользовать

Компоненты/утилиты:

- `Frontend/Frontend3/src/Components/Product/StockBadge/StockBadge.jsx`
- `Frontend/Frontend3/src/Components/Product/ProductTab/ProductTab.jsx` при необходимости
- `Frontend/Frontend3/src/Components/Product/productAdditionalDetails/ProductAdditionalDetails.jsx` при совпадении UX
- delivery icon/assets из `ProductNameRate`
- existing seller preview button area из `SellerPreviewPage.jsx` / `SellerEditPreview.jsx`
- helpers из `Frontend/Frontend3/src/utils/sellerProductWizard.js`:
  - `buildSellerReviewData`;
  - `unwrapProductPreviewResponse`;
  - `formatApiErrorMessage`;
  - VAT formatting;
  - package dimensions conversion/mapping;
  - license mapping.

Компоненты, которые нельзя брать напрямую без refactor:

- `ProductImages.jsx` — читает public product из Redux;
- `ProductNameRate.jsx` — содержит add-to-basket, modal и buyer behavior;
- `ProductCharak.jsx` — читает public product из Redux.

## Какие Новые Компоненты Потребуются

Рекомендуемый минимальный набор:

### `SellerReviewProductLayout`

Корневой layout content area.

Отвечает за:

- preview banner;
- breadcrumb;
- two-column layout;
- responsive order;
- actions slot.

### `SellerReviewGallery`

Prop-driven gallery.

Принимает:

```ts
images: Array<{ id?: string | number; src: string; alt?: string }>
```

Не содержит upload/edit logic.

### `SellerReviewProductInfo`

Read-only product info panel.

Показывает:

- rating;
- name;
- category;
- price;
- without VAT;
- variants;
- stock;
- disabled preview-only CTA;
- delivery.

Не содержит `addToBasket`, `BasketModal`, checkout/payment logic.

### `SellerReviewVariantSelector`

Локальный selector вариантов.

Показывает:

- variant value;
- price;
- stock status;
- selected state.

### `SellerReviewDetailsSections`

Секции ниже product info:

- Description;
- Parameters / Category Attributes;
- Additional Seller Details;
- Package Dimensions For Delivery;
- Documents.

### `SellerReviewActions`

Визуальная оболочка над текущими действиями:

- back/cancel;
- submit for moderation;
- loading state;
- disabled state для missing required typed attributes.

## API И Данные

### Public Product Detail

```text
GET /api/products/{productId}/
```

Используется для product-like preview по id.

Доступные данные:

- `id`;
- `name`;
- `product_description`;
- `additional_details`;
- `category_name`;
- `product_parameters`;
- `rating`;
- `total_reviews`;
- `license_file`;
- `images`;
- `variants`;
- `seller_id`;
- `is_age_restricted`;
- `country_of_origin`;
- `warranty_months`.

Ограничение: public variants могут не содержать package dimensions.

### Seller Product Detail

```text
GET /api/sellers/products/{productId}/
```

Доступные seller/moderation данные:

- `barcode`;
- `article`;
- `vat_rate`;
- `license_file`;
- `variants[].sku`;
- `variants[].weight_grams`;
- `variants[].width_mm`;
- `variants[].height_mm`;
- `variants[].length_mm`;
- `status`;
- `rejected_reason`;
- `country_of_origin`;
- `warranty_months`.

### Seller Typed Attributes

```text
GET /api/sellers/products/{productId}/attributes/
```

Данные:

- `attribute_definition`;
- `code`;
- `data_type`;
- `value_text`;
- `value_number`;
- `value_boolean`;
- `value_option`.

### Category Attribute Schema

```text
GET /api/sellers/categories/{categoryId}/attribute-schema/
```

Нужен для create/edit draft preview и required/missing validation.

### Create Flow State

Redux state:

- `create_prev`

Содержит:

- base product fields;
- images;
- variants;
- stock quantity;
- package dimensions;
- typed attributes;
- license;
- partial success state.

### Edit Flow State

Redux state:

- `edit_goods`

Содержит:

- loaded seller product;
- variants;
- package dimensions;
- typed attributes;
- license;
- additional seller details.

## Data Adapter

Нужен единый normalized shape для review UI:

```ts
{
  id,
  productName,
  categoryName,
  description,
  additionalDetailsText,
  rating,
  totalReviews,
  price,
  priceWithoutVat,
  vatRate,
  images,
  variants,
  categoryAttributes,
  productParameters,
  documents,
  sellerDetails,
  hasMissingRequiredAttributes
}
```

Variant shape:

```ts
{
  id,
  axis,
  value,
  price,
  priceWithoutVat,
  stock,
  stockStatus,
  sku,
  packageDimensions: {
    length,
    width,
    height,
    weight
  }
}
```

## Implementation Plan

### Step 0 — Разделить Независимые Изменения

Перед началом implementation проверить:

```bash
git status --short
```

Если в working tree есть bugfix вроде normalizing API errors, его нужно коммитить отдельно от layout/reference work.

### Step 1 — Подготовить Review Data Adapter

Обновить `sellerProductWizard.js`, если нужно:

- сохранить null-safety;
- сохранить `unwrapProductPreviewResponse`;
- расширить mapping для public/seller/create/edit sources;
- гарантировать стабильный shape для images, variants, seller details, documents.

### Step 2 — Создать Product Review Content Components

Создать components в seller preview зоне:

```text
Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/
```

Минимальный набор:

- `SellerReviewProductLayout.jsx`
- `SellerReviewProductLayout.module.scss`
- `SellerReviewGallery.jsx`
- `SellerReviewProductInfo.jsx`
- `SellerReviewDetailsSections.jsx`
- `SellerReviewActions.jsx`

Если команда решит не плодить файлы, допустимо сгруппировать несколько небольших компонентов в одном файле, но структура должна остаться читаемой.

### Step 3 — Реализовать Visual Shell По Reference

Desktop:

- max-width content area;
- preview banner сверху;
- breadcrumb;
- grid: gallery left, info/details right;
- gallery sticky на desktop;
- actions снизу.

Mobile:

- single column;
- gallery перед info;
- actions доступны после review content.

### Step 4 — Перенести Product Info Логику В Read-Only Mode

Реализовать:

- rating readonly;
- name/category;
- price/without VAT;
- local selected variant;
- variant buttons;
- stock badge;
- disabled add-to-cart / preview-only;
- delivery block.

Запрещено:

- dispatch `addToBasket`;
- открывать `BasketModal`;
- делать checkout/payment requests.

### Step 5 — Реализовать Details Sections

Секции:

1. Description
2. Parameters / Category Attributes
3. Additional Seller Details
4. Package Dimensions For Delivery
5. Documents

Порядок можно адаптировать под reference, но seller-only данные должны быть легко проверяемыми.

### Step 6 — Подключить Страницы

Обновить:

- `SellerPreviewPage.jsx`
- `SellerEditPreview.jsx`
- `SellerPreviewDesktop.jsx`
- `SellerPreviewMobile.jsx`

Сохранить:

- create preview submit;
- edit preview submit;
- missing required typed attributes warning;
- partial success/retry panel;
- `/seller/seller-preview/:id` loading/error states.

### Step 7 — Tests

Обновить:

```text
Frontend/Frontend3/src/redux/sellerProductWizardSlices.test.js
```

Покрыть:

- null-safe adapter;
- Axios response unwrap `{ data: product }`;
- public product response mapping;
- seller product response mapping;
- image mapping;
- variants mapping;
- stock mapping;
- package dimensions mapping;
- country/warranty/barcode/article/age mapping;
- license string/object mapping;
- missing required typed attributes warning.

При наличии удобного test setup добавить render-level test для seller review layout.

### Step 8 — Проверки

Запустить:

```bash
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api sellers.test_product_additional_details_api -v 1
git diff --check
```

## Out Of Scope

Не делать:

- backend changes;
- migrations;
- API contract changes;
- checkout/payment/delivery/order/reservation changes;
- seller stock endpoint changes;
- public filters/facets/search changes;
- ProductDocument write-flow;
- Brand API/UI;
- real add-to-cart from seller preview;
- moderation backend workflow changes;
- перенос Next.js/Tailwind architecture из reference.

## Acceptance Criteria

- Seller review page визуально основана на Product Review reference и близка к `/product/:id`.
- Header/sidebar/footer не взяты из reference.
- Product gallery работает с реальными images.
- Product info показывает реальные name/category/rating/price/VAT.
- Variants отображаются read-only и переключаются локально.
- Stock badge отображается.
- Add to cart disabled/preview-only и не вызывает basket/checkout.
- Delivery block отображается как в product detail/reference.
- Description отображается.
- Category attributes и legacy parameters отображаются в таблице.
- Additional seller details отображаются.
- Package dimensions отображаются per variant.
- Documents/license отображаются.
- Required typed attributes warning сохранён.
- Partial success/retry flow сохранён.
- `/seller/seller-preview/:id` корректно unwraps Axios response.
- `/seller/edit-preview/:id` не теряет edit data.
- Нет backend/model/migration changes.

## Manual QA Checklist

1. Открыть `/product/247` и использовать как baseline.
2. Открыть `/seller/seller-preview/247`.
3. Открыть `/seller/edit-preview/247`.
4. Сравнить верхнюю visual structure:
   - gallery;
   - info;
   - variants;
   - price;
   - delivery.
5. Проверить seller-only поля:
   - VAT;
   - SKU;
   - stock;
   - package dimensions;
   - country;
   - warranty;
   - barcode;
   - article;
   - age restricted.
6. Проверить typed attributes.
7. Проверить documents/license.
8. Проверить, что Add to cart disabled/preview-only.
9. Проверить Network: нет basket/checkout/payment requests.
10. Проверить create preview partial success/retry.
11. Проверить mobile viewport.

## Risks

- Прямое переиспользование `ProductNameRate` может случайно включить basket behavior.
- Прямое переиспользование `ProductImages`/`ProductCharak` может быть неудобным из-за Redux-зависимости.
- Public product response и seller product response имеют разные shape для `license_file`, variants и package dimensions.
- Id-preview может получить Axios response object вместо `response.data`, это уже нужно защищать adapter-тестами.
- Seller preview может снова разойтись с public product detail, если не выделить prop-driven visual layer.

## Реализовано В Iteration 7.6

- Создан prop-driven presentation layer `SellerReviewProductLayout` без зависимости от public product Redux state.
- Выровнен layout под v0 reference screenshot:
  - preview banner с жёлтой точкой, текстом `Preview mode.` и pill `DRAFT` (без Eye icon);
  - breadcrumb `HOME / CATEGORY / PRODUCT NAME` без `Seller goods`;
  - gallery ~610px, square stage, circular arrows, thumbnails ~90px, active black border;
  - product info order: rating → name → category → price → without VAT → variant cards → stock badge → disabled `Add to cart` → delivery;
  - details: tabs Description/Reviews, accordion Additional details, black-header striped tables;
  - Additional Seller Details в фиксированном порядке без Moderation status;
  - documents как sentence-link `You can read the certificate here`;
  - package dimensions в отдельной black-header секции per variant.
- Добавлены блоки:
  - preview banner;
  - local breadcrumb;
  - desktop two-column layout;
  - sticky gallery на desktop;
  - product info с rating/name/category/price/VAT;
  - read-only variant selector;
  - stock badge;
  - disabled preview-only add-to-cart button;
  - delivery preview block;
  - description;
  - parameters/category attributes table;
  - variants/stock/package dimensions cards;
  - documents/license block;
  - additional seller details table;
  - review actions slot.
- `SellerPreviewPage.jsx` и `SellerEditPreview.jsx` сохраняют существующие handlers и передают actions как slot.
- `/seller/seller-preview/:id` сохраняет loading/error-safe поведение и unwrap `{ data: product }`.
- Create partial success/retry panel сохранён отдельно от product review layout.

## Созданные/Изменённые Компоненты

- `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductLayout.jsx`
- `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewGallery.jsx`
- `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductInfo.jsx`
- `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewDetailsSections.jsx`
- `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewActions.jsx`
- `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductLayout.module.scss`
- `SellerReviewSummary.jsx` теперь является thin wrapper над normalized review data и новым layout.

## Adapter Notes

- `buildSellerReviewData()` остаётся null-safe.
- `unwrapProductPreviewResponse()` сохраняет контракт `response.data || response`.
- Поддержаны create draft, edit draft, public product response и seller product response.
- Добавлены/сохранены mapping:
  - images with alt;
  - variants;
  - price / `price_without_vat`;
  - calculated price without VAT fallback;
  - `stock`, `stockStatus`;
  - package dimensions from kg/cm draft fields and mm/g API fields;
  - `country_of_origin`, `warranty_months`, `barcode`, `article`, age flag;
  - `license_file` as string/object/array;
  - typed attributes from schema+values or response rows.

## Verification Results

Выполнено:

```bash
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api sellers.test_product_additional_details_api -v 1
```

Результат: все команды прошли; `npm run build` показывает существующие Sass deprecation/chunk size warnings.

Follow-up review fix: `stock=0` отображается как валидное значение в product info, а submit action disabled во время pending/loading для защиты от повторного клика.

Iteration 7.6 visual alignment (2026-06-16): seller preview layout приведён к v0 reference — variant cards со stock status, black-header tables, preview banner/breadcrumb, read-only `Add to cart`, render-regression tests в `sellerProductWizardSlices.test.js`.

## Layout And Typography Guardrails (Seller Product Review)

Зафиксировать как обязательные правила для seller preview / product-detail-like экранов. При обнаружении расхождений исправлять сразу, не оставлять как cosmetic follow-up.

### Horizontal spacing

- Контент review area: `max-width: 1440px`, центрирование `margin-inline: auto`.
- Дополнительные боковые отступы внутри layout: `padding-inline: clamp(16px, 2.5%, 54px)` на `SellerReviewProductLayout`.
- Seller shell (`SellerPageContainer`): desktop `102px`, tablet `51px`, mobile `14px`.
- Product grid: fluid `2.2fr / 2.8fr` (44% gallery / 56% info), gallery cap `max-width: 616px`, mobile `< 900px` — одна колонка.

### Numeric typography (anti «плавающие цифры»)

Проблема: пропорциональные цифры (`oldstyle figures`) и смешение `var(--ft)` с body-font дают разный baseline у цен, VAT, stock и значений в таблицах.

Обязательно для **всего** `SellerReviewProductLayout` (mixin на `.main`) и всех дочерних полей: цены, VAT, stock, variant cards, таблицы, listing info, package dimensions, actions.

```scss
font-family: var(--ft);
font-variant-numeric: lining-nums tabular-nums;
font-feature-settings: "lnum" 1, "tnum" 1;
line-height: 1.2;
```

В `SellerReviewProductLayout.module.scss` mixin `stableNumericText` применён к корню `.main`; длинные prose-блоки (`descriptionText`, `additionalDetailsContent`, `bannerText`, `breadcrumb`) используют `line-height: 1.5–1.55` поверх наследуемых цифр.

Не смешивать на одной строке цены разные `line-height` (например `115%` vs `140%`) без необходимости.

### QA checklist при review UI

1. Цена и `Excl. VAT` визуально на одной вертикальной сетке, цифры не «прыгают» по высоте.
2. При смене variant price/VAT цифры не смещают соседний текст по вертикали.
3. Боковые поля на desktop не прилипают к краю shell.
4. Gallery не раздувается шире ~616px на ultrawide.

## Known Follow-ups

- Вынести seller-preview labels в i18n.
- Добавить e2e assertion, что seller preview routes не вызывают basket/checkout/payment requests.
- При появлении seller `ProductDocument` API расширить documents block без замены legacy `LicenseFile`.

## Recommended Commit Message

```text
refactor: align seller product review with reference layout
```
