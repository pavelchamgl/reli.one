# Task 014 — Frontend3 Stabilization Audit & Roadmap

**Status:** Done  
**Priority:** P1 (аналитика; подготовка к работам P0–P3)  
**Complexity:** Medium  
**Completed:** May 2026

## Goal

Провести **аудит** кодовой базы **`Frontend/Frontend3`**, сверить её с документацией в `docs/`, выявить риски и пробелы по стабилизации, тестам и рефакторингу, и зафиксировать **категории последующего backlog** (P0–P3) с отсылками к существующим документам и задачам.

## Context

- Фундамент **Vitest + RTL** для Frontend3 и узкий Playwright-smoke уже были в репозитории до аудита; снимок: [`docs/frontend/README.md`](../../frontend/README.md), [`docs/08-testing-strategy.md`](../../08-testing-strategy.md).
- План фаз и гейтов к рефакторингу: [`docs/frontend/refactoring-readiness-plan.md`](../../frontend/refactoring-readiness-plan.md).
- Задачи внедрения тестов: [`docs/frontend/tasks/README.md`](../../frontend/tasks/README.md).
- Общий агрегатор порядка работ: [`docs/roadmap.md`](../../roadmap.md).

## Scope

- Обзор структуры `Frontend/Frontend3` (маршруты, состояние, ключевые потоки: auth, каталог, корзина/чекаут, личные кабинеты — на уровне навигации и зависимостей). ✅
- Сверка с [`docs/04-frontend-architecture.md`](../../04-frontend-architecture.md), [`docs/frontend/README.md`](../../frontend/README.md), [`docs/frontend/test-matrix.md`](../../frontend/test-matrix.md). ✅
- Фиксация **P0 / P1 / P2 / P3** находок: дефекты, хрупкие места, долги, пробелы тестов. ✅
- Обновление документации по итогам аудита. ✅

## Out of scope

- Большой refactor и массовое переписывание компонентов.
- Любые изменения backend или контрактов API.
- Реализация Playwright e2e (только оценка и постановка в backlog).
- Изменения checkout / payment для production.
- Изменения CI, `package.json`, добавление тестов или runtime-кода.

## Audit checklist

- [x] Дерево маршрутов и критические пользовательские потоки.
- [x] Состояние: Redux/store, персист, анти-паттерны и точки роста.
- [x] Ошибки и загрузки: interceptors, UX, toast.
- [x] Зависимости и устаревание (high-level).
- [x] Тесты: что покрыто Vitest/RTL; что в матрице P0/P1 остаётся; разрыв с CI.
- [x] Соответствие документации: устаревшее после сверки с кодом.
- [x] Список рекомендуемых следующих задач с приоритетами.

## Deliverables

| Артефакт | Путь |
|---------|------|
| Полный аудит с findings | [`docs/frontend/frontend3-audit.md`](../../frontend/frontend3-audit.md) |
| Пошаговый roadmap стабилизации | [`docs/frontend/frontend3-roadmap.md`](../../frontend/frontend3-roadmap.md) |
| Обновлённый index задач фронта | [`docs/frontend/tasks/README.md`](../../frontend/tasks/README.md) |
| FE-001: Auth & Routing Stabilization | [`docs/frontend/tasks/001-auth-and-routing-stabilization/task.md`](../../frontend/tasks/001-auth-and-routing-stabilization/task.md) |
| FE-002: API Layer Hardening | [`docs/frontend/tasks/002-api-layer-hardening/task.md`](../../frontend/tasks/002-api-layer-hardening/task.md) |
| FE-003: Seller Onboarding Tests | [`docs/frontend/tasks/003-seller-onboarding-tests/task.md`](../../frontend/tasks/003-seller-onboarding-tests/task.md) |
| FE-004: Products & Search Tests | [`docs/frontend/tasks/004-products-and-search-tests/task.md`](../../frontend/tasks/004-products-and-search-tests/task.md) |
| FE-005: Orders Flow Tests | [`docs/frontend/tasks/005-orders-flow-tests/task.md`](../../frontend/tasks/005-orders-flow-tests/task.md) |
| FE-006: Refactoring Foundation | [`docs/frontend/tasks/006-refactoring-foundation/task.md`](../../frontend/tasks/006-refactoring-foundation/task.md) |
| Обновлённый docs/roadmap.md | [`docs/roadmap.md`](../../roadmap.md) |

## Findings summary

### P0 (7 findings — критические тихие баги)

| ID | Описание |
|----|---------|
| FE-P0-001 | `postSubmitOnboarding` — unreachable `handleError` после `throw` |
| FE-P0-002 | `getProductsBySellerId` — нет `return res`, всегда `undefined` |
| FE-P0-003 | `getProductsByCategory` — hardcoded `https://reli.one/api` |
| FE-P0-004 | `getOrders` (seller) — hardcoded `?courier_service=2` |
| FE-P0-005 | Дублирующий onboarding state endpoint + typo `onbording` |
| FE-P0-006 | `ProtectedRoute` читает `localStorage` напрямую (race с PersistGate) |
| FE-P0-007 | `testApi.js` — dead dev artifact в src/ |

### P1 (7 findings — надёжность и тесты)

| ID | Описание |
|----|---------|
| FE-P1-001 | Нет RTL для login/registration |
| FE-P1-002 | Нет RTL для API errors/retry/toasts |
| FE-P1-003 | Нет RTL для basket/checkout |
| FE-P1-004 | `renderWithProviders` без i18n wrapper |
| FE-P1-005 | `networkToastShown` — module-level state, leak между тестами |
| FE-P1-006 | `window.location.href` в Redux thunk — untestable side effect |
| FE-P1-007 | `renderWithProviders` использует singleton store |

### P2 (6 findings — refactoring readiness)

Нет lazy loading, side effects в Immer reducers, дублирование логики в слайсах и API-слое.  
Детали: [frontend3-audit.md — P2](../../frontend/frontend3-audit.md#p2--refactoring-readiness).

### P3 (3 findings — enhancement)

Нет checkout e2e, нет seller onboarding e2e, dev artifacts в production bundle.

## Validation

- `npm run lint` — зелёный (0 errors).
- `npm run test` — зелёный.
- `npm run build` — зелёный.
- CI jobs `frontend3` + `e2e_frontend3` — зелёные.
- Документация ссылается на актуальные [`docs/tasks/README.md`](../README.md) и [`docs/frontend/tasks/README.md`](../../frontend/tasks/README.md). ✅

## Backlog categories (фактические — после аудита)

| Уровень | Реализованные задачи |
|--------|---------------------|
| **P0** | FE-001 (auth/routing), FE-002 (API layer) |
| **P1** | FE-003 (onboarding tests), FE-004 (catalog tests), FE-005 (orders/basket tests) |
| **P2** | FE-006 (refactoring foundation) |
| **P3** | Задачи e2e — будут добавлены после Phase 2 |

## Связанные ссылки

- [`docs/README.md`](../../README.md)
- [`docs/roadmap.md`](../../roadmap.md)
- [`docs/frontend/README.md`](../../frontend/README.md)
- [`docs/frontend/frontend3-audit.md`](../../frontend/frontend3-audit.md)
- [`docs/frontend/frontend3-roadmap.md`](../../frontend/frontend3-roadmap.md)
