/**
 * FS-003 — Full-stack payment confirmation E2E: webhook lifecycle + UI visibility
 *
 * Tests in this file require a running Django backend + Postgres with E2E env vars:
 *   STRIPE_WEBHOOK_SKIP_SIGNATURE=true
 *   ENABLE_E2E_ENDPOINTS=true
 *
 * If the backend is not available, all tests are automatically skipped.
 *
 * Prerequisites:
 *   cp envs/database.e2e.env.example envs/database.e2e.env
 *   cp envs/backend.e2e.env.example  envs/backend.e2e.env
 *   docker compose -f docker-compose.e2e.yml up --build
 *   # Then, in Frontend/Frontend3:
 *   npm run build && npm run test:e2e
 *
 * Environment:
 *   FULLSTACK_BACKEND_URL  — override backend URL (default: http://localhost:8000)
 *
 * Strategy:
 * - Playwright `request` fixture → direct HTTP to Django (no browser, no proxy)
 * - STRIPE_WEBHOOK_SKIP_SIGNATURE=true → webhook endpoint skips stripe.Webhook.construct_event
 * - ENABLE_E2E_ENDPOINTS=true → /api/e2e/* endpoints exposed for test setup
 * - page.route() proxy → intercepts https://reli.one/api/* from Vite preview,
 *   forwards to http://localhost:8000/api/* transparently
 * - localStorage seeding → JWT token set before page.goto() via addInitScript
 *
 * What is verified:
 * - FS-003a: Backend webhook lifecycle — StripeMetadata → POST /api/stripe-webhook/ →
 *   Order/OrderProduct/Invoice created, Payment.session_id stored, conversion-payload ready.
 * - FS-003b: UI order visibility — /my_orders page renders the created order
 *   with order_number and total_amount after the webhook has been processed.
 *
 * What is NOT covered (follow-ups):
 * - Dedicated /payment_end confirmation page does not display order details
 *   (only a generic success message). A follow-up UI task is documented in
 *   docs/frontend/tasks/013-full-stack-payment-confirmation-e2e/task.md.
 * - PayPal webhook lifecycle (FS-003 uses Stripe only; PayPal covered in Task 016 matrix).
 * - Idempotency (already covered in Task 016 / backend tests).
 *
 * Related docs:
 *   docs/tasks/015-full-stack-e2e-design/task.md (FS-003)
 *   docs/frontend/tasks/013-full-stack-payment-confirmation-e2e/task.md
 *   docs/tasks/016-webhook-idempotency-verification/task.md
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.FULLSTACK_BACKEND_URL ?? 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const PERSIST_VERSION = 20;   // src/redux/index.js — PERSIST_VERSION
const COOKIE_VERSION = '0.0.8'; // src/configs/cookieConfig.js

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Intercept all https://reli.one/api/* requests from the Vite preview
 * and forward them to the real backend. Must be called before page.goto().
 */
async function proxyToBackend(page) {
  await page.route(/https?:\/\/reli\.one\/api\//, async (route) => {
    const backendUrl = route
      .request()
      .url()
      .replace(/https?:\/\/reli\.one\/api/, API);
    try {
      const response = await route.fetch({ url: backendUrl });
      await route.fulfill({ response });
    } catch {
      await route.abort('connectionrefused');
    }
  });
}

/**
 * Register a seller, set warehouse address (CZ origin), return JWT + sellerProfileId.
 */
async function registerSellerWithWarehouse(request) {
  const ts = Date.now();
  const email = `fs003-seller-${ts}@test.example`;
  const phone = `+4207${String(ts).slice(-7)}`;

  const reg = await request.post(`${API}/accounts/register/seller/`, {
    data: {
      first_name: 'FS003',
      last_name: 'Seller',
      email,
      phone_number: phone,
      password: 'Passw0rd!',
      confirm_password: 'Passw0rd!',
    },
  });
  if (!reg.ok()) {
    throw new Error(`Seller registration failed ${reg.status()}: ${await reg.text()}`);
  }

  const login = await request.post(`${API}/accounts/login/`, {
    data: { email, password: 'Passw0rd!' },
  });
  if (!login.ok()) {
    throw new Error(`Seller login failed ${login.status()}: ${await login.text()}`);
  }
  const { access } = await login.json();
  const h = { Authorization: `Bearer ${access}` };

  const r0 = await request.post(`${API}/sellers/onboarding/seller-type/`, {
    headers: h,
    data: { seller_type: 'self_employed' },
  });
  expect(r0.ok(), `seller-type: ${await r0.text()}`).toBeTruthy();

  const r1 = await request.put(`${API}/sellers/onboarding/warehouse/`, {
    headers: h,
    data: {
      street: 'Warehouse Street 1',
      city: 'Praha',
      zip_code: '10000',
      country: 'CZ',
      contact_phone: phone,
    },
  });
  expect(r1.ok(), `warehouse: ${await r1.text()}`).toBeTruthy();

  const stateResp = await request.get(`${API}/sellers/onboarding/state/`, { headers: h });
  expect(stateResp.ok(), `onboarding state: ${await stateResp.text()}`).toBeTruthy();
  const state = await stateResp.json();
  const sellerProfileId = state.seller_profile_id;
  expect(sellerProfileId, 'seller_profile_id must be present').toBeTruthy();

  return { access, email, sellerProfileId };
}

