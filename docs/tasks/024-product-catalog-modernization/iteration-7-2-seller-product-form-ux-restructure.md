# Iteration 7.2 — Seller Product Form UX Restructure

**Статус:** done (create + edit UI/UX parity)  
**Scope:** порядок блоков и полей seller create/edit product form поверх Iteration 7 и 7.1  
**Язык:** русский, technical terms оставлены на English

---

## Цель

Привести seller create/edit product form к утверждённой структуре блоков, не меняя backend contracts и уже работающий submit orchestration.

Форма должна вести seller от выбора category к названию товара, media, description, category attributes, variants с общим VAT и package dimensions внутри каждого variant card, documents и optional persisted seller details.

---

## Scope

Входит:

- перестроить create form по утверждённому порядку секций;
- перестроить edit form по тому же порядку;
- сохранить typed category attributes и required validation;
- сохранить variant-level package dimensions semantics;
- сохранить create partial success/retry flow;
- сохранить legacy `ProductParameter`, `BaseProductImage`, `LicenseFile` compatibility;
- скрыть поля без честного backend/API persistence до отдельной итерации;
- перенести `additional_details` в accordion `Additional seller details`;
- перенести `VAT rate` в блок `Variants, price and stock`;
- трактовать пустой `VAT rate` как `0%` в create/edit payload;
- добавить frontend-only секционный layout без нового design system.

Не входит:

- backend models/migrations;
- backend serializer/API contract changes;
- checkout/payment/delivery/order/reservation logic;
- public filters/facets/search backend;
- seller stock endpoint changes;
- `ProductVariant.sku` generation;
- `ProductMedia`/`ProductDocument` seller write API;
- warehouse selector;
- video upload;
- separate short description field;
- fake persistence для future fields.

---

## Утверждённый Порядок Блоков

1. **Основная информация**
   - Категория;
   - Название товара;
   - Brand скрыт до появления seller brand read/write API;

   Category стоит первым полем, потому что от неё зависит schema typed attributes и дальнейшая структура seller form.

2. **Медиафайлы**
   - legacy `BaseProductImage` upload;
   - main/extra image behavior остаётся текущим compatibility flow;
   - variant image остаётся в variant card.

3. **Описание товара**
   - `product_description`.

4. **Характеристики категории**
   - typed attributes из `CategoryAttributeDefinition`;
   - required validation;
   - legacy `ProductParameter` block оставлен как compatibility fallback и не является обязательным.

5. **Варианты, цена и остатки**
   - `VAT rate` как общее product-level поле для всех вариантов;
   - пустой `VAT rate` сохраняется как `0`;
   - variant axis name;
   - variant value;
   - sale price;
   - stock quantity в create-flow;
   - system `ProductVariant.sku` read-only в edit, если уже есть;
   - package dimensions находятся внутри каждого variant card после price/stock;
   - package dimensions UI units: `mm/kg`;
   - package dimensions backend fields остаются legacy-named: `length_mm`, `width_mm`, `height_mm`, `weight_grams`;
   - package dimensions не называются physical product dimensions.

6. **Документы**
   - legacy `LicenseFile`;
   - PDF/DOCX validation сразу после выбора файла;
   - `ProductDocument` write-flow не подключается.

7. **Дополнительные сведения**
   - collapsed accordion в конце формы;
   - порядок fields: `additional_details` → `Country of origin` → `Warranty` → `EAN/UPC barcode` → `Seller article` → `Age restricted`;
   - `additional_details` сохраняется в существующее backend поле `BaseProduct.additional_details`;
   - `Country of origin` и `Warranty` являются editable optional frontend-only fields в Iteration 7.2;
   - `Country of origin` и `Warranty` intentionally not persisted и не отправляются в API до появления backend/API support;
   - `EAN/UPC barcode` сохраняется в `BaseProduct.barcode`;
   - `Seller article` сохраняется в `BaseProduct.article` и визуально optional;
   - `Age restricted` сохраняется в `BaseProduct.is_age_restricted`;
   - `Age restricted` в будущем должен стать category-conditional, но category flag не реализуется в Iteration 7.2.

