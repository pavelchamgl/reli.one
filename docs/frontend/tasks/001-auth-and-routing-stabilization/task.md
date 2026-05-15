# FE-001 — Auth & Routing Stabilization

**Status:** Done  
**Priority:** P0  
**Phase:** 1 (первый к реализации)  
**Depends on:** —

## Goal

Устранить проблемы надёжности в аутентификации и роутинге: `ProtectedRoute` десинхронизируется с Redux persist; dev-артефакты присутствуют в production bundle.

## Findings

- **FE-P0-006** — `ProtectedRoute` читал `localStorage` напрямую вместо Redux state; race condition при PersistGate hydration. **Fixed.**
- **FE-P0-007** / **FE-P3-003** — `src/api/testApi.js`, `src/pages/Test.jsx`, route `/test` — dev artifacts в production. **Partially fixed** (testApi.js удалён, /test route удалён; Test.jsx оставлен — используется как компонент для рендера IdentDocumInp, переименование вне scope).

## Scope

- [x] `src/Components/ProtectedRoute/ProtectedRoute.jsx`: читает токен из Redux state (`useSelector`) вместо `localStorage.getItem`.
- [x] `ProtectedRoute.test.jsx`: обновлён — использует Redux `preloadedState` вместо `localStorage`.
- [x] Создан `src/redux/authSlice.js` — минимальный slice (setToken / clearToken), persisted.
- [x] `src/redux/index.js`: добавлен `auth` reducer + `auth` в persist whitelist.
- [x] `src/redux/storeInjector.js`: pattern для dispatch из `api/index.js` без циклических зависимостей.
- [x] `src/api/index.js`: interceptor dispatch setToken при refresh success, clearToken при refresh fail.
- [x] Все login-точки (7 компонентов) — dispatch `setToken(res.data)` рядом с `localStorage.setItem`.
- [x] Все logout-точки (6 компонентов + COOKIE_VERSION в HomePage/SellerHomePage) — dispatch `clearToken()` рядом с `localStorage.removeItem`.
- [x] Удалён `src/api/testApi.js`.
- [x] Удалён import `Test` и route `/test` из `src/main.jsx`.

## Out of scope

- Изменение логики аутентификации.
- Изменение структуры token / localStorage ключей.
- Добавление новых тестов сверх минимального обновления.
- Удаление `src/pages/Test.jsx` (компонент используется как экспериментальная площадка для IdentDocumInp; роут удалён).

## Definition of Done

- [x] `ProtectedRoute` читает токен из Redux (`useSelector`), не из `localStorage` напрямую.
- [x] `ProtectedRoute.test.jsx` проходит без изменений (или с минимальной правкой под новый API).
- [x] `testApi.js` удалён, ни один файл его не импортирует.
- [x] Route `/test` удалён из `main.jsx`.
- [x] `npm run lint && npm run test && npm run build` — зелёные.

## Validation results

```
npm run lint   → exit 0 (0 errors)
npm run test   → 5 test files, 9 tests passed
npm run build  → exit 0 (3160 modules, chunk size warning pre-existing)
```

## Изменённые файлы

**Новые:**
- `src/redux/authSlice.js` — setToken / clearToken, initial state из localStorage
- `src/redux/storeInjector.js` — инжектор store для api-слоя

**Изменённые:**
- `src/redux/index.js` — auth reducer, whitelist, injectStore
- `src/Components/ProtectedRoute/ProtectedRoute.jsx` — useSelector
- `src/Components/ProtectedRoute/ProtectedRoute.test.jsx` — preloadedState вместо localStorage
- `src/api/index.js` — dispatch setToken/clearToken в interceptors
- `src/Components/LoginModal/LoginModal.jsx`
- `src/Components/MobAuth/MobLoginForm/MobLoginForm.jsx`
- `src/Components/Auth/googleAuth/GoogleAuth.jsx`
- `src/Components/Auth/facebookAuth/FacebookAuth.jsx`
- `src/Components/Seller/auth/loginForm/LoginForm.jsx`
- `src/Components/Seller/auth/createAccount/verifyEmail/VerifyEmail.jsx`
- `src/Components/OtpPage/PinInpForm/PinInpForm.jsx`
- `src/Components/Seller/sellerHeader/SellerHeader.jsx`
- `src/Components/ProfileNav/ProfileNavDrawer/ProfileNavDrawer.jsx`
- `src/Components/Seller/sellerMobNav/SellerMobNav.jsx`
- `src/pages/MobProfileNavPage.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/SellerHomePage.jsx`
- `src/main.jsx`

**Удалённые:**
- `src/api/testApi.js`

## Follow-up

- `src/pages/Test.jsx` — компонент без роута; можно удалить или переместить в рамках FE-006 (refactoring phase).
- Rehydration guard (`_persist.rehydrated`) в ProtectedRoute не нужен: `RouterProvider` обёрнут в `PersistGate`, поэтому ProtectedRoute не рендерится до завершения гидрации.
- FE-P1-007 (singleton store в test-utils) остаётся open — будет закрыт в рамках FE-003 (Phase 2 test infra).

## Validation

```bash
cd Frontend/Frontend3
npm run lint
npm run test
npm run build
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P0-006, FE-P0-007
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 1
