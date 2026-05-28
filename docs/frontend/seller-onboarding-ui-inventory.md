# Seller Onboarding — UI Migration Inventory

> **Статус:** **пилот завершён** — FE-015…FE-021 Done (2026-05-28).
> **План:** [shadcn-ui-migration-plan.md](./shadcn-ui-migration-plan.md)

Документ связывает **маршруты**, **файлы**, **API**, **Redux**, **тесты** и **целевые view-компоненты** для миграции onboarding на shadcn/ui.

---

## Легенда

| Колонка | Значение |
|---------|----------|
| **Type** | `Container` — логика/API/Redux/nav; `View` — presentational; `Mixed` — split в FE-018+ |
| **Task** | FE-018 … FE-021 |
| **Migrated** | `No` → `WIP` → `Yes` — **все 17 маршрутов: Yes** (FE-021, 2026-05-28) |

**Redux:** slice `state.selfEmploed` (файл `redux/selfEmployed.js`, опечатка в имени slice сохранена).

**i18n:** namespace `onbording` (опечатка в коде) для onboarding-копирайта; общая валидация — default namespace `validation.*`.

---

## Route inventory (17 маршрутов)

| Route | Page file | Main UI (container) | API | Redux | Type | Task | RTL | e2e | FS-001 | Migrated |
|-------|-----------|---------------------|-----|-------|------|------|-----|-----|--------|----------|
| `/seller/login` | `sellerPages/SellerLogin/SellerLogin.jsx` | `auth/loginForm/LoginForm` | `auth.login`, `onboarding.getOnboardingStatus` | `authSlice`, `basketSlice` | Mixed | FE-018 | **FE-018 ✓** | FE-010 ✓, FE-015 ✓ | — | Yes |
| `/seller/reset` | `sellerPages/SellerReset/SellerReset.jsx` | `auth/resetForm/ResetForm` | `auth.sendOtp`, `auth.passSendOtp` | — | Mixed | FE-018 | Gap P1 | — | — | Yes |
| `/seller/successfully-reset` | `sellerPages/SellerSuccessfullyReset/SellerSuccessfullyReset.jsx` | `auth/sellerSuccForm/SellerSuccForm` | — | — | Mixed | FE-018 | Gap P2 | — | — | Yes |
| `/seller/verify-email` | `sellerPages/SellerVerifyEmail/SellerVerifyEmail.jsx` | `auth/verifyForm/VerifyForm` | `auth.*` OTP | `authSlice` | Mixed | FE-018 | Gap P1 | — | — | Yes |
| `/seller/create-password` | `sellerPages/SellerCreateNewPass/SellerCreateNewPass.jsx` | `auth/createPassForm/CreatePassForm` | `auth.createNewPassApi` | — | Mixed | FE-018 | Gap P1 | — | — | Yes |
| `/seller/create-account` | `sellerPages/SellerCreateAccount/SellerCreateAccount.jsx` | `auth/createAccount/createForm/CreateForm` | `auth.register`, `seller/auth.registerSeller` | hook → `selfEmploed` | Mixed | FE-018 | **FE-018 ✓** | FE-010 ✓ | — | Yes |
| `/seller/create-verify` | `sellerPages/CreateVerifyEmail/CreateVerifyEmail.jsx` | `auth/createAccount/verifyEmail/VerifyEmail` | `auth.emailConfirm`, `auth.sendOtp` | `authSlice` | Mixed | FE-018 | Gap P1 | — | — | Yes |
| `/seller/seller-type` | `sellerPages/SellerTypePage/SellerType.jsx` | `auth/sellerTypeContent/SellerTypeContent` | `postSellerType`, `getOnboardingStatus` | — | Mixed | FE-018 | **FE-003 ✓** | FE-010 ✓ | — | Yes |
| `/seller/application-sub` | `sellerPages/ApplicationSubmited/ApplicationSubmited.jsx` | `auth/applicationSubmited/ApplicationSubmited` | `getOnboardingStatus` | — | Mixed | FE-018 | Gap P1 | FE-010 ✓ | — | Yes |
| `/seller/seller-info` | `sellerPages/SellerInformation/SellerInformation.jsx` | personal/tax/address/bank/warehouse/return blocks | `putPersonalData`, `putTax`, `putSelfAddress`, `putOnboardingBank`, `putWarehouse`, `putReturnAddress`, `uploadSingleDocument` | `selfEmploed.selfData` | **FE-019 ✓** | FE-019 | **FE-019 ✓** | — | ✓ | Yes |
| `/seller/seller-company` | `sellerPages/SellerCompanyInfo/SellerCompanyInfo.jsx` | company/rep/address/bank/warehouse/return | `putCompanyInfo`, `putRepresentative`, `putCompanyAddress`, … | `selfEmploed.companyData` | **FE-019 ✓** | FE-019 | **FE-019 ✓** | — | ✓ | Yes |
| `/seller/seller-review` | `sellerPages/ReviewInfoPage/ReviewInfoPage.jsx` | `SelfEmployedReviewView` + submit | `getReviewOnboarding`, `postSubmitOnboarding`, PUT blocks | `selfEmploed` | Mixed | FE-020 | **FE-020 ✓** | FE-020 ✓ | ✓ | Yes |
| `/seller/seller-review-company` | `sellerPages/SellerReviewCompany/SellerReviewCompany.jsx` | `CompanyReviewView` + submit | same | `selfEmploed` | Mixed | FE-020 | Gap P0 | — | ✓ | Yes |
| `/seller/finish-verification` | `sellerPages/FinishVerificationPage/FinishVerificationPage.jsx` | `FinishVerificationStatusView` | `getOnboardingStatus` | — | Mixed | FE-020 | Gap P2 | FE-020 ✓ | — | Yes |
| `/seller/action-required` | `sellerPages/ActionRequiredPage/ActionRequiredPage.jsx` | `ActionRequiredStatusView` | `getOnboardingStatus` | — | Mixed | FE-020 | Gap P2 | FE-020 ✓ | — | Yes |
| `/seller/under-review` | `sellerPages/UnderReviewPage/UnderReviewPage.jsx` | `UnderReviewStatusView` | — | — | View (page) | FE-020 | Gap P2 | FE-020 ✓ | — | Yes |
| `/seller/verified-analyt` | `sellerPages/VerifiedAnalyt/VerifiedAnalyt.jsx` | `VerifiedSellerStatusView` | — | — | View (page) | FE-020 | Gap P2 | FE-020 ✓ | — | Yes |

