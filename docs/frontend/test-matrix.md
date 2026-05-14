# Матрица тестов Frontend3 / Frontend2

Согласовано с [testing-plan.md](./testing-plan.md) и [08-testing-strategy.md](../08-testing-strategy.md). Обновлять при появлении регрессий или новых P0-потоков.

## Конвенции

| Тема | Решение |
|------|---------|
| Файлы тестов | Рядом с кодом: `*.test.js(x)` |
| Раннер | Vitest (`npm run test` / `npm run test:watch`) |
| Компоненты | `@testing-library/react`, `@testing-library/user-event` |
| Среда | `jsdom`, setup: `Frontend3/src/test/setup.js`, полифилл `localStorage` до импорта Redux |
| Обёртка | `renderWithProviders` в `Frontend3/src/test/test-utils.jsx` — Redux `Provider` + `MemoryRouter` (i18n подключать при тестах экранов с `useTranslation`) |
| HTTP | **Первый этап:** `vi.mock` на модуль `./index.js` / `mainInstance` API-слоя (как в `orders.test.js`, `productsApi.test.js`). **MSW** — опционально позже, см. [FE-T004](./tasks/004-playwright-e2e-foundation/task.md) |
| Sentry / OAuth | Не вызывать реальные SDK; при флаках — мок модулей или пустой `VITE_*` |

## Frontend3 — сценарии

| Сценарий | Приоритет | Уровень | Статус |
|----------|-------------|---------|--------|
| Защита маршрутов продавца (`ProtectedRoute`, редирект без токена) | P0 | RTL | Покрыто |
| API заказов: URL детали, `not_closed` без пробела, `closed` | P0 | Unit | Покрыто |
| Поиск товаров: корректный path query | P0 | Unit | Покрыто |
| Статус онбординга продавца: `/sellers/onboarding/state/` | P0 | Unit | Покрыто |
| Логин / форма регистрации (валидация Yup) | P0 | RTL | Backlog |
| Ошибки API / retry (axios-retry), тосты | P0 | RTL | Backlog |
| Корзина / чекаут (ключевые шаги) | P0 | RTL + e2e | Backlog |
| Smoke: приложение открывается | P1 | e2e (Playwright) | Покрыто (`e2e/smoke.spec.js`, CI `e2e_frontend3`) |

## Frontend2 — сценарии

| Сценарий | Приоритет | Уровень | Статус |
|----------|-------------|---------|--------|
| Дымовой рендер / утилиты | P1 | Unit | Минимальный smoke |
| Формы лендинга (Formik) | P1 | Unit / RTL | По мере изменений |
| Ключевые CTA и навигация | P1 | e2e | После стабилизации smoke |

## Связанные таски

- [FE-T001–FE-T005](./tasks/README.md)
