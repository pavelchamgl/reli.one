# Матрица тестов Frontend3 / Frontend2

Согласовано с [testing-plan.md](./testing-plan.md) и [08-testing-strategy.md](../08-testing-strategy.md). Колонка **Файлы в репо** — фактическое расположение тестов.

## Конвенции

| Тема | Решение |
|------|---------|
| Файлы тестов | Рядом с кодом: `*.test.js(x)`; e2e Playwright — `e2e/*.spec.js` |
| Раннер | Vitest (`npm run test` / `npm run test:watch`) |
| Компоненты | `@testing-library/react`, `@testing-library/user-event` (зависимости есть в **Frontend3**; во **Frontend2** в тестах пока без RTL-компонентных кейсов) |
| Среда **Frontend3** | `jsdom`; `setupFiles`: [`Frontend/Frontend3/src/test/polyfill-localstorage.js`](../../Frontend/Frontend3/src/test/polyfill-localstorage.js) (до импорта Redux), затем [`setup.js`](../../Frontend/Frontend3/src/test/setup.js) (`@testing-library/jest-dom/vitest`) |
| Среда **Frontend2** | `jsdom`; [`Frontend/Frontend2/src/test/setup.js`](../../Frontend/Frontend2/src/test/setup.js) |
| Обёртка | **`renderWithProviders`**: [`Frontend/Frontend3/src/test/test-utils.jsx`](../../Frontend/Frontend3/src/test/test-utils.jsx) — Redux `Provider` + `I18nextProvider` (тестовый instance, `t(key)→key`) + `MemoryRouter`. Все три провайдера включены по умолчанию (FE-007). |
| Vitest vs Playwright | В **`vite.config.js` Frontend3** каталог **`e2e/**` в `test.exclude`**, иначе Vitest попытается грузить Playwright-спеки |
| HTTP | **Сейчас:** `vi.mock` на модуль API (`orders.test.js`, `productsApi.test.js`, `onbordingStatus.test.js`, `onboarding.test.js`). **MSW** — не подключён |
| Sentry / OAuth | Не дергать реальные SDK в unit/RTL; при необходимости — мок модулей / env |

## Frontend3 — сценарии