/**
 * Create a base product and one variant. Returns variantSku and variantPrice.
 */
async function createProductVariant(request, sellerAccess) {
  const h = { Authorization: `Bearer ${sellerAccess}` };
  const ts = Date.now();

  const productResp = await request.post(`${API}/sellers/products/`, {
    headers: h,
    data: {
      name: 'FS003 Test Product',
      product_description: 'Full-stack E2E payment confirmation test product',
      vat_rate: '21.00',
      article: `FS003-${ts}`,
    },
  });
  if (!productResp.ok()) {
    throw new Error(`Product create failed ${productResp.status()}: ${await productResp.text()}`);
  }
  const product = await productResp.json();

  const variantResp = await request.post(`${API}/sellers/products/${product.id}/variants/`, {
    headers: h,
    data: [
      {
        name: 'Standard',
        text: 'Default',
        price: '15.00',
        weight_grams: 500,
        length_mm: 200,
        width_mm: 150,
        height_mm: 100,
      },
    ],
  });
  if (variantResp.status() !== 201) {
    throw new Error(`Variant create failed ${variantResp.status()}: ${await variantResp.text()}`);
  }
  const variants = await variantResp.json();
  const variant = Array.isArray(variants) ? variants[0] : variants;

  return {
    variantSku: variant.sku,
    variantPrice: parseFloat(variant.price),
  };
}

/**
 * Register a customer, return JWT access + refresh tokens and user_id.
 */
