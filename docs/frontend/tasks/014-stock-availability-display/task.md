# FE-014 — Stock Availability Display

**Priority:** P1  
**Status:** In progress — runtime integration gap found (2026-05-21)  
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

## Audit / Runtime gap (2026-05-21)

### Manual smoke findings

Smoke performed 2026-05-21 after FE-014 code merged. Backend API confirmed returning correct fields.

| Symptom | Expected | Actual |
|---------|----------|--------|
| Category page — stock badge | Visible per `stock_status` | Not visible |
| Category page — Buy button for out_of_stock product | Disabled | Active |
| Detail page — selected variant availability badge | Visible | Not visible |
| Detail page — Add to cart for unavailable variant | Disabled | Active |
| Detail page — out-of-stock variant can be added via BasketModal | Blocked | Not blocked |
| Basket — can hold unavailable SKU | Blocked | Not blocked |

Tests pass: all RTL unit tests green (129). Runtime UI: not effective.

---

### Root cause analysis

#### Gap 1 — Tests bypass the API→Redux→component data chain (CRITICAL)

All RTL tests inject stock fields **directly into the `data` prop or Redux pre-loaded state**:

```jsx
// ProductCard.test.jsx — artificial data
<ProductCard data={{ ...baseProduct, stock_status: "in_stock", is_available: true }} />

// ProductNameRate.test.jsx — pre-loaded Redux store with stock fields on variants
product.variants: [{ sku: "SKU-A", is_available: true, stock_status: "in_stock", ... }]
```

No test validates the full chain: `fetchGetProducts` / `fetchGetProductById` → Redux → component prop. If the actual API response at the specific URL and with the specific query parameters doesn't include `stock_status`/`is_available`, the tests pass but the UI doesn't react.

**Diagnostic step:** Open DevTools → Network → observe the actual JSON response from:
- `GET /api/products/categories/{id}/` with `max_price`, `min_price`, `ordering`, `page`, `page_size` params
- `GET /api/products/{id}/` (via `getProductById`)

Verify `stock_status`, `is_available` are present at the top level of each result item / each variant object.

#### Gap 2 — `ProductCard` uses list `data` prop for stock, `allData` for basket (CORRECT BY DESIGN but fragile)

`productAvailable = isItemAvailable(data)` reads from the list/category API item (`state.products.products[i]`). If the list endpoint omits stock fields, `isItemAvailable` falls through to `return true` (default available). Badge: `getProductStockStatus(data)` returns `null`. **No badge, button enabled — exactly the smoke symptom.**

`ProductCard` also calls `getProductById` internally (for basket operations) and stores the result in `allData`. `allData` variants MAY have stock fields from the detail API, but they are NOT used for badge/button display.

#### Gap 3 — `ProdCharackButtons` `else` branch: hardcoded placeholder, no stock awareness (DEFINITE BUG)

`varPack` is determined by:
```js
const { image, name, text, price } = variants[0] || {};
if (text && price) setVarPack("pack3");
else if (image && price) setVarPack("pack2");
// else: varPack = null
```

When `variants[0]` has neither `text` nor `image`, `varPack` remains `null`. The `else` branch renders **eight hardcoded `$35.99` buttons with placeholder images** — completely unrelated to real variants. `renderVariantButton()` (which calls `isItemAvailable`) is never reached. The same `varPack` pattern exists in `MobVariantDrawer` and `BasketModalCard`.

For many real products (variants without `text`/`image` descriptors), the variant UI in `ProdCharackButtons` is permanently in the `else` placeholder — meaning:
- Unavailable variants are NOT visually marked
- Users see fake hardcoded variant options instead of real ones
- `setSku` is never called from variant clicks, so `selectedVariant` in `ProductNameRate` relies entirely on the mount-time initialization

#### Gap 4 — `ProductNameRate` sku initialization: `useEffect([], [])` runs once, `product` may be empty on first mount

`ProductPage` renders `ProductNameRate` immediately when `status !== "loading"`. Initial Redux `status = ""` (not "loading"), so `ProductNameRate` mounts with `product = {}`.

`useEffect([], [])` in `ProductNameRate` runs on first mount with empty `product`:
- `firstVariant = {}.variants?.[0]` = `undefined`
- `setSku(undefined)`

Then `fetchGetProductById` fires, `status = "loading"`, `ProductNameRate` **unmounts** (Loader shown). When product loads and `status = "fulfilled"`, `ProductNameRate` **mounts again** — second mount runs the `useEffect` again with real `product.variants[0]`. This fixes the sku. BUT:

