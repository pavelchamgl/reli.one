# FE-023 Visual Extraction Pass — Company Data Step

**Date:** 2026-05-29
**Route:** `/seller/seller-company`
**Local URL:** `http://127.0.0.1:5173/seller/seller-company`
**Design source:** `Reli-onboarding-company.pdf` + Figma node `7076:53373`

## Purpose

This pass freezes the visual target and current live UI baseline before continuing FE-023 fixes. Future styling changes must be measured against this document instead of relying only on visual memory.

## Screenshot Baseline

Current live UI screenshots captured after Iteration 3c:

- [Desktop current baseline — 1440 x 1200](./artifacts/seller-company-current-desktop-1440.png)
- [Mobile current baseline — 375 x 900](./artifacts/seller-company-current-mobile-375.png)

Capture command used:

```bash
cd /Users/pavel/Documents/Projects/reli.one/Frontend/Frontend3
npx playwright screenshot --browser=chromium --viewport-size=1440,1200 http://127.0.0.1:5173/seller/seller-company /Users/pavel/Documents/Projects/reli.one/docs/frontend/tasks/023-seller-onboarding-company-form-parity/artifacts/seller-company-current-desktop-1440.png
npx playwright screenshot --browser=chromium --viewport-size=375,900 http://127.0.0.1:5173/seller/seller-company /Users/pavel/Documents/Projects/reli.one/docs/frontend/tasks/023-seller-onboarding-company-form-parity/artifacts/seller-company-current-mobile-375.png
```

Note: Chromium screenshot capture requires running outside the Codex sandbox on this machine because sandboxed Playwright fails on macOS Mach port permissions.

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
| Select trigger border | computed as `0px none` for `button[role=combobox]` | Needs fix |

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
| Bottom marketplace nav | visible (`Home / Goods / Orders / Account`) | Needs product/design decision |

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

These should be resolved or explicitly accepted before FE-023 is closed.

| ID | Gap | Impact | Recommended action |
|----|-----|--------|--------------------|
| V3-1 | Select triggers lose visible border because legacy global `button { border: none; }` overrides Tailwind border utilities | Selects do not fully match input border treatment | Add explicit solid border style/class to onboarding select trigger |
| V3-2 | Mobile marketplace bottom nav is visible on onboarding route | Not present in Figma/PDF onboarding reference; may distract/overlap in lower viewport states | Confirm product decision; if not intended, hide marketplace mobile nav on `sellerPathnames` |
| V3-3 | Header action says `Login` in local screenshot, while visual contract says `Logout` | Could be auth-state dependent; may be correct only in unauthenticated local state | Verify authenticated seller state; fix only if onboarding should always render logout |

## Pass Verdict

Desktop layout now matches the main Figma geometry: header height, content x-position, card width, field width, upload row height, and desktop grids are aligned. Mobile has no horizontal overflow and stacks fields correctly.

Do not continue broad restyling before resolving or explicitly accepting V3-1 through V3-3.
