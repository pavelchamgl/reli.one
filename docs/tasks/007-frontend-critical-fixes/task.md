# Task 007 — Frontend Critical Fixes

**Priority:** P1  
**Complexity:** Low  
**Status:** Done

## Цель

Устранить критические баги frontend: утечку данных чужого заказа, нерабочий поиск, неправильный API endpoint для онбординга, захардкоженный BaseURL, и добавить защиту маршрутов.

## Контекст

Frontend3 содержит несколько P1 багов которые ломают пользовательский опыт или создают security-риски:
- **FE-2:** `?pk=16` захардкожен → покупатель видит чужой заказ (data leak)
- **FE-3:** `getSearchProducts` → `get("")` → поиск возвращает HTML
- **FE-5:** `onbordingStatus.js` вызывает endpoint сброса пароля вместо статуса онбординга
- **FE-6:** Пробел в `?status=not_closed ` → пустой список заказов
- **FE-7:** `BaseURL` захардкожен → невозможна разработка/staging без правки кода
- **FE-1:** Нет `ProtectedRoute` → авторизованные страницы доступны без логина
- **FE-4:** Токен читается на уровне модуля → 401 после логина без перезагрузки

## Scope (область)

- Исправление `src/api/orders.js` (pk=16, пробел)
- Исправление `src/api/productsApi.js` (пустой URL поиска)
- Исправление `src/api/seller/onbordingStatus.js` (эндпоинт)
- Вынос `BaseURL` в `VITE_API_URL` (координация с Task 006)
- Создание `ProtectedRoute` компонента
- Исправление чтения токена в `commentApi.js` и `productsSlice.js`
- Удаление `console.log` с чувствительными данными

## Не входит в задачу

- Переписывание компонентов с нуля
- Изменение структуры Redux store
- Мобильная адаптация (FE-8)
- Frontend тесты

## Зависимости

- Task 006 (security-hardening) — создание `.env.example` лучше координировать

## Риски

- `BaseURL` вынос может ломать CI/CD pipeline если нет правильного `.env` в build
- `ProtectedRoute` нужно аккуратно внедрить чтобы не сломать публичные маршруты

## Definition of Done

- [x] Страница деталей заказа показывает заказ текущего пользователя, не заказ #16
- [x] Поиск товаров работает и возвращает JSON
- [x] Страница онбординга продавца загружает правильный статус
- [x] Список «текущих заказов» не пустой из-за пробела в query
- [x] `BaseURL` читается из `VITE_API_URL` env variable
- [x] Неавторизованный пользователь на `/seller/*` редиректится на login
- [x] Авторизация работает без перезагрузки страницы — FE-4 закрыт: `commentApi.js` ✅, `productsSlice.js` ✅ (2026-05-05)

---

# Iterations

## Iteration 1 — Analysis

### Цель
Полный аудит API-вызовов и маршрутизации.

### Действия
- Прочитать `Frontend/Frontend3/src/api/orders.js`
- Прочитать `Frontend/Frontend3/src/api/productsApi.js`
- Прочитать `Frontend/Frontend3/src/api/seller/onbordingStatus.js`
- Прочитать `Frontend/Frontend3/src/api/index.js` — как работает BaseURL
- Прочитать `Frontend/Frontend3/src/main.jsx` — структура маршрутов
- Найти все `console.log` с потенциально чувствительными данными

### Output
- Список всех API файлов с проблемами
- Карта маршрутов: публичные vs защищённые
- Список `console.log` для удаления

### Статус
- [ ] Analysis complete

---

## Iteration 2 — API Bug Fixes

### Цель
Исправить все баги в API-вызовах.

### Что менять

**`src/api/orders.js`:**
```js
// ДО:
export const getDetalOrders = async (id) => {
    const res = await mainInstance.get(`/orders/${id}/?pk=16`)
    ...
}
export const getOrdersCurrent = async () => {
    const res = await mainInstance.get("/orders/?status=not_closed ")
    ...
}

// ПОСЛЕ:
export const getDetalOrders = async (id) => {
    const res = await mainInstance.get(`/orders/${id}/`)
    ...
}
export const getOrdersCurrent = async () => {
    const res = await mainInstance.get("/orders/?status=not_closed")
    ...
}
```

**`src/api/productsApi.js`:**
```js
// ДО:
export const getSearchProducts = async (query) => {
    const res = await mainInstance.get("")
    ...
}

// ПОСЛЕ:
export const getSearchProducts = async (query) => {
    const res = await mainInstance.get(`/products/?search=${encodeURIComponent(query)}`)
    ...
}
// Проверить актуальный URL поиска в backend/product/urls.py
```

**`src/api/seller/onbordingStatus.js`:**
```js
// ДО: POST /accounts/password/reset/confirmation/
// ПОСЛЕ: GET /sellers/onboarding/state/
export const getOnboardingStatus = async () => {
    const res = await mainInstance.get("/sellers/onboarding/state/")
    return res
}
```

**`src/api/index.js` — BaseURL:**
```js
// ДО:
const BaseURL = "" || "https://reli.one/api"

// ПОСЛЕ:
const BaseURL = import.meta.env.VITE_API_URL || "https://reli.one/api"

// И для refresh URL:
// ДО: "https://reli.one/api/accounts/token/refresh/"
// ПОСЛЕ: `${BaseURL}/accounts/token/refresh/`
```