| Сценарий | Приоритет | Уровень | Статус | Файлы в репо |
|----------|-----------|---------|--------|----------------|
| Защита маршрутов продавца (`ProtectedRoute`, редирект без токена) | P0 | RTL | Покрыто | [`src/Components/ProtectedRoute/ProtectedRoute.test.jsx`](../../Frontend/Frontend3/src/Components/ProtectedRoute/ProtectedRoute.test.jsx) |
| API заказов: URL детали, `not_closed`, `closed` | P0 | Unit | Покрыто | [`src/api/orders.test.js`](../../Frontend/Frontend3/src/api/orders.test.js) |
| Поиск товаров: корректный path query | P0 | Unit | Покрыто | [`src/api/productsApi.test.js`](../../Frontend/Frontend3/src/api/productsApi.test.js) |
| Товары продавца: `getProductsBySellerId` возвращает данные (fix FE-P0-002) | P1 | Unit | Покрыто | [`src/api/productsApi.test.js`](../../Frontend/Frontend3/src/api/productsApi.test.js) |
| Категория товаров: `getProductsByCategory` относительный path (fix FE-P0-003) | P1 | Unit | Покрыто | [`src/api/productsApi.test.js`](../../Frontend/Frontend3/src/api/productsApi.test.js) |
| `getProductById` / `getProducts` + error handling | P1 | Unit | Покрыто | [`src/api/productsApi.test.js`](../../Frontend/Frontend3/src/api/productsApi.test.js) |
| SearchPage: render, пустой/непустой результат, URL param, категории, loading state | P1 | RTL | Покрыто | [`src/pages/SearchPage.test.jsx`](../../Frontend/Frontend3/src/pages/SearchPage.test.jsx) |
| CatalogCard: render, background image, click dispatch | P1 | RTL | Покрыто | [`src/Components/Catalog/CatalogCard/CatalogCard.test.jsx`](../../Frontend/Frontend3/src/Components/Catalog/CatalogCard/CatalogCard.test.jsx) |
| Customer orders API: endpoint, return values, error propagation | P1 | Unit | Покрыто | [`src/api/orders.test.js`](../../Frontend/Frontend3/src/api/orders.test.js) |
| Seller orders API: getOrders/getOrderDetails/confirm/shipped/cancel/labels | P1 | Unit | Покрыто | [`src/api/seller/orders.test.js`](../../Frontend/Frontend3/src/api/seller/orders.test.js) |
| basketSlice: add/delete/select/count/clear/paymentEnd/sync/delivery | P0 | Unit | Покрыто | [`src/redux/basketSlice.test.js`](../../Frontend/Frontend3/src/redux/basketSlice.test.js) |
| BasketCardBlock: empty state, item list, count, checkbox, filtered | P0 | RTL | Покрыто | [`src/Components/Basket/BasketCardBlock/BasketCardBlock.test.jsx`](../../Frontend/Frontend3/src/Components/Basket/BasketCardBlock/BasketCardBlock.test.jsx) |
| MyOrdersPage: render, current/history tab switch | P1 | RTL | Покрыто | [`src/pages/MyOrdersPage.test.jsx`](../../Frontend/Frontend3/src/pages/MyOrdersPage.test.jsx) |
| Статус онбординга продавца | P0 | Unit | Покрыто | [`src/api/seller/onbordingStatus.test.js`](../../Frontend/Frontend3/src/api/seller/onbordingStatus.test.js) |
| `handleError` + onboarding API endpoints | P0 | Unit | Покрыто | [`src/api/seller/onboarding.test.js`](../../Frontend/Frontend3/src/api/seller/onboarding.test.js) |
| Seller type selection (RTL) | P1 | RTL | Покрыто | [`src/Components/Seller/auth/sellerTypeContent/SellerTypeContent.test.jsx`](../../Frontend/Frontend3/src/Components/Seller/auth/sellerTypeContent/SellerTypeContent.test.jsx) |
| Дым обёртки `renderWithProviders` + i18n provider | P0 | RTL | Покрыто | [`src/test/renderWithProviders.test.jsx`](../../Frontend/Frontend3/src/test/renderWithProviders.test.jsx) |
| Логин / регистрация (Yup) | P0 | RTL | Покрыто | [`LoginModal.test.jsx`](../../Frontend/Frontend3/src/Components/LoginModal/LoginModal.test.jsx), [`SignUpForm.test.jsx`](../../Frontend/Frontend3/src/Components/ProfileNav/SignUp/SignUpForm.test.jsx) |
| Ошибки API / retry, тосты | P0 | Unit | Покрыто | [`src/api/index.test.js`](../../Frontend/Frontend3/src/api/index.test.js) — network toast dedup, 401 refresh/retry, failed refresh → session toast + clearToken |
| Корзина / чекаут (basketSlice + BasketCardBlock) | P0 | Unit + RTL | Покрыто (частично) | [`src/redux/basketSlice.test.js`](../../Frontend/Frontend3/src/redux/basketSlice.test.js), [`BasketCardBlock.test.jsx`](../../Frontend/Frontend3/src/Components/Basket/BasketCardBlock/BasketCardBlock.test.jsx) |
| Smoke: корень SPA открывается | P1 | e2e | Покрыто | [`e2e/smoke.spec.js`](../../Frontend/Frontend3/e2e/smoke.spec.js), CI job `e2e_frontend3` |
| Smoke: home page app shell mount | P1 | e2e | Покрыто | [`e2e/smoke.spec.js`](../../Frontend/Frontend3/e2e/smoke.spec.js) |
| Smoke: protected seller route → /seller/login redirect | P1 | e2e | Покрыто | [`e2e/smoke.spec.js`](../../Frontend/Frontend3/e2e/smoke.spec.js) |
| Smoke: search page loads | P1 | e2e | Покрыто | [`e2e/smoke.spec.js`](../../Frontend/Frontend3/e2e/smoke.spec.js) |
| Smoke: unknown route → wildcard fallback | P1 | e2e | Покрыто | [`e2e/smoke.spec.js`](../../Frontend/Frontend3/e2e/smoke.spec.js) |
| Checkout: basket page открывается (пустая корзина) | P1 | e2e | Покрыто | [`e2e/checkout.spec.js`](../../Frontend/Frontend3/e2e/checkout.spec.js) |
| Checkout: basket page с товаром из Redux state | P1 | e2e | Покрыто | [`e2e/checkout.spec.js`](../../Frontend/Frontend3/e2e/checkout.spec.js) |
| Checkout: basket → payment навигация через кнопку Continue | P0 | e2e | Покрыто | [`e2e/checkout.spec.js`](../../Frontend/Frontend3/e2e/checkout.spec.js) |
| Checkout: payment section 1 (адресная форма) рендерится | P0 | e2e | Покрыто | [`e2e/checkout.spec.js`](../../Frontend/Frontend3/e2e/checkout.spec.js) |
| Checkout: нет Stripe/PayPal вызовов на section 1 | P0 | e2e | Покрыто | [`e2e/checkout.spec.js`](../../Frontend/Frontend3/e2e/checkout.spec.js) |
| Seller onboarding: login page загружается | P1 | e2e | Покрыто | [`e2e/seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/seller-onboarding.spec.js) |
| Seller onboarding: create-account page загружается | P1 | e2e | Покрыто | [`e2e/seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/seller-onboarding.spec.js) |
| Seller onboarding: seller-type page рендерит выбор типа (мок API) | P1 | e2e | Покрыто | [`e2e/seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/seller-onboarding.spec.js) |
| Seller onboarding: application-sub показывает confirmation (мок API) | P1 | e2e | Покрыто | [`e2e/seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/seller-onboarding.spec.js) |
| Seller onboarding: seller-review page (mock review API) | P1 | e2e | Покрыто | [`e2e/seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/seller-onboarding.spec.js) |
| Seller onboarding: under-review / action-required / finish-verification / verified-analyt | P1 | e2e | Покрыто | [`e2e/seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/seller-onboarding.spec.js) |
| FS-001: full-stack onboarding API + UI (backend contour) | P0 | e2e | Покрыто | [`e2e/fullstack-seller-onboarding.spec.js`](../../Frontend/Frontend3/e2e/fullstack-seller-onboarding.spec.js) |

