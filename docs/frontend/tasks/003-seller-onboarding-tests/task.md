# FE-003 — Seller Onboarding Tests

**Status:** Planned  
**Priority:** P1  
**Phase:** 2  
**Depends on:** FE-001, FE-002, test infra fixes (FE-P1-004, FE-P1-007)

## Goal

Покрыть RTL-тестами ключевые сценарии seller onboarding flow: onboarding state, step navigation, happy path submit.

## Context

Backend onboarding API покрыт тестами (Task 008 Done). Frontend onboarding step-навигация не тестировалась. После FE-P0-005 (консолидация endpoint) и FE-P0-001 (fix `postSubmitOnboarding`) flow готов к тестированию.

## Findings

- **FE-P1-001** (частично) — нет RTL-тестов для seller auth/login форм.
- **FE-P0-005** / **FE-P0-001** — после fix можно добавить тест на обработку ошибки сабмита.

## Scope

- RTL-тест для `ProtectedRoute` с авторизованным пользователем (положительный сценарий — дополнение к существующему тесту).
- RTL-тест для onboarding status — компонент отображает нужный шаг при различных значениях статуса (mock `getOnboardingStatus`).
- RTL-тест для submit onboarding — успешный сабмит и обработка ошибки.
- Использовать обновлённый `renderWithProviders` с i18n (после FE-P1-004).

## Out of scope

- E2E Playwright для onboarding (FE-P3-002).
- Тестирование backend onboarding API.
- Изменение production кода onboarding компонентов.

## Definition of Done

- [ ] Тест onboarding status: разные статусы → корректный UI.
- [ ] Тест submit: успех + обработка ошибки `{status, message}`.
- [ ] `npm run test` зелёный.
- [ ] Строки в [test-matrix.md](../../test-matrix.md) обновлены.

## Validation

```bash
cd Frontend/Frontend3
npm run test
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P0-001, FE-P0-005, FE-P1-001
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 2.2
- [../../test-matrix.md](../../test-matrix.md)
