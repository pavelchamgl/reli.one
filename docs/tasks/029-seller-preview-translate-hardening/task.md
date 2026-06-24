# Task 029 — Усиление устойчивости seller preview к автопереводу (hardening)

## Status
Done

## Цель
Усилить устойчивость потока «создание товара → превью → отправка на модерацию»
во Frontend3 к крашам при включённом автопереводе браузера, **без изменения
бизнес-поведения**. Задача — defense-in-depth поверх уже работающего DOM-guard
из Task 025 (Phase 2).

## Контекст
Task 025 закрыл краш `NotFoundError: Failed to execute 'removeChild' on 'Node'`
через `installDomTranslateGuard()` (монки-патч `Node.prototype.removeChild` /
`insertBefore`). На текущем проде (бандл `index-DDuACMky.js`) guard присутствует,
и сценарий отправки на модерацию при активном автопереводе проходит без ошибки
(ручная проверка 24.06.2026: `translateHtml` активен, сабмит `2xx`, переход на
`goods-list`, краша нет).

Ранее наблюдавшийся краш был снят со **старого** бандла `index-D5zKoWlG.js`
(деплой без guard). Остаются архитектурные слабости, которые стоит закрыть,
чтобы проблема не вернулась и чтобы её было видно в мониторинге:

1. В `SellerPreviewPage` success-поток делает `navigate(...)` + `window.location.reload()` —
   React размонтирует уже переведённое дерево превью (самый рискованный момент),
   а `reload()` избыточен.
2. `ErrorBoundary` смонтирован снаружи `RouterProvider`, у роутов нет `errorElement`,
   поэтому ошибку первым перехватывает встроенный boundary React Router и рисует
   дефолтный экран вместо нашего управляемого фолбэка.
3. Guard молча «глотает» cross-parent операции — нет видимости частоты
   срабатываний на проде.
4. Нет пост-сборочной проверки, что задеплоенный бандл реально содержит guard
   (именно это привело к старому крашу на проде).

## Scope (область)
- `Frontend/Frontend3/src/pages/SellerPreviewPage.jsx` — навигация success-потока.
- `Frontend/Frontend3/src/main.jsx` — подключение `errorElement` к роутеру.
- `Frontend/Frontend3/src/Components/ErrorBoundary/ErrorBoundary.jsx` — переиспользование
  как `errorElement` (без смены публичного контракта).
- `Frontend/Frontend3/src/utils/domTranslateGuard.js` — необязательная телеметрия
  срабатываний (Iteration 4, опционально).
- `.github/workflows/ci.yml` — пост-build проверка наличия guard в бандле.
- Тесты соответствующих модулей.

## Не входит в задачу
- Любые изменения бизнес-логики создания/редактирования товара и сабмита на модерацию.
- Изменение публичных API request/response контрактов.
- Изменение Redux-слайсов и моделей.
- Изменение i18n-ключей и файлов `locales/**` (включая незакоммиченные правки
  `en`/`cz` по треку регистрации — они вне этой задачи).
- Изменение поведения guard для нормального (не cross-parent) пути.
- Любые правки Frontend2 и backend.

## Зависимости
- Task 025 (DOM translate guard, Phase 1 + Phase 2) — DONE.

## Риски
- `window.location.assign` меняет тип перехода (hard navigation вместо SPA) —
  поведенчески для пользователя эквивалентно текущему `navigate + reload`,
  но нужно подтвердить тестом и ручной проверкой.
- Подключение `errorElement` к роутеру может изменить место перехвата ошибок —
  проверить, что обычные ошибки роутинга по-прежнему обрабатываются корректно.
- CI-проверка бандла зависит от формы минификации Vite/Terser — использовать
  устойчивый паттерн (`parentNode!==this`), а не имя функции.

## Definition of Done
- [x] Success-поток `SellerPreviewPage` не размонтирует переведённое дерево
      через `navigate`+`reload`; переход выполняется одной hard navigation.
- [x] При любой необработанной ошибке внутри роутера показывается наш
      `ErrorBoundary`-фолбэк (с Sentry-логом), а не дефолтный экран React Router.
