# Frontend3 Stabilization Roadmap

**Версия:** май 2026 (после Task 014 audit)  
**Основан на:** [frontend3-audit.md](./frontend3-audit.md), [refactoring-readiness-plan.md](./refactoring-readiness-plan.md), [test-matrix.md](./test-matrix.md)

Детальный агрегатор треков: [docs/roadmap.md](../roadmap.md).  
Задачи: [docs/frontend/tasks/README.md](./tasks/README.md).

---

## Принципы

1. **Последовательность фаз** — P0 → P1 → P2 → P3. Не начинать рефакторинг (P2) без закрытых гейтов из [refactoring-readiness-plan.md](./refactoring-readiness-plan.md).
2. **Малые PR** — один PR = одна законченная единица (тест + минимальный fix, или только fix, или только docs).
3. **CI зелёный** перед каждым merge в main.
4. **Runtime-код** не трогать в рамках документарных PR.

---

## Phase 1 — P0 Critical Stabilization

**Цель:** устранить тихие баги в API-слое и мёртвый код. Не требует изменений в тестах — только точечные fix-PR.

**Гейт входа:** CI `frontend3` + `e2e_frontend3` зелёные.

**Задача:** [001-auth-and-routing-stabilization](./tasks/001-auth-and-routing-stabilization/task.md) — FE-P0-006 (ProtectedRoute), FE-P0-007 (testApi.js) — **Done**  
**Задача:** [002-api-layer-hardening](./tasks/002-api-layer-hardening/task.md) — FE-P0-001..005 (API fixes) — **Done**

| PR | Finding | Изменения |
|----|---------|-----------|
| 1.1 | FE-P0-001 ✅ | `postSubmitOnboarding`: убрать `throw` до `handleError`, оставить только `handleError` |
| 1.2 | FE-P0-002 ✅ | `getProductsBySellerId`: добавить `return res` |
| 1.3 | FE-P0-003 ✅ | `getProductsByCategory`: убрать абсолютный URL → относительный |
| 1.4 | FE-P0-004 ✅ | `getOrders` (seller): убрать hardcoded `?courier_service=2` |
| 1.5 | FE-P0-005 ✅ | Консолидация onboarding state endpoint: оставить `getOnboardingStatus` в `onboarding.js`, обновить импорты, удалить `onbordingStatus.js`, обновить тест |
| 1.6 | FE-P0-006 ✅ | `ProtectedRoute`: читать из Redux state через `useSelector` вместо прямого `localStorage` |
| 1.7 | FE-P0-007 + FE-P3-003 ✅ | Удалить `src/api/testApi.js`; удалить импорт и route `/test` из `main.jsx`; `Test.jsx` → роут удалён (FE-001), файл удалён (FE-006) |

**Критерий закрытия Phase 1:** `npm run test` зелёный после каждого PR; импорт `testApi` и `onbordingStatus` не используется.

---

## Phase 2 — P1 Test Coverage

**Цель:** покрыть P0-сценарии из [test-matrix.md](./test-matrix.md); исправить инфраструктурные проблемы в test-utils.

**Гейт входа:** Phase 1 завершена. CI зелёный.

**Задачи:** [003-seller-onboarding-tests](./tasks/003-seller-onboarding-tests/task.md) ✅ Done, [004-products-and-search-tests](./tasks/004-products-and-search-tests/task.md) ✅ Done, [005-orders-flow-tests](./tasks/005-orders-flow-tests/task.md) ✅ Done

### 2.0 — Test infrastructure fixes (блокируют корректность тестов)

| PR | Finding | Действие |
|----|---------|---------|
| 2.0.1 ✅ | FE-P1-004 | `I18nextProvider` + `i18nTest` instance добавлены в `renderWithProviders` (FE-007) |
| 2.0.2 ✅ | FE-P1-007 | `setupStore()` + fresh store per test в `renderWithProviders` (FE-006) |
| 2.0.3 ✅ | FE-P1-005 | `resetNetworkToastShown()` helper добавлен (FE-006) |

### 2.1 — Anchor RTL tests (продолжение FE-T003)

| PR | Матрица P0 | Содержание |
|----|-----------|------------|
| 2.1.1 | Логин / регистрация | Yup-валидация полей (ошибки, успех), mock API при submit |
| 2.1.2 | Ошибки API / retry / toast | RTL на путь «запрос упал → пользователь видит toast» |
| 2.1.3 | Корзина / чекаут (state) | RTL на `basketSlice` — добавление, удаление, totalCount; `PaymentPage` — отображение форм доставки |

### 2.2 — Onboarding tests

| PR | Finding/матрица | Содержание |
|----|----------------|------------|
| 2.2.1 ✅ | FE-T003 + Seller | RTL для onboarding status step-navigation; mock `getOnboardingStatus` — Done |

### 2.3 — Products & Search tests ✅

| PR | Finding/матрица | Содержание |
|----|----------------|------------|
| 2.3.1 ✅ | FE-P0-002, FE-P0-003 | `getProductsBySellerId`, `getProductsByCategory`, `getProductById`, `getProducts` — unit тесты (15 тестов) |
| 2.3.2 ✅ | Поиск UI | `SearchPage` RTL: render/empty/results/URL param/category (6 тестов) |
| 2.3.3 ✅ | Каталог UI | `CatalogCard` RTL: render/backgroundImage/click (3 теста) |

### 2.4 — Orders & Basket tests ✅

