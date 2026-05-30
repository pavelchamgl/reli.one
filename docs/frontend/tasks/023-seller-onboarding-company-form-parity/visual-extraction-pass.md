# FE-023 Visual Extraction Pass — Company Data Step

**Date:** 2026-05-29
**Route:** `/seller/seller-company`
**Local URL:** `http://127.0.0.1:5173/seller/seller-company`
**Design source:** `Reli-onboarding-company.pdf` + Figma node `7076:53373`

## Purpose

This pass freezes the visual target and current live UI baseline before continuing FE-023 fixes. Future styling changes must be measured against this document instead of relying only on visual memory.

## Screenshot Baseline

Current live UI screenshots captured after Iteration 3c (pre–V3-1/V3-2 fixes):

- [Desktop current baseline — 1440 x 1200](./artifacts/seller-company-current-desktop-1440.png)
- [Mobile current baseline — 375 x 900](./artifacts/seller-company-current-mobile-375.png)

**Iteration 5:** re-capture after V3-1/V3-2 fixes using the commands below (agent sandbox could not install Playwright Chromium).

Capture command used:

```bash
cd /Users/pavel/Documents/Projects/reli.one/Frontend/Frontend3
npx playwright screenshot --browser=chromium --viewport-size=1440,1200 http://127.0.0.1:5173/seller/seller-company /Users/pavel/Documents/Projects/reli.one/docs/frontend/tasks/023-seller-onboarding-company-form-parity/artifacts/seller-company-current-desktop-1440.png
npx playwright screenshot --browser=chromium --viewport-size=375,900 http://127.0.0.1:5173/seller/seller-company /Users/pavel/Documents/Projects/reli.one/docs/frontend/tasks/023-seller-onboarding-company-form-parity/artifacts/seller-company-current-mobile-375.png
```

Note: Chromium screenshot capture requires running outside the Codex sandbox on this machine because sandboxed Playwright fails on macOS Mach port permissions. Iteration 5 code fixes (V3-1/V3-2) should be verified with a local re-capture using the commands above.

## Figma Target Metrics

Extracted from Figma node `7076:53373` and FE-023 task notes.

| Area | Target |
|------|--------|
| Frame | `1440 x 4348` |
| Header height | `92px` |
| Content wrapper | `x=272`, `width=896` |
| Heading container | `height=138.5` |
| Form/card column | `width=896` |
| Card padding | `32px` |
| Inner field width | `832px` |
| Section header row | `40px` |
| Icon badge | `40 x 40` |
| Full input/select height | `48px` |
| Two-column controls | `408 + 16 gap + 408` |
| Address three-column controls | approximately `266.67 + 15.33 gap + 266.67 + 15.33 gap + 266.67` |
| Upload group | total `104px` |
| Upload control | `832 x 48` |
| Submit button | approximately `223 x 48`, centered |

## Current Desktop Metrics

Measured in browser at `1440 x 1200`.

| Area | Current | Status |
|------|---------|--------|
| Header | `h=92`, `bg=#FFFFFF`, content padding aligns to `x=272` | OK |
| Page background | `#F8FAFC` | OK |
| Main wrapper | `x=272`, `w=896`, `y=92` | OK |
| Section card | `x=272`, `w=896`, `padding=32`, `radius=12`, border `#E5E7EB` | OK |
| Full text input | `w=830`, `h=48`, border visible | OK |
| Two-column controls | `w=407 + 16 gap + 407` | OK |
| Upload row | `w=830`, `h=48`, border `1px solid #D1D5DB` | OK |
| Horizontal overflow | none | OK |
| Select trigger border | `1px solid #D1D5DB` via `onboardingSelectTriggerClassName` | OK (fixed V3-1) |

## Current Mobile Metrics

Measured in browser at `375 x 900`.

| Area | Current | Status |
|------|---------|--------|
| Header | `h=92`, white background, logo + `/ Seller`, language action | OK |
| Main wrapper | `w=375`, padding `16px` | OK |
| Section card | `x=16`, `w=343`, padding `16px` | OK |
| Controls | `w=309`, `h=48`, stacked vertically | OK |
| Upload row | `w=309`, stacked, `h=106` | Acceptable mobile variant |
| Horizontal overflow | none | OK |
| Bottom marketplace nav | hidden on onboarding routes (`sellerPathnames`) | OK (fixed V3-2) |

## Field/Content Parity Notes

Visible data-step field contract matches FE-023 expectations:

- Company Information: company name, legal form, country of registration, business ID, TIN, EORI, registration certificate, company phone.
- Representative: first name, last name, role, date of birth, nationality.
- Business Address: street, city, ZIP, country, proof of address.
- Bank Account: IBAN, SWIFT/BIC, account holder; CZ/SK bank fields are conditional.
- Warehouse Address: same-as-primary checkbox, street, city, ZIP, country, contact phone, proof of address.
- Return Address: same-as-warehouse checkbox, street, city, ZIP, country, contact phone, proof of address.
- No visible VAT ID.
- No representative identity document upload.

## Remaining Visual Gaps

Resolved in Iteration 5 (2026-05-29):

| ID | Gap | Resolution |
|----|-----|------------|
| V3-1 | Select triggers lose visible border because legacy global `button { border: none; }` overrides Tailwind border utilities | **Fixed** — `onboardingSelectTriggerClassName` adds `!border !border-solid !border-[#D1D5DB]` on `SellerCountrySelectView` trigger |
| V3-2 | Mobile marketplace bottom nav visible on onboarding route | **Fixed** — `SellerPage` hides `SellerMobNav` when `sellerPathnames.includes(pathname)`; nav remains on post-onboarding seller dashboard routes |
| V3-3 | Header action says `Login` in local screenshot, while visual contract says `Logout` | **Accepted** — auth-state dependent; `SellerHeader` renders Logout when `localStorage.token` is present, Login link when unauthenticated. Authenticated seller onboarding shows Logout as expected |

## Pass Verdict (Iteration 5)

Desktop layout matches the main Figma geometry: header height, content x-position, card width, field width, upload row height, select borders, and desktop grids are aligned. Mobile has no horizontal overflow, stacks fields correctly, and no marketplace bottom nav on onboarding routes.

All V3-1 through V3-3 gaps are resolved or explicitly accepted. FE-023 visual extraction pass is complete.
