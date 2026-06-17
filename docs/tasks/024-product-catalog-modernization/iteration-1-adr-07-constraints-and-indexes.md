# ADR 07 — Constraints и indexes для будущих catalog models

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, database design  
**Связанные итерации:** 4, 5, 6

---

## Контекст

Новые модели media, identifiers, documents, brands и typed attributes потребуют database constraints. Без заранее согласованных правил возможны дубли, неоднозначное главное фото и медленные facets.

---

## Решение

1. `ProductMedia`: один main media на product через partial unique constraint.
2. `ProductMedia`: индекс по `(product, sort_order)` и status для public filtering.
3. `ProductExternalIdentifier`: unique по согласованной паре `identifier_type/value`; product-level duplicates запрещены.
4. `ProductAttributeValue`: unique `(product, attribute_definition)`.
5. Filterable typed attributes получают indexes по `attribute_definition` и typed value fields.
6. Brand получает indexes по normalized name/status для поиска и moderation.
7. Все constraints должны быть additive и совместимы с legacy data migration.

---

## Последствия

- Iteration 4/5 должна проектировать migrations с учетом этих constraints.
- Facet performance не оставляется на post-factum оптимизацию.
- Дедупликация identifiers должна быть описана до импорта.

---

## Acceptance criteria

- Main media не может быть больше одного на product.
- Attribute value не дублируется для одной definition.
- Identifier deduplication rule есть до migrations.
- Facet indexes описаны до public filter implementation.

---

## Не делаем сейчас

- Не создаем migrations.
- Не добавляем models.
- Не запускаем performance tuning.
