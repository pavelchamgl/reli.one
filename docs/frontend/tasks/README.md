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
| **FE-T003** | [Якорные RTL-тесты P0](./003-rtl-anchor-tests-p0/task.md) | FE-T002 | **Done** — P0 матрица закрыта: ProtectedRoute, basket, login/register Yup, API interceptors |
| **FE-T004** | [Playwright: фундамент и smoke](./004-playwright-e2e-foundation/task.md) | FE-T002 | **Done** — `e2e/`, `npm run test:e2e`, job `e2e_frontend3` в CI |
| **FE-T005** | [Frontend2 и интеграция в CI](./005-frontend2-and-ci-integration/task.md) | FE-T002 | **Done** — Vitest smoke, CI `frontend2` lint → test → build |

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
| **FE-007** | Test Infra i18n Provider & Docs Sync | 2 | P1 | **Done** |
| **FE-008** | [Playwright E2E Foundation](./008-playwright-e2e-foundation/task.md) | 4 | P3 | **Done** |
| **FE-009** | [Checkout Happy Path E2E](./009-checkout-happy-path-e2e/task.md) | 4 | P3 | **Done** |
| **FE-010** | [Seller Onboarding E2E Smoke](./010-seller-onboarding-e2e-smoke/task.md) | 4 | P3 | **Done** |
| **FE-011** | Full-Stack Seller Onboarding E2E (FS-001) | 5 | P2 | **Done** — `e2e/fullstack-seller-onboarding.spec.js`; авто-skip без бэкенда |
| **FE-012** | [Full-Stack Checkout Until Payment Session E2E (FS-002)](./012-full-stack-checkout-payment-session-e2e/task.md) | 5 | P2 | **Done** — `e2e/fullstack-checkout-payment-session.spec.js`; PSP mocked; авто-skip без бэкенда |
| **FE-013** | [Full-Stack Payment Confirmation E2E (FS-003)](./013-full-stack-payment-confirmation-e2e/task.md) | 5 | P2 | **Done** — `e2e/fullstack-payment-confirmation.spec.js`; webhook lifecycle + UI /my_orders; авто-skip без бэкенда |
| **FE-014** | [Stock Availability Display](./014-stock-availability-display/task.md) | 6 | P1 | **Done** — Task 020 fields on cards/detail; checkout 409 message |
| **FE-022** | [Doors Category Display](./022-doors-category-display/task.md) | 6 | P1 | **Done** — Door (180), подкатегории на главной, i18n, фикс. порядок плиток |

---

## Задачи миграции UI: Tailwind + shadcn/ui (FE-015–FE-021)

**Пилот:** seller onboarding в `Frontend3`. Master plan: [shadcn-ui-migration-plan.md](../shadcn-ui-migration-plan.md). Inventory: [seller-onboarding-ui-inventory.md](../seller-onboarding-ui-inventory.md).

| ID | Задача | Priority | После | Статус |
|----|--------|----------|-------|--------|
| **FE-015** | [Tailwind + shadcn foundation](./015-shadcn-ui-foundation/task.md) | P0 | FE-006 | **Done** |
| **FE-016** | [Onboarding audit & test gates](./016-seller-onboarding-migration-audit/task.md) | P0 | FE-015 | **Done** |
| **FE-017** | [Layout shell & form primitives](./017-seller-onboarding-layout-shell/task.md) | P1 | FE-016 | **Done** |
| **FE-018** | [Auth & entry steps UI](./018-seller-onboarding-auth-entry-ui/task.md) | P1 | FE-017 | **Planned** |
| **FE-019** | [Data collection steps UI](./019-seller-onboarding-data-steps-ui/task.md) | P0 | FE-018 | **Planned** |
| **FE-020** | [Review, submit & status UI](./020-seller-onboarding-review-status-ui/task.md) | P0 | FE-019 | **Planned** |
| **FE-021** | [Validation & MUI cleanup (onboarding zone)](./021-seller-onboarding-migration-validation/task.md) | P1 | FE-020 | **Planned** |

**Порядок:** FE-015 → FE-016 → FE-017 → FE-018 → FE-019 → FE-020 → FE-021. Внутри FE-018–FE-020 — малые PR по таблицам в task.md.

---

**Примечания.**

- **FE-T003** и **FE-T004** изначально допускали параллельную работу после FE-T002.
- Расширение RTL по матрице — FE-003, FE-004, FE-005 (продолжение линии FE-T003).
- Порядок фаз, PR и критерии готовности к рефакторингу: **[refactoring-readiness-plan.md](../refactoring-readiness-plan.md)**.