### Shared layout (все auth entry pages)

| Компонент | Путь | Type | Примечание |
|-----------|------|------|------------|
| `FormWrap` | `ui/Seller/auth/formWrap/FormWrap` | View | Обёртка seller auth layout |
| `TitleAndDesc` | `ui/Seller/auth/titleAndDesc/TitleAndDesc` | View | Заголовок + описание |
| `StepWrap` | `ui/Seller/register/stepWrap/StepWrap` | View | Step indicator |
| `InputSeller` | `ui/Seller/auth/inputSeller/InputSeller` | Mixed | Заменить на shadcn `Input` + `FormField` в FE-017 |
| `AuthBtnSeller` | `ui/Seller/auth/authBtnSeller/AuthBtnSeller` | View | Заменить на shadcn `Button` |

---

## Component map — `Components/Seller/auth/` (FE-018–FE-020)

| Component | Type | API / side effects | SCSS | MUI | Target split (container → view) | Task |
|-----------|------|-------------------|------|-----|-----------------------------------|------|
| `loginForm/LoginForm` | Mixed | login, getOnboardingStatus, dispatch, navigate, localStorage | No | — | `LoginForm` → `LoginFormView` | FE-018 ✓ |
| `resetForm/ResetForm` | Mixed | sendOtp, passSendOtp, navigate | No | — | `ResetForm` → `ResetFormView` | FE-018 ✓ |
| `sellerSuccForm/SellerSuccForm` | Mixed | navigate only | No | — | `SellerSuccForm` → `SellerSuccFormView` | FE-018 ✓ |
| `verifyForm/VerifyForm` | Mixed | OTP APIs, dispatch, navigate | No | — | `VerifyForm` → `VerifyFormView` | FE-018 ✓ |
| `createPassForm/CreatePassForm` | Mixed | createNewPassApi, navigate | No | — | `CreatePassForm` → `CreatePassFormView` | FE-018 ✓ |
| `createAccount/createForm/CreateForm` | Mixed | register, registerSeller, Formik, navigate | No | — | `CreateForm` → `CreateAccountFormView` | FE-018 ✓ |
| `createAccount/verifyEmail/VerifyEmail` | Mixed | emailConfirm, dispatch, navigate | No | — | `VerifyEmail` → `CreateVerifyEmailView` | FE-018 ✓ |
| `sellerTypeContent/SellerTypeContent` | Mixed | postSellerType, getOnboardingStatus, navigate | No | — | `SellerTypeContent` → `SellerTypeContentView` | FE-018 ✓ |
| `applicationSubmited/ApplicationSubmited` | Mixed | getOnboardingStatus, navigate, routing by status | No | — | `ApplicationSubmited` → `ApplicationSubmittedView` | FE-018 ✓ |
| `sellerInfo/PersonalDetails` | Mixed | putPersonalData, upload, Formik | No | — | **FE-019 ✓** shadcn + `OnboardingDataSection` | FE-019 ✓ |
| `sellerInfo/TaxInfo` | Mixed | putTax, putSelfAddress | No | — | **FE-019 ✓** | FE-019 ✓ |
| `sellerInfo/address/AddressBlock` | Mixed | putSelfAddress, upload | No | — | **FE-019 ✓** `AddressFieldsView` | FE-019 ✓ |
| `sellerInfo/BankAccount` | Mixed | putOnboardingBank | No | — | **FE-019 ✓** `BankAccountFieldsView` | FE-019 ✓ |
| `sellerInfo/WareHouseAddress` | Mixed | putWarehouse, upload | No | — | **FE-019 ✓** | FE-019 ✓ |
| `sellerInfo/ReturnAddress` | Mixed | putReturnAddress, upload | No | — | **FE-019 ✓** | FE-019 ✓ |
| `sellerInfo/CompanyInfo` | Mixed | putCompanyInfo, upload | No | — | **FE-019 ✓** | FE-019 ✓ |
| `sellerInfo/Representative` | Mixed | putRepresentative, upload | No | — | **FE-019 ✓** | FE-019 ✓ |
| `sellerInfo/CompanyAddress` | Mixed | putCompanyAddress, upload | No | — | **FE-019 ✓** `AddressFieldsView` | FE-019 ✓ |
| `sellerInfo/dateInp/DateInp` | Mixed | — | No | — | **FE-019 ✓** `DateOfBirthFieldView` (InputMask, no MUI) | FE-019 ✓ |
| `sellerInfo/uploadInp/UploadInp` | Mixed | multipart | No | — | **FE-019 ✓** `FileUploadZone` | FE-019 ✓ |
| `identDocumInp/IdentDocumInp` | Mixed | uploadSingleDocument | No | — | Tailwind (FE-021); `UploadInp` внутри | FE-021 ✓ |
| `review/*` (legacy) | — | — | — | — | **Удалено FE-021** — заменено `ReviewSectionCard` / review views | FE-020 ✓ |
| `verifyPinInput/VerifyPinInput` | Mixed | — | No | — | shadcn Input OTP or keep | FE-018 |
| `sellerInfo/sellerinfoSellect/SellerInfoSellect` | View | — | No | — | shadcn Select | FE-019 ✓ |

