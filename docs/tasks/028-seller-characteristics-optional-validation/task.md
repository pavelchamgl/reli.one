# Task 028 — Блок «Characteristics» должен оставаться необязательным после add/delete (seller create/edit)

**Priority:** P2
**Complexity:** Low
**Status:** Planned

## Цель

Сделать так, чтобы блок «Characteristics» (произвольные пары `name` / `value`)
на страницах создания (`/seller/seller-create`) и редактирования товара
(`/seller/seller-edit/:id`) **оставался опциональным** при любом сценарии
взаимодействия.

Сейчас блок необязателен только пока его **не трогали**. Стоит продавцу нажать
«+ Add an item», что-то ввести и удалить, или удалить единственную строку — в
состоянии остаётся пустая строка-плейсхолдер, и валидация при «Предпросмотр» /
сохранении начинает требовать заполнения, показывая
*«All parameters are required to be filled in.»* Вернуться к состоянию
«блок необязателен» через UI невозможно.

## Контекст

Поведение выявлено в чат-аудите (июнь 2026).

### Первопричина

1. Компонент при удалении **последней** строки не очищает состояние, а
   подставляет новую пустую строку:

   ```59:61:Frontend/Frontend3/src/ui/Seller/create/createCharacteristicsInp/CreateCharacInp.jsx
     const handleDelete = (id) => {
       const nextRows = characteristic.filter((item) => item.id !== id);
       updateRows(nextRows.length ? nextRows : [createEmptyRow()]);
   ```

   `updateRows` сразу пишет это в Redux (`setParameters` → `setParametersPrev`),
   поэтому в `product_parameters` оказывается `[{ name: "", value: "" }]`.

2. Валидация перед переходом на превью трактует «есть строка» как «строка
   обязательна целиком»:

   ```151:156:Frontend/Frontend3/src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx
           const visibleParameters = getVisibleProductParameters(product_parameters);
           const isParametersValid =
             !visibleParameters.length ||
             visibleParameters.every(
               (item) => item.name?.trim() && item.value?.trim()
             );
   ```

   Пустой плейсхолдер не отфильтровывается (`getVisibleProductParameters` убирает
   только габаритные строки Length/Width/Height/Weight), поэтому
   `visibleParameters.length === 1`, `every(...)` падает на пустых полях → ошибка.

3. Аналогичный код продублирован в форме редактирования:
   - `Frontend/Frontend3/src/Components/Seller/edit/editGoodsParameters/EditGoodsParameters.jsx`
     (`handleDelete` тоже возвращает `[createEmptyRow()]`).
   - `Frontend/Frontend3/src/Components/Seller/edit/EditGoodsForm/EditGoodsForm.jsx`
     (та же ветка `!visibleParameters.length || ... every(...)`).

### Важно

- На backend параметры **уже** необязательны: при отправке пустые пары
  отфильтровываются (`createProdPrevSlice.js`,
  `.filter((item) => item.name && String(item.value ?? "").trim() !== "")`),
  и шаг `parameters` просто пропускается. То есть проблема **только во
  frontend pre-валидации**, а не в контракте API.
- Атрибуты категории (`SellerCategoryAttributesFields`, поля `is_required`) — это
  **отдельный** механизм со своей валидацией (`validateAttributeDraft`). Их
  обязательность корректна и в scope этой задачи **не меняется**.

### Выбранный подход к исправлению

**Игнорировать полностью пустые строки** (где и `name`, и `value` пустые) при
pre-валидации: они эквивалентны «строка не заполнена / не добавлена». Частично
заполненная строка (заполнено только одно из двух полей) по-прежнему считается
ошибкой — это корректная защита от потери данных.

Это минимальное по риску изменение, согласованное с уже существующим поведением
сериализации на отправке. Опционально (по желанию исполнителя, без расширения
scope) можно дополнительно писать `[]` в Redux при удалении всех строк, оставив
пустую строку только как UI-плейсхолдер.

## Scope (область)

