# Task 023 — ARES Assist for Self-employed Onboarding (CZ)

**Priority:** P1  
**Complexity:** High  
**Status:** **MVP CLOSED (self-employed flow)** — Task 023 self-employed ARES assist/autofill MVP is implemented, regression-tested, and documented.

**Depends on:** [Task 022 — ARES Onboarding Automation (CZ)](../022-ares-onboarding-automation/task.md)  
**Related:** [`docs/seller-onboarding-flow.md`](../../seller-onboarding-flow.md), [`docs/06-integrations.md`](../../06-integrations.md), [Task 008 — Seller Onboarding Stabilization](../008-seller-onboarding-stabilization/task.md)

---

## Decision

Self-employed ARES assist is tracked as a **separate follow-up task**, not as additional scope inside Task 022.

Task 022 should first close the company onboarding MVP and shared ARES foundation:

- company lookup and prefill;
- company entry assist modal;
- sanitized snapshot / admin visibility;
- submit-time moderator hint;
- docs and regression gates.

Only after that should this Task 023 start. This keeps the company MVP shippable and avoids mixing company legal-data automation with self-employed business/tax prefill, which has different semantics and risk.

## Goal

Add Czech-only ARES-assisted prefill for **self-employed seller onboarding** by `IČO`, while preserving manual onboarding, manual moderation, and full editability of all fields.

ARES is a public-registry helper, not identity verification and not an auto-approve mechanism.

## Product Boundary

- Only Czech ARES is in scope.
- No country selector in MVP.
- Manual mode is always available.
- No auto-approve.
- No identity verification.
- No non-CZ registry integration.
- No changes to bank, phone, documents, warehouse/return automation.
- ARES prefill must not overwrite already entered user data unless explicitly approved by product and covered by tests.

## Why Separate From Task 022

Company onboarding and self-employed onboarding use different domain language:

- Company flow uses registered company legal data (`company_name`, `legal_form`, company address).
- Self-employed flow is closer to business/tax registration for an individual seller. ARES data may include public business identity, but it must not be treated as KYC or personal identity verification.

Keeping this as Task 023 makes it easier to:

- close Task 022 without expanding scope indefinitely;
- define self-employed mapping separately;
- keep frontend copy legally/UX-safe;
- avoid accidental auto-fill of sensitive or personal fields;
- reuse Task 022 ARES provider/client/helpers once they are stable.

## Scope

| Area | Meaning |
|------|---------|
| **Mapping** | Decide which ARES fields are safe to apply to self-employed onboarding. |
| **Backend lookup** | Add or adapt a self-employed ARES lookup endpoint/contract using existing ARES provider code. |
| **Shared helper** | Add self-employed-specific prefill helper, reusing Task 022 patterns. |
| **Inline lookup UI** | Add ARES lookup beside self-employed `IČO` / business ID input. |
| **Entry assist modal** | First-run modal for self-employed onboarding, Czech-only, with manual fallback. |
| **Tests** | Backend and Frontend regression coverage for lookup, preview, apply, and errors. |
| **Docs** | Update ARES mapping docs and onboarding flow docs. |

## Out Of Scope

- Auto-approve.
- Identity verification / KYC.
- VIES/VAT validation.
- Slovakia or other country registries.
- Representative/person identity prefill.
- Bank account prefill.
- Phone/email prefill.
- Warehouse/return address prefill.
- Document/proof upload automation.
- Changing existing onboarding contracts unless needed for a dedicated self-employed lookup endpoint.

---

# Iterations

## Iteration 1 — Self-employed Mapping & UX Decision

### Goal
Define exactly what ARES can prefill for self-employed onboarding and what must remain manual.

### Actions
- Audit current self-employed onboarding fields:
  - personal details;
  - tax/business info;
  - self-employed address;
  - bank account;
  - warehouse;
  - return address;
  - documents.
- Decide whether ARES registered address maps to self-employed business address in current domain language.
- Decide how to treat `obchodniJmeno`:
  - show as registry name in preview;
  - do **not** blindly overwrite `first_name` / `last_name`;
  - only apply to personal fields if product explicitly approves it later.
- Decide DIČ/TIN behavior:
  - `dic` may be editable hint;
  - never VAT/DPH/VIES verification;
  - do not overwrite non-empty `tin`.
- Document copy boundary:
  - “We can prefill part of your business/tax registration from a Czech public registry.”
  - “This is not identity verification.”

### Output
- Self-employed ARES mapping table in this task or `ares-field-mapping.md`.
- Approved Apply field list.
- Explicit forbidden field list.

