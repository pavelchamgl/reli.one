# Документация reli.one — точка входа

Навигационный индекс по `docs/`: короткие пояснения и ссылки. Подробное содержание — в целевых файлах.

**Где смотреть задачи**

- Бэкенд и cross-cutting: **[`docs/tasks/README.md`](tasks/README.md)** — сводная таблица, приоритеты, пути к `task.md`.
- Фронтенд (тесты, FE-T00x): **[`docs/frontend/tasks/README.md`](frontend/tasks/README.md)**.

**Агрегированный порядок работ (не замена task README)**

- **[`docs/roadmap.md`](roadmap.md)** — снимок статуса и рекомендуемые треки; подробности всегда в соответствующих `task.md` и README задач.

---

## Project overview

- **[`00-project-overview.md`](00-project-overview.md)** — обзор проекта и границ системы.

## Product / business flows

- **[`01-business-domains.md`](01-business-domains.md)** — бизнес-домены.
- **[`02-user-flows.md`](02-user-flows.md)** — пользовательские потоки.
- **[`payment-flow.md`](payment-flow.md)** — платёжный поток.
- **[`seller-onboarding-flow.md`](seller-onboarding-flow.md)** — онбординг продавца.

## Backend architecture

- **[`03-backend-architecture.md`](03-backend-architecture.md)** — архитектура Django/DRF и основные приложения.

## Frontend architecture

- **[`04-frontend-architecture.md`](04-frontend-architecture.md)** — обзор фронтенда в монорепозитории.
- **[`frontend/README.md`](frontend/README.md)** — тесты, CI, снимок `Frontend2` / `Frontend3` (скрипты, Vitest, Playwright).

## Database and integrations

- **[`05-database-model.md`](05-database-model.md)** — модель данных.
- **[`06-integrations.md`](06-integrations.md)** — внешние интеграции.

## Testing strategy

- **[`08-testing-strategy.md`](08-testing-strategy.md)** — пирамида, P0, backend/frontend, CI.
- **[`frontend/testing-plan.md`](frontend/testing-plan.md)**, **[`frontend/test-matrix.md`](frontend/test-matrix.md)** — план и матрица сценариев фронта.

## Architecture debt

- **[`09-architecture-debt.md`](09-architecture-debt.md)** — накопленный технический долг и риски.

## AI agent workflow

- **[`10-agent-workflow.md`](10-agent-workflow.md)** — как вести задачи и изменения с агентами.
- **[`12-task-generation-prompt.md`](12-task-generation-prompt.md)** — генерация структурированных задач.

## Backend / general task backlog

- **[`tasks/README.md`](tasks/README.md)** — нумерованные задачи (001–014 и далее), таблица и рекомендуемый порядок.

## Frontend task backlog

- **[`frontend/tasks/README.md`](frontend/tasks/README.md)** — FE-T001–FE-T005 и статусы внедрения тестов.

## Operations

- **[`07-deployment.md`](07-deployment.md)** — деплой и сопутствующие процессы.
- **[`operations/database-backup-restore.md`](operations/database-backup-restore.md)** — backup/restore PostgreSQL.
- **[`operations/monitoring-alerts.md`](operations/monitoring-alerts.md)** — мониторинг и алерты.
- **[`operations/repo-ops-followup-checklist.md`](operations/repo-ops-followup-checklist.md)** — ops follow-up по репозиторию.

## Security

- **[`security-incident-response.md`](security-incident-response.md)** — инциденты, секреты, ответные действия.
- Задача **[`tasks/006-security-hardening/task.md`](tasks/006-security-hardening/task.md)** — hardening (детали и DoD в `task.md`).

## Target architecture

- **[`11-target-architecture.md`](11-target-architecture.md)** — целевая архитектура.

---

## Быстрые ссылки: стабилизация Frontend3

- Планируемый аналитический этап: **[`tasks/014-frontend3-stabilization-audit/task.md`](tasks/014-frontend3-stabilization-audit/task.md)**.
- Дорожная карта рефакторинга/фаз: **[`frontend/refactoring-readiness-plan.md`](frontend/refactoring-readiness-plan.md)**.