- `Frontend/Frontend3/src/Components/Seller/shared/sellerProductParameters.js`
  — централизованный хелпер для определения «пустой» строки и/или фильтрации
  строк, обязательных к проверке.
- `Frontend/Frontend3/src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx`
  — `isParametersValid`.
- `Frontend/Frontend3/src/Components/Seller/edit/EditGoodsForm/EditGoodsForm.jsx`
  — `isParametersValid`.
- Тесты (Vitest + RTL) на хелпер и на сценарий add → delete → submit.
- Документация в `docs/` (этот файл + при необходимости заметка в frontend-доках).

## Не входит в задачу

- Изменение бизнес-обязательности атрибутов категории (`is_required`).
- Изменение контрактов API и backend (`ProductParameter`, `bulk_create`).
- Переписывание компонентов характеристик с нуля или смена UX добавления строк.
- Глобальный рефакторинг дублирования create/edit форм (отдельный backlog).
- Изменение текстов/ключей i18n (`allParametersAreRequired` остаётся).

## Зависимости

- Task 024 (product-catalog-modernization) — текущая реализация мастера товара.
- Task 025 (translate-resilient-frontend) — затрагивает те же файлы рендера;
  не конфликтует, но при параллельной работе синхронизировать правки
  `CreateCharacInp.jsx`.

## Риски

- **Потеря данных при «тихой» фильтрации:** нельзя отбрасывать частично
  заполненные строки (только `name` или только `value`) — они должны оставаться
  ошибкой, иначе продавец потеряет введённое. Тесты фиксируют оба случая.
- **Расхождение create/edit:** правку нужно внести в обе формы одинаково, иначе
  поведение разойдётся. Лучше вынести единый хелпер.
- **Регресс «обязательности»:** полностью заполненный блок и частично заполненная
  строка должны по-прежнему валидироваться как раньше.

## Definition of Done

- [ ] На `/seller/seller-create`: сценарий «Add item → ввод → удаление строки»
      (или удаление единственной строки) **не блокирует** «Предпросмотр», если в
      блоке не осталось ни одной заполненной/частично заполненной строки.
- [ ] На `/seller/seller-edit/:id`: тот же сценарий не блокирует сохранение.
- [ ] Частично заполненная строка (заполнено только `name` **или** только
      `value`) по-прежнему даёт ошибку `allParametersAreRequired`.
- [ ] Полностью заполненные строки сохраняются и проходят валидацию как раньше
      (регресс не внесён).
- [ ] Логика «пустой строки» вынесена в общий хелпер и используется обеими
      формами (нет копипасты условия).
- [ ] Добавлены тесты: unit на хелпер + сценарные тесты add/delete для create и
      edit; существующие тесты зелёные.
- [ ] `npm run lint` и `npm run test` во Frontend3 зелёные.
- [ ] Документация обновлена: этот `task.md` отмечен, поведение описано.

---

# Iterations

## Iteration 1 — Analysis & Reproduction

### Цель
Подтвердить первопричину и зафиксировать точки правки.

### Действия
- Воспроизвести на `/seller/seller-create`: «+ Add an item» → ввести значение →
  удалить строку → «Предпросмотр». Ожидаемо появляется
  *«All parameters are required to be filled in.»*
- Повторить на `/seller/seller-edit/:id` (удаление единственной строки).
- Зафиксировать, что без взаимодействия с блоком валидация не срабатывает
  (`product_parameters === null` → `getVisibleProductParameters` → `[]`).
- Подтвердить дублирование логики в create и edit формах.

### Output
- Подтверждённый сценарий воспроизведения (шаги + состояние Redux).
- Список файлов/строк для правки (хелпер + 2 формы).

### Статус
- [ ] Analysis complete

---

## Iteration 2 — Tests (regression-first)

### Цель
Зафиксировать ожидаемое поведение до правки кода.

### Действия
- Расширить `sellerProductParameters.test.js`: тесты на новый хелпер
  («пустая строка игнорируется», «частично заполненная — значимая»,
  «габаритные строки исключены», «полностью заполненная — значимая»).
