# FE-014 — Stock Availability Display

**Priority:** P1  
**Status:** Done  
**Depends on:** [Task 020 — Product Stock Availability API](../../../tasks/020-product-stock-availability-api/task.md)  
**Phase:** 6 — Catalog UX

> Sprint brief label: **Stock Availability Display**. Official FE id **FE-014** (FE-006 is already [Refactoring Foundation](./006-refactoring-foundation/task.md)).

---

## Goal

Show product stock availability on catalog/list/search cards and product detail using Task 020 API fields. Handle stale-cart stock conflicts at checkout (HTTP 409).

---

## API contract (Task 020)

### List / search / category — product item

| Field | Type | Usage |
|-------|------|--------|
| `total_available_quantity` | int | informational |
| `is_available` | bool | disable card CTA when `false` |
| `stock_status` | `in_stock` / `few_left` / `out_of_stock` | badge label |

Endpoints: `GET /api/products/categories/<id>/`, `GET /api/products/search/?q=...`

### Product detail — each `variants[]` item

| Field | Type | Usage |
|-------|------|--------|
| `available_quantity` | int | informational |
| `is_available` | bool | disable Add to cart when selected variant unavailable |
| `stock_status` | string | badge + variant marking |

Endpoint: `GET /api/products/<id>/`

### Checkout — authoritative validation

`POST /create-stripe-payment/`, `POST /create-paypal-payment/` may return **409**:

```json
{
  "stock": {
    "sku": "123456789",
    "requested": 2,
    "available": 0
  }
}
```

UI message: *This item has just gone out of stock. Please refresh your cart.*

---

## Implementation

| Area | Files |
|------|--------|
| Models / helpers | `src/models/productStock.js`, `src/utils/stockAvailability.js`, `src/utils/paymentErrors.js` |
| Badge UI | `src/Components/Product/StockBadge/` |
| Catalog card | `ProductCard.jsx` — badge + disabled Buy |
| Detail desktop | `ProductNameRate.jsx`, `ProdCharackButtons.jsx` |
| Detail mobile | `ProductImageAndName.jsx`, `MobVariantDrawer.jsx` |
| Checkout 409 | `paymentSlice.js`, `PaymentPlataBlock.jsx` |
| i18n | `in_stock`, `few_left`, `out_of_stock`, `stock_error_checkout` |

Backward-compatible: if stock fields are absent, product/variant treated as available.

---

## Tests

| Test | File |
|------|------|
| Card renders stock badge | `ProductCard.test.jsx` |
| Out-of-stock card disables Buy | `ProductCard.test.jsx` |
| List card falls back to detail stock fields | `ProductCard.test.jsx` |
| Detail shows selected variant availability | `ProductNameRate.test.jsx` |
| Unavailable selected variant disables Add to cart | `ProductNameRate.test.jsx` |
| Detail sku init after product load | `ProductNameRate.test.jsx` |
| Generic variant buttons + stock guard | `ProdCharackButtons.test.jsx` |
| Drawer generic variants + stock guard | `MobVariantDrawer.test.jsx` |
| Modal variant out_of_stock blocked | `BasketModalCard.test.jsx` |
| Basket reducer rejects unavailable payload | `basketSlice.test.js`, `stockAvailability.test.js` |
| Checkout 409 shows stock error message | `paymentSlice.test.js`, `PaymentPlataBlock.test.jsx` |

Run: `npm run test`, `npm run lint`

---

## Definition of Done

- [x] List/search/category cards show stock badge from `stock_status`
- [x] Card Buy disabled when `is_available === false`
- [x] Detail shows availability for selected variant; updates on variant change
- [x] Add to cart disabled for unavailable selected variant
- [x] Multi-variant: unavailable variants visibly marked
- [x] Checkout 409 → user-friendly stale-cart message
- [x] RTL tests for card, detail, checkout error
- [x] Docs reference Task 020 API contract

---

## Out of scope

- Seller storefront / favorites stock fields (backend not annotated yet)
- Filter `?in_stock=true`
- Backend runtime changes

---

## Runtime verification history

### Runtime fix implementation notes (2026-05-21)

**Root cause confirmed:** Redux/API pass-through preserves Task 020 stock fields; runtime gaps were in UI branches that never read them (`ProdCharackButtons` placeholder `else`, `varPack=null` in drawer/modal), list-card stock ignoring loaded `allData`, non-reactive detail sku init, and missing basket reducer guard.

**Changes:**
- `stockAvailability.js` — `getListItemStockSource`, `canAddToBasket`
- `ProductCard.jsx` — badge/Buy use list item with `allData` fallback
- `ProdCharackButtons.jsx` — generic stock-aware variant buttons; block unavailable selection
- `MobVariantDrawer.jsx` — generic stock-aware branch when no text/image pack
- `BasketModalCard.jsx` — stock guards on variant select and add-to-basket
- `ProductNameRate.jsx` — reactive sku init on `product.id` / variants
- `basketSlice.js` — reject `addToBasket` when variant/product stock says unavailable; legacy payloads without stock fields still allowed

**Checkout 409:** unchanged — `paymentErrors.js` → `paymentSlice` → `PaymentPlataBlock` (Stripe + PayPal share error display).

