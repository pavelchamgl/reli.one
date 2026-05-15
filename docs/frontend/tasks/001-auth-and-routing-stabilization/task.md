# FE-001 — Auth & Routing Stabilization

**Status:** Planned  
**Priority:** P0  
**Phase:** 1 (первый к реализации)  
**Depends on:** —

## Goal

Устранить проблемы надёжности в аутентификации и роутинге: `ProtectedRoute` десинхронизируется с Redux persist; dev-артефакты присутствуют в production bundle.

## Findings

- **FE-P0-006** — `ProtectedRoute` читает `localStorage` напрямую вместо Redux state; race condition при PersistGate hydration.
- **FE-P0-007** / **FE-P3-003** — `src/api/testApi.js`, `src/pages/Test.jsx`, route `/test` — dev artifacts в production.

## Scope

- `src/Components/ProtectedRoute/ProtectedRoute.jsx`: читать токен из Redux state через `useSelector` вместо `localStorage.getItem`.
- Убедиться, что `ProtectedRoute.test.jsx` не ломается; при необходимости — минимальное обновление теста (без добавления новых сценариев).
- Удалить `src/api/testApi.js`.
- Удалить import и route `/test` из `src/main.jsx`; оценить, можно ли удалить `src/pages/Test.jsx`.
- Проверить, что нет других импортов удаляемых файлов.

## Out of scope

- Изменение логики аутентификации.
- Изменение структуры token / localStorage ключей.
- Добавление новых тестов сверх минимального обновления.

## Definition of Done

- [ ] `ProtectedRoute` читает токен из Redux (`useSelector`), не из `localStorage` напрямую.
- [ ] `ProtectedRoute.test.jsx` проходит без изменений (или с минимальной правкой под новый API).
- [ ] `testApi.js` удалён, ни один файл его не импортирует.
- [ ] Route `/test` удалён из `main.jsx`.
- [ ] `npm run lint && npm run test && npm run build` — зелёные.

## Validation

```bash
cd Frontend/Frontend3
npm run lint
npm run test
npm run build
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P0-006, FE-P0-007
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 1
