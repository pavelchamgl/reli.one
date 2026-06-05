# ADR 03 — Scope typed attributes на первом этапе

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, category attributes, filters  
**Связанные итерации:** 5, 6, 9

---

## Контекст

Текущие характеристики товара хранятся в `ProductParameter` как свободные `name/value`. План модернизации вводит category-driven typed attributes.

При этом текущий `ProductVariant` является одноосевой моделью: у всех вариантов одного товара один `name`, а значение варианта задается через text или image. Variant-level typed attributes потребовали бы отдельного redesign вариантов.

---

## Решение

1. На первом этапе typed attributes являются только product-level.
2. `ProductAttributeValue` должен относиться к `BaseProduct`, а не к `ProductVariant`.
3. `is_variant_attribute` не используется в первой реализации или остается зарезервированным флагом без runtime behavior.
4. Variant-level attributes проектируются только отдельным ADR и отдельной миграционной задачей.
5. `ProductParameter` сохраняется как legacy fallback до готовности typed search и migration.

---

## Последствия

- Category filters и product detail могут строиться на typed product attributes.
- Existing variants, SKU, order history и reviews не затрагиваются.
- Bulk import templates используют product-level category schema.
- Старые товары не становятся invalid автоматически при добавлении новых required attributes.

---

## Acceptance criteria

- Typed attributes не меняют `ProductVariant.clean`.
- Existing variant create/edit продолжает работать.
- Search по `ProductParameter` доступен до typed search.
- Изменение category schema не ломает approved products без explicit revalidation step.

---

## Не делаем сейчас

- Не проектируем `ProductVariantAttributeValue`.
- Не меняем SKU/variant model.
- Не удаляем `ProductParameter`.
