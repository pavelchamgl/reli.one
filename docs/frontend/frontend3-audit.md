# Frontend3 Stabilization Audit

**Date:** May 2026  
**Scope:** `Frontend/Frontend3` — полный аудит кодовой базы  
**Status:** Complete (Task 014)

---

## Опорные документы

- [docs/README.md](../README.md) — точка входа
- [docs/roadmap.md](../roadmap.md) — агрегированные треки
- [docs/frontend/test-matrix.md](./test-matrix.md) — матрица сценариев
- [docs/frontend/testing-plan.md](./testing-plan.md) — цели и стек
- [docs/09-architecture-debt.md](../09-architecture-debt.md) — технический долг
- [docs/tasks/README.md](../tasks/README.md) — бэкенд-задачи и статусы
- [docs/frontend/tasks/README.md](./tasks/README.md) — фронтенд-задачи

---

## Executive summary

`Frontend/Frontend3` — продуктовый SPA (React 18, Vite, Redux Toolkit + redux-persist, React Router v6). Приложение функционально и имеет фундамент тестирования (Vitest + RTL + Playwright smoke), однако содержит ряд P0-дефектов (тихие баги в API-слое, unreachable code в критичном onboarding flow), значимые проблемы надёжности (модульное состояние в тестовой среде, отсутствие i18n в `renderWithProviders`) и архитектурные долги (все маршруты в одном файле, дублирование логики в слайсах, side effects в Immer reducers).

Проект **готов к стабилизационным PR (P0)** и к постепенному наращиванию покрытия RTL (P1). Крупный рефакторинг (P2) блокируется незакрытыми P0/P1 гейтами из `refactoring-readiness-plan.md`.

---

## Структура проекта

```
Frontend/Frontend3/
├── src/
│   ├── api/               # HTTP-клиент, функции вызова API
│   │   ├── index.js       # axios mainInstance + formDataInstance + interceptors
│   │   ├── auth.js        # customer auth
│   │   ├── payment.js     # stripe/paypal/delivery
│   │   ├── orders.js      # customer orders
│   │   ├── productsApi.js # catalog, search
│   │   ├── favorite.js
│   │   ├── commentApi.js
│   │   ├── categoryApi.js
│   │   ├── banner/
│   │   ├── testApi.js     # ⚠️ dev artifact
│   │   └── seller/        # seller-specific API
│   ├── redux/             # 16 слайсов + store + persist
│   ├── pages/             # 48 страниц покупателя
│   ├── sellerPages/       # ~12 страниц продавца
│   ├── Components/        # переиспользуемые компоненты
│   ├── ui/                # примитивы UI
│   ├── code/              # утилиты, валидации, zipcode-справочники
│   ├── hook/              # кастомные хуки
│   ├── test/              # test-utils, setup
│   └── main.jsx           # точка входа: router + providers
├── e2e/                   # Playwright specs
├── .env.example           # шаблон переменных
├── package.json
├── vite.config.js
└── playwright.config.js
```

### Routing overview

- `/` — `HomePage` (root layout) → дочерние: главная, поиск, каталог, продукт, auth-страницы
- `/basket`, `/payment`, `/payment_end` — корзина и оплата (вне root layout)
- `/products-seller/:id` — страница продавца (вне root layout)
- `/seller/*` — `SellerPage` layout → 20+ дочерних маршрутов (онбординг, кабинет, заказы)
- `*` → `HomePage` (wildcard catch-all)

`ProtectedRoute` оборачивает все seller routes, требующие токена (goods, home, orders, create, edit, order detail).

---

## Findings

### P0 — Critical Stabilization

---

#### FE-P0-001: `postSubmitOnboarding` — unreachable `handleError` после `throw`

**Severity:** P0 — **Fixed** (FE-002, май 2026)  
**Файл:** `src/api/seller/onboarding.js`  
Убран `throw (error)` перед `handleError` — теперь ошибка нормализуется через `handleError(error, "Failed to submit onboarding data")`.

---

#### FE-P0-002: `getProductsBySellerId` — отсутствует `return`

**Severity:** P0 — **Fixed** (FE-002, май 2026)  
**Файл:** `src/api/productsApi.js`  
Добавлен `return res` — функция теперь возвращает данные вместо `undefined`.

---

