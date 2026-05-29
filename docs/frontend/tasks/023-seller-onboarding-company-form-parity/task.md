# FE-023 — Seller Company Onboarding: Field Contract & Figma Parity

**Status:** In Progress (Iteration 2 next)
**Priority:** P0
**Phase:** 5 follow-up — seller onboarding hardening
**Depends on:** FE-021
**Blocks:** Wave 2 onboarding-adjacent UI work

## Цель

Восстановить рабочее состояние **company onboarding** и привести экран `/seller/seller-company` к утверждённому Figma/PDF-макету, не меняя продуктовый контракт формы и не удаляя существующие поля.

Задача возникла после FE-015...FE-021: shadcn/Tailwind-миграция закрыла технические gates, но не закрепила pixel/field parity для company onboarding. В результате общие компоненты стали выглядеть как generic shadcn, а не как утверждённый seller onboarding дизайн.

## Источник правды

**Design source:** `Reli-onboarding-company.pdf` — Figma export, предоставлен в задаче.

**Figma file:** [RELI GROUP](https://www.figma.com/design/9fmLDUKB9665aeWDGePN92/RELI-GROUP)

### Figma node links

Использовать эти node links как primary source для visual parity. Если Figma MCP упирается в лимит Starter plan, использовать PDF/screenshot fallback и повторить MCP-запрос позже.

| Purpose | Node | Link | MCP status |
|---------|------|------|------------|
| Company data step, desktop, Step 4 of 6 | `7076:53373` | [Open in Figma](https://www.figma.com/design/9fmLDUKB9665aeWDGePN92/RELI-GROUP?node-id=7076-53373&t=qfuHWr05v6R6tWAV-4) | Metadata fetched |
| Additional company onboarding reference | `7076:54281` | [Open in Figma](https://www.figma.com/design/9fmLDUKB9665aeWDGePN92/RELI-GROUP?node-id=7076-54281&t=qfuHWr05v6R6tWAV-4) | Pending; MCP rate limit hit |
| Additional onboarding/review reference | `6149:6546` | [Open in Figma](https://www.figma.com/design/9fmLDUKB9665aeWDGePN92/RELI-GROUP?node-id=6149-6546&t=qfuHWr05v6R6tWAV-4) | Pending; MCP rate limit hit |
| Additional onboarding/review reference | `6149:2968` | [Open in Figma](https://www.figma.com/design/9fmLDUKB9665aeWDGePN92/RELI-GROUP?node-id=6149-2968&t=qfuHWr05v6R6tWAV-4) | Pending; MCP rate limit hit |

### Extracted Figma notes — node `7076:53373`

These notes were extracted from Figma MCP metadata and should guide the implementation before another MCP call is needed.

- Frame name: `Self-employed / Sole proprietor 14` (contains company onboarding UI despite the legacy frame name).
- Frame size: `1440 x 4348`.
- Header height: `92`.
- Main content area begins below header.
- Form content wrapper:
  - `SellerInformation` x `272`, width `896`.
  - Heading container height `138.5`.
  - `CompanyForm` starts at y `170.5`, width `896`, height `3958`.
- Title area:
  - H1 text: `Seller Information`.
  - Subtitle text: `Please provide all required information for verification`.
  - Step indicator: `Step 4 of 6`.
- Card/container pattern:
  - Outer section width `896`.
  - Inner content x padding `32`.
  - Inner field width `832`.
  - Section header row height `40`.
  - Icon badge size `40 x 40`.
  - Section title offset x `52`, y `8`.
- Field pattern:
  - Label height `20`.
  - Control y offset from label: `28`.
  - Input/select height `48`.
  - Full-width control width `832`.
  - Two-column controls: `408 + 16 gap + 408`.
  - Three-column address controls: approximately `266.67 + 15.33 gap + 266.67 + 15.33 gap + 266.67`.
- Upload pattern:
  - Upload field total height `104`.
  - Label y `0`, description y `28`, upload control y `56`.
  - Upload control height `48`, width `832`.
  - Upload text: `Upload document (PDF, JPG, PNG - Max 10MB)`.
- Submit button:
  - Text: `Continue to Review`.
  - Size approximately `223 x 48`.
  - Centered under form.
- Hidden layer note:
  - `VAT ID` exists in the Figma tree as `hidden="true"`.
  - Do **not** implement/display `VAT ID` unless product explicitly changes the field contract.

Перед началом реализации исполнитель обязан:

1. Открыть PDF и визуально сверить форму.
2. Открыть Figma node `7076:53373` и использовать его как primary desktop reference.
3. Зафиксировать актуальный screenshot текущего `/seller/seller-company`.
4. Не использовать старые скриншоты/предыдущие варианты макета как источник полей, если они противоречат PDF/Figma node links.

## Field Contract — must stay exact

Набор полей для company onboarding должен соответствовать этому списку. Не добавлять `VAT ID`, representative identity documents или другие поля без отдельного product decision.

### Company Information

| Field | Required | Notes |
|-------|----------|-------|
| `Company name` | Yes | Text input |
| `Legal form` | Yes | Select |
| `Country of registration` | Yes | Select |
| `Business ID` | Yes | Text input |
| `TIN (Tax Identification Number)` | Yes | Text input |
| `EORI` | No | Text input; optional, "If importing into EU" |
| `Registration certificate document` | Yes | Upload, PDF/JPG/PNG, max 10MB |
| `Company phone` | Yes | Text input |

### Representative (Authorized Person)

| Field | Required | Notes |
|-------|----------|-------|
| `First name` | Yes | Text input |
| `Last name` | Yes | Text input |
| `Role` | Yes | Select |
| `Date of birth` | Yes | Date input |
| `Nationality` | Yes | Select |

### Business Address

| Field | Required | Notes |
|-------|----------|-------|
| `Street` | Yes | Text input |
| `City` | Yes | Text input |
| `ZIP` | Yes | Text input |
| `Country` | Yes | Select |
| `Proof of address` | Yes | Upload, PDF/JPG/PNG, max 10MB |

### Bank Account

| Field | Required | Notes |
|-------|----------|-------|
| `IBAN` | Yes | Text input |
| `SWIFT/BIC` | Yes | Text input |
| `Account holder` | Yes | Text input; must remain visible |
| `Bank code` | Yes | Text input |
| `Local account number` | Yes | Text input |

### Warehouse Address

| Field | Required | Notes |
|-------|----------|-------|
| `Same as the primary address` | No | Checkbox |
| `Street` | Yes | Text input |
| `City` | Yes | Text input |
| `ZIP` | Yes | Text input |
| `Country` | Yes | Select |
| `Contact phone` | Yes | Text input |
| `Proof of address` | Yes | Upload, PDF/JPG/PNG, max 10MB |

### Return Address

| Field | Required | Notes |
|-------|----------|-------|
| `Same as warehouse address` | No | Checkbox |
| `Street` | Yes | Text input |
| `City` | Yes | Text input |
| `ZIP` | Yes | Text input |
| `Country` | Yes | Select |
| `Contact phone` | Yes | Text input |
| `Proof of address` | Yes | Upload, PDF/JPG/PNG, max 10MB |

## Visual Contract

Экран должен соответствовать PDF по композиции и визуальному языку.

### Page shell

- Header: RELI logo + `/ Seller` слева.
- Header actions: `Logout`, `Language` справа с иконками.
- Background: светло-серый page background, без декоративных градиентов.
- Заголовок по центру:
  - `Seller information`
  - subtitle: `Please provide all required information for verification`
  - step pill: `Step 4 of 6`
- Header/title area не должен быть внутри card.

### Content width and rhythm

- Form content centered.
- Desktop card width должен визуально соответствовать PDF.
- Cards идут вертикально, с равномерным расстоянием.
- Submit button находится под последней card, по центру.

### Cards

- Белый фон.
- Большой radius, как в PDF.
- Мягкая тень/серый offset, как в PDF.
- Section header: цветной rounded icon badge + uppercase-like title.
- Внутри cards сохранять компактные, но читаемые отступы.

### Inputs and selects

- Rounded input/select controls, не generic browser style.
- Border color, height, font size и placeholder tone должны совпадать с PDF визуально.
- Required star — красный.
- Disabled/readonly state не должен выглядеть как broken field.

### Upload controls

- Upload должен быть компактной горизонтальной строкой внутри rounded border.
- Не использовать большой dashed/dropzone-style блок для этого макета.
- Текст формата: `Upload document (PDF, JPG, PNG - Max 10MB)`.
- Uploaded state должен показывать имя/успешное состояние без изменения layout height.

### Layout grids

- `Legal form` + `Country of registration`: 2 колонки на desktop.
- `First name` + `Last name`: 2 колонки на desktop.
- `Date of birth` + `Nationality`: 2 колонки на desktop.
- Address rows: `City` + `ZIP` + `Country`: 3 колонки на desktop.
- Bank row: `Bank code` + `Local account number`: 2 колонки на desktop.
- Mobile: все поля stack в одну колонку без горизонтального overflow.

## Non-goals

- Не менять backend endpoints.
- Не менять общий seller onboarding routing.
- Не удалять текущие API calls.
- Не менять self-employed flow, кроме shared primitive fixes, которые не ломают его visual/functionality.
- Не начинать Wave 2 migration.
- Не добавлять новые product fields без отдельного решения.

## Root Cause Notes

Это не npm/install проблема. Причина в том, что FE-015...FE-021 проверяли техническую миграцию и regression gates, но не фиксировали company-specific Figma parity.

Что пошло не так:

1. Общие shadcn primitives заменили legacy SCSS, но не повторили Figma visual language.
2. Tests проверяли render/submit/status, а не точный field contract и layout.
3. Company flow сложнее self-employed: bank holder, CZ/SK bank fields, warehouse/return copying, multiple proof documents.
4. CI был green, потому что не знал о PDF-макете.

## Implementation Plan

Работать маленькими PR. Каждый шаг должен иметь собственную перепроверку перед переходом дальше.

---

## Iteration 0 — Baseline & Reproduction

### Действия

1. Поднять local backend + frontend.
2. Открыть `/seller/seller-company`.
3. Сделать screenshots:
   - текущий company data step;
   - текущий company review step;
   - PDF reference рядом.
4. Пройти company onboarding вручную до review и записать, где именно ломается:
   - disabled submit;
   - PUT error;
   - upload error;
   - wrong redirect;
   - backend validation error;
   - visual mismatch only.

### Commands

```bash
cd /Users/pavel/Documents/Projects/reli.one
docker compose -f docker-compose.e2e.yml up --build

cd /Users/pavel/Documents/Projects/reli.one/Frontend/Frontend3
npm run dev
```

### Gate before next iteration

- [ ] Есть screenshot текущего UI.
- [ ] Есть screenshot/reference из PDF.
- [ ] Есть список фактических runtime failures.
- [ ] Подтверждено, что `.env.local` указывает на `http://localhost:8000/api`.

### Baseline findings

Полный отчёт: [iteration-0-baseline.md](./iteration-0-baseline.md).

| ID | Finding | Impact | Status |
|----|---------|--------|--------|
| F1 | `wCountry` и `rCountry` отображаются как required, но не входят в Yup-схему | Можно пройти форму без страны склада/возврата | ✅ Fixed — Iteration 1 |
| F2 | `TIN` required только для CZ/SK | Нарушение Field Contract: `TIN` должен быть required всегда | ✅ Fixed — Iteration 1 |
| F3 | `Bank code` / `Local account number` visibility зависит от business address country | Неправильная логика для company flow; нужно опираться на `country_of_registration` или другой согласованный источник | Iteration 2 |
| F4 | Upload fields не валидируются Yup | Можно submit без registration certificate / proof of address документов | Iteration 2 |
| F5 | PUT errors показываются только через toast, не как field-level feedback | Пользователь не понимает, какой field/block исправлять | Iteration 2/4 |
| F6 | `certificate_issue_date` используется как proxy для upload state | При пустом upload backend может получать пустую строку вместо отсутствующего значения | Iteration 2 |
| F7 | `account_holder` auto-fill может оставаться пустым до заполнения company name/legal form | Submit блокируется непрозрачно; нужен понятный UX/validation flow | Iteration 2 |

Visual finding:

- `FileUploadZone` сейчас использует большой dashed/dropzone-style control; Figma node `7076:53373` требует compact horizontal upload row height `48`.

---

## Iteration 1 — Field Contract Test ✅ Done

### Действия

1. Добавить RTL/e2e assertion, что `/seller/seller-company` содержит ровно нужные секции.
2. Проверить наличие всех fields из Field Contract.
3. Проверить отсутствие лишних fields:
   - `VAT ID`;
   - representative identity document upload;
   - self-employed-only tax fields.
4. Проверить visible required markers для обязательных полей.

### Required checks

- `Company Information`: 8 полей.
- `Representative`: 5 полей.
- `Business Address`: 5 полей.
- `Bank Account`: 5 полей.
- `Warehouse Address`: checkbox + 6 полей.
- `Return Address`: checkbox + 6 полей.

### Gate before next iteration

- [x] Test падает на текущем некорректном UI/contract, если contract нарушен.
- [x] Test проходит после contract fix.
- [x] Нет новых product fields.
- [x] Self-employed tests остаются green.

### Completed 2026-05-29

**Новые файлы:**
- `src/code/seller/companyValidationSchema.test.js` — 13 schema tests (F1 × 4, F2 × 3, regress × 4, valid × 2).
- `src/sellerPages/SellerCompanyInfo/SellerCompanyInfo.test.jsx` — 47 RTL tests: все 6 секций, все поля field contract, forbidden fields, required markers.

**Исправления в `src/code/seller/validation.js`:**
- `tin` — убран `when(country_of_registration)`, теперь always required (F2).
- `wCountry` — раскомментировано, required (F1).
- `rCountry` — раскомментировано, required (F1).
- `eori_number` — заменён `matches().nullable()` на `test()` позволяющий пустую строку (side-fix: пустое EORI блокировало форму).

**Результат:** 257/257 тестов green, 43 test files.

---

## Iteration 2 — Functional Recovery

### Действия

1. Сверить frontend payloads с backend serializers для:
   - company info;
   - representative;
   - company address;
   - bank;
   - warehouse;
   - return address;
   - documents upload.
2. Исправить visible/hidden validation mismatch:
   - `Country` required в business/warehouse/return должен совпадать с schema и backend.
   - `Proof of address` required должен совпадать с schema и backend.
3. Проверить `Account holder`:
   - field должен быть visible;
   - если auto-filled, пользователь должен понимать значение;
   - если backend допускает override, field должен быть editable.
4. Проверить CZ/SK bank fields:
   - `Bank code` и `Local account number` должны отображаться для макета;
   - логика показа не должна зависеть от ещё не заполненного unrelated field.
5. Ошибки PUT/upload/submit должны показываться пользователю, не только в console.

### Gate before next iteration

- [ ] Company form можно заполнить полностью по PDF.
- [ ] Continue to Review становится enabled.
- [ ] Все PUT requests уходят с ожидаемым payload.
- [ ] Upload documents работают или показывают понятную ошибку.
- [ ] User-visible error есть для каждого failed block.
- [ ] `npm run test` green.

---

## Iteration 3 — Figma Visual Parity

### Действия

1. Restyle onboarding shell:
   - header;
   - centered title/subtitle;
   - step pill;
   - page background.
2. Restyle data sections:
   - card radius/shadow/background;
   - icon badge;
   - title typography;
   - internal spacing.
3. Restyle controls:
   - input/select height, border, radius, typography;
   - required marker;
   - compact upload row;
   - checkbox style.
4. Fix desktop grids:
   - 2-column rows;
   - 3-column address rows;
   - centered submit button.
5. Verify mobile layout:
   - no overflow;
   - fields stack correctly;
   - upload text does not overflow.

### Gate before next iteration

- [ ] Desktop screenshot visually matches PDF at normal viewport.
- [ ] Mobile screenshot has no overlap/overflow.
- [ ] Upload controls are compact rows, not dropzones.
- [ ] Header matches PDF composition.
- [ ] Submit button is centered and styled as in PDF.
- [ ] `npm run build` green.

---

## Iteration 4 — Company Review Parity

### Действия

1. Проверить `/seller/seller-review-company`.
2. Review page должен показывать все fields from Field Contract.
3. Inline edit должен открывать соответствующий block и сохранять current field set.
4. Submit errors/completeness должны указывать понятный block/field.
5. Submit success должен вести по текущей approved flow логике.

### Gate before next iteration

- [ ] Review содержит все заполненные fields.
- [ ] Нет лишних fields из другого seller type.
- [ ] Edit action не теряет данные.
- [ ] Failed submit показывает alert.
- [ ] Successful submit ведет на expected route.

---

## Iteration 5 — Regression & Manual QA

### Automated checks

```bash
cd /Users/pavel/Documents/Projects/reli.one/Frontend/Frontend3
npm run lint
npm run test
npm run build
npm run test:e2e -- e2e/seller-onboarding.spec.js
npm run test:e2e -- e2e/fullstack-seller-onboarding.spec.js
```

### Manual QA checklist

1. Register seller.
2. Select `Company`.
3. Fill `/seller/seller-company` exactly using PDF field set.
4. Upload:
   - registration certificate;
   - business proof of address;
   - warehouse proof of address;
   - return proof of address.
5. Continue to review.
6. Verify review values.
7. Submit for verification.
8. Verify application submitted/status route.
9. Optional admin reject:
   - reject seller;
   - open action-required;
   - edit company data;
   - resubmit.
10. Optional admin approve:
   - approve seller;
   - verify approved/status CTA.

### Visual QA checklist

- [ ] Desktop: compare screenshot with PDF.
- [ ] Mobile: no overlap, no hidden fields.
- [ ] Long values do not break card width.
- [ ] Required stars visible.
- [ ] Upload filename state does not resize cards unpredictably.
- [ ] Select open/closed states are usable.

### Gate for Done

- [ ] All automated checks green.
- [ ] Manual company onboarding happy path passed.
- [ ] Design screenshot attached to PR.
- [ ] Field Contract checklist completed in PR description.
- [ ] No code outside onboarding/shared primitives changed unless explicitly justified.

## PR Description Template

```markdown
## Scope
- Restored company onboarding field contract and Figma parity for `/seller/seller-company`.

## Field Contract
- [ ] Company Information: 8/8 fields
- [ ] Representative: 5/5 fields
- [ ] Business Address: 5/5 fields
- [ ] Bank Account: 5/5 fields
- [ ] Warehouse Address: checkbox + 6/6 fields
- [ ] Return Address: checkbox + 6/6 fields
- [ ] No VAT ID
- [ ] No representative identity upload

## Verification
- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build
- [ ] npm run test:e2e -- e2e/seller-onboarding.spec.js
- [ ] npm run test:e2e -- e2e/fullstack-seller-onboarding.spec.js
- [ ] Manual company onboarding happy path
- [ ] Desktop screenshot vs PDF
- [ ] Mobile screenshot

## Notes
- Backend/API contract changes: none / describe if any
- Shared primitive impact: describe
```

## Agent Prompt

```text
Task FE-023: Restore `/seller/seller-company` to match the provided Reli-onboarding-company.pdf.

Rules:
- Keep the exact Field Contract from docs/frontend/tasks/023-seller-onboarding-company-form-parity/task.md.
- Do not add VAT ID.
- Do not add representative identity document uploads.
- Preserve backend endpoints and routing.
- First add/adjust tests that lock the company field contract.
- Then fix functional issues.
- Only after that restyle shared onboarding primitives and company page to match the PDF.
- Before final response, run lint/test/build/e2e gates or report why any gate was not run.
```
