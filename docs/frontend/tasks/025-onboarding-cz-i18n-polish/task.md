# FE-025 — Seller Onboarding Missing Czech i18n

**Status:** Planned  
**Priority:** P1  
**Phase:** Seller onboarding stabilization  
**Depends on:** FE-023, Task 022, Task 023  
**Scope:** Frontend3 onboarding missing translations only

## Goal

Make newly added seller onboarding ARES, upload, review, and validation messages work correctly when the UI language is switched to Czech and the relevant Czech translation is currently missing.

This task is intentionally narrow: add missing CZ translations and replace hardcoded English onboarding strings with i18n keys. Do not rewrite or polish existing Czech translations that already have a CZ value.

## Current Findings

Initial audit found these concrete issues:

| Area | Finding |
|------|---------|
| Locale parity | `onboard.warehouse_bank.same_as_the_primary_address` exists in EN but is missing in CZ. |
| Hardcoded upload copy | `IdentDocumInp.jsx` still passes `inpText="Uploud document"` in identity upload paths. |
| Hardcoded error copy | `SellerInformation.jsx` still has `ErrToast("Unexpected error: " + err.message || err)`. |
| Review parser literals | `ReviewInfoPage.jsx` contains English fallback literals such as `Failed to submit onboarding data`, `Unknown error`, `Unexpected error`. |
| Upload errors | Upload error copy now uses i18n keys, but all upload call sites should be checked for hardcoded fallbacks. |

## Files to Audit

Keep the audit focused on these files first:

- `Frontend/Frontend3/src/locales/en/onbordingEn.json`
- `Frontend/Frontend3/src/locales/cz/onbordingCz.json`
- `Frontend/Frontend3/src/Components/Seller/auth/identDocumInp/IdentDocumInp.jsx`
- `Frontend/Frontend3/src/Components/Seller/auth/sellerInfo/uploadInp/UploadInp.jsx`
- `Frontend/Frontend3/src/Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo.jsx`
- `Frontend/Frontend3/src/Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo.jsx`
- `Frontend/Frontend3/src/sellerPages/SellerCompanyInfo/CompanyAresEntryAssistModal.jsx`
- `Frontend/Frontend3/src/sellerPages/SellerInformation/SelfEmployedAresEntryAssistModal.jsx`
- `Frontend/Frontend3/src/sellerPages/SellerInformation/SellerInformation.jsx`
- `Frontend/Frontend3/src/sellerPages/ReviewInfoPage/ReviewInfoPage.jsx`
- onboarding/review tests that assert visible text

## Non-goals

- Do not change ARES lookup/apply behavior.
- Do not change submit or upload behavior.
- Do not change backend contracts.
- Do not redesign modal/review/upload UI.
- Do not translate unrelated product, checkout, order, or admin copy.
- Do not rename locale namespaces.
- Do not change existing Czech translation values that already exist.
- Do not do broad Czech copy polish in this task.

## Implementation Plan

### Iteration 1 — Locale Parity Check

1. Compare flattened keys between `onbordingEn.json` and `onbordingCz.json`.
2. Add missing CZ keys that are used by onboarding UI.
3. Do not add unrelated legacy auth/register keys unless they are required by onboarding screens.

Expected immediate fix:

- Add `onboard.warehouse_bank.same_as_the_primary_address` to CZ.

### Iteration 2 — Replace Hardcoded Onboarding Strings

Replace hardcoded English strings in the audited onboarding files with existing or new i18n keys.

Known targets:

- `IdentDocumInp.jsx`: replace `Uploud document` with `t('onboard.common.upload')`.
- `SellerInformation.jsx`: replace hardcoded unexpected error toast with a translated fallback.
- `ReviewInfoPage.jsx`: replace parser fallback literals with translated review error keys.

Add new keys only when an existing key is not semantically correct.

### Iteration 3 — Missing Translation Guard

Only add or change locale values in these cases:

1. EN has a key used by onboarding UI and CZ does not have that key.
2. A hardcoded English onboarding string is moved to a new i18n key, so both EN and CZ values must be added.
3. A fallback error currently has no i18n key and needs a translated CZ value.

Do not change existing CZ text for keys that already exist, including company/self-employed ARES modal copy, unless the key is unusable because of a typo that prevents rendering.

### Iteration 4 — Tests

Add or update narrow regression tests:

