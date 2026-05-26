# FE-T005 — Frontend2 и интеграция тестов в CI

**Priority:** P1  
**Complexity:** Medium  
**Status:** Done

## Цель

Распространить подход **FE-T002** на **`Frontend/Frontend2`** (Vitest + минимальный smoke) и **подключить шаги** к **GitHub Actions**.

## Контекст

Два Vite-приложения должны иметь согласованные команды `test`; job **`frontend2`** выполняет `npm run test` после lint.

## Scope

- `vite.config.js`: секция `test` (jsdom, `src/test/setup.js`).
- `src/landing-smoke.test.js` — дымовой тест контура.
- `package.json`: `test`, `test:watch`; devDependencies: `vitest`, `jsdom`, `@testing-library/jest-dom`.
- `.github/workflows/ci.yml`: шаг **Test** для `frontend2`.
- ESM `__dirname` в `vite.config.js` через `import.meta.url`.

## Не входит в задачу

- Полный lint-cleanup лендинга (jsx-key, unused imports) — optional follow-up; warnings допустимы (parity с Frontend3).

## Зависимости

- **FE-T002**.

## Риски

- ~~Lint в Frontend2 исторически не зелёный~~ — закрыто: ESLint policy parity с Frontend3 (2026-05).

## Definition of Done

- [x] `npm run test` в `Frontend/Frontend2` (локально).
- [x] В `.github/workflows/ci.yml` для `frontend2` есть шаг **`npm run test --if-present`** после lint.
- [x] [08-testing-strategy.md](../../../08-testing-strategy.md) и [testing-plan.md](../../testing-plan.md) отражают контур.
- [x] **Зелёный** job `frontend2` end-to-end: `lint` → `test` → `build` (ESLint **0 errors**, warnings допустимы).

---

# Iterations

## Iteration 1 — Frontend2

### Статус

- [x] 

## Iteration 2 — CI

### Статус

- [x] ESLint parity с Frontend3 (`.eslintrc.cjs`, lint script без `--max-warnings 0`); job **`frontend2`**: lint → test → build зелёный локально.
