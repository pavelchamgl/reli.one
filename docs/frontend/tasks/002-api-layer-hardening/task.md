# FE-002 — API Layer Hardening

**Status:** Done  
**Priority:** P0  
**Phase:** 1  
**Depends on:** FE-001 (параллельно возможно)

## Goal

Устранить тихие баги в API-слое: unreachable код, missing return, hardcoded URL, hardcoded filter, дублирующий endpoint с опечаткой в имени.

## Findings

- **FE-P0-001** — `postSubmitOnboarding`: unreachable `handleError` после `throw`. **Fixed.**
- **FE-P0-002** — `getProductsBySellerId`: отсутствует `return res`. **Fixed.**
- **FE-P0-003** — `getProductsByCategory`: hardcoded `https://reli.one/api` вместо `VITE_API_URL`. **Fixed.**
- **FE-P0-004** — `getOrders` (seller): hardcoded `?courier_service=2` фильтр. **Fixed.**
- **FE-P0-005** — Дубль endpoint onboarding state: `onbordingStatus.js` (typo) vs `onboarding.js#getOnboardingStatus`. **Fixed.**

## Scope

**PR 1.1 — `postSubmitOnboarding`**  
`src/api/seller/onboarding.js`: убран `throw(error)` перед `handleError` — теперь ошибка нормализуется через `handleError`.

**PR 1.2 — `getProductsBySellerId`**  
`src/api/productsApi.js`: добавлен `return res` в тело try-блока.

**PR 1.3 — `getProductsByCategory`**  
`src/api/productsApi.js`: заменён абсолютный URL на относительный `/products/categories/${category}` — `mainInstance` использует `VITE_API_URL`.

**PR 1.4 — `getOrders` seller filter**  
`src/api/seller/orders.js`: убран `?courier_service=2`; сигнатура изменена на `getOrders(params = {})`, фильтры передаются через axios `params`. Backward compatible: вызов без аргументов возвращает все заказы. Удалён мёртвый import `getOrders` из `NewSellerOrder.jsx`.

**PR 1.5 — Консолидация onboarding status endpoint**  
- Тест `onbordingStatus.test.js` переведён на `getOnboardingStatus` из `onboarding.js`.
- Удалён `src/api/seller/onbordingStatus.js`.

## Out of scope

- Изменение backend контрактов.
- Изменение логики обработки ошибок глобально.
- Добавление новых API-методов.

## Definition of Done

- [x] `postSubmitOnboarding` бросает нормализованную ошибку через `handleError`.
- [x] `getProductsBySellerId` возвращает данные.
- [x] `getProductsByCategory` использует `VITE_API_URL` (относительный путь через `mainInstance`).
- [x] `getOrders` (seller) не имеет hardcoded courier_service фильтра.
- [x] `onbordingStatus.js` удалён; тест переведён на `onboarding.js`.
- [x] `npm run lint && npm run test && npm run build` — зелёные.

## Validation results

```
npm run lint   → exit 0 (0 errors)
npm run test   → 5 test files, 9 tests passed
npm run build  → exit 0
```

Grep-проверки (все чистые):
```
grep "courier_service=2" src   → no matches
grep "onbordingStatus"   src   → no matches
grep "testApi"           src   → no matches
grep "https://reli.one/api" src → только api/index.js (BaseURL fallback, норма),
                                  productsSlice.js (3), favorite.js (1) — follow-up
```

## Изменённые файлы

**Изменённые:**
- `src/api/seller/onboarding.js` — FE-P0-001: убран `throw` перед `handleError`
- `src/api/productsApi.js` — FE-P0-002: `return res`; FE-P0-003: relative URL
- `src/api/seller/orders.js` — FE-P0-004: убран `?courier_service=2`, добавлен `params`
- `src/api/seller/onbordingStatus.test.js` — FE-P0-005: импорт → `onboarding.js`
- `src/sellerPages/NewSellerOrder/NewSellerOrder.jsx` — удалён мёртвый import `getOrders`

**Удалённые:**
- `src/api/seller/onbordingStatus.js`

## Follow-up

- Hardcoded `https://reli.one/api` остаётся в `src/redux/productsSlice.js` (строки 11, 36, 59) и `src/api/favorite.js` (строка 14). Эти файлы находятся вне scope FE-002 (аудитом не были помечены как FE-P0-003, но аналогичная проблема). Рекомендуется включить в **FE-006** (Phase 3) или создать отдельный тикет.

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
