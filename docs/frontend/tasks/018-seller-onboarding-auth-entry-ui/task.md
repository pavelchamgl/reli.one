# FE-018 — Seller Onboarding: Auth & Entry Steps UI

**Status:** Done
**Priority:** P1
**Phase:** 5 — UI migration
**Depends on:** FE-017
**Blocks:** FE-019

## Цель

Мигрировать **низкорисковые entry-экраны** seller onboarding на shadcn/ui, сохранив Formik/Yup, API и маршруты в container-слое.

## Контекст

Эти экраны — первая «живая» миграция после foundation. Часть уже покрыта e2e (FE-010). Порядок: от простых форм к `SellerTypeContent`.

## Scope — маршруты

| Route | Page | Container (оставить логику) | New View |
|-------|------|----------------------------|----------|
| `/seller/login` | `SellerLogin` | auth submit, redirect | `LoginFormView` |
| `/seller/reset` | `SellerReset` | OTP flow | `ResetFormView` |
| `/seller/successfully-reset` | `SellerSuccessfullyReset` | — | static view |
| `/seller/verify-email` | `SellerVerifyEmail` | verify API | `VerifyFormView` |
| `/seller/create-password` | `SellerCreateNewPass` | password rules | `CreatePassFormView` |
| `/seller/create-account` | `SellerCreateAccount` | register API | `CreateAccountFormView` |
| `/seller/create-verify` | `CreateVerifyEmail` | resend OTP | `CreateVerifyEmailView` |
| `/seller/seller-type` | `SellerType` | `postSellerType`, state | `SellerTypeContentView` |
| `/seller/application-sub` | `ApplicationSubmited` | read state | `ApplicationSubmittedView` |

## Не входит в задачу

- `/seller/seller-info`, company, review (FE-019, FE-020).
- OAuth / Google (если не используется на seller login).
- Изменение текстов i18n (только перенос keys).

## Зависимости

- FE-017 layout shell.
- FE-016 inventory & test gates.
- Existing: `SellerTypeContent.test.jsx`, `e2e/seller-onboarding.spec.js`.

## Риски

| Риск | Митигация |
|------|-----------|
| e2e ищет старые MUI class names | обновить селекторы на role/name/data-testid в том же PR |
| Pin input (`VerifyPinInput`) | отдельный shadcn Input OTP или сохранить логику в container |

## Definition of Done

- [x] Все 9 маршрутов из таблицы используют shadcn views.
- [x] MUI imports удалены из перечисленных components/pages (MUI только в `DateInp` — FE-019).
- [x] RTL: `LoginForm`, `CreateForm`, `SellerTypeContent` (+ existing SellerTypeContent tests).
- [x] `e2e/seller-onboarding.spec.js` — 4/4 green.
- [x] `npm run test && npm run build` green (184 tests).

## Implementation notes (2026-05-27)

- **Views:** `components/seller/onboarding/views/` — 9 presentational components.
- **Containers:** Formik/API/Redux/nav остаются в `Components/Seller/auth/*`; рендер через `SellerOnboardingLayout`.
- **Pages:** `FormWrap` убран — layout в container.
- **SPA nav:** внутренние seller-переходы через callback props (`onSignUpClick`, …) в container + `navigate()` — без `<a href>` и без react-router в views.
- **Tests:** `LoginForm.test.jsx`, `CreateForm.test.jsx`; `ResizeObserver` polyfill в `test/setup.js`.
- **e2e:** селекторы без изменений (i18n text + `input[name]`).

---

# Iterations

## Iteration 1 — Tests before UI (per screen)

### Цель

Якоря до смены разметки.

### Действия (для каждого PR)

1. Добавить/расширить RTL: render + key assertions (поля, кнопки, error text keys).
2. Запустить `npm run test` — green **до** v0 UI.

### Output

- `*.test.jsx` рядом с container или view.

### Статус

- [x]

---

## Iteration 2 — v0 generate views

### Цель

Сгенерировать presentational components.

### Действия

1. v0 по шаблону из [shadcn-ui-migration-plan.md](../../shadcn-ui-migration-plan.md).
2. Положить views в `src/components/seller/onboarding/views/`.
3. Code review: **нет** fetch, dispatch, useNavigate в view.

### Порядок генерации

1. `ApplicationSubmittedView` (read-only)
2. `SellerTypeContentView`
3. `LoginFormView`, `CreateAccountFormView`
4. `ResetFormView`, `VerifyFormView`, `CreatePassFormView`, `CreateVerifyEmailView`
5. `SellerSuccessfullyResetView`

### Статус

- [x]

---

## Iteration 3 — Container integration

### Цель

Подключить views к существующим pages.

### Действия

1. В `LoginForm.jsx`: оставить Formik; render `<LoginFormView values errors handlers />`.
2. Аналогично для остальных.
3. Обернуть в `SellerOnboardingLayout` где уместно.

### Ограничения

- Не менять URL API.
- Не менять validation schema без багфикса.

### Статус

- [x]

---

## Iteration 4 — E2E & validation

### Действия

```bash
cd Frontend/Frontend3
npm run test
npm run build
npm run test:e2e -- e2e/seller-onboarding.spec.js
```

Обновить селекторы в spec при необходимости.

### Статус

- [x]

---

## PR breakdown (рекомендуемый порядок)

| PR | Routes | Tests |
|----|--------|-------|
| 18.1 | `application-sub`, `seller-type` | extend SellerTypeContent + e2e |
| 18.2 | `login`, `create-account`, `create-verify` | new RTL |
| 18.3 | `reset`, `verify-email`, `create-password`, `successfully-reset` | new RTL |

## Agent prompt (integration)

```text
Task FE-018 PR 18.1: Split SellerTypeContent into container + SellerTypeContentView.
Use SellerOnboardingLayout from FE-017. Keep all API and Redux in container.
Update SellerTypeContent.test.jsx and e2e/seller-onboarding.spec.js if selectors change.
Do not change routes or API contracts.
```
