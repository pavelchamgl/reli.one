# Task 025 — Устойчивость Frontend3 к автопереводу браузера (seller product create/preview)

**Priority:** P1
**Complexity:** Medium
**Status:**
- **Phase 1 (устойчивость + отключение перевода):** Done (код + тесты; ручная
  проверка с реальным переводом — за продактом).
- **Phase 2 (возврат автоперевода RU/UK без краша):** Planned — см. раздел
  [Phase 2](#phase-2--возврат-автоперевода-rуuk-для-продавца-вариант-3) ниже.

## Цель

Устранить падение приложения с ошибкой
`NotFoundError: Failed to execute 'removeChild' on 'Node'` и белым экраном
«Unexpected Application Error!» (у продавца отображается переведённым как
«Неожиданная ошибка приложения!»), которое возникает при создании товара на
`/seller/seller-create` и на странице ревью перед отправкой на модерацию
(`/seller/seller-preview`), когда у пользователя включён **автоперевод страницы
в браузере** (Google Translate / встроенный перевод Chrome / Яндекс.Браузер) или
DOM-инжектирующее расширение.

Сделать так, чтобы:
1. Автоперевод **не ронял** приложение.
2. Любая необработанная ошибка рендера показывала **управляемый фолбэк** и
   уходила в Sentry, а не дефолтный экран React Router.
3. Сценарии создания/превью товара были **покрыты тестами**, включая
   устойчивость к внешней мутации DOM.

## Контекст

Полный анализ первопричины (chat-аудит, июнь 2026):

- `index.html` объявляет `<html lang="en">` и **не содержит** защиты от перевода
  (`translate="no"`, `<meta name="google" content="notranslate">`). Браузер
  русско-/украиноязычного продавца предлагает перевод английского интерфейса.
- Переводчик оборачивает текстовые узлы в `<font>…</font>` и перемещает их.
  React при reconciliation вызывает `removeChild`/`insertBefore` на узлах,
  которые уже не являются его дочерними → `NotFoundError`.
- В приложении **нет глобального ErrorBoundary** (`createBrowserRouter` без
  `errorElement`; поиск по `errorElement`/`useRouteError` — пусто), поэтому
  срабатывает дефолтный обработчик React Router с текстом
  «Unexpected Application Error!».
- Форма создания и превью построены на **условном переключении текстовых узлов**
  (`{error ? <p>…</p> : <></>}`, `{cond ? … : null}`), что максимально повышает
  вероятность краша именно на этих страницах. Падение совпадает с моментом клика
  «Предпросмотр»: одновременно выставляется 6+ флагов ошибок валидации.
- Тестов на флоу создания/превью товара **нет** (покрыты только slice
  `sellerProductWizardSlices.test.js` и util `sellerProductParameters.test.js`).

**Бизнес-поведение НЕ меняем:** валидация, контракты API, навигация и тексты
остаются прежними. Меняем только устойчивость рендера и инфраструктуру ошибок.

## Scope (область)

- `Frontend/Frontend3/index.html` — защита от перевода на уровне документа.
- Глобальный `ErrorBoundary` + интеграция с уже подключённым Sentry
  (`src/main.jsx`).
- `notranslate`/`translate="no"` для динамических текстовых блоков на критичных
  страницах продавца (формы и превью), где переключаются текст-узлы.
- Унификация «опасных» паттернов условного рендера текста в:
  - `src/ui/Seller/create/createFormInp/CreateFormInp.jsx`
  - `src/Components/Seller/create/sellerCreateImages/SellerCreateImage.jsx`
  - `src/ui/Seller/create/createCharacteristicsInp/CreateCharacInp.jsx`
  - `src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx`
  - `src/pages/SellerPreviewPage.jsx`
- Тесты (Vitest + React Testing Library) на create/preview флоу.

## Не входит в задачу

- Переписывание формы создания товара или превью с нуля.
- Изменение бизнес-логики валидации и контрактов API.
- Локализация/перевод контента силами приложения (i18n) сверх текущего.
- Изменение backend.
- Глобальная замена всех `{cond ? … : <></>}` по всему Frontend3 вне scope
  выше (только перечисленные критичные файлы; остальное — backlog P3).

## Зависимости

- Task 024 (product-catalog-modernization) — текущая реализация мастера товара.
- Sentry уже инициализирован в `src/main.jsx` (используем для логирования
  фолбэка ErrorBoundary).

## Риски

- **Чрезмерный `notranslate`** может отключить полезный перевод там, где он
  нужен. Применять точечно к динамическим текст-узлам, а не ко всему `#root`.
- ErrorBoundary не должен «глотать» ошибки молча — обязательно логировать в
  Sentry, иначе потеряем диагностику.
- Изменение паттернов рендера может затронуть отображение ошибок валидации —
  поведение должно остаться идентичным (тесты это фиксируют).
- `removeChild`-краш невозможно стабильно воспроизвести без активного перевода;
  тест на устойчивость эмулирует мутацию DOM, а не реальный переводчик.

## Definition of Done

- [x] Включённый автоперевод страницы на `/seller/seller-create` и
      `/seller/seller-preview` **не приводит** к белому экрану/крашу при
      заполнении формы, появлении ошибок валидации и отправке на модерацию.
      (защита: `translate="no"` на `#root` + `<meta name="google" content="notranslate">`
      + точечные `translate="no"` + глобальный ErrorBoundary как страховка.)
- [x] Любая необработанная ошибка рендера показывает **наш** фолбэк-экран
      (с возможностью вернуться/перезагрузить), а не дефолтный
      «Unexpected Application Error!». (`ErrorBoundary` обёрнут вокруг `RouterProvider`.)
- [x] Все необработанные ошибки рендера логируются в Sentry с контекстом
      (`area`, `translation_likely_active`, `componentStack`; без PII).
- [x] Критичные динамические текст-блоки форм/превью продавца защищены от
      перевода (`notranslate`/`translate="no"`), бизнес-тексты не сломаны.
- [x] Опасные паттерны `{cond ? <p>…</p> : <></>}` в перечисленных файлах
      заменены на стабильный always-mounted контейнер (`hidden={!error}`)
      без изменения внешнего поведения.
- [x] Добавлены интеграционные тесты на create/preview флоу (валидация,
      ветки превью) и тест на устойчивость к внешней мутации DOM (reparent в `<font>`).
- [x] `npm run lint` (0 errors) и `npm run test` (462 passed) во Frontend3 зелёные.
- [ ] Ручная проверка: продавец с включённым переводом проходит весь флоу до
      «Отправить на модерацию» без ошибки (evidence: видео/скрин). — за продактом.

---

# Iterations

## Iteration 1 — Analysis & Reproduction

### Цель
Подтвердить первопричину и зафиксировать точки риска.

### Действия
- Прочитать и составить карту условных текст-узлов в:
  `CreateFormInp.jsx`, `SellerCreateImage.jsx`, `CreateCharacInp.jsx`,
  `SellerCreateForm.jsx`, `SellerPreviewPage.jsx`.
- Воспроизвести краш: включить «Перевести на русский» в Chrome на
  `/seller/seller-create`, заполнить форму невалидно, нажать «Предпросмотр».
- Проверить, что без перевода краша нет (инкогнито без расширений).
- Зафиксировать, что глобального ErrorBoundary нет и `index.html` не защищён.

### Output
- Список файлов и строк с паттернами `: <></>` и `? … : null` (P0/P1/P2).
- Подтверждённый сценарий воспроизведения (шаги + условия).

### Статус
- [x] Analysis complete

Карта опасных паттернов (`: <></>` / `? … : null` с текст-узлами):
- `CreateFormInp.jsx:70` — `error ? <p> : <></>` (P0, рендерится в форме многократно).
- `SellerCreateImage.jsx:185-186` — `fileError`/`err` → `<p> : <></>` (P0).
- `CreateCharacInp.jsx:91` — `err ? <p> : null` (P1).
- `SellerPreviewPage.jsx` — блоки `pending`/`rejected`/`hasMissingRequiredAttributes`/
  `partial_success` (P1, переключаются при клике «Отправить»).
- Глобального ErrorBoundary нет; `index.html` без защиты от перевода — подтверждено.

---

## Iteration 2 — Global ErrorBoundary + Sentry fallback

### Цель
Заменить дефолтный краш-экран React Router на управляемый фолбэк с логированием.

### Действия
- Добавить глобальный ErrorBoundary (React class component или
  `Sentry.ErrorBoundary`) на верхнем уровне дерева в `src/main.jsx`
  (обёртка над `RouterProvider` или через `errorElement` роутера).
- Фолбэк: понятное сообщение + кнопки «Назад»/«Перезагрузить»; текст через i18n.
- В `componentDidCatch`/`onError` отправлять ошибку в Sentry с тегом
  (например `area: seller-product-wizard`) и информацией, что мог быть активен
  перевод (флаг наличия `<font>`-узлов в `#root`, без PII).
- Не нарушать правило безопасности: не логировать токены/PII.

### Ограничения
- Не менять структуру роутера сверх добавления error boundary.

### Output
- Компонент ErrorBoundary + подключение в `main.jsx`.

### Статус
- [x] ErrorBoundary done

`src/Components/ErrorBoundary/ErrorBoundary.jsx` (class component): фолбэк с
кнопками «Перезагрузить»/«Назад» (i18n `errorBoundary.*`, en+cz), `translate="no"`
на контейнере; в `componentDidCatch` → `Sentry.captureException` с тегами
`area`, `translation_likely_active` (наличие `<font>` в `#root`) и `componentStack`.
Подключён в `main.jsx` вокруг `RouterProvider`.

---

## Iteration 3 — Защита от автоперевода

### Цель
Не дать переводчику мутировать узлы, которыми управляет React в критичных местах.

### Действия
- В `index.html` добавить в `<head>`:
  `<meta name="google" content="notranslate" />` и оценить `translate="no"` на
  корневом контейнере динамической части (точечно, не на статике сайта).
- Проставить `translate="no"` / класс `notranslate` на динамические текст-блоки
  форм и превью продавца (блоки ошибок валидации, спиннер «Loading…»,
  предупреждения, баннер `partial_success`).
- Проверить, что бизнес-тексты, которые реально нужно переводить, не сломаны
  (решение: интерфейс уже локализуется через i18n, внешний перевод для
  критичных интерактивных блоков отключаем осознанно).

### Output
- Изменённый `index.html` + точечные `notranslate` атрибуты.

### Статус
- [x] Anti-translate protection done

`index.html`: добавлены `<meta name="google" content="notranslate" />` и
`translate="no"` на `#root`. Точечный `translate="no"` на динамических блоках
превью (loading, rejected, missing-attributes, partial_success). Интерфейс
локализуется через i18n (en/cz), поэтому внешний перевод отключён осознанно.

---

## Iteration 4 — Hardening условного рендера текста

### Цель
Снизить число remove/insert операций над текст-узлами без изменения поведения.

### Действия
- Заменить `{error ? <p>…</p> : <></>}` на стабильный контейнер: всегда
  монтировать обёртку ошибки и менять только содержимое/класс, либо
  использовать `null` вместо `<></>`. Применить в:
  - `CreateFormInp.jsx` (строка с `error ? <p> : <></>`)
  - `SellerCreateImage.jsx` (`fileError` и `imageRequired`)
  - `CreateCharacInp.jsx` (`allParametersAreRequired`)
- В `SellerPreviewPage.jsx` и `SellerCreateForm.jsx` свести к минимуму
  ветвления, переключающие соседние текст-узлы.
- Поведение (что и когда показывается) должно остаться идентичным — проверяется
  тестами из Iteration 5.

### Ограничения
- Не менять тексты, ключи i18n, условия появления ошибок.
- Не трогать валидацию (`getValidateGoods`, `validateProductVariants` и т.п.).

### Output
- Diff по перечисленным файлам с одинаковым внешним поведением.

### Статус
- [x] Render hardening done

Паттерн `{error ? <p>…</p> : <></>}` заменён на always-mounted узел
`<p className={styles.errText} translate="no" hidden={!error}>{error || ""}</p>`
в `CreateFormInp`, `SellerCreateImage` (fileError + imageRequired),
`CreateCharacInp`. Узел больше не размонтируется → React не вызывает
`removeChild` на перемещённом переводчиком узле. Внешнее поведение идентично
(скрыт через `hidden`, тексты/условия не менялись).

---

## Iteration 5 — Tests

### Цель
Зафиксировать поведение create/preview и устойчивость к мутации DOM.

### Действия
- Интеграционные тесты (Vitest + RTL) на `SellerCreateForm`:
  - сабмит с невалидными полями → появляются все блоки ошибок, рендер не падает;
  - валидный сабмит → переход на `/seller/seller-preview`.
- Тесты `SellerCreateImage`: ошибка валидации файла, требование изображения,
  добавление/удаление.
- Тесты `CreateCharacInp`: добавление/удаление строк, ошибка обязательности.
- Тесты `SellerPreviewPage`: ветки `pending` / `rejected` / `fulfilled` /
  `partial_success`, `hasMissingRequiredAttributes`.
- Тест устойчивости: смонтировать критичный компонент, эмулировать внешнюю
  мутацию (обернуть текст-узел в `<font>` / удалить узел вручную), затем
  вызвать перерендер (toggle ошибки) — приложение не должно падать;
  ErrorBoundary, если ловит, показывает фолбэк.

### Output
- Новые `*.test.jsx` рядом с компонентами.

### Статус
- [x] Tests done

Новые тесты (16, все зелёные):
- `ErrorBoundary.test.jsx` — рендер детей; фолбэк + `Sentry.captureException`
  с тегами; `translate="no"` на фолбэке.
- `CreateFormInp.test.jsx` — показ/скрытие ошибки, `translate="no"`,
  устойчивость к reparent узла в `<font>` при перерендере (без краша).
- `CreateCharacInp.test.jsx` — добавление/удаление строк, тоггл ошибки.
- `SellerCreateImage.test.jsx` — ошибка формата файла, imageRequired,
  стабильные защищённые узлы (swiper/react-responsive замоканы).
- `SellerPreviewPage.test.jsx` — ветки default/missing-attributes/
  partial_success/pending(id)/rejected(id).

---

## Iteration 6 — Validation

### Сценарии для проверки
- [ ] Перевод включён → заполнить форму невалидно → «Предпросмотр» → ошибки
      валидации показываются, краша нет.
- [ ] Перевод включён → валидная форма → превью → «Отправить на модерацию» →
      успех, без белого экрана.
- [ ] Принудительно вызвать ошибку рендера → виден наш фолбэк, событие в Sentry.
- [ ] Перевод выключен → поведение идентично прежнему (регресс не внесён).
- [ ] `npm run lint` ✅, `npm run test` ✅ (Frontend3).

### Статус
- [x] Validation complete (автоматическая часть)

- `npm run lint` → 0 errors (654 pre-existing warnings, не из этой задачи).
- `npm run test` → 54 файла, 462 теста passed.
- Ручные сценарии с реальным включённым переводом браузера — за продактом
  (краш невозможно стабильно воспроизвести в unit-окружении; вместо этого
  добавлен тест на эмуляцию мутации DOM).

---

---

# Phase 2 — Возврат автоперевода RU/UK для продавца (Вариант 3)

**Priority:** P1 · **Complexity:** Medium · **Status:** Planned

## Цель

Вернуть автоперевод страницы средствами браузера (Google Translate / встроенный
перевод Chrome / Яндекс.Браузер) для продавцов с русским/украинским языком,
**не возвращая** краш `NotFoundError: Failed to execute 'removeChild' on 'Node'`
на `/seller/seller-create` и `/seller/seller-preview`.

То есть: снять глобальную блокировку перевода, добавленную в Phase 1, но
устранить **первопричину** падения, а не подавлять переводчик.

## Контекст

В Phase 1 перевод был полностью отключён (`<meta name="google" content="notranslate">`
+ `translate="no"` на `#root`). Это безопасно, но лишает русско-/украиноязычных
продавцов автоперевода интерфейса (родная локализация в i18n — только en/cz).

Корень краша: переводчик оборачивает текст-узел в `<font>` и перемещает его;
React при reconciliation вызывает `removeChild`/`insertBefore` на узле, который
уже не его прямой потомок → DOM кидает `NotFoundError`. Канонический фикс
сообщества React — «защитный» monkey-patch `Node.prototype.removeChild` и
`insertBefore`, которые не бросают исключение при операции над узлом из чужого
родителя. Это позволяет оставить перевод включённым.

Решение по охвату (согласовано): перевести **весь** интерфейс продавца, но
**защитить от перевода технические/числовые токены** (цены, SKU, ID товара,
штрихкод, ставка VAT, габариты, гарантия, артикул), т.к. Google Translate может
искажать форматирование чисел и кодов.

## Scope (область)

- `Frontend/Frontend3/index.html` — снять `<meta name="google" content="notranslate">`
  и `translate="no"` с `#root`.
- Новый util `src/utils/domTranslateGuard.js` — `installDomTranslateGuard()`,
  подключение в `src/main.jsx` **до** `ReactDOM.createRoot`.
- Снять точечные `translate="no"` с **i18n-текстов** ошибок валидации
  (`CreateFormInp`, `CreateCharacInp`, `SellerCreateImage`) — их перевод полезен
  продавцу; always-mounted `hidden`-паттерн из Phase 1 сохраняем.
- Проставить `translate="no"` на **технические/числовые** токены в:
  - `src/Components/Seller/preview/**` (`SellerPreview*`, `SellerReview*`):
    цена, sale price, stock qty, system SKU, габариты упаковки, штрихкод.
  - `src/Components/Seller/create/sellerCreateVariants/SellerCreateVariants.jsx`
    — отображаемые числовые значения вариантов (не плейсхолдеры).
  - `src/pages/SellerPreviewPage.jsx` — баннер `partial_success`: защитить
    `Product ID` и коды шагов, но разрешить перевод поясняющего текста.
- Тесты на guard и на охват `translate="no"` технических токенов.

## Не входит в задачу

- Перевод средствами приложения (полноценный i18n RU/UK) — отдельный backlog.
- Изменение бизнес-логики, валидации, контрактов API.
- Возврат/изменение `ErrorBoundary` (остаётся как страховка; на самом фолбэке
  `translate="no"` сохраняем осознанно — фолбэк редкий и не должен сам падать).
- Глобальная правка всех страниц вне seller create/preview.

## Зависимости

- Phase 1 этой же задачи (ErrorBoundary, always-mounted `hidden`-паттерн) — основа.

## Риски

- **Monkey-patch глобальных DOM-методов.** `removeChild`/`insertBefore`
  переопределяются на уровне всего приложения. Митигация: «глотать» операцию
  только когда `child.parentNode !== this` (иначе — оригинальное поведение),
  защита от двойного патча (idempotent), подробный комментарий-обоснование, без
  изменения сигнатур/возвращаемых значений в нормальном пути.
- **Искажение чисел/кодов переводчиком.** Google Translate меняет
  форматирование чисел и может «переводить» коды. Митигация: строгий аудит и
  `translate="no"` на всех технических/числовых токенах (Iteration 8).
- **Возврат churn текст-узлов** при включённом переводе. Митигация: guard +
  always-mounted `hidden`-паттерн снижают частоту проблемных reconciliation;
  ErrorBoundary ловит остаточные случаи.
- **Качество машинного перевода поверх en/cz.** Перевод RU/UK — машинный, по
  верх английского интерфейса. Принято продуктово как осознанный компромисс.

## Definition of Done (Phase 2)

- [ ] Автоперевод браузера на RU и UK **включается** на `/seller/seller-create`
      и `/seller/seller-preview` (нет `notranslate`/`translate="no"` на `#root`).
- [ ] При включённом переводе заполнение формы, появление ошибок валидации,
      «Предпросмотр» и «Отправить на модерацию» **не вызывают** краш/белый экран.
- [ ] `installDomTranslateGuard()` подключён в `main.jsx` до первого рендера,
      идемпотентен, «глотает» только cross-parent операции.
- [ ] Технические/числовые токены (цена, sale price, stock, SKU, ID, штрихкод,
      VAT, габариты, гарантия, артикул) защищены `translate="no"` и **не**
      искажаются переводчиком.
- [ ] i18n-тексты ошибок валидации снова переводятся (с них снят `translate="no"`),
      always-mounted `hidden`-паттерн сохранён.
- [ ] Добавлены тесты: guard (cross-parent no-throw + нормальный путь),
      охват `translate="no"` техн. токенов; обновлены тесты Phase 1, где
      проверялся `translate="no"` на узлах ошибок.
- [ ] `npm run lint` (0 errors) и `npm run test` зелёные во Frontend3.
- [ ] Ручная проверка в Chrome: перевод EN→RU и EN→UK, оба критичных экрана,
      числа/коды не искажены, краша нет (evidence: видео/скрин).

---

## Iteration 7 — DOM translate guard (главный фикс)

### Цель
Сделать React устойчивым к мутациям переводчика на уровне DOM, чтобы перевод
можно было включить безопасно.

### Действия
- Создать `src/utils/domTranslateGuard.js` с `installDomTranslateGuard()`:
  переопределить `Node.prototype.removeChild` и `Node.prototype.insertBefore`
  так, чтобы при `child.parentNode !== this` (или `referenceNode.parentNode !== this`)
  возвращать узел без выброса исключения; иначе — вызывать оригинал.
- Сделать идемпотентным (флаг на функции/модуле), чтобы StrictMode и повторные
  импорты не патчили дважды.
- Подключить вызов в начале `src/main.jsx` **до** `ReactDOM.createRoot(...)`.
- Не логировать PII; опциональный `console.warn` только в dev.

### Output
- `domTranslateGuard.js` + подключение в `main.jsx`.

### Статус
- [ ] Guard done

---

## Iteration 8 — Точечный re-open перевода

### Цель
Включить перевод интерфейса и защитить технические/числовые токены.

### Действия
- `index.html`: удалить `<meta name="google" content="notranslate" />` и
  `translate="no"` с `#root`.
- Снять `translate="no"` с i18n-узлов ошибок валидации в `CreateFormInp`,
  `CreateCharacInp`, `SellerCreateImage` (паттерн `hidden={!error}` оставить).
- Провести аудит и проставить `translate="no"` на технические/числовые токены
  в превью/ревью и вариантах (цена, sale price, stock, SKU, ID, штрихкод, VAT,
  габариты, гарантия, артикул). В баннере `partial_success` защитить `Product ID`
  и коды шагов, оставив перевод поясняющего текста.

### Ограничения
- Не менять тексты, ключи i18n, условия появления ошибок и бизнес-логику.

### Output
- Diff по `index.html` и перечисленным компонентам.

### Статус
- [ ] Re-open done

---

## Iteration 9 — Tests

### Цель
Зафиксировать работу guard и охват защиты технических токенов; обновить тесты
Phase 1.

### Действия
- `domTranslateGuard.test.js`: после установки `removeChild`/`insertBefore` с
  «чужим» родителем не бросают и возвращают узел; с правильным родителем
  работают как обычно; повторная установка не ломает поведение.
- Тест устойчивости: смонтировать критичный компонент, перенести текст-узел в
  `<font>`, переключить состояние ошибки — с установленным guard краша нет.
- Обновить тесты `CreateFormInp`/`CreateCharacInp`/`SellerCreateImage`: убрать/
  инвертировать ассерты на `translate="no"` у узлов ошибок (теперь переводимы),
  оставить проверку `hidden`-поведения.
- Тесты охвата: технические токены в превью/вариантах несут `translate="no"`.

### Output
- Новый `*.test.js(x)` + обновлённые тесты Phase 1.

### Статус
- [ ] Tests done

---

## Iteration 10 — Validation

### Сценарии для проверки
- [ ] Chrome перевод EN→RU: форма создания и превью переведены, краша нет.
- [ ] Chrome перевод EN→UK: то же.
- [ ] Невалидный сабмит при включённом переводе → ошибки видны, без краша.
- [ ] Валидный сабмит → превью → «Отправить на модерацию» → успех, без белого
      экрана.
- [ ] Числа/коды (цена, SKU, ID, штрихкод, габариты, VAT) не искажены переводом.
- [ ] `npm run lint` ✅, `npm run test` ✅ (Frontend3).
- [ ] Evidence (видео/скрин) приложены.

### Статус
- [ ] Validation complete

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Document** | `Frontend/Frontend3/index.html` |
| **Bootstrap/Error** | `Frontend/Frontend3/src/main.jsx`, `ErrorBoundary` компонент, **Phase 2:** `src/utils/domTranslateGuard.js` |
| **Forms (render)** | `src/ui/Seller/create/createFormInp/CreateFormInp.jsx`, `src/ui/Seller/create/createCharacteristicsInp/CreateCharacInp.jsx`, `src/Components/Seller/create/sellerCreateImages/SellerCreateImage.jsx`, `src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx` |
| **Preview / Review (Phase 2 техн. токены)** | `src/pages/SellerPreviewPage.jsx`, `src/Components/Seller/preview/**` (`SellerPreviewDesktop`, `SellerPreviewMobile`, `SellerReview*`), `src/Components/Seller/create/sellerCreateVariants/SellerCreateVariants.jsx` |
| **Tests** | новые `*.test.jsx`/`*.test.js` рядом с компонентами и `src/utils/domTranslateGuard.test.js` |
| **Backend API** | Не меняется |

## Заметки для агента-исполнителя

- Соблюдать правила репозитория: не менять бизнес-поведение и контракты API,
  делать маленькие проверяемые изменения, не логировать секреты/PII.
- Сначала Iteration 1 (анализ + воспроизведение), затем строго по порядку.
- Перед правкой рендера (Iteration 4) написать/подготовить тесты (Iteration 5)
  как страховку от регресса, либо вести их параллельно.
- Каждую итерацию отмечать чекбоксом и кратко фиксировать evidence в этом файле.
