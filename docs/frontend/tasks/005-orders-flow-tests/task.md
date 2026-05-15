# FE-005 — Orders Flow Tests

**Status:** Planned  
**Priority:** P1  
**Phase:** 2  
**Depends on:** FE-002, test infra fixes (FE-P1-004, FE-P1-007)

## Goal

Покрыть RTL-тестами customer orders list и basket/checkout state — P0-сценарии из [test-matrix.md](../../test-matrix.md).

## Context

`src/api/orders.js` частично покрыт unit-тестом (`orders.test.js` — URL и статусы). Однако UI-компоненты и `basketSlice` не тестированы. `basketSlice` содержит сложную логику (sync по email, selectedProducts, totalCount, корзины по пользователям) — P0-риск без якорных тестов.

## Scope

### 2.1.3 — Basket / Checkout RTL

- Unit-тест `basketSlice`: добавление товара, удаление, `selectProduct`, `totalCount`, `paymentEndBasket`, `syncBasket`.
- RTL `BasketPage` (desktop или mobile): отображение позиций, удаление, расчёт суммы (mock store state).
- RTL `PaymentPage`: отображение формы доставки; mock `postCalculateDelivery`; отображение ошибки расчёта.

### 2.1.2 — API errors / retry / toasts

- RTL или unit-тест interceptor-логики: 401 + refresh → повтор; network error → toast один раз (mock `localStorage` + `ErrToast`).
- Сброс `networkToastShown` (FE-P1-005) задокументировать в test setup.

## Out of scope

- E2E checkout (FE-P3-001).
- Изменение логики корзины.
- Тестирование Stripe/PayPal redirect (мокать `window.location.href`).

## Definition of Done

- [ ] Ключевые reducers `basketSlice` покрыты unit-тестами.
- [ ] RTL-тест `BasketPage`: список, удаление, сумма.
- [ ] Interceptor 401 + toast — покрыт.
- [ ] `npm run test` зелёный.
- [ ] Матрица обновлена: «Корзина / чекаут» → Покрыто (или Backlog с обоснованием).

## Validation

```bash
cd Frontend/Frontend3
npm run test
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P1-002, FE-P1-003, FE-P1-005, FE-P1-006
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 2.1
- [../../test-matrix.md](../../test-matrix.md)