---

## UI → API Mapping

| UI field | API/backend field | Notes |
| --- | --- | --- |
| Категория | `BaseProduct.category` | required |
| Название товара | `BaseProduct.name` | required |
| Brand | `BaseProduct.brand` | follow-up: seller serializer/API не принимает field, активное UI field скрыто |
| Description | `BaseProduct.product_description` | required |
| Additional details | `BaseProduct.additional_details` | optional, находится в accordion `Additional seller details` |
| Country of origin | нет текущего поля | optional frontend-only field, не отправляется в API |
| Warranty | нет текущего поля | optional frontend-only field, не отправляется в API |
| EAN/UPC barcode | `BaseProduct.barcode` | optional, находится в accordion `Additional seller details` |
| Seller article | `BaseProduct.article` | UI optional; create uses compatibility fallback because backend create still requires non-blank `article` |
| Age restricted | `BaseProduct.is_age_restricted` | mapped from frontend `is_age`, находится в accordion `Additional seller details` |
| VAT rate | `BaseProduct.vat_rate` | optional UI field in `Variants, price and stock`; empty value maps to `0` |
| Category attributes | `ProductAttributeValue` via `/attributes/` | product-level only |
| Legacy parameters | `ProductParameter` | compatibility fallback |
| Product images | `BaseProductImage` endpoints | legacy image flow |
| Variant axis name | `ProductVariant.name` | одинаковый для всех вариантов товара (`variantsName`) |
| Variant value | `ProductVariant.text` | **required** |
| Variant image | `ProductVariant.image` | optional; можно вместе с `text` |
| Variant price | `ProductVariant.price` | required |
| Stock quantity | seller variant stock endpoint | **required** в UI до preview/submit; create-flow после variant create |
| Package length mm | `ProductVariant.length_mm` | direct mm |
| Package width mm | `ProductVariant.width_mm` | direct mm |
| Package height mm | `ProductVariant.height_mm` | direct mm |
| Package weight kg | `ProductVariant.weight_grams` | converted `kg -> g` |
| License file | legacy `LicenseFile` | PDF/DOCX only |

---

## Design / Верстка Constraints

- использовать текущие seller form inputs/buttons/fonts;
- не вводить новый design system;
- не добавлять декоративные cards, gradients, hero blocks или новую палитру;
- секции должны быть естественным продолжением текущей seller page;
- labels короткие и помещаются в mobile/desktop layout;
- required errors остаются рядом с полями;
- `Country of origin` и `Warranty` могут быть active frontend-only inputs, но не persisted;
- fields без persistence кроме `Country of origin` и `Warranty` не показываются как активные inputs;
- `additional_details` находится в native accordion.
- product physical dimensions остаются category attributes или future model; они не смешиваются с package dimensions.

---

## Known Follow-Ups

- Сделать seller brand read/write API and UI.
- Сделать backend create `article` optional или явно разделить seller article и required internal identifier.
- Добавить video upload отдельной итерацией.
- Подключить `ProductDocument` write-flow для сертификатов/инструкций.
- Добавить edit stock UI, если product detail или отдельный endpoint будет давать текущий stock per variant.
- Реализовать persistence для `Country of origin`, `Warranty`, `HS code`, `Packaging material`, `Seller note`.
- Сделать `Age restricted` category-conditional, когда backend category flag будет доступен.

---

## Edit Parity (2026-06)

Create и edit используют один и тот же UX-эталон (секции, i18n, validation, spacing). Edit-only поведение сохранено.

### Shared UI и helpers

