# Iteration 7.4 — Seller Product Review Page Alignment

> Note: Iteration 7.5 (pixel parity pass) completed as a follow-up to 7.4.

## Проблема

Текущие страницы seller preview (`/seller/seller-preview`, `/seller/seller-preview/:id`, `/seller/edit-preview/:id`) рендерились как отдельная summary-форма, визуально и структурно заметно отличающаяся от публичной страницы товара (`/product/:id`).

Из-за этого:
- продавцу сложнее сверять финальный вид карточки перед модерацией;
- review-экран не отражает привычную иерархию блоков product detail (gallery/info/variants/delivery/description/parameters);
- часть seller-only данных не была встроена в понятный product-detail контекст.

## Цель (Product Detail Parity)

Сделать seller preview read-only экраном на основе визуальной структуры публичной product detail page, не меняя бизнес-поведение публичной страницы и не включая basket/checkout мутации.

## Затронутые страницы

- `/seller/seller-preview` (create preview);
- `/seller/seller-preview/:id` (preview существующего товара по id);
- `/seller/edit-preview/:id` (preview перед edit submit).

## Какие данные используются

- create draft state: `create_prev`;
- edit draft state: `edit_goods`;
- public/seller product detail response для id-preview;
- category typed attributes schema + values;
- legacy `product_parameters`;
- variants (`variantsMain`, `variantsServ`, `variants`);
- license/document (`license_file`) как string/object/array;
- images (`image_url`, `image`, `base64`, data URL).

Для `/seller/seller-preview/:id` response от `getProductById(id)` обязательно разворачивается через `response.data` (без изменения API helper-контракта).

## Seller-only поля поверх product detail

- VAT rate;
- system SKU по каждому variant;
- stock quantity по variant (с fallback `Stock not loaded`, если quantity отсутствует);
- package dimensions per variant (`length/width/height/weight`);
- `country_of_origin`;
- `warranty_months`;
- `barcode` (EAN/UPC);
- seller article (`item`/`article`);
- `is_age_restricted`;
- moderation status/info, если поле доступно в response/state.

## Scope

- read-only product-detail visual shell для seller preview;
- адаптер/нормализация review data для create/edit/detail источников;
- сохранение null/loading/error-safe состояний;
- сохранение guard для missing required typed attributes;
- сохранение partial success/retry панели на create preview;
- добавление/обновление тестов для маппинга и guard-логики;
- обновление task-документации.

## Out of Scope

- backend/models/migrations/serializers/API contracts;
- checkout/payment/delivery/order/reservation бизнес-изменения;
- seller stock endpoint;
- public filters/facets/search;
- SKU generation;
- ProductDocument/Brand API;
- редизайн публичной `/product/:id`.

## Acceptance Criteria

1. Seller preview визуально следует базовой структуре product detail:
   - галерея слева, info справа;
   - name/category/rating readonly;
   - price + without VAT;
   - variant selector (read-only pills);
   - stock badge/text и disabled preview-only action;
   - delivery visual block;
   - description;
   - parameters/category attributes;
   - license/document link.
2. Seller-only поля присутствуют и отображаются корректно.
3. `add-to-cart`/basket/checkout логика не активируется из seller preview.
4. `/seller/seller-preview/:id` корректно работает с Axios response shape `{ data: product }`.
5. Required typed attributes guard сохраняется.
6. Partial success/retry для create preview сохраняется.
7. Для id-preview/edit-preview submit controls не запускают create flow.

## Manual QA Checklist

1. Открыть `/product/247` и зафиксировать baseline.
2. Открыть `/seller/seller-preview/247`.
3. Открыть `/seller/edit-preview/247`.
4. Сравнить верхний visual shell: gallery, info, variants, price, delivery.
5. Проверить seller-only поля.
6. Проверить, что Add to cart отключен/preview-only.
7. Проверить, что нет basket/checkout requests.
8. Проверить, что create preview partial success/retry не сломан.
9. Проверить, что edit preview не теряет данные.
10. Проверить fallback `Stock not loaded` там, где stock не пришел.

## Команды проверки

```bash
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api sellers.test_product_additional_details_api -v 1
git diff --check
```

## Known Follow-ups

- ✅ Done in 7.5 — aligned upper shell via CSS only (gap, typography, button height). Shared component layer remains a future option if further drift occurs.
- Вынести seller-preview i18n-строки (часть label пока англоязычная).
- Добавить e2e smoke для проверки отсутствия basket/checkout запросов именно на seller preview route.

## Iteration 7.5 — Pixel Parity Pass

### Changes
- SellerReviewSummary.module.scss upper shell aligned to ProductNameRate:
  - .previewArea gap: clamp(40px, 20vw, 60px)
  - .productInfo h2 font-size: 24px (fixed)
  - .category: 16px, uppercase, letter-spacing 0.06em
  - .ratingDiv p: 20px, uppercase, letter-spacing 0.05em
  - .disabledCartButton height: 55px
- Seller-only sections (summaryGrid, variantCard, packageBlock) unchanged.
- No JSX changes.

### Remaining Follow-ups
- Seller preview i18n: labels are still English-only.
- E2e smoke: no automated test verifying absence of basket/checkout network requests on seller preview routes.
