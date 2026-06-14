# Iteration 7.4 — Seller Product Review Page Alignment

## Цель

Привести seller product review/preview page к финальной структуре create/edit формы и сделать её удобной read-only проверкой перед отправкой товара на модерацию.

UX-подход: `product detail preview + seller summary`. Страница не является копией формы с input-полями и не запускает checkout/add-to-cart behavior.

## Scope

В этой итерации меняется только frontend seller preview/review:

- product detail preview area для визуальной проверки товара;
- read-only summary sections в порядке финальной формы;
- display helpers для review data из create/edit state;
- warning/guard для missing required typed attributes;
- loading/error-safe режим для `/seller/seller-preview/:id`;
- explicit stock fallback для edit/detail preview, если stock quantity не загружен;
- focused frontend tests;
- task-документ.

Backend, public product detail, checkout/payment/delivery/order/reservation, stock endpoint, public filters/facets/search, SKU generation и API contracts не меняются.

## Финальная структура review page

1. `Product detail preview area`
   - product images;
   - product name;
   - category name;
   - variants;
   - price;
   - disabled preview-only button instead of active add-to-cart;
   - description.

2. `Main Information`
   - Category;
   - Product name.

3. `Media Files`
   - main image;
   - additional images;
   - empty state if no images.

4. `Description`
   - `product_description`.

5. `Category Attributes`
   - typed attributes from `CategoryAttributeDefinition`;
   - text, number, boolean, enum label/value;
   - legacy `ProductParameter` compatibility rows;
   - warning if required typed attribute is missing.

6. `Variants, Price And Stock`
   - common VAT rate;
   - per variant: axis/name, value, sale price, stock quantity, system SKU if available.

7. `Package Dimensions For Delivery`
   - shown inside each variant card;
   - package length cm;
   - package width cm;
   - package height cm;
   - package weight kg;
   - not physical product dimensions.

8. `Documents`
   - legacy license/certificate file name/status;
   - partial success failed upload is still shown by existing partial success panel.

9. `Additional Seller Details`
   - `additional_details`;
   - `country_of_origin`;
   - `warranty_months`;
   - EAN/UPC barcode;
   - Seller article;
   - Age restricted.

## Mapping Fields → Source State / API

- Product name: `create_prev.name` / `edit_goods.name`.
- Category: `category.name`, `category_name`.
- Images: `images[].image_url`, `images[].image`, `images[].base64`.
- Existing product preview by id unwraps the existing `getProductById` Axios response in frontend review adapter; the shared API helper contract is unchanged.
- Description: `product_description`.
- Typed attributes: `attributeSchema.attributes` + `attributeValues`.
- Legacy parameters: `product_parameters` / `parameters`.
- Variants: `variantsMain` / `variantsServ` / `variants`.
- VAT: `vat_rate`, displayed with frontend formatting so `"0.00"` becomes `"0"`.
- Stock: `variant.quantity_in_stock` when present.
- Stock fallback: если seller edit/detail state не содержит quantity, review показывает `Stock not loaded`, а не обычное пустое значение.
- SKU: `variant.sku` when present after create/edit detail.
- Package dimensions:
  - create: `length`, `width`, `height`, `weight`;
  - edit: `package_length_cm`, `package_width_cm`, `package_height_cm`, `package_weight_kg`;
  - API detail fallback: `length_mm`, `width_mm`, `height_mm`, `weight_grams`.
- Documents: `license_file`.
- Additional seller details: `additional_details`, `country_of_origin`, `warranty_months`, `barcode`, `item/article`, `is_age/is_age_restricted`.

## Что не входит в задачу

- backend models/migrations/serializers/API changes;
- public product detail behavior changes;
- checkout/add-to-cart behavior in seller preview;
- seller stock endpoint changes;
- public filters/facets/search changes;
- ProductDocument write-flow;
- Brand API/UI;
- video upload;
- full seller area redesign.

## Partial Success / Retry Constraints

- Existing partial success panel remains on create preview page.
- If base product was created but secondary steps failed, product id stays visible.
- `Retry failed steps` must call existing retry flow and must not duplicate product create.
- Review page does not hide failed steps; it only displays the current read-only summary.

## Manual QA Checklist

1. Create product and open preview.
2. Open `/seller/seller-preview/:id` for existing product and verify preview loads real product detail without empty-state crash.
3. Verify preview area shows images, name, category, variants, price and disabled preview-only button.
4. Verify sections follow final form order.
5. Verify typed text/number/boolean/enum attributes display readable values.
6. Verify legacy parameters still display.
7. Verify VAT `0.00` displays as `0`.
8. Verify create draft stock shows entered `quantity_in_stock`.
9. Verify edit/detail preview without stock quantity shows `Stock not loaded`.
10. Verify package dimensions are inside variant cards and named as delivery package dimensions.
11. Verify license/certificate file appears in Documents.
12. Verify Additional Seller Details shows `additional_details`, country, warranty, barcode, article and age restricted.
13. Trigger partial success and verify product id + retry controls remain visible.
14. Verify public product detail page behavior is unchanged.

## Verification Commands

```bash
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api sellers.test_product_additional_details_api -v 1
git diff --check
```

## Known Follow-Ups

- Public-detail-level visual parity can be improved later after seller/public component boundaries are cleaner.
- Review tabs can be expanded later if seller moderation requires richer audit sections.
- Full browser QA for failed secondary upload retry remains a manual scenario unless stable fixtures are added.
