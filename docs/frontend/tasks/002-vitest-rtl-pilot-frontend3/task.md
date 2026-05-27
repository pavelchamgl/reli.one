# FE-T002 — Пилот: Vitest + Testing Library в Frontend3

**Priority:** P0  
**Complexity:** Medium  
**Status:** Done

## Цель

Подключить **Vitest**, **Testing Library**, **jsdom** (и при необходимости **MSW** по решению FE-T001) в **`Frontend/Frontend3`**, добавить скрипты `test` / `test:watch`, один **дымовой тест** и обёртку **`renderWithProviders`**, чтобы последующие задачи добавляли реальные кейсы без переделки фундамента.

## Контекст

В `package.json` Frontend3 нет тестового раннера; Vite делает Vitest естественным выбором.

## Scope

- `devDependencies`: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@vitejs/plugin-react` уже есть — проверить совместимость версий; добавить недостающее.
- Конфиг Vitest (отдельный файл или секция в `vite.config`), окружение **jsdom**.
- Скрипты в `package.json`: например `test`, `test:watch`, при необходимости `test:coverage`.
- Файл-хелпер обёртки рендера согласно **FE-T001**.
- **Один** smoke-тест (например рендер `App` или простого провайдер-дерева), доказывающий что pipeline работает.
- Краткий раздел **«Как запускать»** в `Frontend/Frontend3/README.md` **или** ссылка из него на `docs/frontend/testing-plan.md` — по договорённости команды.

## Не входит в задачу

- Покрытие P0-сценариев (FE-T003).
- Playwright (FE-T004).
- Дублирование конфига во Frontend2 (FE-T005).

## Зависимости

- **FE-T001** завершён или согласованы конвенции в том же PR (если команда объединяет).

## Риски

- Конфликт ESM/`import.meta` с зависимостями — решать версиями Vitest и документацией Vite.
- **redux-persist**: в тестах может понаджаться кастомный store без persist или мок `localStorage`.

## Definition of Done

- [x] `npm run test` в `Frontend/Frontend3`; CI job `frontend3` выполняет тесты.
- [x] Хелпер `src/test/test-utils.jsx` (`renderWithProviders`).
- [x] Набор unit/RTL тестов (API, ProtectedRoute, smoke хелпера).
- [x] Секреты не в тестах.

---

# Iterations

## Iteration 1 — Конфигурация

### Цель

Собрать минимальный рабочий Vitest.

### Действия

- Добавить зависимости, конфиг, скрипты.
- Убедиться что `import` от алиасов Vite резолвятся в тестах.

### Статус

- [ ] 

## Iteration 2 — Провайдеры и smoke

### Цель

Стабильный рендер под Redux/Router/i18n.

### Действия

- Реализовать `renderWithProviders`.
- Добавить smoke-тест.

### Статус

- [ ] 