If the `product.variants[i]` from the detail API don't carry `is_available` / `stock_status` (Gap 1), then even with a correct `sku`, `selectedVariantAvailable` falls through to `true` and no badge renders.

#### Gap 5 — `BasketModalCard`: no `isItemAvailable` guard on variant selection

`BasketModalCard` renders variant buttons in its `pack2`/`pack3` branches without checking `isItemAvailable(item)`. A user who opens `BasketModal` (desktop detail page, multi-variant product) can select and add any variant, including unavailable ones. The checkout 409 is the only downstream guard.

#### Gap 6 — `MobVariantDrawer` `varPack = null` case: drawer renders no variant buttons

When `varPack = null` (no `text`/`image` on variants), `MobVariantDrawer` shows only "Select {name}" with no buttons. On mobile, the user cannot select any variant at all.

---

### Fix checklist

**Step 1 — Diagnose data chain (no code, browser DevTools)**
- [x] Category/list API returns `stock_status`, `is_available` (Task 020 backend + Redux pass-through confirmed; UI was not reading fields in several branches)
- [x] Product detail API returns variant `is_available`, `stock_status` (same — pass-through OK, gaps in variant UI paths)

**Step 2 — `ProdCharackButtons` `else` branch (high impact)**
- [x] Replace hardcoded `else` block with stock-aware rendering using real `variants` (generic text/sku buttons via `renderVariantButton`)
- [x] Same fix in `MobVariantDrawer` (show generic buttons when `varPack = null`)
- [x] Same fix in `BasketModalCard` (add `isItemAvailable` guard on `setSelected`)

**Step 3 — `ProductCard` stock source fallback (after allData loads)**
- [x] After `getProductById` response stored in `allData`, derive stock from `allData` when list item lacks stock fields (`getListItemStockSource`)
- [x] Use `allData.is_available` / `allData.stock_status` as fallback when list item lacks these fields

**Step 4 — `ProductNameRate` sku re-initialization on product change**
- [x] Replace `useEffect([], [])` with `useEffect([product?.id, product?.variants, search])` so sku initializes when product loads

**Step 5 — End-to-end integration tests**
- [x] `ProductCard.test.jsx` — list item without stock fields + detail mock with stock fields
- [x] `ProductNameRate.test.jsx` — dispatch `fetchGetProductById/fulfilled` and assert badge/button
- [x] `ProdCharackButtons.test.jsx`, `MobVariantDrawer.test.jsx`, `BasketModalCard.test.jsx`, `basketSlice.test.js`, `stockAvailability.test.js`

**Step 6 — Re-verify smoke after fixes**
- [ ] Product in stock: badge "In stock", Buy/Add to cart active
- [ ] Product out of stock: badge "Out of stock", Buy/Add to cart disabled
- [ ] Product with one available / one unavailable variant: unavailable variant grayed out in `ProdCharackButtons`; selecting unavailable variant disables Add to cart
- [ ] Checkout 409: stale cart message shown

---

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

**Manual smoke:** pending — run checklist in Step 6 before marking Done.

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

`src/api/index.js` fallback is `http://localhost:8000/api`. No `.env.local` existed before; created in pass 2. To point to local backend explicitly:
```bash
# Frontend/Frontend3/.env.local (created)
VITE_API_URL=http://localhost:8000/api
```
After creating/editing `.env.local`, restart the Vite dev server.

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

- [ ] `/product_category/44` → product 16 badge "in_stock" visible, Buy active
- [ ] product 1 (out_of_stock) → badge "out_of_stock" visible, Buy disabled
- [ ] Add product 16 from category card → modal shows variants; OOS (45×56cm) button disabled, dim
- [ ] `/product/16` desktop → badge shows for first variant (30×28cm = in_stock)
- [ ] Switch to 45×56cm → badge "out_of_stock", Add disabled
- [ ] Click Add to cart on 45×56cm → basket unchanged
- [ ] Select 30×28cm → Add to cart → basket contains only SKU 240819709
- [ ] `/product/16` mobile (≤470px) → same badge/button behavior via ProductImageAndName
- [ ] `/basket` → no newly added SKU 871363262; if stale OOS item exists → badge + dim + deselected
- [ ] Checkout 409: message "This item has just gone out of stock. Please refresh your cart."
