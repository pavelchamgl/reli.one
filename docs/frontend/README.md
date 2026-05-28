# Frontend — документация

## Тестирование

- **[План тестирования фронтенда](./testing-plan.md)** — цели, уровни покрытия, стек, CI и связь с общей стратегией.
- **[Матрица сценариев и конвенции](./test-matrix.md)** — P0/P1, unit / RTL / e2e, статусы и **пути к файлам тестов в репозитории**.
- **[Дорожная карта: закрытие задач и подготовка к рефакторингу Frontend3](./refactoring-readiness-plan.md)** — фазы, гейты, порядок PR.
- **[Задачи внедрения](./tasks/README.md)** — FE-T001–FE-T005.

## Снимок кодовой базы (синхронизировано с репозиторием)

Ниже — факт из `package.json` и `.github/workflows/ci.yml`, без желаемого состояния.

| Приложение | Каталог | React / Vite (из package.json) | Скрипты | Примечание |
|------------|---------|-------------------------------|---------|------------|
| **Frontend3** | `Frontend/Frontend3` | React `^18.2.0`, Vite `^5.2.x`, **Vitest** `^1.6.x`, **react-router-dom** `^6.23.x` | `npm run test`, `test:watch`, `test:e2e` | ESLint: **0 errors**, много warnings; шаг lint в CI проходит. |
| **Frontend2** | `Frontend/Frontend2` | React `^18.2.0`, Vite `^5.0.x`, Vitest `^1.6.x`, **react-router-dom** `^7.9.x` | `npm run test`, `test:watch` | ESLint: **0 errors**, ~133 warnings (parity с Frontend3); `npm run lint` / `test` / `build` зелёные; CI job **`frontend2`** проходит lint → test → build. |

**CI (`.github/workflows/ci.yml`):** `node-version: 20`; jobs **`backend`**, **`frontend2`**, **`frontend3`**, **`e2e_frontend3`** (build + Playwright Chromium + `test:e2e`).

**Конфиги тестов Frontend3:**

- Vitest: секция `test` в [`Frontend/Frontend3/vite.config.js`](../../Frontend/Frontend3/vite.config.js) — `setupFiles`: `src/test/polyfill-localstorage.js`, `src/test/setup.js`; **`exclude`** включает `e2e/`, чтобы Playwright-спеки не собирал Vitest.
- Playwright: [`Frontend/Frontend3/playwright.config.js`](../../Frontend/Frontend3/playwright.config.js), спеки в [`Frontend/Frontend3/e2e/`](../../Frontend/Frontend3/e2e/).
- Обёртка RTL: [`Frontend/Frontend3/src/test/test-utils.jsx`](../../Frontend/Frontend3/src/test/test-utils.jsx).

## Миграция UI (Tailwind + shadcn/ui)

- **[План миграции Frontend3](./shadcn-ui-migration-plan.md)** — стратегия, роли агентов, гейты качества.
- **[Inventory seller onboarding UI](./seller-onboarding-ui-inventory.md)** — маршруты, split container/view, test gates (**FE-016 Done**).
- **[Задачи FE-015–FE-021](./tasks/README.md#задачи-миграции-ui-tailwind--shadcnui-fe-015fe-021)** — пошаговая декомпозиция.

## См. также

- [04. Frontend architecture](../04-frontend-architecture.md)
- [08. Testing strategy](../08-testing-strategy.md)
- [Документация: точка входа](../README.md), [roadmap-треки](../roadmap.md)
- Следующий аналитический шаг по Frontend3: [Task 014 — Stabilization Audit](../tasks/014-frontend3-stabilization-audit/task.md)
