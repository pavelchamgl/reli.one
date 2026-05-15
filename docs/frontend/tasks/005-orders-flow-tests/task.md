# FE-005 — Orders Flow Tests

**Status:** Done  
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

- [x] Ключевые reducers `basketSlice` покрыты unit-тестами (29 тестов).
- [x] RTL-тест `BasketCardBlock`: список, пустое состояние, checkbox.
- [x] RTL-тест `MyOrdersPage`: render, tabs navigation.
- [x] Seller orders API покрыт unit-тестами.
- [x] Customer orders API расширен: return values + error propagation.
- [x] `npm run test` зелёный (120/120).
- [x] Матрица обновлена: «Корзина / чекаут» → Покрыто (частично; interceptors — Backlog).

## Implementation notes

### Новые/изменённые тестовые файлы

| Файл | Тестов | Тип |
|------|--------|-----|
| `src/api/orders.test.js` | 12 (было 3) | unit — endpoint + return values + error propagation |
| `src/api/seller/orders.test.js` | 20 | unit — все 10 функций seller orders API |
| `src/redux/basketSlice.test.js` | 29 | unit — все ключевые reducers |
| `src/Components/Basket/BasketCardBlock/BasketCardBlock.test.jsx` | 8 | RTL — empty/list/checkbox/count/filtered |
| `src/pages/MyOrdersPage.test.jsx` | 6 | RTL — render/tabs |

### Паттерн: mockImplementationOnce вместо mockRejectedValue

Vitest 4.1.6 в jsdom/node окружении с `vi.mock()` трактует `mockRejectedValue()` как unhandled rejection и помечает тест FAILED до выполнения ассертов. Решение: `mockImplementationOnce(() => { throw new Error("...") })`. Синхронный throw из async-функции через `await` корректно оборачивается в rejected promise, который `.rejects.toThrow()` ловит. Паттерн задокументирован в обновлённых тестовых файлах.

### Особенность: basketSlice читает localStorage в reducers

`basketSlice` читает `localStorage.getItem("email")` внутри reducers (FE-P2-002). Тесты используют `localStorage.clear()` в `beforeEach` для изоляции. Полифилл `polyfill-localstorage.js` уже в setupFiles — тесты работают без дополнительной настройки.

### Не покрыто в этой задаче (follow-up)

- **Interceptor 401 + toast** (FE-P1-002, FE-P1-005): `api/index.js` interceptors сложно тестировать из-за module-level `networkToastShown` и singleton store (FE-P1-005, FE-P1-007). Требует `vi.resetModules()` или рефакторинга. → Follow-up для FE-006 или отдельной задачи.
- **BasketPage full**: `BasketPage` просто рендерит `BasketCardBlock` + `BasketTotalBlock`. `BasketTotalBlock` зависит от `state.payment.groups` (paymentSlice) и имеет console.log. Minimal path тестируется через `BasketCardBlock`. Полный тест — в рамках FE-006.
- **Seller orders: `getOrders` / `getOrderDetails` silent catch**: эти функции не бросают ошибку из catch. Поведение документировано в тесте как follow-up для FE-006 (добавить `throw error`).

## Validation

```bash
cd Frontend/Frontend3
npm run lint   # ✅ 0 errors, 687 pre-existing warnings
npm run test   # ✅ 120/120 passed
npm run build  # ✅ successful
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P1-002, FE-P1-003, FE-P1-005, FE-P1-006
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 2.1
- [../../test-matrix.md](../../test-matrix.md)
