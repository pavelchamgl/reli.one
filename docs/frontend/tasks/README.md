# Задачи: внедрение тестирования фронтенда

Декомпозиция **[плана тестирования](../testing-plan.md)**. Выполнять в порядке зависимостей (столбец «После»).

| ID | Задача | После | Статус |
|----|--------|-------|--------|
| **FE-T001** | [Матрица сценариев и конвенции](./001-test-matrix-and-conventions/task.md) | — | To do |
| **FE-T002** | [Пилот Vitest + RTL в Frontend3](./002-vitest-rtl-pilot-frontend3/task.md) | FE-T001 | To do |
| **FE-T003** | [Якорные RTL-тесты P0](./003-rtl-anchor-tests-p0/task.md) | FE-T002 | To do |
| **FE-T004** | [Playwright: фундамент и smoke](./004-playwright-e2e-foundation/task.md) | FE-T002 | To do |
| **FE-T005** | [Frontend2 и интеграция в CI](./005-frontend2-and-ci-integration/task.md) | FE-T002; желательно FE-T003, FE-T004 | To do |

**Примечания.**

- **FE-T003** и **FE-T004** можно вести **параллельно** после FE-T002, если разные исполнители.
- **FE-T005** логично начинать после стабилизации пилота (FE-T002); включение e2e в CI — по готовности FE-T004.
