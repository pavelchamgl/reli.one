# Task 023 — ARES Assist for Self-employed Onboarding (CZ)

**Priority:** P1  
**Complexity:** High  
**Status:** **PLANNED** — starts after Task 022 MVP company/shared ARES foundation is closed.

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
- [ ]

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
- [ ]

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
- [ ]

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
- [ ]

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
- [ ]

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
- [ ]

---

## Definition of Done

- [ ] Self-employed ARES mapping is documented and approved.
- [ ] Backend self-employed lookup contract is implemented and tested, or reuse of company lookup is explicitly justified.
- [ ] Self-employed Apply helper fills only approved fields.
- [ ] Inline self-employed lookup UI works with preview + Apply + error states.
- [ ] First-run self-employed ARES assist modal works without country selector.
- [ ] Manual mode is always available.
- [ ] Copy clearly states Czech-only public-registry prefill and not identity verification.
- [ ] EN/CZ i18n added.
- [ ] Desktop/mobile visual QA completed.
- [ ] Tests pass.