#### FE-P0-003: `getProductsByCategory` — hardcoded production URL

**Severity:** P0 — **Fixed** (FE-002, май 2026)  
**Файл:** `src/api/productsApi.js`  
Заменён абсолютный URL на относительный `/products/categories/${category}` — `mainInstance` использует `VITE_API_URL`.  
**Follow-up Fixed** (FE-006, май 2026): Аналогичные hardcoded URL в `productsSlice.js` (3 шт.) и `favorite.js` (1 шт.) также заменены на относительные пути.

---

#### FE-P0-004: `getOrders` (seller) — hardcoded `?courier_service=2`

**Severity:** P0 — **Fixed** (FE-002, май 2026)  
**Файл:** `src/api/seller/orders.js`  
Убран `?courier_service=2`; сигнатура изменена на `getOrders(params = {})`. Фильтры передаются через axios `params`. Вызов без аргументов возвращает все заказы (backward compatible). Удалён мёртвый import из `NewSellerOrder.jsx`.

---

#### FE-P0-005: Duplicate onboarding state endpoint

**Severity:** P0 — **Fixed** (FE-002, май 2026)  
`src/api/seller/onbordingStatus.js` удалён. Тест `onbordingStatus.test.js` переведён на `getOnboardingStatus` из `onboarding.js`. Производственный код использовал только `getOnboardingStatus` из `onboarding.js`.

---

#### FE-P0-006: `ProtectedRoute` читает `localStorage` во время рендера — race с PersistGate

**Severity:** P0 — **Fixed** (FE-001, май 2026)  
**Файл:** `src/Components/ProtectedRoute/ProtectedRoute.jsx`  
**Описание:**  
`PersistGate` гидрирует Redux store асинхронно. `ProtectedRoute` читал `localStorage` напрямую, минуя Redux store. При логауте через Redux без очистки localStorage компонент оставался десинхронизирован.

**Исправление:**  
- Создан `src/redux/authSlice.js` (setToken / clearToken, persisted).
- `ProtectedRoute` читает `state.auth.token` через `useSelector`.
- Все login (7 компонентов) и logout (8 точек) диспатчат соответствующие actions.
- `api/index.js` interceptor диспатчит setToken / clearToken при refresh через storeInjector.

---

#### FE-P0-007: `testApi.js` — dead dev artifact в `src/api/`

**Severity:** P0 (security/quality) — **Fixed** (FE-001, май 2026)  
**Файл:** `src/api/testApi.js` — **удалён**; route `/test` — **удалён** из `main.jsx`.  
`src/pages/Test.jsx` оставлен (используется как площадка для IdentDocumInp, роут удалён; полное удаление в FE-006).

---

### P1 — High Priority: Tests & Reliability

---

#### FE-P1-001: RTL-тесты для login/registration формы отсутствуют

**Severity:** P1  
**Относится к:** `src/pages/SignUpPage.jsx`, login-компоненты  
**Описание:**  
В [test-matrix.md](./test-matrix.md) сценарий «Логин / регистрация (Yup)» имеет статус **Backlog** — тестов нет. Это P0-сценарий матрицы, без которого изменения форм аутентификации не имеют регрессий.

**Рекомендованное исправление:** FE-T003 (PR 1.1) — RTL-тест валидации Yup, ошибок полей, mock submit.

---

#### FE-P1-002: RTL-тесты для API errors / retry / toasts отсутствуют

**Severity:** P1  
**Относится к:** `src/api/index.js`, `src/ui/Toastify`  
**Описание:**  
Interceptor-логика (401 + refresh, network error + toast) не покрыта тестами. Любое изменение в interceptors рискует сломать UX незаметно.

---

#### FE-P1-003: RTL-тесты для корзины / чекаута отсутствуют

**Severity:** P1  
**Относится к:** `src/redux/basketSlice.js`, `src/pages/BasketPage.jsx`, `src/pages/PaymentPage.jsx`  
**Описание:**  
Критический P0-сценарий «Корзина / чекаут» в матрице — **Backlog**. Сложная логика корзины (корзины по email, sync, totalCount, selectedProducts) не покрыта.

---

#### FE-P1-004: `renderWithProviders` не включает i18n provider

