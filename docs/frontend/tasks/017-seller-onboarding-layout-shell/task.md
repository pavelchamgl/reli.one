# FE-017 — Seller Onboarding Layout Shell & Form Primitives

**Status:** Done  
**Priority:** P1  
**Phase:** 5 — UI migration  
**Depends on:** FE-016  
**Blocks:** FE-018 … FE-020

## Цель

Ввести **общий layout онбординга** и **form primitives** на shadcn/ui, чтобы FE-018–FE-020 не дублировали разметку шагов, ошибок и прогресса.

## Контекст

Onboarding использует повторяющиеся паттерны: заголовок шага, подзаголовок, card-форма, footer с Back/Continue, inline errors, loading skeleton. Сейчас они размазаны по SCSS-модулям. Единый shell ускоряет v0-генерацию.

## Scope

- `SellerOnboardingLayout` — header (logo/lang), main, optional sidebar/stepper.
- `OnboardingStepHeader` — title, description, step indicator.
- `OnboardingFormFooter` — primary/secondary actions, loading state.
- `FormField` wrapper — Label + Input/Textarea + error message (shadcn).
- `OnboardingProgress` — mapping `next_step` из API → визуальный прогресс (read-only, без смены логики навигации).
- `FileUploadZone` — presentational UI для документов (без изменения multipart API).
- Story/dev preview или RTL smoke на layout.

## Не входит в задачу

- Подключение layout ко всем страницам (это FE-018+).
- Замена Formik/Yup — остаются в container.
- `@mui/x-date-pickers` — временно: `SellerDateInp` может оставаться MUI внутри container до FE-019 follow-up.

## Зависимости

- FE-015 (`components/ui`).
- FE-016 (inventory + props contracts).

## Риски

| Риск | Митигация |
|------|-----------|
| Stepper не совпадает с backend `next_step` | только отображение; навигация как сейчас |
| i18n в layout | все строки через `t()` props или children |

## Definition of Done

- [x] Компоненты в `src/components/seller/onboarding/` (git lowercase path).
- [x] RTL: layout рендерит title, footer buttons, error state.
- [x] Production routes не переключены — только RTL smoke в тестах.
- [x] `npm run test && npm run build` зелёные (178 tests, build OK).
- [x] Mapping `next_step` → labels в [inventory](../../seller-onboarding-ui-inventory.md#next_step--ui-mapping-fe-017).

## Implementation notes (2026-05-27)

- **Design tokens:** `max-w-lg` form column, `max-w-5xl` header, shadcn `Card` radius/spacing; legacy `SellerHeader` — reuse в FE-018+.
- **Компоненты:** `SellerOnboardingLayout`, `SellerOnboardingCard`, `OnboardingStepHeader`, `OnboardingFormFooter`, `FormField`, `OnboardingAlert`, `FileUploadZone`, `OnboardingProgress`.
- **Constants:** `src/features/seller-onboarding/constants/onboardingSteps.js` (9 steps, backend order).
- **Barrel:** `@/components/seller/onboarding`.
- **Tests:** 9 RTL/unit tests in `components/seller/onboarding/` + `onboardingSteps.test.js`.
- **Path casing:** git tracks `components/seller/onboarding/` (not `Components/Seller/onboarding/`).

---

# Iterations

## Iteration 1 — Design tokens for onboarding

### Действия

1. Зафиксировать spacing, max-width form (например `max-w-lg`), border-radius из shadcn theme.
2. Согласовать с существующим seller header (`SellerHeader`) — reuse или replace позже.

### Output

- CSS variables / tailwind extend в PR comment.

### Статус

- [x]

---

## Iteration 2 — Layout components

### Действия

1. `SellerOnboardingLayout.jsx` — props: `children`, `headerRight`, `className`.
2. `OnboardingStepHeader.jsx` — props: `title`, `description`, `step`, `totalSteps`.
3. `OnboardingFormFooter.jsx` — props: `onBack`, `onContinue`, `continueLabel`, `isSubmitting`, `continueDisabled`.

### v0 prompt example

```text
Create SellerOnboardingLayout and OnboardingStepHeader using shadcn Card and Separator.
Presentational only. Props only. Mobile-first centered column.
```

### Статус

- [x]

---

## Iteration 3 — Form primitives

### Действия

1. `FormField.jsx` — id, label, error, hint, children (Input slot).
2. `OnboardingAlert.jsx` — API error banner (variant destructive).
3. `FileUploadZone.jsx` — drag area, file list display, props: `files`, `onSelect`, `accept`, `error`.

### Статус

- [x]

---

## Iteration 4 — Progress mapping

### Действия

1. `onboardingSteps.js` — константы порядка: `seller_type`, `personal`, `tax`, … (из [seller-onboarding-flow.md](../../../seller-onboarding-flow.md)).
2. `OnboardingProgress.jsx` — props: `currentStepKey`, `completedSteps[]`.

### Статус

- [x]

---

## Iteration 5 — Tests & validation

### Действия

```bash
cd Frontend/Frontend3
npm run test -- src/components/seller/onboarding
npm run build
```

### Статус

- [x]

---

## PR breakdown (рекомендуемый)

| PR | Содержание |
|----|------------|
| 17.1 | Layout + StepHeader + Footer + tests |
| 17.2 | FormField + Alert + FileUploadZone + tests |
| 17.3 | Progress mapping + unit tests on `onboardingSteps.js` |