| PR | Finding/матрица | Содержание |
|----|----------------|------------|
| 2.4.1 ✅ | Customer orders API | `orders.test.js` расширен: return values + error propagation (12 тестов) |
| 2.4.2 ✅ | Seller orders API | `seller/orders.test.js` новый: все 10 функций (20 тестов) |
| 2.4.3 ✅ | FE-P1-003 | `basketSlice.test.js` новый: 29 unit-тестов reducers |
| 2.4.4 ✅ | Корзина UI | `BasketCardBlock.test.jsx` RTL: empty/list/checkbox (8 тестов) |
| 2.4.5 ✅ | Orders UI | `MyOrdersPage.test.jsx` RTL: render/tabs (6 тестов) |

**Критерий закрытия Phase 2:** все P0-строки в [test-matrix.md](./test-matrix.md) имеют статус «Покрыто» или «Backlog (обоснованно)». FE-T003, FE-004, FE-005 → Done.

---

## Phase 3 — P2 Refactoring

**Цель:** снизить технический долг без изменения продуктового поведения.

**Гейт входа:** Phase 1 + Phase 2 завершены. Гейты G1–G4 из [refactoring-readiness-plan.md](./refactoring-readiness-plan.md) выполнены.

**Задача:** [006-refactoring-foundation](./tasks/006-refactoring-foundation/task.md) ✅ Done

| PR | Finding | Действие |
|----|---------|---------|
| 3.1 ✅ | FE-P2-001 | `React.lazy` + `Suspense` для всех page-компонентов в `main.jsx` |
| 3.2 ✅ | FE-P0-003 follow-up | Hardcoded URLs убраны из `productsSlice.js` (3 шт.) и `favorite.js` |
| 3.3 ✅ | FE-P1-005 | `resetNetworkToastShown()` экспортирован для тестов |
| 3.4 ✅ | FE-P1-007 | `setupStore()` + `renderWithProviders` fresh store per test |
| 3.5 ✅ | FE-005 follow-up | `getOrders`/`getOrderDetails` — silent catch → throw error |
| 3.6 ✅ | SearchPage | `data-testid="search-loading"` при `searchStatus === "loading"` |
| 3.7 ✅ | FE-P3-003 | `src/pages/Test.jsx` удалён |

**Отложено (следующие фазы):**
- FE-P2-003: `buildPaymentGroups` DRY в paymentSlice
- FE-P2-004: `applyInterceptors` DRY
- FE-P2-002: email-sync из basket reducers
- FE-P2-005: paymentSlice localStorage дублирование
- FE-P2-006: persist migration документация

Каждый PR: `npm run test` зелёный после merge.

---

## Phase 4 — P3 Playwright / E2E Expansion

**Цель:** покрыть критические пользовательские пути сквозными тестами.

**Гейт входа:** Phase 2 завершена (baseline RTL стабилен).

**Задача:** [008-playwright-e2e-foundation](./tasks/008-playwright-e2e-foundation/task.md) ✅ Done

| PR | Finding | Содержание |
|----|---------|---------|
| 4.0 ✅ | FE-008 | Smoke e2e: root/home/protected-redirect/search/wildcard — 5/5 passed |
| 4.1 ✅ | FE-009 | Playwright e2e: checkout happy path — basket/payment section 1, no PSP calls — 6/6 passed |
| 4.2 | FE-P3-001 follow-up | Playwright e2e: checkout sections 2–3 (delivery mock + payment form) |
| 4.3 ✅ | FE-010 | Playwright e2e: seller onboarding smoke (login/create-account/seller-type/application-sub) — 4/4 passed |
| 4.4 | — | Расширение матрицы P1 e2e по [test-matrix.md](./test-matrix.md) |
| 4.5 ✅ | FE-011 | Full-stack e2e: seller onboarding FS-001 (3 теста, Django + Postgres, proxy-forwarding, skip без бэкенда) |
| 4.6 ✅ | FE-012 | Full-stack e2e: checkout until payment session FS-002 (2 теста, real backend, PSP mocked, Redux state seeding, skip без бэкенда) |
| 4.7 ✅ | FE-013 | Full-stack e2e: payment confirmation + webhook lifecycle FS-003 (2 теста, webhook mock, Order/Invoice в DB, /my_orders UI, skip без бэкенда) |
| 4.8 ✅ | Task 018 | Full-stack e2e CI gate: job `e2e_fullstack` (FS-001/002/003, docker-compose e2e, отдельно от `e2e_frontend3`) |

---

## Сводная диаграмма

```mermaid
gantt
    title Frontend3 Stabilization Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 — P0 Stabilization
    API layer fixes (FE-P0-001..005)   :p0api, 2026-05-19, 5d
    Auth/routing fix + dead code       :p0auth, after p0api, 3d
    section Phase 2 — P1 Tests
    Test infra fixes (i18n, store)     :p1infra, after p0auth, 3d
    RTL: login/reg, API errors         :p1rtl1, after p1infra, 5d
    RTL: basket/checkout state         :p1rtl2, after p1rtl1, 5d
    RTL: onboarding tests              :p1onb, after p1rtl1, 4d
    section Phase 3 — P2 Refactoring
    Router lazy loading                :p2router, after p1rtl2, 5d
    Slice / API-layer cleanup          :p2slice, after p2router, 7d
    section Phase 4 — P3 E2E
    Checkout e2e                       :p3co, after p2slice, 5d
    Seller onboarding e2e              :p3onb, after p3co, 4d
```

---

## Связанные документы

- [frontend3-audit.md](./frontend3-audit.md) — детальные findings
- [test-matrix.md](./test-matrix.md) — матрица покрытия
- [refactoring-readiness-plan.md](./refactoring-readiness-plan.md) — гейты рефакторинга
- [tasks/README.md](./tasks/README.md) — все frontend-задачи
- [docs/roadmap.md](../roadmap.md) — общий агрегатор треков