## FE-014 — Stock Availability Display

| Сценарий | Приоритет | Уровень | Статус | Файлы в репо |
|----------|-----------|---------|--------|----------------|
| Catalog/list card stock badge, disabled Buy, detail-stock fallback | P1 | RTL | Покрыто | [`ProductCard.test.jsx`](../../Frontend/Frontend3/src/Components/Product/ProductCard/ProductCard.test.jsx) |
| Product detail selected variant availability, sku init, Add-to-cart guard | P1 | RTL | Покрыто | [`ProductNameRate.test.jsx`](../../Frontend/Frontend3/src/Components/Product/ProductNameRate/ProductNameRate.test.jsx), [`ProdCharackButtons.test.jsx`](../../Frontend/Frontend3/src/Components/Product/ProdCharakButtons/ProdCharackButtons.test.jsx), [`ProductPage.test.jsx`](../../Frontend/Frontend3/src/pages/ProductPage.test.jsx) |
| Mobile/generic variant drawer stock guard | P1 | RTL | Покрыто | [`MobVariantDrawer.test.jsx`](../../Frontend/Frontend3/src/Components/Product/MobVariantDrawer/MobVariantDrawer.test.jsx) |
| Basket modal and basket page stale out-of-stock handling | P1 | RTL | Покрыто | [`BasketModalCard.test.jsx`](../../Frontend/Frontend3/src/Components/Basket/BasketModalCard/BasketModalCard.test.jsx), [`BasketCard.test.jsx`](../../Frontend/Frontend3/src/Components/Basket/BasketCard/BasketCard.test.jsx) |
| Shared stock availability helpers and basket reducer guard | P1 | Unit | Покрыто | [`stockAvailability.test.js`](../../Frontend/Frontend3/src/utils/stockAvailability.test.js), [`basketSlice.test.js`](../../Frontend/Frontend3/src/redux/basketSlice.test.js) |
| Checkout 409 stock error mapping and UI message | P0 | Unit + RTL | Покрыто | [`paymentSlice.test.js`](../../Frontend/Frontend3/src/redux/paymentSlice.test.js), [`PaymentPlataBlock.test.jsx`](../../Frontend/Frontend3/src/Components/Payment/PaymentPlataBlock/PaymentPlataBlock.test.jsx) |

