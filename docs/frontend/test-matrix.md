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
| Логин / регистрация (Yup) | P0 | RTL | Backlog | — |
| Ошибки API / retry, тосты | P0 | RTL | Backlog | — |
| Корзина / чекаут (basketSlice + BasketCardBlock) | P0 | Unit + RTL | Покрыто (частично) | [`src/redux/basketSlice.test.js`](../../Frontend/Frontend3/src/redux/basketSlice.test.js), [`BasketCardBlock.test.jsx`](../../Frontend/Frontend3/src/Components/Basket/BasketCardBlock/BasketCardBlock.test.jsx) |
| Smoke: корень SPA открывается | P1 | e2e | Покрыто | [`e2e/smoke.spec.js`](../../Frontend/Frontend3/e2e/smoke.spec.js), CI job `e2e_frontend3` |

## Frontend2 — сценарии

| Сценарий | Приоритет | Уровень | Статус | Файлы в репо |
|----------|-----------|---------|--------|----------------|
| Дымовой тест Vitest | P1 | Unit | Покрыто | [`src/landing-smoke.test.js`](../../Frontend/Frontend2/src/landing-smoke.test.js) |
| Формы лендинга (Formik) | P1 | Unit / RTL | Backlog | — |
| Ключевые CTA и навигация | P1 | e2e | Backlog | — |

**CI:** см. предупреждение в [README ./README.md](./README.md) — `lint` во Frontend2 сейчас **не зелёный**, job **`frontend2`** обычно падает до `test`.

## Связанные таски

- [FE-T001–FE-T005](./tasks/README.md)
- [Дорожная карта до рефакторинга Frontend3](./refactoring-readiness-plan.md)
