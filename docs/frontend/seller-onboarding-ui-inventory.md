# Seller Onboarding — UI Migration Inventory

> **Статус:** черновик для FE-016. Заполняется в задаче [FE-016](../tasks/016-seller-onboarding-migration-audit/task.md).  
> **План:** [shadcn-ui-migration-plan.md](./shadcn-ui-migration-plan.md)

Документ связывает **маршруты**, **файлы**, **API**, **тесты** и **целевые view-компоненты** для миграции onboarding на shadcn/ui.

---

## Легенда

| Колонка | Значение |
|---------|----------|
| **Type** | `Container` / `View` / `Mixed` |
| **Task** | FE-018 … FE-021 |
| **Tests** | RTL / e2e / fullstack — статус якоря |
| **Migrated** | `No` → `WIP` → `Yes` (обновляет FE-021) |

---

## Route inventory (шаблон — заполнить в FE-016)

**Всего: 17 onboarding routes** (см. [карту маршрутов](./shadcn-ui-migration-plan.md#карта-маршрутов-пилота)).

| Route | Page file | Main components | API (onboarding) | Redux | Type | Task | Tests RTL | Tests e2e | Migrated |
|-------|-----------|-----------------|------------------|-------|------|------|-----------|-----------|----------|
| `/seller/login` | `sellerPages/SellerLogin/SellerLogin.jsx` | `LoginForm` | `auth.js` login | — | Mixed | FE-018 | TBD | FE-010 ✓ | No |
| `/seller/reset` | `sellerPages/SellerReset/...` | `ResetForm` | password reset OTP | — | Mixed | FE-018 | TBD | — | No |
| `/seller/successfully-reset` | `sellerPages/SellerSuccessfullyReset/SellerSuccessfullyReset.jsx` | static confirmation | — | — | View | FE-018 | TBD | — | No |
| `/seller/verify-email` | `sellerPages/SellerVerifyEmail/...` | `VerifyForm` | email confirm | — | Mixed | FE-018 | TBD | — | No |
| `/seller/create-password` | `sellerPages/SellerCreateNewPass/...` | `CreatePassForm` | password set | — | Mixed | FE-018 | TBD | — | No |
| `/seller/create-account` | `sellerPages/SellerCreateAccount/...` | `CreateForm` | register seller | — | Mixed | FE-018 | TBD | FE-010 ✓ | No |
| `/seller/create-verify` | `sellerPages/CreateVerifyEmail/...` | `VerifyEmail` | OTP resend | — | Mixed | FE-018 | TBD | — | No |
| `/seller/seller-type` | `sellerPages/SellerTypePage/SellerType.jsx` | `SellerTypeContent` | `POST seller-type`, `GET state` | possible | Mixed | FE-018 | FE-003 ✓ | FE-010 ✓ | No |
| `/seller/application-sub` | `sellerPages/ApplicationSubmited/...` | `ApplicationSubmited` | `GET state` | — | View-heavy | FE-018 | TBD | FE-010 ✓ | No |
| `/seller/seller-info` | `sellerPages/SellerInformation/...` | personal/tax/address/… | `self-employed/*`, bank, warehouse, return, documents | `selfEmploed` | Mixed | FE-019 | TBD | FS-001 | No |
| `/seller/seller-company` | `sellerPages/SellerCompanyInfo/...` | company blocks | `company/*`, bank, … | `selfEmploed` | Mixed | FE-019 | TBD | FS-001 | No |
| `/seller/seller-review` | `sellerPages/ReviewInfoPage/...` | review/* | `GET review`, `POST submit` | — | Mixed | FE-020 | partial API ✓ | FS-001 | No |
| `/seller/seller-review-company` | `sellerPages/SellerReviewCompany/...` | review/* | same | — | Mixed | FE-020 | TBD | FS-001 | No |
| `/seller/finish-verification` | `sellerPages/FinishVerificationPage/...` | — | `GET state` | — | TBD | FE-020 | TBD | — | No |
| `/seller/action-required` | `sellerPages/ActionRequiredPage/...` | — | `GET state` | — | TBD | FE-020 | TBD | — | No |
| `/seller/under-review` | `sellerPages/UnderReviewPage/...` | — | `GET state` | — | TBD | FE-020 | TBD | — | No |
| `/seller/verified-analyt` | `sellerPages/VerifiedAnalyt/...` | — | `GET state` | — | TBD | FE-020 | TBD | — | No |

*Точные пути файлов и Redux — уточнить в Iteration 1 FE-016.*

---

## Onboarding page paths (scope для FE-021 grep)

Только эти каталоги `sellerPages/` — **не** `NewSellerOrder*`, **не** seller cabinet в `pages/`:

```
src/sellerPages/SellerLogin/
src/sellerPages/SellerReset/
src/sellerPages/SellerSuccessfullyReset/
src/sellerPages/SellerVerifyEmail/
src/sellerPages/SellerCreateNewPass/
src/sellerPages/SellerTypePage/
src/sellerPages/SellerCreateAccount/
src/sellerPages/CreateVerifyEmail/
src/sellerPages/ApplicationSubmited/
src/sellerPages/SellerInformation/
src/sellerPages/SellerCompanyInfo/
src/sellerPages/ReviewInfoPage/
src/sellerPages/SellerReviewCompany/
src/sellerPages/FinishVerificationPage/
src/sellerPages/ActionRequiredPage/
src/sellerPages/UnderReviewPage/
src/sellerPages/VerifiedAnalyt/
```

Плюс `src/Components/Seller/auth/` (все onboarding UI-компоненты).

---

## MUI / SCSS usage (заполнить в FE-016)

| Path | MUI imports | SCSS module | Notes |
|------|-------------|-------------|-------|
| `Components/Seller/auth/loginForm/LoginForm.jsx` | TBD | Yes | |
| `Components/Seller/auth/sellerTypeContent/SellerTypeContent.jsx` | TBD | Yes | has RTL tests |
| … | | | |

---

## Container / View split targets (заполнить в FE-016)

| Current file | Container (keep logic) | New view file |
|--------------|------------------------|---------------|
| `SellerTypeContent.jsx` | `SellerTypeContent.jsx` | `SellerTypeContentView.jsx` |
| `LoginForm.jsx` | `LoginForm.jsx` | `LoginFormView.jsx` |
| … | | |

---

## Test gates — must stay green

| Test file | Covers | Gate for |
|-----------|--------|------------|
| `src/api/seller/onboarding.test.js` | API error handling | FE-019, FE-020 |
| `SellerTypeContent.test.jsx` | seller-type UI | FE-018 |
| `e2e/seller-onboarding.spec.js` | 4 smoke routes | FE-018 |
| `e2e/fullstack-seller-onboarding.spec.js` | FS-001 | FE-019, FE-020 |

### Gaps to add (FE-016 output)

| Screen | Missing anchor | Priority | Add in task |
|--------|----------------|----------|-------------|
| LoginForm | RTL validation | P0 | FE-018 |
| CreateForm | RTL validation | P0 | FE-018 |
| BankAccount | RTL API errors | P0 | FE-019 |
| Review submit | RTL failed submit | P0 | FE-020 |

---

## v0 / Agent brief

См. шаблон промпта в [shadcn-ui-migration-plan.md](./shadcn-ui-migration-plan.md#роли-ии-агентов).

**Onboarding-specific props example (`SellerTypeContentView`):**

```javascript
{
  selectedType: 'self_employed' | 'company' | null,
  onSelectType: (type) => void,
  onContinue: () => void,
  isLoading: boolean,
  errorMessage: string | null,
  labels: { title, subtitle, selfEmployed, company, continue },
}
```

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-05-27 | Создан шаблон inventory для FE-016 |
| 2026-05-27 | Добавлен `/seller/successfully-reset`; секция onboarding page paths для FE-021 |
