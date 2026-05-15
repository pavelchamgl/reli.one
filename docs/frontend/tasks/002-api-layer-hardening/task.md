# FE-002 — API Layer Hardening

**Status:** Planned  
**Priority:** P0  
**Phase:** 1  
**Depends on:** FE-001 (параллельно возможно)

## Goal

Устранить тихие баги в API-слое: unreachable код, missing return, hardcoded URL, hardcoded filter, дублирующий endpoint с опечаткой в имени.

## Findings

- **FE-P0-001** — `postSubmitOnboarding`: unreachable `handleError` после `throw`.
- **FE-P0-002** — `getProductsBySellerId`: отсутствует `return res`.
- **FE-P0-003** — `getProductsByCategory`: hardcoded `https://reli.one/api` вместо `VITE_API_URL`.
- **FE-P0-004** — `getOrders` (seller): hardcoded `?courier_service=2` фильтр.
- **FE-P0-005** — Дубль endpoint onboarding state: `onbordingStatus.js` (typo) vs `onboarding.js#getOnboardingStatus`.

## Scope

**PR 1.1 — `postSubmitOnboarding`**  
`src/api/seller/onboarding.js`: заменить `throw(error)` на `handleError(error, ...)` в catch-блоке `postSubmitOnboarding`.

**PR 1.2 — `getProductsBySellerId`**  
`src/api/productsApi.js`: добавить `return res` в тело try-блока.

**PR 1.3 — `getProductsByCategory`**  
`src/api/productsApi.js`: заменить абсолютный URL на относительный `/products/categories/${category}`.

**PR 1.4 — `getOrders` seller filter**  
`src/api/seller/orders.js`: убрать `?courier_service=2` из строки запроса (или сделать параметром функции — по согласованию).

**PR 1.5 — Консолидация onboarding status endpoint**  
- Оставить `getOnboardingStatus` в `src/api/seller/onboarding.js`.  
- Найти все импорты `getOnbordStatus` из `onbordingStatus.js`, заменить на `getOnboardingStatus` из `onboarding.js`.  
- Обновить `src/api/seller/onbordingStatus.test.js` — импортировать из `onboarding.js`.  
- Удалить `src/api/seller/onbordingStatus.js`.

## Out of scope

- Изменение backend контрактов.
- Изменение логики обработки ошибок глобально.
- Добавление новых API-методов.

## Definition of Done

- [ ] `postSubmitOnboarding` бросает нормализованную ошибку `{status, message}` через `handleError`.
- [ ] `getProductsBySellerId` возвращает данные.
- [ ] `getProductsByCategory` использует `VITE_API_URL` (относительный путь через `mainInstance`).
- [ ] `getOrders` (seller) не имеет hardcoded courier_service фильтра.
- [ ] `onbordingStatus.js` удалён; тест перенесён на `onboarding.js`.
- [ ] `npm run lint && npm run test && npm run build` — зелёные.

## Validation

```bash
cd Frontend/Frontend3
npm run lint
npm run test
npm run build
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P0-001..005
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 1