## Frontend2 — сценарии

| Сценарий | Приоритет | Уровень | Статус | Файлы в репо |
|----------|-----------|---------|--------|----------------|
| Дымовой тест Vitest | P1 | Unit | Покрыто | [`src/landing-smoke.test.js`](../../Frontend/Frontend2/src/landing-smoke.test.js) |
| Формы лендинга (Formik) | P1 | Unit / RTL | Backlog | — |
| Ключевые CTA и навигация | P1 | e2e | Backlog | — |

**CI:** job **`frontend2`** — lint → test → build (ESLint 0 errors; warnings допустимы, см. [README ./README.md](./README.md)).

---

## UI migration gates — Seller onboarding (shadcn/ui)

Связь с [shadcn-ui-migration-plan.md](./shadcn-ui-migration-plan.md) и [seller-onboarding-ui-inventory.md](./seller-onboarding-ui-inventory.md). Статусы обновляются по мере выполнения FE-015–FE-021.

| Gate | Сценарий | Уровень | Статус | Задача |
|------|----------|---------|--------|--------|
| G-UI-1 | shadcn foundation: build + smoke routes не регрессят | build/manual + e2e | Покрыто | FE-015 — `fe015-foundation-smoke.spec.js`, dev + preview 2/2 |
| G-UI-2 | Inventory onboarding + test gap list | docs | Покрыто | FE-016 — [seller-onboarding-ui-inventory.md](./seller-onboarding-ui-inventory.md) |
| G-UI-3 | Layout shell RTL smoke | RTL | Покрыто | FE-017 — `SellerOnboardingLayout.test.jsx` |
| G-UI-4 | Auth/entry: `seller-onboarding.spec.js` 4/4 | e2e + RTL | Покрыто | FE-018 |
| G-UI-5 | Data steps: bank/personal RTL + FS-001 | RTL + e2e | Partial (RTL ✓, FS-001 API ✓) | FE-019 / FE-021 |
| G-UI-6 | Review submit error + status pages | RTL + e2e | Покрыто | FE-020 — RTL + `seller-onboarding.spec.js` 9/9 |
| G-UI-7 | No `@mui` in onboarding zone | grep audit | Backlog | FE-021 |

**Правило:** перед merge PR миграции экрана — соответствующий gate минимум **Partial** (RTL/e2e зелёные); после FE-021 — **Done**.

### UI migration — onboarding test backlog (FE-016)

Якоря добавлять **в том же PR**, что и shadcn UI для экрана (см. inventory). **4 P0 RTL gaps** (строки ниже, Backlog) + **P0 regression gate** (последняя строка, уже Покрыто).

| Сценарий | Приоритет | Уровень | Статус | Добавить в | Файл теста (целевой) |
|----------|-----------|---------|--------|------------|----------------------|
| LoginForm: Yup validation + submit state | P0 | RTL | Покрыто | FE-018 | `LoginForm.test.jsx` |
| CreateForm: Yup + agree checkbox | P0 | RTL | Покрыто | FE-018 | `CreateForm.test.jsx` |
| ApplicationSubmited: status UI (mock state) | P1 | RTL | Backlog | FE-018 | `ApplicationSubmited.test.jsx` |
| BankAccount: API validation errors displayed | P0 | RTL | Покрыто | FE-019 | `BankAccount.test.jsx` |
| Review submit: failed submit + completeness | P0 | RTL | Покрыто | FE-020 | `ReviewInfoPage.test.jsx` |
| Seller onboarding UI: must stay green (regression) | P0 | e2e + unit | Покрыто | FE-016 gate | см. inventory § Test gates |

## Связанные таски

- [FE-T001–FE-T005](./tasks/README.md)
- [Дорожная карта до рефакторинга Frontend3](./refactoring-readiness-plan.md)
