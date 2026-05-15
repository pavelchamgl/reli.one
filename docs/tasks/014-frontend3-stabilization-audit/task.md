# Task 014 — Frontend3 Stabilization Audit & Roadmap

**Status:** Planned  
**Priority:** P1 (аналитика; подготовка к работам P0–P3)  
**Complexity:** Medium (объём обзора, без обязательных PR с кодом)

## Goal

Провести **аудит** кодовой базы **`Frontend/Frontend3`**, сверить её с документацией в `docs/`, выявить риски и пробелы по стабилизации, тестам и рефакторингу, и зафиксировать **категории последующего backlog** (P0–P3) с отсылками к существующим документам и задачам — **без** выполнения крупных перестроек в рамках этой задачи.

## Context

- В репозитории уже есть фундамент **Vitest + RTL** для Frontend3 и узкий Playwright-smoke; снимок: [`docs/frontend/README.md`](../../frontend/README.md), [`docs/08-testing-strategy.md`](../../08-testing-strategy.md).
- План фаз и гейтов к рефакторингу: [`docs/frontend/refactoring-readiness-plan.md`](../../frontend/refactoring-readiness-plan.md).
- Задачи внедрения тестов на фронте: [`docs/frontend/tasks/README.md`](../../frontend/tasks/README.md) (в т.ч. **FE-T003** — расширение RTL).
- Общий агрегатор порядка работ: [`docs/roadmap.md`](../../roadmap.md).

## Scope

- Обзор структуры `Frontend/Frontend3` (маршруты, состояние, ключевые потоки: auth, каталог, корзина/чекаут, личные кабинеты — на уровне навигации и зависимостей).
- Сверка с [`docs/04-frontend-architecture.md`](../../04-frontend-architecture.md), [`docs/frontend/README.md`](../../frontend/README.md), [`docs/frontend/test-matrix.md`](../../frontend/test-matrix.md).
- Фиксация **P0 / P1 / P2 / P3** находок: дефекты, хрупкие места, долги, пробелы тестов — в виде списка **категорий** и отсылок (файлы, маршруты, доки), пригодного для последующих задач.
- Обновление **только документации** по итогам аудита (например `docs/frontend/*`, при необходимости короткие правки в `docs/roadmap.md` / task README), если это следует из выводов.

## Out of scope

- Большой refactor и массовое переписывание компонентов.
- Любые изменения **backend** или контрактов API (кроме рекомендаций текстом в отчёте).
- Реализация / расширение **Playwright e2e** (только оценка и постановка в backlog).
- Изменения **checkout / payment** для production.
- Изменения CI, `package.json`, добавление тестов или runtime-кода **в рамках Task 014** (отдельные задачи после аудита).

## Audit checklist

- [ ] Дерево маршрутов и критические пользовательские потоки (согласовать с [`docs/02-user-flows.md`](../../02-user-flows.md), где уместно).
- [ ] Состояние: Redux/store, персист, типовые анти-паттерны и точки роста (описательно).
- [ ] Ошибки и загрузки: UX, повтор запросов, соответствие ожиданиям API.
- [ ] Зависимости и устаревание (high-level; без обновления пакетов в 014).
- [ ] Тесты: что покрыто Vitest/RTL; что в матрице P0/P1 остаётся; разрыв с CI (`frontend3`, `e2e_frontend3`).
- [ ] Соответствие документации: что устарело или отсутствует после сверки с кодом.
- [ ] Список **рекомендуемых следующих задач** с приоритетами (ссылки на новые или существующие `task.md` / FE-T00x).

## Deliverables

- Краткий **отчёт по аудиту** в `docs/` (новый файл или расширение существующего плана — на усмотрение исполнителя; согласовать имя с владельцем репо).
- Обновлённый или подтверждённый **roadmap хвоста фронта** (категории P0–P3) с отсылками на [`docs/roadmap.md`](../../roadmap.md) и [`docs/frontend/refactoring-readiness-plan.md`](../../frontend/refactoring-readiness-plan.md).
- Явная отсылка к актуальным **[`docs/tasks/README.md`](../README.md)** и **[`docs/frontend/tasks/README.md`](../../frontend/tasks/README.md)** в итоговом тексте.

## Validation

После любых сопутствующих правок документации, если параллельно проверяется здоровье проекта (опционально для чисто-документарного PR):

- В каталоге `Frontend/Frontend3`: `npm run lint`, `npm run test`, `npm run build`.

Проверить, что документация **ссылается на актуальные** [`docs/tasks/README.md`](../README.md) и [`docs/frontend/tasks/README.md`](../../frontend/tasks/README.md).

## Expected backlog categories (после аудита)

| Уровень | Ориентир |
|--------|-----------|
| **P0** | Блокеры стабильности, регрессии, критичный UX/API mismatch |
| **P1** | Расширение RTL (продолжение FE-T003), якорные сценарии из матрицы |
| **P2** | Рефакторинг модулей/слоёв по [`refactoring-readiness-plan.md`](../../frontend/refactoring-readiness-plan.md) |
| **P3** | Playwright/e2e beyond smoke, визуальные/сквозные сценарии |

## Связанные ссылки

- [`docs/README.md`](../../README.md)
- [`docs/roadmap.md`](../../roadmap.md)
- [`docs/frontend/README.md`](../../frontend/README.md)