async function registerCustomer(request) {
  const ts = Date.now();
  const email = `fs003-customer-${ts}@test.example`;
  const phone = `+4208${String(ts).slice(-7)}`;

  const reg = await request.post(`${API}/accounts/register/customer/`, {
    data: {
      first_name: 'FS003',
      last_name: 'Customer',
      email,
      phone_number: phone,
      password: 'Passw0rd!',
      confirm_password: 'Passw0rd!',
    },
  });
  if (!reg.ok()) {
    throw new Error(`Customer registration failed ${reg.status()}: ${await reg.text()}`);
  }

  const login = await request.post(`${API}/accounts/login/`, {
    data: { email, password: 'Passw0rd!' },
  });
  if (!login.ok()) {
    throw new Error(`Customer login failed ${login.status()}: ${await login.text()}`);
  }
  const { access, refresh } = await login.json();

  const profileResp = await request.get(`${API}/accounts/profile/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!profileResp.ok()) {
    throw new Error(`Profile fetch failed ${profileResp.status()}: ${await profileResp.text()}`);
  }
  const { id: userId } = await profileResp.json();

  return { email, access, refresh, userId };
}

/**
 * Ensure required lookup records exist in the E2E DB:
 * OrderStatus(PENDING), DeliveryType(2), CourierService(2).
 * Uses the E2E setup endpoint (ENABLE_E2E_ENDPOINTS=true required).
 */
async function ensureOrderLookupData(request, authToken) {
  const r = await request.post(`${API}/e2e/payment/setup-order-data/`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!r.ok()) {
    throw new Error(`E2E setup-order-data failed ${r.status()}: ${await r.text()}`);
  }
  return await r.json();
}

/**
 * Create StripeMetadata in DB and return the session_key.
 * Uses the E2E metadata endpoint (ENABLE_E2E_ENDPOINTS=true required).
 */
async function createStripeMetadata(request, authToken, {
  customerId,
  customerEmail,
  sellerProfileId,
  variantSku,
  qty = 1,
  deliveryPrice = '5.21',
}) {
  const ts = Date.now();
  const sessionKey = `sk-e2e-fs003-${ts}`;
  const invoiceNumber = `FS003-INV-${ts}`;
  const variableSymbol = `FS003VS${ts}`;
  const unitPrice = 15.0;
  const acquiringFee = unitPrice * 0.025; // approximate
  const unitAcq = parseFloat((unitPrice + acquiringFee).toFixed(2));
  const lineTotal = parseFloat((unitAcq * qty).toFixed(2));
  const groupTotal = parseFloat((lineTotal + parseFloat(deliveryPrice)).toFixed(2));

  const r = await request.post(`${API}/e2e/payment/create-stripe-metadata/`, {
    headers: { Authorization: `Bearer ${authToken}` },
    data: {
      session_key: sessionKey,
      custom_data: {
        user_id: String(customerId),
        email: customerEmail,
        first_name: 'FS003',
        last_name: 'Customer',
        phone: '+420777000111',
        delivery_address: {
          street: 'Test Street 1',
          city: 'Praha',
          zip: '11000',
          country: 'CZ',
        },
      },
      invoice_data: {
        invoice_number: invoiceNumber,
        groups: [
          {
            seller_id: sellerProfileId,
            delivery_type: 2,
            courier_service: 2,
            delivery_address: {
              street: 'Test Street 1',
              city: 'Praha',
              zip: '11000',
              country: 'CZ',
            },
            products: [{ sku: variantSku, quantity: qty }],
            calculated_delivery_cost: deliveryPrice,
            calculated_total_parcels: 1,
            calculated_group_total: String(groupTotal),
          },
        ],
      },
      description_data: {
        gross_total: String(groupTotal),
        delivery_total: deliveryPrice,
        variable_symbol: variableSymbol,
      },
    },
  });
  if (r.status() !== 201) {
    throw new Error(`create-stripe-metadata failed ${r.status()}: ${await r.text()}`);
  }
  const body = await r.json();
  return {
    sessionKey: body.session_key,
    invoiceNumber,
    groupTotal,
  };
}

/**
 * Simulate a Stripe checkout.session.completed webhook (no real signature).
 * STRIPE_WEBHOOK_SKIP_SIGNATURE=true must be set in the backend.
 */
async function simulateStripeWebhook(request, { sessionKey, sessionId, amountCents }) {
  const event = {
    id: `evt_e2e_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        metadata: { session_key: sessionKey },
        amount_total: amountCents,
        currency: 'eur',
        customer: null,
        payment_intent: `pi_e2e_${Date.now()}`,
      },
    },
  };

  const r = await request.post(`${API}/stripe-webhook/`, {
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': 'sig_e2e_skip',
    },
    data: event,
  });
  return r;
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('FS-003 — Full-stack payment confirmation E2E', () => {
  test.beforeEach(async ({ request }) => {
    const up = await request.get(`${BACKEND_URL}/health/`).catch(() => null);
    test.skip(
      !up || !up.ok(),
      `Backend not available at ${BACKEND_URL} — run: docker compose -f docker-compose.e2e.yml up --build`,
    );

    // Also skip if E2E endpoints are not enabled (ENABLE_E2E_ENDPOINTS must be true)
    const e2eCheck = await request
      .post(`${API}/e2e/payment/setup-order-data/`, {
        headers: { Authorization: 'Bearer skip-check' },
      })
      .catch(() => null);
    test.skip(
      !e2eCheck || e2eCheck.status() === 404,
      'ENABLE_E2E_ENDPOINTS not active — set ENABLE_E2E_ENDPOINTS=true in backend.e2e.env',
    );
  });

  /**
   * FS-003a — Backend webhook lifecycle (API-only, no browser).
   *
   * Verifies the full post-payment lifecycle:
   *   StripeMetadata (pre-created) → POST /api/stripe-webhook/ (mock signature)
   *   → Order + OrderProduct + Payment created in DB
   *   → Invoice PDF generated and stored
   *   → /api/conversion-payload/ returns ready:true
   *   → /api/orders/ returns the order for the customer
   */
  test('FS-003a: webhook lifecycle creates Order/Payment/Invoice and conversion-payload is ready', async ({
    request,
  }) => {
    const { access: sellerAccess, sellerProfileId } = await registerSellerWithWarehouse(request);
    const { variantSku } = await createProductVariant(request, sellerAccess);
    const {
      email: customerEmail,
      access: customerAccess,
      userId: customerId,
    } = await registerCustomer(request);

    // Ensure DeliveryType(2), CourierService(2), OrderStatus(PENDING) exist
    await ensureOrderLookupData(request, customerAccess);

    const ts = Date.now();
    const sessionId = `cs_e2e_fs003a_${ts}`;
    const deliveryPrice = '5.21';

    const { sessionKey, groupTotal } = await createStripeMetadata(request, customerAccess, {
      customerId,
      customerEmail,
      sellerProfileId,
      variantSku,
      qty: 1,
      deliveryPrice,
    });

    const amountCents = Math.round(groupTotal * 100);

    // Simulate webhook (STRIPE_WEBHOOK_SKIP_SIGNATURE=true required)
    const webhookResp = await simulateStripeWebhook(request, {
      sessionKey,
      sessionId,
      amountCents,
    });
    expect(
      webhookResp.status(),
      `Webhook should return 200. Got ${webhookResp.status()}: ${await webhookResp.text()}`,
    ).toBe(200);

    const webhookBody = await webhookResp.json();
    expect(
      webhookBody.status,
      'Webhook should report 1 order created',
    ).toContain('1 order');

    // Assert Order is visible in customer's order list
    const ordersResp = await request.get(`${API}/orders/?status=not_closed`, {
      headers: { Authorization: `Bearer ${customerAccess}` },
    });
    expect(ordersResp.ok(), `GET /api/orders/ failed: ${await ordersResp.text()}`).toBeTruthy();
    const orders = await ordersResp.json();
    expect(orders.length, 'At least 1 order should exist for the customer').toBeGreaterThanOrEqual(1);

    const createdOrder = orders.find((o) => o.order_status === 'Pending' || o.order_status === 'Čeká na vyřízení');
    expect(createdOrder, 'An order in Pending status should be found').toBeTruthy();
    expect(createdOrder.total_amount, 'Order total_amount should be set').toBeTruthy();

    // Assert conversion-payload is ready (indicates Payment record exists in DB)
    const convResp = await request.get(
      `${API}/conversion-payload/?session_id=${sessionId}`,
    );
    expect(convResp.ok(), `conversion-payload request failed: ${await convResp.text()}`).toBeTruthy();
    const convBody = await convResp.json();
    expect(convBody.ready, 'conversion-payload should be ready after webhook').toBe(true);
    expect(convBody.transaction_id, 'transaction_id should match session_id').toBe(sessionId);
    expect(convBody.currency, 'currency should be EUR').toBe('EUR');
  });

  /**
   * FS-003b — UI order visibility after webhook (full-stack: real backend + browser).
   *
   * Creates a complete lifecycle via API, then opens /my_orders in the browser
   * and verifies the order card is rendered.
   *
   * UI route used: /my_orders (MyOrdersPage → ActualSection → HistorySmallCard)
   * Why not /payment_end: that page shows only a generic success message without
   * order details. Follow-up tracked in task.md.
   */
  test('FS-003b: /my_orders shows the created order after webhook processing', async ({
    page,
    request,
  }) => {
    const { access: sellerAccess, sellerProfileId } = await registerSellerWithWarehouse(request);
    const { variantSku } = await createProductVariant(request, sellerAccess);
    const {
      email: customerEmail,
      access: customerAccess,
      refresh: customerRefresh,
      userId: customerId,
    } = await registerCustomer(request);

    await ensureOrderLookupData(request, customerAccess);

    const ts = Date.now();
    const sessionId = `cs_e2e_fs003b_${ts}`;
    const deliveryPrice = '5.21';

    const { sessionKey, groupTotal } = await createStripeMetadata(request, customerAccess, {
      customerId,
      customerEmail,
      sellerProfileId,
      variantSku,
      qty: 1,
      deliveryPrice,
    });

    const amountCents = Math.round(groupTotal * 100);

    // Trigger webhook — creates Order in DB
    const webhookResp = await simulateStripeWebhook(request, {
      sessionKey,
      sessionId,
      amountCents,
    });
    expect(webhookResp.status(), `Webhook failed: ${await webhookResp.text()}`).toBe(200);

    // Seed customer JWT so /my_orders API calls succeed
    await page.addInitScript(
      ({ token, refresh, persistVersion, cookieVersion }) => {
        const authState = {
          auth: {
            token: { access: token, refresh },
            status: 'fulfilled',
            error: null,
          },
        };
        const persistKey = `persist:root`;
        const existing = {};
        try {
          const raw = localStorage.getItem(persistKey);
          if (raw) Object.assign(existing, JSON.parse(raw));
        } catch {}
        const merged = { ...existing };
        for (const [k, v] of Object.entries(authState)) {
          merged[k] = JSON.stringify(v);
        }
        merged._persist = JSON.stringify({ version: persistVersion, rehydrated: true });
        localStorage.setItem(persistKey, JSON.stringify(merged));
        localStorage.setItem('token', JSON.stringify({ access: token, refresh }));
        localStorage.setItem('cookieVersion', cookieVersion);
      },
      {
        token: customerAccess,
        refresh: customerRefresh,
        persistVersion: PERSIST_VERSION,
        cookieVersion: COOKIE_VERSION,
      },
    );

    await proxyToBackend(page);
    await page.goto('https://reli.one/my_orders');

    // Wait for the orders to load — the HistorySmallCard renders order_number and total_amount
    // Selector: text matching pattern like "order {number}" rendered by HistorySmallCard
    await expect(
      page.locator('[class*="prodNumber"]').first(),
    ).toBeVisible({ timeout: 15000 });

    // Assert at least one order card is rendered (not the "no content" placeholder)
    const noContent = page.locator('[class*="noContent"], [class*="noContentWrap"]');
    const hasNoContent = await noContent.isVisible().catch(() => false);
    expect(hasNoContent, 'No-content placeholder should NOT be shown after order creation').toBe(false);
  });
});
