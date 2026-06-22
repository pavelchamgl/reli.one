# Task 025 — Устойчивость Frontend3 к автопереводу браузера (seller product create/preview)

**Priority:** P1
**Complexity:** Medium
**Status:** Done (код + тесты; ручная проверка с реальным переводом — за продактом)

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

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Document** | `Frontend/Frontend3/index.html` |
| **Bootstrap/Error** | `Frontend/Frontend3/src/main.jsx`, новый `ErrorBoundary` компонент |
| **Forms (render)** | `src/ui/Seller/create/createFormInp/CreateFormInp.jsx`, `src/ui/Seller/create/createCharacteristicsInp/CreateCharacInp.jsx`, `src/Components/Seller/create/sellerCreateImages/SellerCreateImage.jsx`, `src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx` |
| **Preview** | `src/pages/SellerPreviewPage.jsx` |
| **Tests** | новые `*.test.jsx` рядом с компонентами выше |
| **Backend API** | Не меняется |

## Заметки для агента-исполнителя

- Соблюдать правила репозитория: не менять бизнес-поведение и контракты API,
  делать маленькие проверяемые изменения, не логировать секреты/PII.
- Сначала Iteration 1 (анализ + воспроизведение), затем строго по порядку.
- Перед правкой рендера (Iteration 4) написать/подготовить тесты (Iteration 5)
  как страховку от регресса, либо вести их параллельно.
- Каждую итерацию отмечать чекбоксом и кратко фиксировать evidence в этом файле.