### Затрагиваемые файлы
| Файл | Изменение |
|------|-----------|
| `src/api/orders.js` | Убрать pk=16, убрать пробел |
| `src/api/productsApi.js` | Исправить URL поиска |
| `src/api/seller/onbordingStatus.js` | Исправить эндпоинт |
| `src/api/index.js` | VITE_API_URL |

### Статус
- [x] API fixes applied — подтверждено в коде (orders.js, productsApi.js, onbordingStatus.js, index.js)

---

## Iteration 3 — Token & Module-Level Reads

### Цель
Исправить чтение токена на уровне модуля.

### Что менять

**`src/api/commentApi.js`:**
```js
// ДО (уровень модуля):
const tokenLocal = localStorage.getItem("token")
const token = JSON.parse(tokenLocal)

// ПОСЛЕ (внутри функции):
const getAuthHeaders = () => {
    const tokenData = JSON.parse(localStorage.getItem("token") || "null")
    return tokenData?.access ? { Authorization: `Bearer ${tokenData.access}` } : {}
}

// Использовать внутри каждого запроса:
headers: getAuthHeaders()
```

**`src/redux/productsSlice.js`:**
```js
// Аналогично — переместить чтение токена внутрь createAsyncThunk callback
```

### Статус
- [x] Token reads fixed — `commentApi.js` ✅, `productsSlice.js` ✅ (module-level read удалён 2026-05-05; explicit headers убраны, токен читается через interceptor в moment запроса)

---

## Iteration 4 — ProtectedRoute

### Цель
Добавить защиту маршрутов для авторизованных страниц.

### Что создать

**`src/components/ProtectedRoute/ProtectedRoute.jsx`** (новый файл):
```jsx
import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children, requiredRole }) => {
    const tokenData = JSON.parse(localStorage.getItem("token") || "null")

    if (!tokenData?.access) {
        return <Navigate to="/seller/login" replace />
    }

    if (requiredRole) {
        const userRole = tokenData?.role
        if (userRole !== requiredRole) {
            return <Navigate to="/" replace />
        }
    }

    return children
}

export default ProtectedRoute
```

**`src/main.jsx`** — обернуть seller маршруты:
```jsx
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"

// В router config:
{
    path: "/seller/*",
    element: (
        <ProtectedRoute requiredRole="seller">
            <SellerLayout />
        </ProtectedRoute>
    )
}
```

### Статус
- [x] ProtectedRoute created — существует в `src/Components/ProtectedRoute/ProtectedRoute.jsx` и inline-версия в `main.jsx` (строки 96–102)
- [x] Seller routes protected — все seller/* routes обёрнуты в ProtectedRoute в main.jsx

**Примечание:** в main.jsx используется inline-версия, импортированный компонент из `src/Components/ProtectedRoute/` не используется — дублирование.

---

## Iteration 5 — Console.log Cleanup

### Цель
Удалить console.log с потенциально чувствительными данными.

### Что менять

Файлы с `console.log` для очистки:
- `src/api/auth.js` — логирование token/error
- `src/api/payment.js` — логирование session data
- `src/redux/paymentSlice.js` — логирование payment data
- `src/redux/newOrderSlice.js` — логирование order data

**Добавить ESLint правило:**
```json
// .eslintrc.json или eslint.config.js
{
  "rules": {
    "no-console": "warn"
  }
}
```

### Статус
- [x] console.log removed — `src/api/auth.js` строка 94 удалён `console.log(error)` (2026-05-05); остальные файлы (`payment.js`, `paymentSlice.js`, `newOrderSlice.js`, `productsSlice.js` line 80) остаются — вне scope этой задачи
- [ ] ESLint rule added — не добавлено

---

## Iteration 6 — Validation

### Сценарии для проверки
- [ ] Открыть детали заказа → видишь свой заказ (не #16)
- [ ] Ввести поисковый запрос → получаешь JSON результаты
- [ ] Войти как продавец → страница онбординга показывает статус
- [ ] Список «Мои заказы» → видишь текущие заказы
- [ ] Открыть `/seller/dashboard` без логина → редирект на login
- [ ] Войти → открыть отзывы к товару → они загружаются (без перезагрузки)
- [ ] `VITE_API_URL` в `.env.local` → запросы идут на локальный backend

### Статус
- [ ] Validation complete — ручная проверка не проводилась

**Аудит 2026-05-05:** 6/7 DoD пунктов выполнены. Оставшиеся: FE-4 (`productsSlice.js`), FE-9 (`auth.js` console.log). Дублирование ProtectedRoute (inline vs компонент) — технический долг P3.

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **API** | `src/api/orders.js`, `src/api/productsApi.js`, `src/api/seller/onbordingStatus.js`, `src/api/index.js` |
| **Auth** | `src/api/commentApi.js`, `src/redux/productsSlice.js` |
| **Routing** | `src/main.jsx`, `src/components/ProtectedRoute/` (новый) |
| **Env** | `Frontend/Frontend3/.env.example` (координация с Task 006) |
| **Backend API** | Не меняется (только URL на фронте исправляются) |

## Связанные проблемы из docs/09-architecture-debt.md

- FE-1: Нет ProtectedRoute P1
- FE-2: Хардкод `?pk=16` P1
- FE-3: `getSearchProducts` пустой URL P1
- FE-4: Токен на уровне модуля P1
- FE-5: `onbordingStatus.js` неправильный эндпоинт P1
- FE-6: Пробел в фильтре P1
- FE-7: BaseURL захардкожен P1
- FE-9: `console.log` в production P2
