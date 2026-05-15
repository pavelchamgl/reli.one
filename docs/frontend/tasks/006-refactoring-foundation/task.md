# FE-006 — Refactoring Foundation

**Status:** Planned  
**Priority:** P2  
**Phase:** 3  
**Depends on:** FE-001, FE-002, FE-003, FE-004, FE-005 (все P0/P1 гейты закрыты)

## Goal

Снизить технический долг без изменения продуктового поведения: lazy loading маршрутов, DRY в слайсах и API-слое, устранение side effects в reducers.

## Гейты входа (из refactoring-readiness-plan.md)

- [ ] G1: Все неотложенные P0-строки матрицы покрыты.
- [ ] G2: CI `frontend3` + `e2e_frontend3` зелёные.
- [ ] G3: Карта зон риска согласована (см. Scope).
- [ ] G4: `renderWithProviders` использует i18n + fresh store.

## Scope (малые PR в порядке реализации)

### PR 3.1 — Router lazy loading
- Вынести роутинг из `main.jsx` в `src/router.jsx`.
- Обернуть page-компоненты в `React.lazy` + `Suspense`.
- Сохранить все текущие маршруты без изменений.
- Проверить, что существующие тесты навигации (`ProtectedRoute.test.jsx`) проходят.

### PR 3.2 — Payment group mapping DRY
- Выделить `buildPaymentGroups(groups, paymentInfo, country, pointInfo)` из `paymentSlice.js`.
- Использовать из `fetchCreateStripeSession` и `fetchCreatePayPalSession`.
- Добавить unit-тест на `buildPaymentGroups` с ключевыми сценариями.

### PR 3.3 — API interceptors DRY
- Выделить `applyInterceptors(instance)` в `src/api/index.js`.
- Применить к `mainInstance` и `formDataInstance`.

### PR 3.4 — Basket slice: вынос email из reducers
- Вынести `email` из синхронизационной логики в `basketSlice` — передавать через `action.payload` или отдельный `authSlice`.
- Не менять продуктовую логику корзины.

### PR 3.5 — PaymentSlice: убрать дублирующий localStorage init
- Убрать инициализацию `paymentInfo` / `delivery` из `localStorage` при загрузке модуля.
- Доверять только `redux-persist` (payment уже в whitelist).
- Проверить, что UI не меняется.

### PR 3.6 — Persist migration documentation
- Добавить inline-комментарий к миграции в `src/redux/index.js`, поясняющий причину.
- Опционально: unit-тест для `migrations[PERSIST_VERSION]`.

## Out of scope

- Переписывание компонентов.
- Изменение Redux-контрактов (публичных экшенов/селекторов).
- Изменение backend API.
- Playwright e2e setup.

## Definition of Done

- [ ] `main.jsx` не содержит прямых `import` page-компонентов (используется `React.lazy`).
- [ ] `buildPaymentGroups` выделен и используется обоими thunk'ами.
- [ ] `applyInterceptors` убирает дублирование.
- [ ] Basket reducers не читают `localStorage` внутри Immer.
- [ ] `paymentSlice` инициализируется только через persist.
- [ ] `npm run lint && npm run test && npm run build` — зелёные после каждого PR.
- [ ] `e2e_frontend3` зелёный после merge.

## Validation

```bash
cd Frontend/Frontend3
npm run lint
npm run test
npm run build
npm run test:e2e  # опционально локально
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P2-001..006
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 3
- [refactoring-readiness-plan.md](../../refactoring-readiness-plan.md) — гейты G1–G4