- Сценарный тест (RTL) для `CreateCharacInp` / `SellerCreateForm`:
  add → ввод → delete → submit проходит (нет ошибки);
  add → ввод только `name` → submit показывает ошибку.
- Аналогичный сценарный тест для `EditGoodsParameters` / `EditGoodsForm`.
- На этом шаге тесты, проверяющие исправленное поведение, ожидаемо **красные**.

### Output
- Новые/обновлённые `*.test.*` рядом с компонентами и хелпером.

### Статус
- [ ] Tests written (red)

---

## Iteration 3 — Fix

### Цель
Сделать блок снова опциональным после add/delete без изменения остального
поведения.

### Действия
- В `sellerProductParameters.js` добавить хелпер, например
  `isEmptyParameterRow(row)` (оба поля пустые/whitespace) и/или
  `getRequiredProductParameters(parameters)` (видимые строки минус полностью
  пустые) с переиспользованием существующего `getVisibleProductParameters`.
- В `SellerCreateForm.jsx` и `EditGoodsForm.jsx` заменить расчёт
  `isParametersValid` так, чтобы:
  - полностью пустые строки **не** делали блок невалидным;
  - частично заполненные строки **оставались** ошибкой;
  - полностью заполненные — проверялись как раньше.
- (Опционально, вне обязательного scope) при удалении всех строк писать в Redux
  `[]`, оставив пустую строку только как локальный UI-плейсхолдер.

### Ограничения
- Не менять тексты/ключи i18n, контракты API, логику атрибутов категории.
- Не менять сериализацию на отправке (она уже фильтрует пустые пары).

### Output
- Diff по хелперу и двум формам; тесты из Iteration 2 становятся зелёными.

### Статус
- [ ] Fix done

---

## Iteration 4 — Validation & Docs

### Сценарии для проверки
- [ ] create: add → ввод → delete → «Предпросмотр» проходит.
- [ ] create: add → только `name` → ошибка `allParametersAreRequired`.
- [ ] create: две полностью заполненные строки → проходит и сохраняется.
- [ ] edit: удаление единственной строки → сохранение проходит.
- [ ] edit: частично заполненная строка → ошибка.
- [ ] Блок, который не трогали, по-прежнему опционален.
- [ ] `npm run lint` ✅, `npm run test` ✅ (Frontend3).

### Документация
- Отметить чекбоксы и зафиксировать evidence в этом `task.md`.
- При необходимости добавить короткую заметку в frontend-доки о том, что блок
  характеристик опционален и как трактуются пустые/частичные строки.

### Статус
- [ ] Validation complete

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Helper** | `Frontend/Frontend3/src/Components/Seller/shared/sellerProductParameters.js` |
| **Create form** | `Frontend/Frontend3/src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx`, `Frontend/Frontend3/src/ui/Seller/create/createCharacteristicsInp/CreateCharacInp.jsx` |
| **Edit form** | `Frontend/Frontend3/src/Components/Seller/edit/EditGoodsForm/EditGoodsForm.jsx`, `Frontend/Frontend3/src/Components/Seller/edit/editGoodsParameters/EditGoodsParameters.jsx` |
| **Serialization (reference, не меняем)** | `Frontend/Frontend3/src/redux/createProdPrevSlice.js` |
| **Tests** | `Frontend/Frontend3/src/Components/Seller/shared/sellerProductParameters.test.js` + новые `*.test.jsx` рядом с компонентами |
| **Backend API** | Не меняется |

## Заметки для агента-исполнителя

- Соблюдать правила репозитория: не менять бизнес-поведение сверх описанного и
  контракты API; маленькие проверяемые изменения; не логировать секреты/PII.
- Сначала Iteration 1 (анализ + воспроизведение), затем тесты (Iteration 2)
  как страховка от регресса, затем правка (Iteration 3).
- Правку в create и edit вносить **одинаково** через общий хелпер.
- Каждую итерацию отмечать чекбоксом и кратко фиксировать evidence в этом файле.
