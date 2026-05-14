# Задачи: внедрение тестирования фронтенда

Декомпозиция **[плана тестирования](../testing-plan.md)**. Выполнять в порядке зависимостей (столбец «После»).

| ID | Задача | После | Статус |
|----|--------|-------|--------|
| **FE-T001** | [Матрица сценариев и конвенции](./001-test-matrix-and-conventions/task.md) | — | **Done** — артефакт: [test-matrix.md](../test-matrix.md) |
| **FE-T002** | [Пилот Vitest + RTL в Frontend3](./002-vitest-rtl-pilot-frontend3/task.md) | FE-T001 | **Done** — Vitest, хелперы, smoke, CI `frontend3` |
| **FE-T003** | [Якорные RTL-тесты P0](./003-rtl-anchor-tests-p0/task.md) | FE-T002 | **In progress** — API + `ProtectedRoute`; формы / ошибки / чекаут в матрице как backlog |
| **FE-T004** | [Playwright: фундамент и smoke](./004-playwright-e2e-foundation/task.md) | FE-T002 | **Done** — `e2e/`, `npm run test:e2e`, job `e2e_frontend3` в CI |
| **FE-T005** | [Frontend2 и интеграция в CI](./005-frontend2-and-ci-integration/task.md) | FE-T002 | **Done (infra)** — Vitest, шаги workflow; **`frontend2` CI красный** из‑за ESLint, см. [README](../README.md) |

**Примечания.**

- **FE-T003** и **FE-T004** изначально допускали параллельную работу после FE-T002.
- Расширение RTL по матрице (логин, тосты, корзина) — продолжение **FE-T003** без нового номера задачи.