**MUI в onboarding-зоне:** **0** (`@mui` grep, FE-021). **SCSS modules в `Components/Seller/auth`:** **0** (orphan удалены FE-021; `NewSellerOrder*` вне scope).

**Views (FE-020):** `components/seller/onboarding/views/review/*`, `views/status/*`, `features/seller-onboarding/*` mappers.

---

## API map (`src/api/seller/onboarding.js` + auth)

| Function | HTTP | Used in (UI) |
|----------|------|--------------|
| `postSellerType` | POST `/sellers/onboarding/seller-type/` | SellerTypeContent |
| `getOnboardingStatus` | GET `/sellers/onboarding/state/` | LoginForm, SellerTypeContent, ApplicationSubmited, Review pages |
| `putPersonalData` | PUT `self-employed/personal/` | PersonalDetails, ReviewInfoPage |
| `putTax` | PUT `self-employed/tax/` | TaxInfo, ReviewInfoPage |
| `putSelfAddress` | PUT `self-employed/address/` | AddressBlock, TaxInfo, ReviewInfoPage |
| `putCompanyInfo` | PUT `company/info/` | CompanyInfo, SellerCompanyInfo, Review |
| `putRepresentative` | PUT `company/representative/` | Representative |
| `putCompanyAddress` | PUT `company/address/` | CompanyAddress |
| `putOnboardingBank` | PUT `bank/` | BankAccount (all flows) |
| `putWarehouse` | PUT `warehouse/` | WhareHouseAddress |
| `putReturnAddress` | PUT `return/` | ReturnAddress |
| `uploadSingleDocument` | POST `documents/` | Upload blocks, IdentDocumInp |
| `getReviewOnboarding` | GET `review/` | ReviewInfoPage, SellerReviewCompany |
| `postSubmitOnboarding` | POST `submit/` | Review pages |
| `auth.login` | POST `/accounts/login/` | LoginForm |
| `auth.register` / `registerSeller` | POST register | CreateForm |