**Severity:** P1 — **Fixed** (FE-007, май 2026)  
**Файл:** `src/test/test-utils.jsx`  
**Исправление:**  
- Создан `src/test/i18n-test.js` — лёгкий `i18n.createInstance()` с пустыми ресурсами. `t("key")` → `"key"`. Не читает localStorage, не загрязняет production singleton.  
- `renderWithProviders` теперь включает `<I18nextProvider i18n={i18nTest}>`.  
- Добавлен smoke-тест: компонент с `useTranslation` рендерится без ошибки.  
- Существующие тесты, мокающие `react-i18next`, продолжают работать без изменений.

---

#### FE-P1-005: `networkToastShown` — module-level мутабельное состояние в `src/api/index.js`

**Severity:** P1 — **Mitigated** (FE-006, май 2026)  
**Файл:** `src/api/index.js`  
**Описание:**  
```js
let networkToastShown = false; // module-level
```
Состояние не сбрасывается между тестами в Vitest (модуль кешируется). Тест, вызвавший network error, может повлиять на следующий тест — тост не появится, хотя должен.

**Исправление:** добавлена экспортируемая функция `resetNetworkToastShown()`. Runtime-поведение не изменено. Использовать в тестах: `beforeEach(() => resetNetworkToastShown())`. Closure/ref рефакторинг — follow-up.

---

#### FE-P1-006: Payment thunks используют `window.location.href` — untestable side effect

**Severity:** P1  
**Файл:** `src/redux/paymentSlice.js`, строки 88–90, 167–169  
**Описание:**  
```js
if (res.status === 200) {
    window.location.href = res.data.checkout_url; // ← глобальный side effect
}
```
Тест thunk'а (или компонента, его вызывающего) потребует мокать `window.location` — нестандартная операция в jsdom.

**Рекомендованное исправление:** при рефакторе (P2) — вынести redirect в компонент или роутер-экшен; для тестов (P1) — задокументировать mock-паттерн.

---

#### FE-P1-007: `renderWithProviders` использует singleton store — state bleeding между тестами

**Severity:** P1 — **Fixed** (FE-006, май 2026)  
**Файл:** `src/test/test-utils.jsx`  
**Описание:**  
```js
import { store } from "../redux/index.js"; // singleton
// ...
const { ..., storeInstance = store, ... } = options;
```
Тесты, мутирующие Redux state (dispatch action), могут влиять на последующие тесты, если store не сбрасывается.

**Исправление:** добавлена `setupStore(preloadedState = {})` в `redux/index.js` — создаёт non-persisted store с `rootReducer`. `renderWithProviders` использует `setupStore()` по умолчанию. Backward compatibility (опция `storeInstance`) сохранена.

---

### P2 — Refactoring Readiness

---

#### FE-P2-001: Все маршруты в `main.jsx` — нет lazy loading

**Severity:** P2 — **Fixed** (FE-006, май 2026)  
**Файл:** `src/main.jsx`  
**Описание:**  
`main.jsx` содержит ~50 `import` page-компонентов и весь граф маршрутов в одном файле. Нет `React.lazy` / `Suspense` — весь JS бандл загружается при первом открытии приложения.

**Исправление:** все page- и sellerPage-компоненты переведены на `React.lazy`. Добавлен `Suspense fallback={null}` вокруг `RouterProvider`. `ProtectedRoute` остался eager. Build генерирует отдельные chunk-файлы per page. Маршруты и URL не изменились.

---

#### FE-P2-002: Side effects в Immer reducers — прямое чтение `localStorage` внутри reducers

**Severity:** P2  
**Файл:** `src/redux/basketSlice.js` — ~10 reducers  
**Описание:**  
```js
// внутри reducer (Immer):
const email = JSON.parse(localStorage.getItem("email"));
```
Redux best practice — reducers должны быть pure functions. Чтение `localStorage` внутри reducer — side effect, усложняющий тестирование (нужно мокать `localStorage`) и отладку.

**Рекомендованное исправление:** передавать `email` в `action.payload` или хранить в отдельном `authSlice` в Redux state.

---

#### FE-P2-003: Дублирующая логика маппинга групп в `fetchCreateStripeSession` и `fetchCreatePayPalSession`

**Severity:** P2  
**Файл:** `src/redux/paymentSlice.js`  
**Описание:**  
Логика формирования `newGroups` (маппинг deliveryType, courier_service, pickup_point_id, delivery_mode, DPD special case) идентична в обоих thunk'ах — ~40 строк скопированного кода.

