# FE-006 — Refactoring Foundation

**Status:** Done  
**Priority:** P2  
**Phase:** 3  
**Depends on:** FE-001, FE-002, FE-003, FE-004, FE-005 (все P0/P1 гейты закрыты)  
**Completed:** май 2026

## Goal

Снизить технический долг без изменения продуктового поведения: lazy loading маршрутов, исправление hardcoded URL, изоляция тест-инфраструктуры, устранение silent catch, удаление dev artifact.

## Что сделано

### PR 3.1 — Router lazy loading (FE-P2-001)

- `main.jsx`: все ~50 page- и sellerPage-компонентов переведены на `React.lazy`.
- Добавлен `Suspense` wrapper вокруг `RouterProvider`.
- Маршруты и URL не изменились.
- `ProtectedRoute` остался eager (используется inline в конфиге роутера).
- Build генерирует отдельные chunk-файлы per page.

### PR 3.2 — Hardcoded production URL (FE-P0-003 follow-up)

- `src/redux/productsSlice.js`: заменены 3 hardcoded `https://reli.one/api/...` → относительные пути через `mainInstance` (который использует `VITE_API_URL`).
  - `products/categories/{id}/` — params через axios `params`
  - `products/search/` — без изменения params
  - `sellers/{id}/products/`
- Удалён неиспользуемый `import axios from "axios"` из `productsSlice.js`.
- `src/api/favorite.js`: `getFavoriteProducts` — заменён hardcoded URL на `/favorites/products/` с axios `params`.

### PR 3.3 — networkToastShown test helper (FE-P1-005)

- `src/api/index.js`: добавлена экспортируемая функция `resetNetworkToastShown()`.
- Runtime-поведение не изменено. Функция предназначена только для использования в тестах (beforeEach/afterEach).
- Документирована ссылка на finding FE-P1-005.

### PR 3.4 — setupStore + renderWithProviders fresh store (FE-P1-007)

- `src/redux/index.js`: добавлена экспортируемая фабричная функция `setupStore(preloadedState = {})` — создаёт non-persisted store на базе `rootReducer`.
- `src/test/test-utils.jsx`: `renderWithProviders` теперь использует `setupStore()` по умолчанию вместо singleton `store`. Backward compatibility сохранена (опция `storeInstance` работает как прежде).

### PR 3.5 — seller orders consistent error handling (FE-005 follow-up)

- `src/api/seller/orders.js`: `getOrders` и `getOrderDetails` — empty catch заменён на `throw error` (консистентно со всеми другими функциями в файле).
- `src/api/seller/orders.test.js`: тесты "returns undefined on error (silent catch)" → "propagates errors".

### PR 3.6 — SearchPage loading state

- `src/pages/SearchPage.jsx`: добавлен `<div data-testid="search-loading" />` при `searchStatus === "loading"`.
- `src/pages/SearchPage.test.jsx`: новый тест "shows search-loading indicator when searchStatus is loading".

### PR 3.7 — Dev artifact Test.jsx (FE-P3-003 follow-up)

- `src/pages/Test.jsx` — удалён. Файл не был импортирован ни одним production-кодом (маршрут `/test` удалён в FE-001). Компонент `IdentDocumInp` был единственным используемым импортом, он доступен напрямую из `src/Components/`.

## Результаты валидации

```
npm run lint   → 0 errors (747 warnings, pre-existing)
npm run test   → 121/121 passed (13 файлов)
npm run build  → success (chunk warnings — pre-existing)
```

Grep-проверки:
- `grep -R "https://reli.one/api" src` → только BaseURL fallback в `api/index.js` (допустимо)
- `grep -R "networkToastShown" src` → только `api/index.js` (ожидаемо)
- `grep -R "from.*pages/Test" src` → нет результатов
- `grep -R "pages/Test" src` → нет результатов

## Гейты входа (из refactoring-readiness-plan.md)

- [x] G1: Все неотложенные P0-строки матрицы покрыты.
- [x] G2: CI `frontend3` + `e2e_frontend3` зелёные.
- [x] G3: Карта зон риска согласована (Scope).
- [x] G4: `renderWithProviders` использует fresh store (setupStore).

## Definition of Done

- [x] Page-компоненты в `main.jsx` используют `React.lazy` + `Suspense`.
- [x] Hardcoded `https://reli.one/api` убраны из productsSlice.js и favorite.js.
- [x] `resetNetworkToastShown()` экспортирован для тестов.
- [x] `setupStore()` экспортирован из redux/index.js; `renderWithProviders` по умолчанию изолирован.
- [x] `getOrders` / `getOrderDetails` бросают ошибки (консистентно).
- [x] `data-testid="search-loading"` отображается при `searchStatus === "loading"`.
- [x] `src/pages/Test.jsx` удалён.
- [x] `npm run lint && npm run test && npm run build` — зелёные.

## Out of scope (follow-up)

- PR 3.2 (roadmap) — `buildPaymentGroups` DRY в paymentSlice — отложено.
- PR 3.3 (roadmap) — `applyInterceptors` DRY — отложено.
- PR 3.4 (roadmap) — basket email из reducers — отложено.
- PR 3.5 (roadmap) — paymentSlice localStorage дублирование — отложено.
- PR 3.6 (roadmap) — persist migration документация — отложено.

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P1-005, FE-P1-007, FE-P2-001
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 3
- [refactoring-readiness-plan.md](../../refactoring-readiness-plan.md) — гейты G1–G4
