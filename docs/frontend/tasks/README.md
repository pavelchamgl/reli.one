# Задачи: внедрение тестирования фронтенда

Декомпозиция **[плана тестирования](../testing-plan.md)**. Выполнять в порядке зависимостей (столбец «После»).

**Навигация:**
- Точка входа в документацию: [docs/README.md](../../README.md)
- Общий roadmap треков: [docs/roadmap.md](../../roadmap.md)
- Детальный roadmap Frontend3: [frontend3-roadmap.md](../frontend3-roadmap.md)
- Аудит Frontend3 + findings: [frontend3-audit.md](../frontend3-audit.md)

---

## Задачи тестовой инфраструктуры (FE-T*)

| ID | Задача | После | Статус |
|----|--------|-------|--------|
| **FE-T001** | [Матрица сценариев и конвенции](./001-test-matrix-and-conventions/task.md) | — | **Done** — артефакт: [test-matrix.md](../test-matrix.md) |
| **FE-T002** | [Пилот Vitest + RTL в Frontend3](./002-vitest-rtl-pilot-frontend3/task.md) | FE-T001 | **Done** — Vitest, хелперы, smoke, CI `frontend3` |
| **FE-T003** | [Якорные RTL-тесты P0](./003-rtl-anchor-tests-p0/task.md) | FE-T002 | **In progress** — API + `ProtectedRoute`; формы / ошибки / чекаут в матрице как backlog |
| **FE-T004** | [Playwright: фундамент и smoke](./004-playwright-e2e-foundation/task.md) | FE-T002 | **Done** — `e2e/`, `npm run test:e2e`, job `e2e_frontend3` в CI |
| **FE-T005** | [Frontend2 и интеграция в CI](./005-frontend2-and-ci-integration/task.md) | FE-T002 | **Done (infra)** — Vitest, шаги workflow; **`frontend2` CI красный** из‑за ESLint, см. [README](../README.md) |

---

## Задачи стабилизации Frontend3 (FE-* из Task 014)

Результат аудита [Task 014](../../../tasks/014-frontend3-stabilization-audit/task.md). Порядок реализации: [frontend3-roadmap.md](../frontend3-roadmap.md).

| ID | Задача | Phase | Priority | Статус |
|----|--------|-------|----------|--------|
| **FE-001** | [Auth & Routing Stabilization](./001-auth-and-routing-stabilization/task.md) | 1 | **P0** | **Done** |
| **FE-002** | [API Layer Hardening](./002-api-layer-hardening/task.md) | 1 | **P0** | **Done** |
| **FE-003** | [Seller Onboarding Tests](./003-seller-onboarding-tests/task.md) | 2 | P1 | **Done** |
| **FE-004** | [Products & Search Tests](./004-products-and-search-tests/task.md) | 2 | P1 | **Done** |
| **FE-005** | [Orders Flow Tests](./005-orders-flow-tests/task.md) | 2 | P1 | **Done** |
| **FE-006** | [Refactoring Foundation](./006-refactoring-foundation/task.md) | 3 | P2 | **Done** |

_P3 (Playwright/E2E expansion) — будут добавлены после Phase 2._

---

**Примечания.**

- **FE-T003** и **FE-T004** изначально допускали параллельную работу после FE-T002.
- Расширение RTL по матрице — FE-003, FE-004, FE-005 (продолжение линии FE-T003).
- Порядок фаз, PR и критерии готовности к рефакторингу: **[refactoring-readiness-plan.md](../refactoring-readiness-plan.md)**.