1. CZ locale contains all onboarding keys used by new ARES/upload/review UI.
2. Self-employed ARES error state renders Czech text when i18n language is `cz`.
3. Company ARES error state renders Czech text when i18n language is `cz`.
4. Upload error renders Czech text.
5. Review submit fallback error renders Czech text.

Prefer focused RTL/unit tests over broad snapshot tests.

## Verification

Run after implementation:

```bash
cd Frontend/Frontend3
npm test -- SellerInformation.test.jsx --run
npm test -- SellerCompanyInfo.test.jsx --run
npm test -- ReviewInfoPage.test.jsx --run
```

If locale-specific tests are added elsewhere, run those too.

Also run:

```bash
git diff --check
```

Manual smoke, if dev server is available:

1. Switch UI language to Czech.
2. Open company onboarding ARES modal and inline lookup error state.
3. Open self-employed onboarding ARES modal and inline lookup error state.
4. Trigger upload error if feasible.
5. Trigger review submit fallback/validation error if feasible.
6. Check mobile width for long Czech strings.

## Definition of Done

- [ ] EN/CZ onboarding locale keys are aligned for the touched onboarding namespaces.
- [ ] No hardcoded English onboarding ARES/upload/review error strings remain in audited files.
- [ ] Existing CZ translations are not modified unless they were missing or unreachable.
- [ ] Company onboarding ARES tests still pass.
- [ ] Self-employed onboarding ARES tests still pass.
- [ ] Review error tests pass.
- [ ] `git diff --check` passes.
- [ ] Any deferred manual/mobile QA is explicitly noted in the final response.

## Suggested Agent Prompt

```text
Work in /Users/pavel/Documents/Projects/reli.one.

Implement FE-025: Seller Onboarding Missing Czech i18n.

Read docs/frontend/tasks/025-onboarding-cz-i18n-polish/task.md first. Keep the work narrow: only missing Frontend3 seller onboarding Czech translations and hardcoded onboarding messages. Do not change existing Czech translation values that already exist. Do not change ARES behavior, submit/upload behavior, backend contracts, or layout.

Audit these files:
- Frontend/Frontend3/src/locales/en/onbordingEn.json
- Frontend/Frontend3/src/locales/cz/onbordingCz.json
- Frontend/Frontend3/src/Components/Seller/auth/identDocumInp/IdentDocumInp.jsx
- Frontend/Frontend3/src/Components/Seller/auth/sellerInfo/uploadInp/UploadInp.jsx
- Frontend/Frontend3/src/Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo.jsx
- Frontend/Frontend3/src/Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo.jsx
- Frontend/Frontend3/src/sellerPages/SellerCompanyInfo/CompanyAresEntryAssistModal.jsx
- Frontend/Frontend3/src/sellerPages/SellerInformation/SelfEmployedAresEntryAssistModal.jsx
- Frontend/Frontend3/src/sellerPages/SellerInformation/SellerInformation.jsx
- Frontend/Frontend3/src/sellerPages/ReviewInfoPage/ReviewInfoPage.jsx

Known issues to fix:
- CZ is missing `onboard.warehouse_bank.same_as_the_primary_address`.
- `IdentDocumInp.jsx` has hardcoded `Uploud document`.
- `SellerInformation.jsx` has hardcoded `Unexpected error`.
- `ReviewInfoPage.jsx` has English fallback literals: `Failed to submit onboarding data`, `Unknown error`, `Unexpected error`.
- Existing company/self-employed ARES Czech copy already has translations; do not rewrite it in this task.

Add/update focused tests for Czech rendering where practical:
- self-employed ARES error in Czech;
- company ARES error in Czech;
- upload error in Czech;
- review submit fallback in Czech;
- locale parity for touched onboarding namespaces.

Run:
- cd Frontend/Frontend3 && npm test -- SellerInformation.test.jsx --run
- cd Frontend/Frontend3 && npm test -- SellerCompanyInfo.test.jsx --run
- cd Frontend/Frontend3 && npm test -- ReviewInfoPage.test.jsx --run
- git diff --check

Final response:
- list changed files;
- summarize fixed missing-translation/hardcoded-string issues;
- include test results;
- mention any manual/mobile QA status;
- give commit message.
```

## Recommended Commit Message

```text
fix(onboarding): add missing Czech onboarding translations
```