### Status
- [x] MVP mapping decision:
  - allowed Apply fields: `ico` / business ID, `tax_country=cz` when empty, `tin` from `dic_hint` when empty, primary self-employed address `street`, `city`, `zip_code`, `country` when empty;
  - preview-only: registry/business name from `obchodniJmeno` (`registry_name` / `company_name`);
  - forbidden Apply fields: `first_name`, `last_name`, date of birth, nationality, phone, bank, warehouse, return address, document/proof upload fields;
  - existing non-empty seller-entered fields are preserved.

---

## Iteration 2 — Backend Self-employed Lookup Contract

### Goal
Expose a self-employed-oriented ARES lookup contract while reusing existing ARES provider/client code from Task 022.

### Actions
- Choose endpoint:
  - preferred: `GET /api/sellers/onboarding/self-employed/ares-lookup/?ico=...`;
  - alternative: reuse company endpoint only if response naming stays semantically safe.
- Reuse `backend/sellers/providers/ares/**`.
- Return sanitized response:
  - `found`;
  - `is_active`;
  - `business_id`;
  - `registry_name`;
  - `tax_country`;
  - `tin_hint`;
  - `tin_hint_source`;
  - `registered_address`;
  - `warnings`.
- Ensure lookup does not persist onboarding data.
- Keep permission `IsSeller`.
- Keep throttle/cache behavior.

### Tests
- Valid IČO success.
- Invalid format/checksum does not call ARES.
- Not found.
- Timeout/unavailable.
- Cache.
- No raw response leakage.

### Status
- [x] MVP frontend reuses the existing stateless sanitized `GET /api/sellers/onboarding/company/ares-lookup/?ico=...` endpoint.
  - Justification: Task 023 MVP only needs public-registry lookup by Czech IČO, preview, and explicit Apply; the endpoint does not persist onboarding data and already normalizes/sanitizes ARES responses.
  - Submit-time self-employed `SellerAresVerification` moderator hint is implemented separately in the submit path.
  - Deferred backend iteration: add a semantically named `/self-employed/ares-lookup/` endpoint/contract if product wants separate API naming or lookup-specific self-employed audit semantics.

---

## Iteration 3 — Self-employed Prefill Helper

### Goal
Create a self-employed-specific Apply helper so modal and inline lookup use one mapping path.

### Actions
- Add `applyAresSelfEmployedPrefill.js` or equivalent helper.
- Helper inputs:
  - formik-like setter API;
  - normalized ARES response.
- Helper fills only approved fields from Iteration 1.
- Helper must not mutate:
  - phone;
  - bank;
  - warehouse/return;
  - documents;
  - personal identity fields unless explicitly approved.
- Preserve non-empty `tin`.

### Tests
- Fills approved business/tax/address fields.
- Does not overwrite non-empty `tin`.
- Does not fill forbidden fields.
- Handles partial address safely.

### Status
- [x] MVP helper added for self-employed Apply with no-overwrite behavior.

---

## Iteration 4 — Inline Self-employed ARES Lookup UI

### Goal
Let self-employed sellers trigger lookup from the relevant business/tax block without using the entry modal.

### Actions
- Add “Load from public registry” near self-employed `IČO` / business ID field.
- Reuse self-employed lookup API and Apply helper.
- Show preview before Apply.
- Keep fields editable.
- Keep manual filling available on every error state.

### States
- Idle.
- Loading.
- Success preview.
- Invalid/not found/unavailable.

### Tests
- Lookup button calls endpoint.
- Preview renders sanitized data.
- Apply fills approved fields.
- Error states do not block manual flow.

### Status
- [x] MVP inline lookup added to the self-employed tax block using shared lookup + self-employed Apply helper.

---

## Iteration 5 — Self-employed Entry Assist Modal

### Goal
Make Czech-only ARES assist visible at the beginning of self-employed onboarding.

### Product Rules
- No country selector.
- Czech-only copy.
- Manual mode always available.
- Modal copy must say this is public-registry business/tax prefill, not identity verification.
- Modal must not promise full onboarding automation.

### Trigger Rules
- Show only for self-employed onboarding page.
- Show only when relevant business/tax data is empty.
- Do not show after:
  - Apply;
  - Fill manually;
  - existing business/tax data is loaded;
  - rejection/edit flow where data already exists.
- Use local/session persistence unless a persistent backend flag is separately approved.

### Modal States
1. Initial:
   - Czech-only explanation;
   - IČO input;
   - `Load from public registry`;
   - `Fill manually`.
2. Loading.
3. Success preview:
   - registry name;
   - IČO;
   - registered address;
   - DIČ/TIN hint;
   - activity warning if inactive.
4. Error/not found/unavailable:
   - readable message;
   - Apply unavailable;
   - manual mode available.

