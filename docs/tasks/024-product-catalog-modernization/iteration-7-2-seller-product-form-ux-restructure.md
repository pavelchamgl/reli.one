# Iteration 7.2 — Seller Product Form UX Restructure

**Статус:** frontend UX restructure  
**Scope:** порядок блоков и полей seller create/edit product form поверх Iteration 7 и 7.1  
**Язык:** русский, technical terms оставлены на English

---

## Цель

Привести seller create/edit product form к утверждённой структуре блоков, не меняя backend contracts и уже работающий submit orchestration.

Форма должна вести seller от базовых product fields к media, description, category attributes, variants, package dimensions, documents и optional follow-up details.

---

## Scope

Входит:

- перестроить create form по утверждённому порядку секций;
- перестроить edit form по тому же порядку;
- сохранить typed category attributes и required validation;
- сохранить variant-level package dimensions semantics;
- сохранить create partial success/retry flow;
- сохранить legacy `ProductParameter`, `BaseProductImage`, `LicenseFile` compatibility;
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
   - Название товара;
   - Категория;
   - Brand — отображается как follow-up field, потому что seller API ещё не принимает `brand`;
   - Артикул продавца — визуально optional;
   - EAN/UPC barcode — optional;
   - Age restricted;
   - VAT rate.

2. **Медиафайлы**
   - legacy `BaseProductImage` upload;
   - main/extra image behavior остаётся текущим compatibility flow;
   - variant image остаётся в variant card.

3. **Описание товара**
   - `product_description`;
   - `additional_details`.

4. **Характеристики категории**
   - typed attributes из `CategoryAttributeDefinition`;
   - required validation;
   - legacy `ProductParameter` block оставлен как compatibility fallback и не является обязательным.

5. **Варианты, цена и остатки**
   - variant axis name;
   - variant value;
   - sale price;
   - stock quantity в create-flow;
   - system `ProductVariant.sku` read-only в edit, если уже есть.

6. **Габариты упаковки для доставки**
   - отображаются отдельным визуальным блоком между `Variants, price and stock` и `Documents`;
   - значения остаются variant-level и редактируют поля каждого variant draft;
   - UI units: `cm/kg`;
   - backend fields остаются legacy-named: `length_mm`, `width_mm`, `height_mm`, `weight_grams`;
   - эти поля не называются physical product dimensions.

7. **Документы**
   - legacy `LicenseFile`;
   - PDF/DOCX validation сразу после выбора файла;
   - `ProductDocument` write-flow не подключается.

8. **Дополнительные сведения**
   - collapsed accordion в конце формы;
   - fields показаны disabled/follow-up, чтобы не обещать persistence без backend fields:
     `Country of origin`, `Warranty`, `HS code`, `Packaging material`, `Seller note`.

---

## UI → API Mapping

| UI field | API/backend field | Notes |
| --- | --- | --- |
| Название товара | `BaseProduct.name` | required |
| Категория | `BaseProduct.category` | required |
| Brand | `BaseProduct.brand` | follow-up: seller serializer/API не принимает field |
| Артикул продавца | `BaseProduct.article` | UI optional; create uses compatibility fallback because backend create still requires non-blank `article` |
| EAN/UPC barcode | `BaseProduct.barcode` | optional |
| Age restricted | `BaseProduct.is_age_restricted` | mapped from frontend `is_age` |
| VAT rate | `BaseProduct.vat_rate` | required |
| Description | `BaseProduct.product_description` | required |
| Additional details | `BaseProduct.additional_details` | optional |
| Category attributes | `ProductAttributeValue` via `/attributes/` | product-level only |
| Legacy parameters | `ProductParameter` | compatibility fallback |
| Product images | `BaseProductImage` endpoints | legacy image flow |
| Variant value | `ProductVariant.text` or `ProductVariant.image` | current variant model |
| Variant price | `ProductVariant.price` | required |
| Stock quantity | seller variant stock endpoint | create-flow after variant create |
| Package length cm | `ProductVariant.length_mm` | converted `cm -> mm` |
| Package width cm | `ProductVariant.width_mm` | converted `cm -> mm` |
| Package height cm | `ProductVariant.height_mm` | converted `cm -> mm` |
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
- additional/future fields скрыты в native accordion.

---

## Known Follow-Ups

- Сделать seller API для `Brand` write/read в create/edit flow.
- Сделать backend create `article` optional или явно разделить seller article и required internal identifier.
- Добавить video upload отдельной итерацией.
- Подключить `ProductDocument` write-flow для сертификатов/инструкций.
- Добавить edit stock UI, если product detail или отдельный endpoint будет давать текущий stock per variant.
- Реализовать persistence для `Country of origin`, `Warranty`, `HS code`, `Packaging material`, `Seller note`.

---

## Manual QA Checklist

1. Открыть create product form.
2. Проверить порядок блоков: Main information → Media files → Description → Category attributes → Variants, price and stock → Package dimensions → Documents → Additional seller details.
3. Проверить, что seller article визуально optional.
4. Проверить, что category typed required attributes блокируют preview до `POST /products/`.
5. Проверить, что product create payload не содержит package dimensions.
6. Проверить, что отдельный блок `Package dimensions` редактирует package dimensions per variant, а variant payload содержит эти значения в `mm/g`.
7. Проверить, что license invalid file rejected сразу после выбора.
8. Открыть edit product form и проверить тот же порядок блоков.
9. Проверить, что typed attributes редактируются и сохраняются.
10. Проверить, что package dimensions в edit не смешиваются с physical product dimensions.
11. Проверить, что SKU в edit read-only, если есть.
12. Проверить, что unknown future fields не отправляются в API.

---

## Verification Commands

```bash
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
- Brand exists in backend foundation, but seller create/edit serializer does not expose it yet.
- Future fields in accordion are intentionally disabled to avoid fake persistence.
- Edit stock is not shown because current edit product payload does not provide stock quantity per variant.
