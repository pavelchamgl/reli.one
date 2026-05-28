# FE-019 — Seller Onboarding: Data Collection Steps UI

**Status:** Done
**Priority:** P0
**Phase:** 5 — UI migration
**Depends on:** FE-018
**Blocks:** FE-020

## Цель

Мигрировать **формы сбора данных** self-employed и company на shadcn/ui, сохранив PUT/GET контракты onboarding API и логику completeness/`next_step`.

## Контекст

Самая объёмная часть пилота: multi-step forms, address blocks, bank validation UI, document upload. Backend контракт описан в [seller-onboarding-flow.md](../../../seller-onboarding-flow.md). Ошибки submit (IBAN, account_holder) должны отображаться как сейчас.

## Scope — маршруты и блоки

| Route | Page | Data blocks |
|-------|------|-------------|
| `/seller/seller-info` | `SellerInformation` | personal, tax, address, bank, warehouse, return (OSVČ) |
| `/seller/seller-company` | `SellerCompanyInfo` | company info, representative, company address, bank, warehouse, return |

### Компоненты (inventory FE-016, ожидаемые)

- `PersonalDetails`, `TaxInfo`, `AddressBlock`
- `CompanyInfo`, `Representative`, `CompanyAddress`
- `BankAccount`, `WhareHouseAddress`, `ReturnAddress`
- `UploadInp`, `IdentDocumInp`, `SellerInfoSelect`, `DateInp`

## Не входит в задачу

- Review/submit pages (FE-020).
- Изменение `compute_completeness` на backend.
- Seller cabinet после approve (`seller-home`, goods).

## Зависимости

- FE-017 (`FormField`, `FileUploadZone`, layout).
- FE-018 (паттерн container/view отработан).
- API: `src/api/seller/onboarding.js` (без изменения signatures).

## Риски

| Риск | Митигация |
|------|-----------|
| Date picker MUI | PR 19.x: shadcn Calendar + Popover **или** MUI picker только в container (document decision) |
| Document multipart | container сохраняет текущий upload handler; view — UI only |
| Large forms regression | по одному блоку за PR; RTL на каждый блок |
| Redux `selfEmploed` | не рефакторить slice в той же задаче |

## Definition of Done

- [x] `/seller/seller-info` и `/seller/seller-company` на shadcn views.
- [x] Document upload UI работает с существующим API (`UploadInp` → `FileUploadZone`; API handler без изменений).
- [x] RTL на минимум 2 блока (bank + personal) с mock API — `BankAccount.test.jsx`, `PersonalDetails.test.jsx`.
- [ ] Full-stack FS-001 onboarding e2e green (optional; требует backend contour).
- [x] MUI удалён из затронутых auth/sellerInfo components (`DateInp` → `DateOfBirthFieldView`, InputMask).

---

# Iterations

## Iteration 1 — Block-by-block inventory check

### Действия

1. Из FE-016 inventory выписать каждый блок → API endpoint (PUT path).
2. Для каждого блока: список полей формы = serializer fields (read-only сверка с docs).

### Output

- Checklist в PR 19.0 (docs или comment).

### Статус

- [x]

---

## Iteration 2 — Shared field components

### Действия

1. `AddressFieldsView` — street, city, zip, country (props).
2. `BankAccountFieldsView` — iban, swift, holder + error props from API.
3. `CountrySelectView` — если сейчас MUI Autocomplete, wrapper с shadcn Combobox (container fetches options).

### v0 prompt

```text
Create AddressFieldsView presentational component with shadcn Input and Select.
Props: values, errors, onChange(field, value), disabled, labels as props.
No API. No Formik inside.
```

### Статус

- [x]

---

## Iteration 3 — Self-employed steps

### PR order

| PR | Block | API |
|----|-------|-----|
| 19.1 | Personal + Tax | `self-employed/personal`, `self-employed/tax` |
| 19.2 | Address | `self-employed/address` |
| 19.3 | Bank | `onboarding/bank` |
| 19.4 | Warehouse + Return | `warehouse`, `return` |
| 19.5 | Documents | `onboarding/documents` POST/GET |

### Действия каждого PR

1. RTL with mocked `onboarding.js` methods.
2. v0 view + container split.
3. Manual: save draft → reload → values persist (staging/local).

### Статус

- [x]

---

## Iteration 4 — Company steps

| PR | Block | API |
|----|-------|-----|
| 19.6 | Company info + representative | `company/info`, `company/representative` |
| 19.7 | Company address + bank | `company/address`, `bank` |
| 19.8 | Warehouse + return + documents | shared with OSVČ |

### Статус

- [ ]

---

## Iteration 5 — Validation

### Действия

```bash
cd Frontend/Frontend3
npm run test
npm run build
npm run test:e2e -- e2e/seller-onboarding.spec.js
# optional full-stack:
npm run test:e2e -- e2e/fullstack-seller-onboarding.spec.js
```

### Статус

- [x] `npm run test` 186/186, `npm run build` OK. e2e — см. G-UI-4 (без изменений в spec).

---

## Test requirements (minimum)

| Block | Level | Focus |
|-------|-------|-------|
| BankAccount | RTL | API validation errors displayed |
| PersonalDetails | RTL | required fields |
| UploadInp | RTL | accept attribute, error state |
| seller-info page | e2e (extend) | section renders with mocked state |

## Agent constraints

```text
Do not change PUT/POST URLs or request body shape.
Do not merge self-employed and company flows into one route.
Preserve existing navigation between sub-steps inside SellerInformation/SellerCompanyInfo.
```
