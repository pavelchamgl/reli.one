# FE-004 — Products & Search Tests

**Status:** Planned  
**Priority:** P1  
**Phase:** 2  
**Depends on:** FE-002, test infra fixes (FE-P1-004, FE-P1-007)

## Goal

Покрыть RTL/unit тестами API-слой каталога и UI-сценарии поиска и отображения товаров.

## Context

После FE-P0-002 и FE-P0-003 API-функции каталога исправлены. Нужны тесты для фиксации контракта и предотвращения регрессий. Существующий `productsApi.test.js` покрывает только `getSearchProducts`; `getProductsBySellerId` и `getProductsByCategory` не тестированы.

## Scope

- Unit-тест `getProductsBySellerId` — проверить, что возвращает данные (после fix FE-P0-002).
- Unit-тест `getProductsByCategory` — проверить, что использует относительный путь (после fix FE-P0-003).
- RTL-тест `SearchPage` или компонента поиска: ввод query → вызов API → отображение результатов (mock).
- RTL-тест каталога: отображение карточек, пустой результат.

## Out of scope

- Backend catalog API тесты.
- E2E поиска.
- Изменение компонентов.

## Definition of Done

- [ ] Unit-тесты для исправленных API-функций.
- [ ] Хотя бы один RTL-тест на отображение результатов поиска.
- [ ] `npm run test` зелёный.
- [ ] Строки в [test-matrix.md](../../test-matrix.md) обновлены.

## Validation

```bash
cd Frontend/Frontend3
npm run test
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P0-002, FE-P0-003
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 2