- [x] (Опц.) Срабатывания guard видны в Sentry (breadcrumb/rate-limited message).
- [x] CI падает, если собранный бандл `index-*.js` не содержит guard-паттерн.
- [x] Все новые/обновлённые тесты зелёные; lint без новых ошибок.
- [x] `docs/tasks/README.md` обновлён (строка 029).
- [x] Изменены только файлы из раздела Scope; locales/** и прочее не затронуты.

---

# Iterations

## Iteration 1 — Analysis (DONE)

### Цель
Зафиксировать текущее состояние и причину.

### Действия
- Подтверждено: guard и `translation_likely_active` присутствуют в проде (`index-DDuACMky.js`).
- Подтверждено: ранний краш снят со старого бандла `index-D5zKoWlG.js` (без guard).
- Выявлены 4 слабых места (см. Контекст).

### Output
- Список усилений P1 (Iter 2–3) и P2 (Iter 4–5).

### Статус
- [x] Готово

---

## Iteration 2 — Regression test: success-навигация (tests-first)

### Цель
Зафиксировать ожидаемое поведение success-потока до изменения кода.

### Действия
- Добавить тест в `SellerPreviewPage.test.jsx`:
  при `!id && product.status === "fulfilled"` выполняется один hard-переход на
  `/seller/goods-list` (мок `window.location.assign`), без вызова `navigate`
  для размонтирования и без `window.location.reload`.

### Ограничения
- Трогать только тест-файл `SellerPreviewPage.test.jsx`.

### Output
- Падающий (red) тест, фиксирующий целевое поведение.

### Статус
- [x]

---

## Iteration 3 — Fix навигации success-потока

### Цель
Убрать размонтирование переведённого дерева в success-потоке.

### Действия
- В `SellerPreviewPage.jsx` заменить в success-`useEffect`
  `navigate("/seller/goods-list"); window.location.reload();`
  на единственный hard-переход `window.location.assign("/seller/goods-list")`.

### Ограничения
- Не менять условие срабатывания (`!id && product?.status === "fulfilled"`).
- Не трогать остальные ветки рендера и `partial_success`.

### Output
- Зелёный тест из Iteration 2.

### Статус
- [x]

---

## Iteration 4 — ErrorBoundary как errorElement роутера

### Цель
Гарантировать показ управляемого фолбэка при любой ошибке роутинга/рендера.

### Действия
- Подключить `ErrorBoundary` (или совместимую обёртку через
  `useRouteError`) как `errorElement` корневого роута в `main.jsx`.
- Убедиться, что Sentry-лог с тегом `translation_likely_active` срабатывает
  и из этого пути.

### Ограничения
- Не менять публичный контракт `ErrorBoundary` (props `area`, кнопки).
- Не менять дерево провайдеров вне необходимого для `errorElement`.

### Output
- Тест/проверка: ошибка внутри роута → наш фолбэк, не дефолтный экран Router.

### Статус
- [x]

---

## Iteration 5 — (Опционально) Телеметрия guard

### Цель
Сделать видимой частоту автоперевод-мутаций на проде.

### Действия
- В `domTranslateGuard.js` при первом cross-parent срабатывании отправлять
  rate-limited Sentry breadcrumb/message (без PII).

### Ограничения
- Не менять нормальный путь и идемпотентность guard.
- Без шумных логов (строгий rate-limit / однократно за сессию).

### Output
- Обновлённый `domTranslateGuard.test.js`.

### Статус
- [x]

---

## Iteration 6 — CI пост-build проверка наличия guard

### Цель
Не допускать деплой бандла без guard.

### Действия
- В `ci.yml` после сборки Frontend3 добавить шаг: убедиться, что
  `dist/assets/index-*.js` содержит устойчивый паттерн `parentNode!==this`.
- Падать с понятным сообщением, если паттерн не найден.

### Ограничения
- Не менять другие шаги CI.
- Использовать паттерн, устойчивый к минификации (не имя функции).

### Output
- Зелёный CI на корректной сборке, красный — на сборке без guard.

### Статус
- [x]

---

## Iteration 7 — Validation

### Цель
Проверить корректность всех изменений.

### Действия
- `npm run lint` и `npm run test` в `Frontend/Frontend3` — зелёные.
- Ручная проверка: создание товара + отправка на модерацию при активном
  автопереводе → нет краша, переход на `goods-list`.
- `git status` — изменены только файлы из Scope; locales/** не затронуты.
- Обновить `docs/tasks/README.md` (строка 029).

### Статус
- [x]