| Элемент | Файл / паттерн |
| --- | --- |
| Порядок секций, placeholders, input constraints | `SellerCreateForm.jsx` ↔ `EditGoodsForm.jsx` |
| Категория на edit без re-select | `CreateCategoryMain` + prop `readOnlyCategory={{ id, name }}`; **не** читает `edit_goods` |
| Legacy characteristics (видимые) | `CreateCharacInp` / `EditGoodsParameters` |
| Dimension rows filter | `Components/Seller/shared/sellerProductParameters.js` — `isDimensionParameterRow`, `getVisibleProductParameters` |
| Form validation | `getValidateGoods(t)`, `validateAttributeDraft(..., t)`, `validateProductVariants(..., t)` из `sellerProductWizard.js` |

### Legacy `ProductParameter` dimension rows

Строки с именами `length` / `width` / `height` / `weight` (case-insensitive) **скрыты в UI**, но остаются в Redux/API. Preview/save validation проверяет только **visible** rows через `getVisibleProductParameters`.

### Edit-only (не регрессировать)

- `fetchSellerProductById` + Redux `edit_goods`
- `status: local|server` для variants, parameters, images, license
- Server deletes: `fetchDeleteVariant`, `fetchDeleteParameters`, `fetchDeleteImage`, `fetchDeleteLicense`
- System SKU read-only в variant card
- Preview: `/seller/edit-preview/:id`

### Tests

```bash
npm --prefix Frontend/Frontend3 run test -- src/Components/Seller/shared/sellerProductParameters.test.js
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
```

---

## Manual QA Checklist

1. Открыть create product form.
2. Проверить порядок блоков: Main information → Media files → Description → Category attributes → Variants, price and stock → Documents → Additional seller details.
3. Проверить, что в Main information первым полем идёт Category, вторым Product name.
4. Проверить, что `VAT rate` находится в `Variants, price and stock`, визуально optional, а пустое значение уходит как `0`.
5. Проверить порядок accordion `Additional seller details`: `additional_details` → `Country of origin` → `Warranty` → `EAN/UPC barcode` → `Seller article` → `Age restricted`.
6. Проверить, что seller article визуально optional.
7. Проверить, что Brand, `HS code`, `Packaging material`, `Seller note` не показаны как активные поля.
8. Проверить, что `Country of origin` и `Warranty` редактируются в UI, но не уходят в create/edit API payload.
9. Проверить, что `additional_details`, barcode, article и age restricted сохраняются в существующие backend fields.
10. Проверить, что category typed required attributes блокируют preview до `POST /products/`.
11. Проверить, что product create payload не содержит package dimensions.
12. Проверить, что package dimensions находятся внутри каждого variant card и variant payload содержит эти значения в `mm/g`.
13. Проверить, что license invalid file rejected сразу после выбора.
14. Открыть edit product form и проверить тот же порядок блоков.
15. Проверить, что typed attributes редактируются и сохраняются.
16. Проверить, что package dimensions в edit не смешиваются с physical product dimensions.
17. Проверить, что SKU в edit read-only, если есть.
18. Проверить, что unknown future fields не отправляются в API.
19. Side-by-side `/seller/seller-create` vs `/seller/seller-edit/:id`: секции, шрифты, spacing, variant grid.
20. CZ locale на edit: нет hardcoded EN в форме.
21. Edit с dimension-params с API: preview не блокируется из-за скрытых dimension rows.

---

## Verification Commands

```bash
npm --prefix Frontend/Frontend3 run test -- src/Components/Seller/shared/sellerProductParameters.test.js
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_category_attributes -v 1
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api -v 1
git diff --check
```

---

## Risks

- Backend create serializer still requires `article`, while UX treats seller article as optional. Frontend keeps compatibility fallback until backend contract changes.
- Brand exists in backend foundation, but seller create/edit serializer does not expose it yet; active UI field is hidden until seller API is ready.
- Future fields are hidden to avoid fake persistence.
- Edit stock is not shown because current edit product payload does not provide stock quantity per variant.
- Empty `VAT rate` is normalized by frontend payload building to `0`; backend contract is not changed.
