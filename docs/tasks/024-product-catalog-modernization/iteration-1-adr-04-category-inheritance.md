# ADR 04 — Category inheritance для attribute schema

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, category tree, facets, import templates  
**Связанные итерации:** 5, 6, 9

---

## Контекст

`Category` уже является MPTT-деревом. Товар может быть привязан к категории, а при удалении категории поле становится `NULL`. Текущий category listing показывает только прямые товары категории.

Для schema-driven характеристик нужно определить, как работают parent/child categories, non-leaf categories и `category=NULL`.

---

## Решение

1. Attribute definitions наследуются от ancestors к descendants.
2. Если child category переопределяет attribute с тем же stable code, используется child definition.
3. Seller create/import должен предпочитать leaf category.
4. Non-leaf category допустима только если для нее явно разрешено создание товаров.
5. Товар с `category=NULL` не получает required typed attributes и не участвует в category-specific facets.

---

## Последствия

- Category schema endpoint должен возвращать итоговую schema: ancestors + current category overrides.
- Import template строится по итоговой schema выбранной категории.
- Facets для category page должны использовать те же inheritance rules.
- Existing products с `category=NULL` остаются доступными через legacy public behavior, но без typed category filters.

---

## Acceptance criteria

- Для leaf category schema содержит inherited attributes.
- Override в child category детерминирован.
- Behavior для non-leaf category явно проверяется fixture.
- `category=NULL` не вызывает validation crash и не ломает public detail/list.
- Deleted category fixture проверяет переход товара в `category=NULL`.

---

## Не делаем сейчас

- Не меняем category listing behavior.
- Не добавляем category schema models.
- Не переносим существующие товары между категориями.
