# FE-020 — Seller Onboarding: Review, Submit & Status UI

**Status:** In progress
**Priority:** P0
**Phase:** 5 — UI migration
**Depends on:** FE-019
**Blocks:** FE-021

## Цель

Мигрировать **review**, **submit** и **post-submit status** экраны на shadcn/ui, сохранив `POST /onboarding/submit/` и отображение completeness/errors с backend.

## Контекст

Review — точка, где пользователь видит агрегированные данные перед submit. Submit errors содержат `completeness` flags и field errors ([seller-onboarding-flow.md](../../../seller-onboarding-flow.md) §7). Status pages зависят от `GET onboarding/state/`.

## Scope — маршруты

| Route | Page | Поведение |
|-------|------|-----------|
| `/seller/seller-review` | `ReviewInfoPage` | OSVČ review + submit |
| `/seller/seller-review-company` | `SellerReviewCompany` | Company review + submit |
| `/seller/finish-verification` | `FinishVerificationPage` | status messaging |
| `/seller/action-required` | `ActionRequiredPage` | editable rejected state CTA |
| `/seller/under-review` | `UnderReviewPage` | pending_verification |
| `/seller/verified-analyt` | `VerifiedAnalyt` | approved → dashboard entry |

### Review subcomponents (ожидаемые)

- `PersonalDetails`, `BusinessAddress`, `BankAccount`, `WarehouseAndReturn`, `AccountInfo`, `CompanyInfo` (review folder)

## Не входит в задачу

- Django admin moderation.
- Email templates.
- Redirect после approve в seller-home (сохранить текущую логику).

## Зависимости

- FE-019 (data steps migrated).
- `postSubmitOnboarding` + `handleError` (не менять контракт).
- Tests: `onboarding.test.js`, FE-011 full-stack.

## Риски

| Риск | Митигация |
|------|-----------|
| Submit error UX regression | RTL on `handleError` mapping + integration test with mock 400 |
| Full-stack e2e FS-001 | run after each review PR |
| Read-only review accidentally editable | explicit `readOnly` props on views |

## Definition of Done

- [x] Review pages render all sections from API review response (mocked RTL). — OSVČ `ReviewInfoPage` + `ReviewSectionCard` RTL
- [ ] Submit success → navigates as before (e2e or manual script).
- [ ] Submit failure → completeness/errors visible (RTL).
- [ ] Status pages migrated; icons/badges via shadcn Badge/Alert.
- [ ] `e2e/seller-onboarding.spec.js` + FS-001 green.
- [ ] No MUI in review/status components.

---

# Iterations

## Iteration 1 — Review read-only views

### Действия

1. v0: `ReviewSectionCard` — title + dl/dt/dd rows from props.
2. Split `ReviewInfoPage` → container + `SelfEmployedReviewView`.
3. Split `SellerReviewCompany` → `CompanyReviewView`.

### Props contract (example)

```javascript
// SelfEmployedReviewView
{
  sections: [{ id, title, rows: [{ label, value }] }],
  isSubmittable,
  onSubmit,
  onEditSection,
  submitError,
  isSubmitting,
}
```

### Статус

- [x]

---

## Iteration 2 — Submit integration

### Действия

1. Container: `GET onboarding/review/` → map to view props.
2. Submit button calls existing `postSubmitOnboarding()`.
3. Map API error body to `submitError` / field list (reuse `handleError`).

### Tests

- RTL: submittable → button enabled; 400 with completeness → message shown.
- Unit: уже есть в `onboarding.test.js` — не дублировать без нужды.

### Статус

- [ ]

---

## Iteration 3 — Status pages

### PR order

| PR | Route | State from API |
|----|-------|----------------|
| 20.1 | `under-review`, `application-sub` overlap check | `pending_verification` |
| 20.2 | `action-required`, `finish-verification` | `rejected` / intermediate |
| 20.3 | `verified-analyt` | `approved` |

### Действия

1. v0 static views with CTA props.
2. Container loads `getOnboardingStatus()` where already implemented.

### Статус

- [ ]

---

## Iteration 4 — E2E & full-stack

### Действия

```bash
cd Frontend/Frontend3
npm run test
npm run test:e2e -- e2e/seller-onboarding.spec.js
npm run test:e2e -- e2e/fullstack-seller-onboarding.spec.js  # if backend available
```

Обновить [test-matrix.md](../../test-matrix.md): review submit RTL row.

### Статус

- [ ]

---

## PR breakdown

| PR | Content |
|----|---------|
| 20.1 | Review views + OSVČ page | ✓ |
| 20.2 | Company review page | ✓ |
| 20.3 | Submit error handling polish + RTL |
| 20.4 | Status pages bundle |

## Agent prompt (submit — critical)

```text
Task FE-020: Migrate ReviewInfoPage UI to shadcn presentational views.
Keep postSubmitOnboarding() in container exactly as today.
On API error, display the same user-visible messages via handleError mapping.
Add RTL test for failed submit with completeness flags in response body.
Do NOT change backend endpoints or request shape.
```
