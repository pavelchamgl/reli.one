# Roadmap — агрегатор (не замена task README)

Единый ориентир по порядку и трекам. **Детали статусов, чеклистов и артефактов** — только в исходных файлах:

- **[`docs/tasks/README.md`](tasks/README.md)** — бэкенд и сквозные задачи 001+.
- **[`docs/frontend/tasks/README.md`](frontend/tasks/README.md)** — фронтенд FE-T\*\*\*.

Если статус в этом файле не совпадает с `task.md`, **приоритет у `task.md`**; здесь возможны упрощённые формулировки.

**Точка входа в документацию:** [`docs/README.md`](README.md).

---

## Current status snapshot

- **Task 009** — **завершена по заявленному scope** в репозитории; **`reserved_quantity`**, резерв на складе и списание в webhook — реализованы в **[Task 013](tasks/013-stock-reservation/task.md)** (**DONE repo-scope**; **OPEN ops rollout**). См. также **[Task 009](tasks/009-db-model-improvements/task.md)**.
- **Task 011** — **Done (repo-scope)** — см. **[`tasks/011-order-product-received-at-timezone/task.md`](tasks/011-order-product-received-at-timezone/task.md)**.
- **Task 012** — **Done (repo-scope)** по заголовку и основному DoD в **[`tasks/012-order-lifecycle-extended-tests/task.md`](tasks/012-order-lifecycle-extended-tests/task.md)**; в том же файле остаётся пометка про сценарии без публичных действий в коде — **verify in task file**.
- **Frontend3** — зафиксирован фундамент **Vitest + RTL** (`npm run test`), плюс узкий Playwright smoke; снимок: **[`docs/frontend/README.md`](frontend/README.md)**, `Frontend/Frontend3/package.json`.
- **Task 014 — Frontend3 Stabilization Audit — Done.** Аудит завершён; артефакты: [`docs/frontend/frontend3-audit.md`](frontend/frontend3-audit.md), [`docs/frontend/frontend3-roadmap.md`](frontend/frontend3-roadmap.md), задачи FE-001–FE-006 в [`docs/frontend/tasks/README.md`](frontend/tasks/README.md).

**Параллельность:** треки **Backend** и **Frontend** можно вести **параллельно** (отдельные ветки/PR, общие договорённости по API не менять вне задач).

---

## Active / next — backend

Рекомендуемая логика (высокий уровень):

1. Закрытие хвостов и регрессий вокруг order/lifecycle — **Task 012** (**verify in task file** при расхождении с доской).
2. **Task 004** — **DONE repo-scope** (payment cleanup + structural Order Consistency); **OPEN (ops/manual):** production/live PSP acceptance и production migration verification — см. [`task.md`](tasks/004-order-consistency/task.md). Future order lifecycle extensions — отдельный backlog.
3. **[Task 013](tasks/013-stock-reservation/task.md)** — **DONE repo-scope implementation**; **OPEN ops rollout:** `STOCK_RESERVATION_ENABLED=True` на staging/prod, cron/Celery cleanup, monitoring, production evidence. Git **не** утверждает production rollout.

Прочие номера (003, 005, 006, 008, 010 и т.д.) — см. таблицу и пояснения в **[`docs/tasks/README.md`](tasks/README.md)**.

---

## Active / next — frontend

**Task 014 Done.** Следующий шаг — реализация выявленных задач:

1. **Phase 1 — P0 Stabilization** (реализовать первыми):
   - **[FE-001](frontend/tasks/001-auth-and-routing-stabilization/task.md)** — `ProtectedRoute` fix + dev artifacts cleanup.
   - **[FE-002](frontend/tasks/002-api-layer-hardening/task.md)** — API layer: 5 критических багов (hardcoded URL, missing return, unreachable code, duplicate endpoint).
2. **Phase 2 — P1 Test Coverage** (после Phase 1):
   - **[FE-003](frontend/tasks/003-seller-onboarding-tests/task.md)** — Seller onboarding RTL.
   - **[FE-004](frontend/tasks/004-products-and-search-tests/task.md)** — Products & search tests.
   - **[FE-005](frontend/tasks/005-orders-flow-tests/task.md)** — Basket / orders / API errors RTL.
3. **Phase 3 — P2 Refactoring** (после гейтов G1–G4):
   - **[FE-006](frontend/tasks/006-refactoring-foundation/task.md)** — Lazy loading, DRY в слайсах, API interceptors.
4. **Phase 4 — P3 E2E** — checkout e2e, seller onboarding e2e; задачи будут добавлены после Phase 2.

Детали порядка PR: **[`docs/frontend/frontend3-roadmap.md`](frontend/frontend3-roadmap.md)**.  
Полный index задач фронта: **[`docs/frontend/tasks/README.md`](frontend/tasks/README.md)**.

---

## Documentation / operations

- Прогон runbook’ов на **staging/production**, фиксация evidence **вне git** там, где это принято (см. **[Task 010](tasks/010-devops-infrastructure/task.md)** и **[`07-deployment.md`](07-deployment.md)**).
- **Ротация credentials**, выполнение follow-up по инцидентам — **[`security-incident-response.md`](security-incident-response.md)**.
- **Backup / restore** — **[`operations/database-backup-restore.md`](operations/database-backup-restore.md)**; регулярные проверки на проде — уточнять в **[`docs/tasks/README.md`](tasks/README.md)** (блоки P1) и ops-чеклистах.

---

## Deferred / explicitly out of scope (на уровне roadmap)

- **Task 013 ops rollout** — включение флага на staging/prod, cron, monitoring и production evidence **не** входит в repo-scope closure; см. **[`task.md`](tasks/013-stock-reservation/task.md)**. Имплементация в коде **уже есть**.
- Массовый рефакторинг фронта — **вне** Phase 1/2; старт только после гейтов G1–G4 из [refactoring-readiness-plan.md](frontend/refactoring-readiness-plan.md).
- Полный e2e чекаута, прод-изменения оплаты — Phase 4 после стабилизации; промокоды и конкурентный склад — по соответствующим задачам и **[`docs/tasks/README.md`](tasks/README.md)**.
- **[Task 021](tasks/021-ci-annotations-lint-warnings/task.md)** — убрать **25** non-blocking warnings в CI Annotations (Frontend2/3 lint + GitHub Actions Node 20 deprecation); **P3 / Deferred**, не блокирует merge.

---

*Обновляйте этот агрегатор при смене приоритетов; не дублируйте сюда полные чеклисты из задач.*