**Рекомендованное исправление:** вынести маппинг в `buildPaymentGroups(groups, paymentInfo, country, pointInfo)` и использовать из обоих thunk'ов.

---

#### FE-P2-004: `formDataInstance` дублирует interceptors из `mainInstance`

**Severity:** P2  
**Файл:** `src/api/index.js`  
**Описание:**  
`formDataInstance` и `mainInstance` — два отдельных axios-инстанса с независимо прикреплёнными идентичными интерсепторами (`responseInterceptor`, `successInterceptor`). При изменении interceptor-логики нужно обновлять оба места.

**Рекомендованное исправление:** выделить общую `applyInterceptors(instance)` и вызывать для обоих.

---

#### FE-P2-005: `paymentSlice` инициализирует state из `localStorage` при загрузке модуля

**Severity:** P2  
**Файл:** `src/redux/paymentSlice.js`, строки 5–7  
**Описание:**  
```js
const initialPaymentInfo = JSON.parse(localStorage.getItem("payment")) || {};
const delivery = JSON.parse(localStorage.getItem("delivery")) || [];
```
`payment` уже есть в whitelist `redux-persist`. Двойное чтение (из persist + из localStorage напрямую) создаёт два независимых источника правды. При тестировании — необходимо мокать localStorage.

---

#### FE-P2-006: `src/redux/index.js` — `migrations` на версию `PERSIST_VERSION` обнуляет `selfEmploed` slice

**Severity:** P2  
**Файл:** `src/redux/index.js`  
**Описание:**  
```js
const migrations = {
    [PERSIST_VERSION]: (state) => ({
        ...state,
        selfEmploed: undefined  // ← сброс при миграции
    })
}
```
При обновлении `PERSIST_VERSION` у пользователей, находящихся на процессе онбординга в состоянии `selfEmploed`, данные будут потеряны. Нет документации причин конкретной миграции.

---

### P3 — Enhancements & E2E

---

#### FE-P3-001: Нет e2e теста для checkout happy path

**Severity:** P3  
**Описание:**  
Playwright smoke только проверяет открытие корня SPA. Полный сценарий «добавить в корзину → оплата → Stripe redirect» не покрыт e2e.

---

#### FE-P3-002: Нет e2e теста для seller onboarding flow

**Severity:** P3  
**Описание:**  
Seller onboarding — сложный multi-step flow (login → type → personal/company info → bank → warehouse → submit → review). Ручная приёмка подтверждена (backend), но e2e UI-сценарий отсутствует.

---

#### FE-P3-003: `src/api/testApi.js`, `/test` route — dev artifacts в src/

**Severity:** P3 — **Fixed** (FE-001 + FE-006, май 2026)  
**Файлы:** `src/api/testApi.js` — удалён (FE-001); route `/test` — удалён (FE-001); `src/pages/Test.jsx` — удалён (FE-006). Ни один production-файл не импортировал `Test.jsx`.

---

## Contract mismatches и наблюдения

| Область | Наблюдение |
|---------|-----------|
| Seller orders API | `getOrders` в `src/api/seller/orders.js` фильтрует только `courier_service=2`; backend поддерживает фильтр как необязательный |
| Onboarding state | Два файла вызывают один endpoint — `onbordingStatus.js` (typo) и `onboarding.js#getOnboardingStatus` |
| Products by category | `getProductsByCategory` использует абсолютный prod URL вместо `VITE_API_URL` |
| Products by seller | `getProductsBySellerId` не возвращает данные |
| Payment redirect | Redirect через `window.location.href` в Redux thunk — не контракт, но архитектурно неудобно |
| Onboarding submit errors | `postSubmitOnboarding` бросает сырой `AxiosError` из-за unreachable `handleError` |

---

## Состояние тестирования

