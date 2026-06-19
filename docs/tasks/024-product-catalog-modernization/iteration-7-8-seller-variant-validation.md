# Iteration 7.8 — Seller variant validation

**Статус:** реализовано  
**Дата:** 2026-06-17  
**Scope:** seller create/edit product wizard, `ProductVariant` API  
**Связанные документы:** `iteration-7-seller-product-wizard.md`, `iteration-7-2-seller-product-form-ux-restructure.md`

---

## Контекст

Ранее seller variant требовал **ровно одно** из полей `text` или `image`, а габариты упаковки и stock в edit-flow были фактически опциональны. Это расходилось с UX формы (отдельные поля цены, stock, package dimensions) и мешало вариантам с текстовой подписью и опциональным фото.

---

## Решение

### Backend (`ProductVariant`)

| Поле | Правило |
|------|---------|
| `name` | обязателен; одинаковый для всех вариантов одного `BaseProduct` |
| `text` | **обязателен** (непустая строка) |
| `image` | **опционален**; допустим вместе с `text` |
| `price` | обязателен, > 0 |
| `weight_grams`, `width_mm`, `height_mm`, `length_mm` | обязательны, > 0 |
| `quantity_in_stock` | не в модели варианта; обязателен в create-flow через stock endpoint |

Файлы: `backend/sellers/serializers.py`, `backend/product/models.py` (`clean()`), OpenAPI в `backend/sellers/views.py`.

Тесты: `backend/sellers/test_product_variant_validation.py`.

### Frontend

- Единая валидация: `validateVariantDraft`, `validateProductVariants`, `isProductVariantsValid` в `sellerProductWizard.js`.
- Create/edit: per-field errors (en/cz) + подсветка карточки варианта.
- Убран глобальный режим `type: "text" | "image"` в create-flow.
- `fetchCreateProduct` не пропускает stock step при пустом `quantity_in_stock`.
- `mapVariantDraftToPayload` всегда отправляет `text`; `image` — только если задан.

Локали: `sellerHomeEn.json`, `sellerHomeCz.json` — ключи `item.variant*Required`, `item.variantsSectionError`.

### Seller product detail read

`ProductVariantSerializer` возвращает `quantity_in_stock` (read-only) для edit/preview. Тесты: `backend/sellers/test_product_stock_api.py`.

---

## Что не менялось

- `ProductVariant.sku` generation.
- Stock endpoint contract (`PUT .../stock/`).
- Delivery dimensions storage: `mm` / `g` на варианте; UI package fields в `mm` / `kg`.
- Category attributes (product-level) — отдельно, см. cheatsheet doors.

---

## Acceptance criteria

- [x] Create variant с `text` без `image` — OK.
- [x] Create variant с `text` + `image` — OK.
- [x] Create без `text` — 400.
- [x] UI блокирует preview/submit при пустых price/stock/package fields.
- [x] Одинаковый `variantsName` для всех вариантов при сохранении.

---

## Regression tests

```bash
# backend
python manage.py test sellers.test_product_variant_validation sellers.test_product_stock_api

# frontend
cd Frontend/Frontend3 && npm test -- --run src/redux/sellerProductWizardSlices.test.js
```
