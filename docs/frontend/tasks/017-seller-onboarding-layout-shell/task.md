# FE-017 — Seller Onboarding Layout Shell & Form Primitives

**Status:** Planned  
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

- [ ] Компоненты в `src/components/seller/onboarding/` (или согласованный path из FE-016).
- [ ] RTL: layout рендерит title, footer buttons, error state.
- [ ] Ни один production route не переключён на новый layout (только импорт в preview/test) **или** переключён один demo route за feature flag — решение в PR.
- [ ] `npm run test && npm run build` зелёные.
- [ ] Документирован mapping `next_step` → labels в inventory или в task PR description.

---

# Iterations

## Iteration 1 — Design tokens for onboarding

### Действия

1. Зафиксировать spacing, max-width form (например `max-w-lg`), border-radius из shadcn theme.
2. Согласовать с существующим seller header (`SellerHeader`) — reuse или replace позже.

### Output

- CSS variables / tailwind extend в PR comment.

### Статус

- [ ]

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

- [ ]

---

## Iteration 3 — Form primitives

### Действия

1. `FormField.jsx` — id, label, error, hint, children (Input slot).
2. `OnboardingAlert.jsx` — API error banner (variant destructive).
3. `FileUploadZone.jsx` — drag area, file list display, props: `files`, `onSelect`, `accept`, `error`.

### Статус

- [ ]

---

## Iteration 4 — Progress mapping

### Действия

1. `onboardingSteps.js` — константы порядка: `seller_type`, `personal`, `tax`, … (из [seller-onboarding-flow.md](../../../seller-onboarding-flow.md)).
2. `OnboardingProgress.jsx` — props: `currentStepKey`, `completedSteps[]`.

### Статус

- [ ]

---

## Iteration 5 — Tests & validation

### Действия

```bash
cd Frontend/Frontend3
npm run test -- src/components/seller/onboarding
npm run build
```

### Статус

- [ ]

---

## PR breakdown (рекомендуемый)

| PR | Содержание |
|----|------------|
| 17.1 | Layout + StepHeader + Footer + tests |
| 17.2 | FormField + Alert + FileUploadZone + tests |
| 17.3 | Progress mapping + unit tests on `onboardingSteps.js` |