### Visual Requirements
- Match existing seller onboarding UI.
- Same color palette, typography, spacing, and button hierarchy as company entry modal.
- Mobile-friendly scroll behavior.
- Compact preview.
- No nested card-in-card layout.

### Tests
- Modal appears on empty self-employed onboarding.
- Modal does not appear when data exists.
- Fill manually closes modal without mutation.
- Success preview renders.
- Apply fills approved fields and closes modal.
- Apply preserves non-empty `tin`.
- Error states keep manual mode available.

### Status
- [x] MVP entry assist modal added for first-run empty self-employed onboarding with separate localStorage dismissal.

---

## Iteration 6 — Docs, QA, Regression Gate

### Goal
Verify the full self-employed assisted flow and document it.

### Docs
- Update `docs/tasks/022-ares-onboarding-automation/ares-field-mapping.md` or create a Task 023 mapping appendix.
- Update `docs/06-integrations.md`.
- Update `docs/seller-onboarding-flow.md`.

### QA
- Desktop: initial modal, success preview, error, Apply, manual.
- Mobile: initial modal, success preview with long address, error, Apply, manual.
- Rejected/edit flow: modal does not reappear when data exists.
- Submit after assisted prefill still goes to manual moderation path.

### Regression
- Backend tests for self-employed lookup.
- Frontend tests for inline lookup and modal.
- Relevant seller onboarding tests.

### Status
- [x] Docs, QA evidence, and regression gate closed for MVP.

### QA Evidence

Backend:

- `cd backend && python3 manage.py test sellers.test_ares_verification` — 11 passed.
- `cd backend && python3 manage.py test sellers.test_ares_lookup` — 22 passed.
- `cd backend && python3 manage.py test sellers` — 88 passed.
- `cd backend && python3 manage.py check` — OK.

Frontend:

- `cd Frontend/Frontend3 && npm test -- SellerInformation.test.jsx --run` — 21 passed.
- `cd Frontend/Frontend3 && npm test -- ReviewInfoPage.test.jsx --run` — 8 passed.
- `cd Frontend/Frontend3 && npm test -- SellerCompanyInfo.test.jsx --run` — 79 passed.
- `cd Frontend/Frontend3 && npm test -- SellerReviewCompany.test.jsx --run` — 10 passed.
- `cd Frontend/Frontend3 && npm test -- selfEmployed.test.js --run` — 2 passed.
- `git diff --check` — clean.

Regression coverage includes:

- self-employed first-run ARES assist modal, manual fallback, lookup preview, Apply, no-overwrite behavior, and not found/invalid/unavailable states;
- ARES-prefilled business/tax/address values preserved after document upload;
- `first_name`, `last_name`, `date_of_birth`, `nationality`, and `account_holder` preservation regressions;
- required document guard before Continue to Review;
- warehouse `same_as_primary_address` persistence in review/edit flow;
- self-employed submit-time ARES moderator hint, mismatch/unavailable behavior, and sanitized snapshot storage;
- company ARES/onboarding regression tests.

### Manual / Mobile QA

- Automated RTL coverage verifies the modal and form states structurally.
- Manual mobile/browser visual smoke was not rerun during documentation closure because this pass changed docs only. Manual acceptance remains recommended before release for:
  - self-employed entry ARES modal initial state;
  - success preview with a long registered address;
  - invalid/not found/unavailable error states;
  - manual mode;
  - document upload state preservation;
  - Continue to Review guard with missing documents;
  - Review edit Warehouse Address `same_as_primary_address`;
  - submit path remaining `pending_verification`.

### Known Limitations / Deferred

- Dedicated `/self-employed/ares-lookup/` endpoint is deferred; frontend lookup currently reuses the existing company ARES lookup endpoint.
- Auto-approve is out of scope.
- ARES is not KYC or identity verification.
- `first_name`, `last_name`, `date_of_birth`, and `nationality` are not filled from ARES.
- Phone, bank, warehouse, return address, and document fields are not prefilled from ARES.
- Slovakia and non-CZ registries are out of scope.
- Manual mobile/browser visual QA is pending manual acceptance for release.

---

## Definition of Done

- [x] Self-employed ARES mapping is documented and approved.
- [x] Backend self-employed lookup contract is implemented and tested, or reuse of company lookup is explicitly justified.
- [x] Self-employed Apply helper fills only approved fields.
- [x] Inline self-employed lookup UI works with preview + Apply + error states.
- [x] First-run self-employed ARES assist modal works without country selector.
- [x] Manual mode is always available.
- [x] Copy clearly states Czech-only public-registry prefill and not identity verification.
- [x] EN/CZ i18n added.
- [x] Desktop/mobile visual QA status documented.
- [x] Tests pass.
