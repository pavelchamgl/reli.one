# FE-023 — Iteration 0: Baseline Report

**Date:** 2026-05-29
**Status:** Complete

---

## Environment — Gate ✅

| Check | Result |
|-------|--------|
| `.env.local` → `http://localhost:8000/api` | ✅ Confirmed |
| Backend (`reli_backend_e2e`) running on :8000 | ✅ Confirmed (Docker, 18h uptime) |
| Frontend Vite dev on :5173 | ✅ Running |
| Frontend build | ✅ Successful (`npm run build`) |

---

## Screenshots

Playwright/Chromium не может запуститься в agent sandbox (SIGSEGV при инициализации).
**Action required:** снять скриншоты вручную на localhost:5173/seller/seller-company и приложить к PR.

Baseline spec для последующих runs: `e2e/fe023-baseline.spec.js`

---

## Field Contract Audit

Сравнение кода с [Field Contract](#) из task.md.

### Company Information (8 fields)

| Field | In form | Yup required | Status |
|-------|---------|-------------|--------|
| `company_name` | ✅ | ✅ always | OK |
| `legal_form` | ✅ | ✅ always | OK |
| `country_of_registration` | ✅ | ✅ always | OK |
| `business_id` | ✅ | ✅ always | OK |
| `tin` | ✅ | ⚠️ only CZ/SK | **Bug: должен быть required всегда** |
| `eori` | ✅ | optional | OK (по контракту optional) |
| `registration_certificate` upload | ✅ | ❌ не валидируется | **Bug: можно сабмитить без документа** |
| `company_phone` | ✅ | ✅ always | OK |

### Representative (5 fields)

| Field | In form | Yup required | Status |
|-------|---------|-------------|--------|
| `first_name` | ✅ | ✅ | OK |
| `last_name` | ✅ | ✅ | OK |
| `role` | ✅ | ✅ | OK |
| `date_of_birth` | ✅ | ✅ | OK |
| `nationality` | ✅ | ✅ | OK |

### Business Address (5 fields)

| Field | In form | Yup required | Status |
|-------|---------|-------------|--------|
| `street` | ✅ | ✅ | OK |
| `city` | ✅ | ✅ | OK |
| `zip_code` | ✅ | ✅ | OK |
| `country` | ✅ | ✅ | OK |
| `proof_of_address` upload | ✅ | ❌ не валидируется | **Bug: можно сабмитить без документа** |

### Bank Account (5 fields)

| Field | In form | Yup required | Status |
|-------|---------|-------------|--------|
| `iban` | ✅ | ✅ | OK |
| `swift_bic` | ✅ | ✅ | OK |
| `account_holder` | ✅ disabled, auto-filled | ✅ | ⚠️ disabled — OK per contract, но user confusion |
| `bank_code` | ✅ (только CZ/SK) | ❌ нет в Yup | **Bug: нет валидации + видимость зависит от бизнес-адреса** |
| `local_account_number` | ✅ (только CZ/SK) | ❌ нет в Yup | **Bug: нет валидации + видимость зависит от бизнес-адреса** |

### Warehouse Address (checkbox + 6 fields)

| Field | In form | Yup required | Status |
|-------|---------|-------------|--------|
| `same_as_the_primary_address` checkbox | ✅ | — | OK |
| `wStreet` | ✅ | ✅ | OK |
| `wCity` | ✅ | ✅ | OK |
| `wZip_code` | ✅ | ✅ | OK |
| `wCountry` | ✅ | ❌ закомментировано | **Bug: можно сабмитить без страны склада** |
| `contact_phone` | ✅ | ✅ | OK |
| `proof_of_address` upload | ✅ | ❌ не валидируется | **Bug: можно сабмитить без документа** |

### Return Address (checkbox + 6 fields)

| Field | In form | Yup required | Status |
|-------|---------|-------------|--------|
| `same_as_warehouse` checkbox | ✅ | — | OK |
| `rStreet` | ✅ | ✅ | OK |
| `rCity` | ✅ | ✅ | OK |
| `rZip_code` | ✅ | ✅ | OK |
| `rCountry` | ✅ | ❌ закомментировано | **Bug: можно сабмитить без страны возврата** |
| `rContact_phone` | ✅ | ✅ | OK |
| `proof_of_address` upload | ✅ | ❌ не валидируется | **Bug: можно сабмитить без документа** |

---

## Runtime Failures (Code Analysis)

### Critical

**F1 — wCountry и rCountry не в Yup-схеме**
Файл: `src/code/seller/validation.js` строки 323–324, 352–353 — закомментированы.
Пользователь может пройти валидацию и нажать Continue без выбора страны склада/возврата.
Backend вероятно вернёт 400. Ошибка не показывается на поле.

**F2 — TIN не обязателен для нон-CZ/SK стран**
Файл: `src/code/seller/validation.js` строки 194–201.
`tin` условно required. Field contract требует его всегда. У немецкой/французской компании TIN не заблокирует сабмит.

**F3 — Bank code visibility зависит от бизнес-адреса, не от страны компании**
Файл: `src/Components/Seller/auth/sellerInfo/BankAccount/BankAccount.jsx` строки 22–25.
```js
const tax_country = normalize(formik.values.tax_country); // undefined в company form
const business_country = normalize(formik.values.country); // адрес компании
const activeCountry = tax_country || business_country;
const isCzSk = ['cz', 'sk'].includes(activeCountry);
```
`bank_code` и `local_account_number` появляются только когда в поле Business Address выбрана CZ или SK.
Это race condition: если заполнить Bank до Business Address — поля не видны.
Правильная логика: использовать `country_of_registration`.

**F4 — Документы не валидируются Yup**
`certificate_issue_date`, `proof_document_issue_date`, `wProof_document_issue_date`, `rProof_document_issue_date` — все закомментированы.
Форма считается валидной без загрузки ни одного документа.
Backend при сабмите может вернуть 400 с `documents missing`.

**F5 — PUT errors не показываются как field errors**
Файл: `src/sellerPages/SellerCompanyInfo/SellerCompanyInfo.jsx` строки 143–153.
`Promise.allSettled()` → `ErrToast(errors.join('\n'))`. Никакой связи ошибок с конкретными полями.

### Medium

**F6 — `certificate_issue_date` как upload proxy**
Значение `certificate_issue_date` устанавливается в `CompanyInfo.jsx` только после успешного upload (строка 75).
Отправляется в `putCompanyInfo` (строка 100 в `SellerCompanyInfo.jsx`).
Если upload не произошёл — отправляется пустая строка. Backend может вернуть 400 или сохранить null.

**F7 — `account_holder` мгновенно перезаписывается**
`useEffect` в `BankAccount.jsx` (строки 45–56) устанавливает `account_holder` при изменении `company_name` или `legal_form`.
Если пользователь пытается вручную ввести значение (поле disabled, так что нельзя) — нет проблемы.
Но если `company_name = ''` и `legal_form = ''` в начале — `account_holder` = `''`, что делает Yup-проверку failing пока компания не заполнена.
Это блокирует submit button пока Company Info не заполнен — может быть непонятным для пользователя.

---

## Visual Issues (Code Analysis)

**V1 — FileUploadZone: большой dashed dropzone**
Файл: `src/components/seller/onboarding/FileUploadZone.jsx`
Текущий стиль: `rounded-lg border border-dashed p-6 text-center` + Upload icon.
Figma требует: компактная горизонтальная строка внутри rounded border, без dropzone-стиля.

**V2 — Нет inspect для SellerOnboardingLayout/card styling**
Нужно проверить card radius/shadow, header, step pill — в Iteration 3.

---

## Summary of Issues for Next Iterations

| ID | Area | Target | Type | Status |
|----|------|--------|------|--------|
| F1 | `wCountry`, `rCountry` не в Yup | 1+2 | Validation bug | ✅ Fixed — Iteration 1 |
| F2 | `tin` условный | 1+2 | Validation bug | ✅ Fixed — Iteration 1 |
| F3 | `bank_code` visibility logic | 2 | Functional bug | ✅ Fixed — Iteration 2 |
| F4 | Документы не валидируются | 2 | Validation gap | ✅ Fixed — Iteration 2 |
| F5 | PUT errors нет на полях | 2 | UX | ✅ Fixed — Iteration 2 |
| F6 | `certificate_issue_date` как upload proxy | 2 | Functional | ✅ Fixed — Iteration 2 |
| F7 | `account_holder` empty блокирует | 2 | UX | ✅ Fixed — Iteration 2 |
| V1 | Upload dropzone style | 3 | Visual | ✅ Fixed — Iteration 3 (code) |
| V2 | Card/header/step styling | 3 | Visual | ✅ Fixed — Iteration 3 (code) |

---

## Gate Status

- [ ] Есть screenshot текущего UI — **Требует ручного снятия на localhost:5173**
- [x] Есть список фактических runtime failures — F1–F7 выше
- [x] Подтверждено, что `.env.local` указывает на `http://localhost:8000/api`
- [x] Backend + frontend подняты

**Все code-level gates пройдены. Screenshot gate требует ручного действия.**