Unit-тесты API: [`onboarding.test.js`](../../Frontend/Frontend3/src/api/seller/onboarding.test.js), [`onbordingStatus.test.js`](../../Frontend/Frontend3/src/api/seller/onbordingStatus.test.js).

---

## Целевая структура `features/seller-onboarding/` (код — с FE-017)

Документированная раскладка; **физические файлы не создавались в FE-016**.

```
Frontend/Frontend3/src/
├── features/seller-onboarding/
│   ├── constants/
│   │   └── onboardingSteps.js          # next_step → label (FE-017)
│   ├── hooks/
│   │   └── useOnboardingNavigation.js  # optional: status → route
│   ├── containers/                     # Formik + API (текущие *Form.jsx)
│   │   ├── LoginFormContainer.jsx
│   │   ├── CreateAccountFormContainer.jsx
│   │   └── ...
│   └── views/                          # v0 / shadcn presentational
│       ├── LoginFormView.jsx
│       ├── SellerTypeContentView.jsx
│       └── ...
├── components/seller/onboarding/       # FE-017 layout shell
│   ├── SellerOnboardingLayout.jsx
│   ├── FormField.jsx
│   └── ...
└── components/ui/                      # FE-015 shadcn primitives
```

**Правило миграции:** container остаётся на старом path до PR split; view добавляется рядом или в `features/.../views/`, import меняется в одном PR.

---

## Test gates — must stay green

| Test file | Covers | Gate for |
|-----------|--------|----------|
| `src/api/seller/onboarding.test.js` | handleError, endpoints | FE-019, FE-020 |
| `SellerTypeContent.test.jsx` | seller-type UI + API mock | FE-018 |
| `e2e/seller-onboarding.spec.js` | login, create-account, seller-type, application-sub, review, 4 status routes | FE-018–FE-021 |
| `e2e/helpers.js` | shared third-party block, API mock/proxy | FE-021 |
| `e2e/fe015-foundation-smoke.spec.js` | `/`, `/seller/login` mount | FE-015–FE-021 regression |
| `e2e/fullstack-seller-onboarding.spec.js` | FS-001 full onboarding (3/3) | FE-019–FE-021 |
| `e2e/smoke.spec.js` | protected seller redirect | All seller PRs |

---

## Test gaps — добавить до / в задаче миграции UI

| Screen / component | Missing anchor | Priority | Добавить в | Селекторы / фокус |
|--------------------|----------------|----------|------------|-------------------|
| `LoginForm` | RTL: Yup errors, submit loading | **P0** | FE-018 PR 18.2 | `input[name=email]`, `input[name=password]`, button disabled |
| `CreateForm` | RTL: Yup errors, agree checkbox | **P0** | FE-018 PR 18.2 | validation keys, submit blocked |
| `ApplicationSubmited` | RTL: status badges / title | P1 | FE-018 PR 18.1 | mocked `getOnboardingStatus` |
| `ResetForm`, `VerifyForm` | RTL smoke | P1 | FE-018 PR 18.3 | OTP fields render |
| `BankAccount` | RTL: API validation errors on screen | **P0** | **FE-019 ✓** | `BankAccount.test.jsx` |
| `PersonalDetails` | RTL: required fields | P1 | **FE-019 ✓** | `PersonalDetails.test.jsx` |
| `ReviewInfoPage` submit | RTL: failed submit shows completeness | **P0** | **FE-020 ✓** | `ReviewInfoPage.test.jsx` |
| Status pages | e2e smoke | P2 | **FE-020 ✓** | `seller-onboarding.spec.js` 9/9 |
| `DateInp` | shadcn InputMask (no MUI) | P1 | **FE-019 ✓** | — |
| Onboarding SCSS cleanup | no `.module.scss` in auth zone | P1 | **FE-021 ✓** | grep audit |
| Legacy `sellerAnalytics/*` | removed (dead code) | P2 | **FE-021 ✓** | — |

**Не добавлять в FE-016:** `data-testid` в production (e2e уже использует `name`, role, i18n keys). При миграции FE-018 — обновлять e2e в том же PR при смене селекторов.

---

## E2e selector stability (FE-018 checklist)

