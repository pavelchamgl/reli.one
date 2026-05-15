# Roadmap — агрегатор (не замена task README)

Единый ориентир по порядку и трекам. **Детали статусов, чеклистов и артефактов** — только в исходных файлах:

- **[`docs/tasks/README.md`](tasks/README.md)** — бэкенд и сквозные задачи 001+.
- **[`docs/frontend/tasks/README.md`](frontend/tasks/README.md)** — фронтенд FE-T\*\*\*.

Если статус в этом файле не совпадает с `task.md`, **приоритет у `task.md`**; здесь возможны упрощённые формулировки.

**Точка входа в документацию:** [`docs/README.md`](README.md).

---

## Current status snapshot

- **Task 009** — **завершена по заявленному scope** в репозитории; follow-up по **`reserved_quantity`**, резерву на складе и списанию остатка в webhook — в **[Task 013](tasks/013-stock-reservation/task.md)** (сейчас design-only / вне обязательного трека). См. также **[Task 009](tasks/009-db-model-improvements/task.md)**.
- **Task 011** — **Done (repo-scope)** — см. **[`tasks/011-order-product-received-at-timezone/task.md`](tasks/011-order-product-received-at-timezone/task.md)**.
- **Task 012** — **Done (repo-scope)** по заголовку и основному DoD в **[`tasks/012-order-lifecycle-extended-tests/task.md`](tasks/012-order-lifecycle-extended-tests/task.md)**; в том же файле остаётся пометка про сценарии без публичных действий в коде — **verify in task file**.
- **Frontend3** — зафиксирован фундамент **Vitest + RTL** (`npm run test`), плюс узкий Playwright smoke; снимок: **[`docs/frontend/README.md`](frontend/README.md)**, `Frontend/Frontend3/package.json`.
- **Следующий рекомендуемый крупный аналитический шаг по фронту:** **[Task 014 — Frontend3 Stabilization Audit](tasks/014-frontend3-stabilization-audit/task.md)** (только аудит и дорожная карта, без массового кода в рамках 014).

**Параллельность:** треки **Backend** и **Frontend** можно вести **параллельно** (отдельные ветки/PR, общие договорённости по API не менять вне задач).

---

## Active / next — backend

Рекомендуемая логика (высокий уровень):

1. Закрытие хвостов и регрессий вокруг order/lifecycle — **Task 012** (**verify in task file** при расхождении с доской).
2. Структурный backlog **Order Consistency** и связанное — **[Task 004](tasks/004-order-consistency/task.md)** (секция backlog в `task.md`).
3. **[Task 013](tasks/013-stock-reservation/task.md)** — **только после отдельного проектирования** и явного включения складского трека: резерв, `reserved_quantity`, списание в webhook и согласование с платежами/заказом.

Прочие номера (003, 005, 006, 008, 010 и т.д.) — см. таблицу и пояснения в **[`docs/tasks/README.md`](tasks/README.md)**.

---

## Active / next — frontend

1. **[Task 014](tasks/014-frontend3-stabilization-audit/task.md)** — аудит `Frontend/Frontend3`, сверка с документацией, вынос P0–P3 и черновика плана стабилизации.
2. Дальше по приоритету (как направления работ, детали после 014):
   - **P0** — стабилизация критичных зон (без большого рефакторинга до отдельной задачи).
   - **P1** — расширение **RTL**-покрытия (продолжение линии **FE-T003** — статус: **[`docs/frontend/tasks/README.md`](frontend/tasks/README.md)**).
   - **P2** — рефакторинг по **[`docs/frontend/refactoring-readiness-plan.md`](frontend/refactoring-readiness-plan.md)** после гейтов.
   - **P3** — расширение **Playwright / e2e** (не смешивать с объёмом Task 014).

---

## Documentation / operations

- Прогон runbook’ов на **staging/production**, фиксация evidence **вне git** там, где это принято (см. **[Task 010](tasks/010-devops-infrastructure/task.md)** и **[`07-deployment.md`](07-deployment.md)**).
- **Ротация credentials**, выполнение follow-up по инцидентам — **[`security-incident-response.md`](security-incident-response.md)**.
- **Backup / restore** — **[`operations/database-backup-restore.md`](operations/database-backup-restore.md)**; регулярные проверки на проде — уточнять в **[`docs/tasks/README.md`](tasks/README.md)** (блоки P1) и ops-чеклистах.

---

## Deferred / explicitly out of scope (на уровне roadmap)

- **Task 013** — имплементация резерва/списания **не** в текущем обязательном треке до решения и дизайна (см. **`task.md`**).
- Массовый рефакторинг фронта, полный e2e чекаута, прод-изменения оплаты — **вне** аналитического scope **Task 014**; промокоды и конкурентный склад — по соответствующим задачам и **[`docs/tasks/README.md`](tasks/README.md)**.

---

*Обновляйте этот агрегатор при смене приоритетов; не дублируйте сюда полные чеклисты из задач.*
