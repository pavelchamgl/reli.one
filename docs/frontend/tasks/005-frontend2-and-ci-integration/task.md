# FE-T005 — Frontend2 и интеграция тестов в CI

**Priority:** P1  
**Complexity:** Medium  
**Status:** Done

## Цель

Распространить подход **FE-T002** на **`Frontend/Frontend2`** (Vitest + минимальный smoke) и **подключить прогон** к **GitHub Actions**.

## Контекст

Два Vite-приложения должны иметь согласованные команды `test`; job **`frontend2`** выполняет `npm run test` после lint.

## Scope

- `vite.config.js`: секция `test` (jsdom, `src/test/setup.js`).
- `src/landing-smoke.test.js` — дымовой тест контура.
- `package.json`: `test`, `test:watch`; devDependencies: `vitest`, `jsdom`, `@testing-library/jest-dom`.
- `.github/workflows/ci.yml`: шаг **Test** для `frontend2`.
- ESM `__dirname` в `vite.config.js` через `import.meta.url`.

## Не входит в задачу

- Исправление существующих предупреждений ESLint по всему лендингу (откладывается отдельной задачей).

## Зависимости

- **FE-T002**.

## Риски

- Lint в Frontend2 исторически не зелёный — **отдельно** от контура Vitest.

## Definition of Done

- [x] `npm run test` в `Frontend/Frontend2`.
- [x] CI: `frontend2` выполняет `npm run test --if-present`.
- [x] [08-testing-strategy.md](../../../08-testing-strategy.md) и [testing-plan.md](../../testing-plan.md) отражают контур.

---

# Iterations

## Iteration 1 — Frontend2

### Статус

- [x] 

## Iteration 2 — CI

### Статус

- [x] 