| Route | Current stable selectors | Risk при shadcn |
|-------|-------------------------|-----------------|
| `/seller/login` | `input[name="email"]`, `input[name="password"]` | Low — сохранить `name` на Input |
| `/seller/create-account` | heading "Create Your Seller Account" | Medium — i18n key preferred |
| `/seller/seller-type` | text "Choose your seller type" | Medium — use `t('onboard.selection.choose_type')` in test via key mock |
| `/seller/application-sub` | "Your application has been submitted" | Medium |

---

## v0 / Agent brief

### Base prompt (from [shadcn-ui-migration-plan.md](./shadcn-ui-migration-plan.md))

```text
Build a presentational React component using Tailwind CSS and shadcn/ui.

Constraints:
- No API calls, no Redux, no react-router, no localStorage.
- All data and errors via props; actions via callback props.
- Use i18n labels passed as props or children (do not hardcode locale strings).
- Import from @/components/ui/* and @/components/seller/onboarding/* only.
- Accessible labels, focus states, mobile-first layout.
- Return .jsx only (no TypeScript).

Component: [NAME]
Props: [LIST — see examples below]
Reference: docs/frontend/seller-onboarding-ui-inventory.md
```

### Props contracts (первые экраны FE-018)

**`SellerTypeContentView`**

```javascript
{
  selectedType: 'self_employed' | 'company' | null,
  onSelectType: (type) => void,
  onContinue: () => void,
  isContinueDisabled: boolean,
  isLoading: boolean,
  errorMessage: string | null,
  labels: {
    title, description, selfEmployedTitle, selfEmployedDesc,
    companyTitle, companyDesc, continue,
  },
}
```

**`LoginFormView`**

```javascript
{
  values: { email, password },
  errors: { email?, password? },
  touched: { email?, password? },
  regErr: string | null,
  isLoading: boolean,
  onChange: (field, value) => void,
  onSubmit: () => void,
  labels: { title, email, password, submit, forgotPassword, registerLink },
}
```

**`ApplicationSubmittedView`**

```javascript
{
  status: string | null,           // e.g. pending_verification
  statusLabel: string,
  title, description,
  homeLinkLabel, onHomeClick,
  showPendingBadge: boolean,
}
```

**`ReviewSectionCard`** (FE-020)

```javascript
{
  title: string,
  rows: [{ label, value }],
  onEdit?: () => void,
  editLabel?: string,
}
```

### Agent roles (кратко)

| PR | Agent | Делает |
|----|-------|--------|
| Pre-UI | Test | RTL якорь до смены разметки |
| UI | v0 | View `.jsx` only |
| Integration | Cursor | Container wiring, i18n, same API |
| Review | Cursor | No fetch in view, e2e green |

---

## Onboarding page paths (FE-021 grep scope)

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

Плюс `src/Components/Seller/auth/` и `src/components/seller/onboarding/` (**FE-017 Done**).

---

## next_step → UI mapping (FE-017)

Backend order (`compute_next_step` in `services_onboarding.py`):

| `next_step` | Step # | UI label source |
|-------------|--------|-----------------|
| `seller_type` | 1 | i18n `onboard.steps.seller_type` (add in FE-018) |
| `personal` | 2 | `onboard.steps.personal` |
| `tax` | 3 | `onboard.steps.tax` |
| `address` | 4 | `onboard.steps.address` |
| `bank` | 5 | `onboard.steps.bank` |
| `warehouse` | 6 | `onboard.steps.warehouse` |
| `return` | 7 | `onboard.steps.return` |
| `documents` | 8 | `onboard.steps.documents` |
| `review` | 9 | `onboard.steps.review` |

Код: [`onboardingSteps.js`](../../Frontend/Frontend3/src/features/seller-onboarding/constants/onboardingSteps.js), компонент [`OnboardingProgress`](../../Frontend/Frontend3/src/components/seller/onboarding/OnboardingProgress.jsx). Навигация не меняется — только отображение.

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-05-27 | Шаблон inventory для FE-016 |
| 2026-05-27 | `/seller/successfully-reset`; FE-021 grep paths |
| 2026-05-28 | **FE-018:** 9 auth/entry routes → shadcn views, e2e smoke |
| 2026-05-28 | **FE-019:** data steps migrated |
| 2026-05-28 | **FE-020:** review/status views, e2e 9/9 |
| 2026-05-28 | **FE-021:** SCSS/MUI cleanup, FS-001 3/3, `sellerAnalytics` removed, 17/17 routes **Migrated: Yes** |
