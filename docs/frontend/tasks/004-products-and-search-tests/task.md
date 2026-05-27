# FE-004 — Products & Search Tests

**Status:** Done  
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

- [x] Unit-тесты для исправленных API-функций.
- [x] Хотя бы один RTL-тест на отображение результатов поиска.
- [x] `npm run test` зелёный (49/49).
- [x] Строки в [test-matrix.md](../../test-matrix.md) обновлены.

## Implementation notes

### Новые/изменённые тестовые файлы

| Файл | Тестов | Тип |
|------|--------|-----|
| `src/api/productsApi.test.js` | 15 (было 2) | unit — все 5 API-функций + error handling |
| `src/pages/SearchPage.test.jsx` | 6 | RTL — render/empty/results/category/URL |
| `src/Components/Catalog/CatalogCard/CatalogCard.test.jsx` | 3 | RTL — render/backgroundImage/click |

### Паттерн тестирования SearchPage

SearchPage сильно связан с Redux и дочерними компонентами (`ProductCard`, фильтры). Применён подход:
- `configureStore` с `preloadedState` для products-слайса (нет HTTP-вызовов в read-сценариях).
- `vi.mock` для `ProductCard` (слишком сложный, вызывает `getProductById` на mount), фильтров, `react-responsive`, `react-i18next`.
- Мок дефолтного экспорта `api/index.js` (mainInstance) для блокировки реальных HTTP вызовов из thunk-ов.

### Особенность: loading-индикатор отсутствует

`SearchPage` не рендерит loading-индикатор. `searchStatus: "loading"` устанавливается только внутри `ProductCard` (skeleton). Follow-up добавлен ниже.

## Follow-up (не в scope FE-004)

- SearchPage не имеет собственного loading-индикатора — показывает `NoContentText` как в loading, так и в empty состоянии. Рекомендация: добавить `data-testid="loading"` или skeleton в SearchPage при `searchStatus === "loading"` (FE-006 или отдельная задача).
- `ProductCard` протестировать изолированно сложно из-за вызова `getProductById` на mount и множества Redux-зависимостей — рассмотреть в рамках FE-006 рефакторинга.

## Validation

```bash
cd Frontend/Frontend3
npm run test
```

## Связанные документы

- [frontend3-audit.md](../../frontend3-audit.md) — FE-P0-002, FE-P0-003
- [frontend3-roadmap.md](../../frontend3-roadmap.md) — Phase 2
