# Task 019 — E2E Catalog Fixture From Real Catalog Structure

**Priority:** P2  
**Complexity:** Low–Medium  
**Type:** Testing / CI / Fixtures  
**Status:** **DONE**

---

## Goal

Заменить временный CI seed `Category.objects.get_or_create(name='E2E Category')` на реалистичную fixture структуры каталога из e2e/local DB.

---

## Context

Full-stack E2E (FS-001/002/003) требуют хотя бы одной категории для создания продукта через seller API. В Task 018 использовался минимальный runtime seed одной категории — работало, но не отражало nested MPTT-дерево production-like каталога.

---

## Scope

- Экспорт `product.Category` → `backend/product/fixtures/e2e_categories.json`
- CI job `e2e_fullstack`: `loaddata` вместо shell-seed
- Документация: e2e-local-contour, Task 018 follow-up, test-coverage-snapshot

---

## Out of Scope

- Экспорт товаров, seller/product/media/order/payment
- Production dumps
- Изменение business logic / runtime кода

---

## Implementation

### Fixture

```bash
docker compose -f docker-compose.e2e.yml exec -T backend_e2e \
  python manage.py dumpdata product.Category \
  --indent 2 --natural-foreign --natural-primary \
  > backend/product/fixtures/e2e_categories.json
```

- **165** категорий (nested MPTT, до 3 уровней)
- Только `product.category`; без email/phone/users/orders/products
- Временная `E2E Category` удалена из fixture

### CI

```yaml
docker compose -f docker-compose.e2e.yml exec -T backend_e2e \
  python manage.py loaddata product/fixtures/e2e_categories.json
```

---

## Safety Checklist

- [x] Fixture содержит только `product.category`
- [x] Нет PII / users / orders / products
- [x] Не production dump (экспорт из локального e2e контура)
- [x] Image paths — относительные (`category_images/...`); файлы опциональны для FS-002/003

---

## Validation Results

| Проверка | Результат |
|----------|-----------|
| `loaddata` на fresh e2e DB | **PASS** |
| `GET /api/products/category/` — nested tree | **PASS** |
| FS-001/002/003 (7 тестов) | **PASS** |
| `getFirstCategoryId()` traversal | **PASS** (без изменений в specs) |

---

## Risks

1. Изменение модели `Category` / MPTT — fixture потребует перегенерации.
2. Пустой fixture — FS-002/003 упадут на product create.

---

## Relation

| Task | Связь |
|------|-------|
| **018** | Заменён runtime seed категории |
| **015** | FS-002/003 используют category id из API tree |