| Категория | Состояние |
|-----------|-----------|
| Vitest + RTL | Установлен и работает (`npm run test` зелёный, 121/121) |
| `renderWithProviders` | Есть; `setupStore()` fresh store (FE-006) + `I18nextProvider` (FE-007) — полностью изолирован |
| API unit тесты | 6 файлов: `orders.test.js` (12), `productsApi.test.js` (15), `onbordingStatus.test.js`, `onboarding.test.js`, `seller/orders.test.js` (20) |
| RTL component tests | 5 файлов: `ProtectedRoute.test.jsx`, `renderWithProviders.test.jsx`, `SellerTypeContent.test.jsx`, `CatalogCard.test.jsx`, `BasketCardBlock.test.jsx` |
| RTL page tests | 2 файла: `SearchPage.test.jsx`, `MyOrdersPage.test.jsx` |
| Redux unit tests | 1 файл: `basketSlice.test.js` (29 тестов) |
| Playwright smoke | Покрыт (`e2e/smoke.spec.js`), CI job `e2e_frontend3` |
| Login/reg форм | **Backlog** — не реализованы |
| API errors/retry | **Backlog** — не реализованы |
| Basket/checkout RTL | **Backlog** — не реализованы |
| Checkout e2e happy path | **Backlog** — не реализованы |
| Seller onboarding e2e | **Backlog** — не реализованы |

Детали: [test-matrix.md](./test-matrix.md).

---

## Сводная таблица findings

| ID | Severity | Область | Краткое описание |
|----|----------|---------|-----------------|
| FE-P0-001 | **P0** ✅ Fixed | API / Onboarding | unreachable `handleError` в `postSubmitOnboarding` |
| FE-P0-002 | **P0** ✅ Fixed | API / Catalog | `getProductsBySellerId` не возвращает данные |
| FE-P0-003 | **P0** ✅ Fixed | API / Catalog | `getProductsByCategory` — hardcoded prod URL |
| FE-P0-004 | **P0** ✅ Fixed | API / Seller Orders | `getOrders` hardcoded `?courier_service=2` |
| FE-P0-005 | **P0** ✅ Fixed | API / Onboarding | Дублирующий onboarding state endpoint + typo в имени файла |
| FE-P0-006 | **P0** ✅ Fixed | Auth / Routing | `ProtectedRoute` читает localStorage напрямую |
| FE-P0-007 | **P0** ✅ Fixed | Code Quality | `testApi.js` — dead dev artifact |
| FE-P1-001 | P1 | Tests | RTL login/reg отсутствует |
| FE-P1-002 | P1 | Tests | RTL API errors/retry/toasts отсутствует |
| FE-P1-003 | P1 ✅ Partial | Tests | basketSlice unit + BasketCardBlock RTL покрыты; PaymentPage + interceptors — backlog |
| FE-P1-004 | P1 ✅ Fixed | Tests | `I18nextProvider` добавлен в `renderWithProviders` |
| FE-P1-005 | P1 ✅ Mitigated | Tests | module-level `networkToastShown` — `resetNetworkToastShown()` helper добавлен |
| FE-P1-006 | P1 | Tests / Architecture | `window.location.href` в Redux thunk |
| FE-P1-007 | P1 ✅ Fixed | Tests | `setupStore()` + fresh `renderWithProviders` |
| FE-P2-001 | P2 ✅ Fixed | Architecture | `React.lazy` + `Suspense` для всех page-компонентов |
| FE-P2-002 | P2 | Architecture | `localStorage` read в Immer reducers (side effect) |
| FE-P2-003 | P2 | Architecture | Дублирование логики маппинга групп Stripe/PayPal |
| FE-P2-004 | P2 | Architecture | `formDataInstance` дублирует interceptors |
| FE-P2-005 | P2 | Architecture | Двойная инициализация `paymentSlice` из localStorage + persist |
| FE-P2-006 | P2 | Architecture | persist migration `selfEmploed: undefined` без документации |
| FE-P3-001 | P3 | E2E | Нет checkout e2e happy path |
| FE-P3-002 | P3 | E2E | Нет seller onboarding e2e |
| FE-P3-003 | P3 ✅ Fixed | Code Quality | все dev artifacts удалены (`/test`, `testApi.js`, `Test.jsx`) |

---

## Результаты проверки

`npm run lint` — зелёный (0 errors, есть warnings).  
`npm run test` — зелёный (Vitest, 122/122 после FE-007).  
`npm run build` — зелёный.  
CI jobs `frontend3` и `e2e_frontend3` — зелёные.

---

*Рекомендуемый порядок реализации и декомпозиция на задачи: [frontend3-roadmap.md](./frontend3-roadmap.md).*
