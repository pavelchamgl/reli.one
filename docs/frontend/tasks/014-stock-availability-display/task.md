# FE-014 — Stock Availability Display

**Priority:** P1  
**Status:** Done (2026-05-21)  
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
| Detail shows selected variant availability | `ProductNameRate.test.jsx` |
| Unavailable selected variant disables Add to cart | `ProductNameRate.test.jsx` |
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
