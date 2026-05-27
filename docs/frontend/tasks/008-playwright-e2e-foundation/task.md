# FE-008 — Playwright E2E Foundation

**Status:** Done  
**Priority:** P3  
**Phase:** 4  
**Depends on:** FE-001..FE-007 (Phase 1–3 завершены)  
**Completed:** май 2026

## Goal

Создать базовую e2e инфраструктуру Playwright для Frontend3 и реализовать первые smoke-тесты: mounting, routing, protected route redirect.

## Что сделано

### Инфраструктура (существовала до FE-008)

- `playwright.config.js` — конфиг уже был в репо (webServer vite preview на 4173, Chromium, retries для CI).
- `@playwright/test ^1.52.0` — уже в devDependencies.
- `npm run test:e2e` — уже был в scripts.
- `e2e/smoke.spec.js` — 1 базовый тест "root page loads".

### Добавлено в FE-008

**`package.json`**  
- Добавлен script `test:e2e:ui`: `playwright test --ui` (для локальной отладки).

**`e2e/smoke.spec.js`** — расширен с 1 до 5 тестов:

| Тест | Что проверяет |
|------|---------------|
| `root page loads` | Страница открывается, body видим |
| `home page: app shell mounts without crash` | `#root` монтируется, URL остаётся `/` |
| `protected seller route redirects to /seller/login` | `/seller/seller-home` → redirect на `/seller/login` (ProtectedRoute + PersistGate) |
| `search page loads and stays on /search` | `/search` рендерится без crash, URL корректный |
| `unknown route falls back to home page (wildcard *)` | Несуществующий маршрут → `HomePage` (wildcard `*`) |

Тесты запускаются против `vite preview` собранного приложения. Backend не поднимается — проверяем только routing, mounting и redirect-логику.

## Результаты валидации

```
npm run lint   → 0 errors (747 warnings, pre-existing)
npm run test   → 122/122 passed
npm run build  → success
npm run test:e2e → 5/5 passed (9.4s, 4 workers, Chromium arm64)
```

E2E результаты:
```
✓ protected seller route redirects to /seller/login when not authenticated (2.8s)
✓ search page loads and stays on /search (3.4s)
✓ root page loads (5.0s)
✓ home page: app shell mounts without crash (5.1s)
✓ unknown route falls back to home page (wildcard *) (2.7s)
5 passed (9.4s)
```

## Definition of Done

- [x] `npm run test:e2e:ui` script добавлен.
- [x] 5 smoke-тестов реализованы и зелёные.
- [x] `npm run lint && npm run test && npm run build && npm run test:e2e` — все зелёные.

## Out of scope (следующие фазы)

- FE-P3-001: checkout happy path e2e
- FE-P3-002: seller onboarding smoke e2e
- Расширение матрицы P1 e2e
- MSW для изоляции HTTP в e2e

## Связанные документы

- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 4
- [test-matrix.md](../../test-matrix.md) — e2e строки
- [frontend3-audit.md](../../frontend3-audit.md) — FE-P3-001, FE-P3-002