**Manual smoke:** superseded by pass 3 verification below.

---

## Runtime fix pass 2 (2026-05-25)

### Why pass 1 did not affect the actual UI path

Pass 1 fixed the **code**, but the manual smoke still failed for three separate reasons:

1. **Stale `basket` localStorage** — `basket` is in the redux-persist whitelist. SKU 871363262 added before pass 1 remained in localStorage. The reducer now blocks **new** additions but cannot remove already-persisted items retroactively.
   **Action:** clear localStorage before any new smoke (`localStorage.clear()` in DevTools Console, or "Clear site data").

2. **`useEffect([product?.id, product?.variants, search])` in ProductNameRate** — `product?.variants` is an array reference. Any unrelated Redux dispatch (basket update, payment slice, etc.) that caused `state.products.product` to return a new object reference would re-trigger the effect and reset `sku` to the URL-param or first variant, potentially overwriting the user's manual variant selection. Fixed in pass 2: dep changed to `[product?.id, search]`.

3. **`ProductImageAndName` mobile path** — the mobile product-detail component (`ProductPage → ProductImageAndName` for ≤470px viewport) initialised `sku` via `useEffect([product, basket])`. Basket updates (add/remove) re-ran the effect and reset the selected variant. Fixed in pass 2: dep changed to `[product?.id]`, `sku` prop now passed to `ProdCharackButtons`.

### Actual component routes

| URL | Rendered component chain |
|-----|--------------------------|
| `/product_category/44` | `CategoryPage` → `ProductCard` |
| `/product/16` (desktop > 470px) | `ProductPage` → `ProductNameRate` + `ProdCharackButtons` |
| `/product/16` (mobile ≤ 470px) | `ProductPage` → `ProductImageAndName` + `ProdCharackButtons` |
| `/basket` | `BasketPage` → `BasketCardBlock` → `BasketCard` |
| Multi-variant "Add to cart" desktop | → `BasketModal` → `BasketModalCard` |
| Multi-variant "Buy" category card mobile | → `MobVariantDrawer` |

`BasketModalCard` is NOT rendered on `/basket` — only in the add-to-cart modal dialog.

### Stale basket items note

After deploying pass 1/2, users with pre-existing basket items in localStorage may still have unavailable SKUs stored until:
- `localStorage.clear()` / "Clear site data"
- Checkout 409 removes selected items
- The user manually deletes the item from the basket page

The reducer **blocks new additions** of OOS items. No retroactive removal of persisted items is implemented in this scope.

### Pass 2 changes

| File | Change |
|------|--------|
| `ProductNameRate.jsx` | Fix useEffect dep: `[product?.id, search]` only |
| `ProductImageAndName.jsx` | Fix useEffect dep: `[product?.id]`; pass `sku` prop to ProdCharackButtons |
| `stockAvailability.js` | Guard empty `sku` in `canAddToBasket`; add product-level fallback |
| `stockAvailability.test.js` | Additional `canAddToBasket` edge cases |

### API configuration (pass 2)

Local development uses an explicit Vite env file:
```bash
# Frontend/Frontend3/.env.local
VITE_API_URL=http://localhost:8000/api
```
After creating/editing `.env.local`, restart the Vite dev server. Do not rely on the production fallback for local verification.

### BasketCard OOS detection (pass 2)

`BasketCard` already fetched fresh product data via `getProductById` on mount (for price sync). Extended to also check `variant.is_available` / `variant.stock_status`:
- If OOS: shows `StockBadge("out_of_stock")`, disables +/−/checkbox, auto-deselects the item
- Card becomes 60% opacity as visual indicator
- Checkout cannot include auto-deselected OOS items

### Smoke checklist (clear localStorage first)

```javascript
// DevTools Console → Application → Storage → Clear site data
// OR:
localStorage.removeItem("persist:root");
location.reload();
```

- [x] `/product_category/44` → stock badge visible; in-stock Buy active; out-of-stock Buy disabled
- [x] `/product/16` → selected variant badge updates; out-of-stock variant disables Add to cart
- [x] `/basket` → stale out-of-stock item is marked, dimmed, deselected, and excluded from checkout
- [x] Checkout 409: message "This item has just gone out of stock. Please refresh your cart."

---

## Runtime fix pass 3 (2026-05-25)

Pass 3 closed the remaining local runtime blockers found during manual smoke:

| Area | Result |
|------|--------|
| Local API config | Frontend3 points to local backend through `Frontend/Frontend3/.env.local` (`VITE_API_URL=http://localhost:8000/api`) |
| Backend CORS | Local frontend can call the local backend API during Vite smoke |
| `ProductPage` | Error/loading state no longer renders stale empty product UI before detail data is ready |
| `BasketCard` | Stale persisted out-of-stock basket items are detected from fresh product data, visually marked, deselected, and excluded from checkout |

Manual smoke completed against local backend:

| Route | Verification |
|-------|--------------|
| `/product_category/44` | Category card availability reflects Task 020 stock fields |
| `/product/16` | Variant availability badge and Add-to-cart state follow selected SKU |
| `/basket` | Stale out-of-stock SKU handling is visible and checkout-safe |
