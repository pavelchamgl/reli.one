# Iteration 7.3 — Additional Seller Details Persistence And File Validation

## Цель

Закрыть маленькие UX/API gaps после Iteration 7.2:

- добавить честное backend-сохранение `Country of origin` и `Warranty`;
- подключить эти поля в seller create/edit form;
- валидировать product images сразу при выборе файлов;
- показывать backend VAT `"0.00"` как `"0"` в UI, не меняя `DecimalField` и API output.

## Scope

В этой итерации меняются только:

- `BaseProduct.country_of_origin`;
- `BaseProduct.warranty_months`;
- seller create/update/detail serializers;
- public product detail serializer, чтобы detail мог показать новые поля;
- минимальный Django admin для новых полей;
- seller create/edit frontend form и focused helpers/tests;
- frontend validation для legacy product image upload;
- task-документ и focused regression tests.

## Backend Fields

- `country_of_origin`: optional text field, `blank=True`, default `""`.
- `warranty_months`: optional positive integer field, `null=True`, `blank=True`.

Правило для `warranty_months`:

- пустое значение хранится как `null`;
- если значение указано, оно должно быть positive integer `> 0`;
- произвольный текст warranty не хранится.

`ProductVariant` не меняется. Package dimensions остаются legacy fields варианта: `weight_grams`, `length_mm`, `width_mm`, `height_mm`.

## Frontend Field Order

В accordion `Additional seller details` порядок полей:

1. `additional_details`
2. `Country of origin`
3. `Warranty, months`
4. `EAN/UPC barcode`
5. `Seller article`
6. `Age restricted`

Mapping:

- `Country of origin` → `BaseProduct.country_of_origin`;
- `Warranty, months` → `BaseProduct.warranty_months`;
- `Additional details` → `BaseProduct.additional_details`;
- `EAN/UPC barcode` → `BaseProduct.barcode`;
- `Seller article` → `BaseProduct.article`;
- `Age restricted` → `BaseProduct.is_age_restricted`.

## Validation Rules

- `Country of origin`: optional text.
- `Warranty, months`: optional positive whole number.
- Empty warranty sends `null`.
- Fractional, negative and text warranty values are blocked before save.
- Existing `article` compatibility fallback remains unchanged if seller leaves article empty.

## Image Validation Rules

Product images are validated immediately when files are selected.

Allowed formats:

- JPG/JPEG;
- PNG;
- WEBP.

Rejected formats:

- SVG;
- video files;
- PDF/DOCX;
- any unsupported MIME/extension.

For mixed selection `valid + invalid`, the whole selection is rejected. Invalid files must not enter preview/state and must not be sent to `bulk_upload`.

Legacy `BaseProductImage` upload endpoint remains unchanged.

## VAT Display Rule

Backend may return VAT as `"0.00"` because it is a `DecimalField`. Frontend input displays this as `"0"`.

Rules:

- create empty VAT sends `"0"`;
- edit displays backend `"0.00"` as `"0"`;
- edit empty VAT sends `"0"`;
- backend decimal API output is not changed.

## Migration / Rollback Notes

Migration adds nullable/blank-safe fields to `BaseProduct`.

Rollback:

- reverse migration drops `country_of_origin` and `warranty_months`;
- before rollback in production, export non-empty values if they must be preserved;
- no data is migrated from legacy fields because these fields did not previously exist.

## Manual QA Checklist

1. Create product as seller.
2. Fill `Country of origin` and `Warranty, months`.
3. Verify product appears in seller list and edit page with values loaded.
4. Edit both fields and save; verify values persist.
5. Leave warranty empty; verify save succeeds and value is empty/null.
6. Enter invalid warranty (`0`, `-1`, `12.5`, text); verify field-level error before save.
7. Upload JPG/PNG/WEBP product images; verify preview and submit work.
8. Select SVG/video or mixed valid+invalid images; verify immediate error and no preview.
9. Verify license validation still allows only PDF/DOCX.
10. Verify VAT returned as `"0.00"` is displayed as `"0"` in edit UI.
11. Verify public product detail still opens and does not expose `reserved_quantity`.

## Verification Commands

```bash
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py makemigrations --check --dry-run
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py migrate --plan
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_additional_details_api -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api -v 1
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
git diff --check
```

## Known Follow-Ups

- Brand seller read/write API and UI remain out of scope.
- ProductDocument write-flow remains out of scope.
- Video upload remains out of scope.
- Country/warranty filters/facets are not part of this iteration.
- Age restricted should become category-conditional in a future iteration.
