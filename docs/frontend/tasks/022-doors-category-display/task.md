# FE-022 — Doors Category Display (Frontend3)

**Status:** Done  
**Priority:** P1  
**Phase:** 6 — Catalog UX  
**Depends on:** категория Door (id 180) и подкатегории 181–183 в Django Admin (e2e созданы)  
**Blocks:** —

## Цель

Отобразить новую категорию **Doors / Dveře** и три подкатегории в каталоге Frontend3 и на главной странице.

## Контекст

Данные категорий приходят из `GET /products/category/` (MPTT-дерево), но видимость на фронте ограничена whitelist/blacklist:

- `CatalogDrawer.jsx` — `hiddenIds`, `hiddenSubCategories`
- `MainPage.jsx` — `visibleIds` и сортировка плиток по этому массиву

Категория создана в e2e admin:

| id | name в API | EN (i18n) | CZ (i18n) | parent |
|----|------------|-----------|-----------|--------|
| 180 | Door | Doors | Dveře | — |
| 181 | Entrance doors | Entrance doors | Vchodové dveře | 180 |
| 182 | Interior doors | Interior doors | Interiérové dveře | 180 |
| 183 | Glass doors | Glass doors | Skleněné dveře | 180 |

## Scope

- Добавить id `181`, `182`, `183` в `visibleIds` на главной ([`MainPage.jsx`](../../../../Frontend/Frontend3/src/pages/MainPage.jsx))
- Зафиксировать порядок плиток: `[145, 44, 181, 182, 183]` (сортировка по `visibleIds`, не порядок API)
- Добавить переводы `categories.180`–`183` в EN/CZ ([`translation.json`](../../../../Frontend/Frontend3/src/locales/))
- Верифицировать, что каталог (drawer/mobile) показывает Door без правок blacklist

## Не входит в задачу

- Создание категорий в prod admin (отдельный ops-шаг)
- Загрузка изображений категорий в admin (блокер плиток на главной, но не блокер каталога)
- Рефакторинг hardcoded-фильтров каталога
- Изменение API или моделей Django
- E2E-тесты каталога (backlog)

## Зависимости

- e2e backend: `reli_backend_e2e` на порту 8000
- Категории 180–183 в БД e2e

## Риски

| Риск | Митигация |
|------|-----------|
| Нет `image_url` у подкатегорий | `CategoryCard` не рендерит плитку — загрузить image в admin |
| API name `"Door"` vs UI `"Doors"` | i18n-ключ `categories.180` переопределяет отображение |
| Prod без категорий | id в `visibleIds` безопасны — просто не покажутся без данных в API |

## Definition of Done

- [x] `visibleIds` = `[145, 44, 181, 182, 183]`
- [x] Плитки на главной сортируются по порядку `visibleIds`
- [x] Переводы EN/CZ для id 180–183 добавлены
- [x] Каталог: Door в левой колонке, подкатегории справа (desktop) / drill-down (mobile) — без правок blacklist
- [x] Главная: плитки подкатегорий (при `image_url` в admin)
- [x] EN / CZ: Doors/Dveře и подкатегории

## Файлы изменений

| Файл | Изменение |
|------|-----------|
| `Frontend/Frontend3/src/pages/MainPage.jsx` | `visibleIds`, сортировка по `visibleIds` |
| `Frontend/Frontend3/src/locales/en/translation.json` | `categories.180`–`183` |
| `Frontend/Frontend3/src/locales/cz/translation.json` | `categories.180`–`183` |

## Порядок плиток на главной

Фиксированный порядок (массив `visibleIds` задаёт и whitelist, и sort):

1. Paintings (145)
2. Party goods (44)
3. Entrance doors (181)
4. Interior doors (182)
5. Glass doors (183)

Без сортировки по `visibleIds` порядок Door-подкатегорий брался из API (MPTT `order_insertion_by: name` → Glass перед Interior).

## QA (ручной чеклист)

1. `curl http://localhost:8000/products/category/` — ветка id 180 с children
2. Desktop: «Каталог» → Doors → 3 подкатегории
3. Mobile: каталог → Doors → `/mob_category/180`
4. Главная: плитки в порядке 145 → 44 → 181 → 182 → 183
5. Клик → `/product_category/181` (и 182, 183)
6. Переключение EN/CZ — корректные названия
