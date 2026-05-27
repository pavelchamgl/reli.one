# FE-016 — Seller Onboarding Migration Audit & Test Gates

**Status:** Planned  
**Priority:** P0  
**Phase:** 5 — UI migration  
**Depends on:** FE-015  
**Blocks:** FE-017 … FE-021

## Цель

Построить **inventory** зоны seller onboarding и закрыть **test gates** перед заменой UI: что мигрируем, какие props/API/Redux задействованы, какие тесты должны остаться зелёными.

## Контекст

Onboarding уже частично покрыт (FE-003 unit/RTL, FE-010 e2e smoke, FE-011 full-stack). При смене разметки e2e на текстовых селекторах может сломаться. Audit снижает риск «v0 переписал пол-флоу».

Опора: [seller-onboarding-flow.md](../../../seller-onboarding-flow.md), [04-frontend-architecture.md](../../../04-frontend-architecture.md).

## Scope

- Таблица: route → page → container components → API calls → Redux usage → i18n keys (top-level).
- Классификация каждого компонента: **Container** / **View** / **Mixed** (требует split).
- Список MUI/SCSS зависимостей по файлам в `sellerPages/` и `Components/Seller/auth/`.
- Gap analysis тестов: что покрыто vs что нужно перед FE-018.
- Черновик `features/seller-onboarding/` (структура папок — только в документе, код опционально в FE-017).
- Обновление [test-matrix.md](../../test-matrix.md): секция «UI migration gates» для onboarding.

## Не входит в задачу

- Визуальная миграция компонентов.
- Изменение API или backend.
- Playwright full-stack переделка (только план селекторов).

## Зависимости

- FE-015 (alias `@/`, shadcn paths согласованы).

## Риски

| Риск | Митигация |
|------|-----------|
| Inventory устареет | хранить в `docs/frontend/seller-onboarding-ui-inventory.md` |
| Смешанные компоненты | явный backlog split в FE-017/018 |

## Definition of Done

- [ ] Артефакт [seller-onboarding-ui-inventory.md](../../seller-onboarding-ui-inventory.md) создан.
- [ ] Для каждого маршрута пилота — строка в inventory (см. [shadcn-ui-migration-plan.md](../../shadcn-ui-migration-plan.md)).
- [ ] Список P0 тестов «must stay green» зафиксирован.
- [ ] Список недостающих RTL/e2e якорей с приоритетом (что добавить до FE-018).
- [ ] [test-matrix.md](../../test-matrix.md) обновлён (новые строки или секция).
- [ ] PR **docs-only** или docs + минимальные `data-testid` (если согласовано отдельно).

---

# Iterations

## Iteration 1 — Route & file inventory

### Цель

Полный список файлов onboarding-зоны.

### Действия

1. Пройти `Frontend/Frontend3/src/main.jsx` — children `/seller/*` onboarding routes.
2. Для каждого route открыть `sellerPages/*` и связанные `Components/Seller/auth/*`.
3. Записать цепочку импортов до API (`src/api/seller/onboarding.js`, `auth.js`).

### Output

- Таблица в `seller-onboarding-ui-inventory.md`.

### Статус

- [ ]

---

## Iteration 2 — Container / View split plan

### Цель

Определить, что остаётся в container, что отдаётся v0.

### Действия

1. Пометить компоненты с `dispatch`, `useNavigate`, `axios`, `localStorage` → **Container**.
2. Пометить чистый render + callbacks → **View** (кандидат v0).
3. **Mixed** — план split: `XContainer.jsx` + `XView.jsx`.

Приоритет split для FE-018:

| Component | Тип (ожидание) |
|-----------|----------------|
| `SellerTypeContent` | Mixed → split |
| `LoginForm` | Mixed |
| `CreateForm` | Mixed |
| `ApplicationSubmited` | View-heavy |
| `PersonalDetails`, `TaxInfo`, … | Mixed |

### Output

- Колонка «Target files» в inventory.

### Статус

- [ ]

---

## Iteration 3 — Test gap analysis

### Цель

Сопоставить inventory с [test-matrix.md](../../test-matrix.md).

### Действия

1. Перечислить существующие тесты:
   - `src/api/seller/onboarding.test.js`
   - `SellerTypeContent.test.jsx`
   - `e2e/seller-onboarding.spec.js`
   - `e2e/fullstack-seller-onboarding.spec.js` (если есть)
2. Для каждого маршрута FE-018: «RTL yes/no», «e2e yes/no».
3. Зафиксировать минимальные якоря до UI-PR:
   - `LoginForm`: поля + submit disabled/enabled
   - `CreateForm`: Yup errors
   - `ApplicationSubmited`: status badges

### Output

- Таблица gaps в inventory + строки в test-matrix.

### Статус

- [ ]

---

## Iteration 4 — v0 & agent brief

### Цель

Единый brief для v0/Cursor на весь пилот.

### Действия

1. Скопировать шаблон промпта из [shadcn-ui-migration-plan.md](../../shadcn-ui-migration-plan.md).
2. Добавить для onboarding: список **обязательных props** на первый экран (`SellerTypeContent`).
3. Зафиксировать design references (скриншоты текущего UI — optional, без PII).

### Output

- Раздел «Agent brief» в inventory.

### Статус

- [ ]

---

## Ключевые файлы для анализа

| Область | Путь |
|---------|------|
| Routes | `Frontend/Frontend3/src/main.jsx` |
| Pages | `Frontend/Frontend3/src/sellerPages/` |
| Auth UI | `Frontend/Frontend3/src/Components/Seller/auth/` |
| API | `Frontend/Frontend3/src/api/seller/onboarding.js` |
| Redux | `Frontend/Frontend3/src/redux/selfEmploed*.js` (уточнить точное имя в audit) |
| Tests | `**/seller*onboarding*`, `SellerTypeContent.test.jsx` |

## Suggested commits

```
docs(frontend): add seller onboarding UI migration inventory
docs(frontend): extend test matrix for shadcn migration gates
```
