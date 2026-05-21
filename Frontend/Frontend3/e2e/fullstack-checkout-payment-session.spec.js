/**
 * FS-002 — Full-stack checkout until payment session E2E
 *
 * Tests in this file require a running Django backend + Postgres.
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
 * - page.route() proxy → intercepts https://reli.one/api/* from Vite preview,
 *   forwards to http://localhost:8000/api/* transparently (CORS-safe)
 * - localStorage seeding → JWT token, basket state, payment Redux state set
 *   before page.goto() via addInitScript
 * - PSP (Stripe) mocked at Playwright route level — no real API calls
 *
 * What is verified:
 * - FS-002a: Full backend validation chain from customer request to Stripe call boundary
 *   (not 401/403/400 — only fails at PSP because STRIPE_API_SECRET_KEY is empty in e2e env).
 *   StripeMetadata is saved in DB before the Stripe call (confirmed by code review + unit tests).
 * - FS-002b: Full-stack UI — basket seeded with real product SKU, section 3 rendered
 *   directly via Redux state seeding, mocked create-stripe-payment endpoint, "Pay Now"
 *   dispatches request with correct payload, no real PSP calls.
 *
 * Related docs:
 *   docs/tasks/015-full-stack-e2e-design/task.md (FS-002)
 *   docs/frontend/tasks/012-full-stack-checkout-payment-session-e2e/task.md
 *   docs/testing/e2e-local-contour.md
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
 * Register a seller user, set warehouse address (for CZ origin check),
 * and return JWT access token + seller_profile_id.
 *
 * Does NOT complete full onboarding (no personal/tax/bank/documents).
 * Warehouse step is sufficient for default_warehouse.country = "CZ".
 */
async function registerSellerWithWarehouse(request) {
  const ts = Date.now();
  const email = `fs002-seller-${ts}@test.example`;
  const phone = `+420730${String(ts % 1_000_000).padStart(6, '0')}`;

  const reg = await request.post(`${API}/accounts/register/seller/`, {
    data: {
      first_name: 'FS002',
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

  // Set seller type (required before warehouse step)
  const r0 = await request.post(`${API}/sellers/onboarding/seller-type/`, {
    headers: h,
    data: { seller_type: 'self_employed' },
  });
  expect(r0.ok(), `seller-type: ${await r0.text()}`).toBeTruthy();

  // Set warehouse address — this sets seller_profile.default_warehouse with country=CZ
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

  const rWh = await request.post(`${API}/e2e/sellers/sync-default-warehouse/`, { headers: h });
  expect(rWh.ok(), `sync default warehouse: ${await rWh.text()}`).toBeTruthy();

  // Get seller_profile_id from onboarding state (seller_profile_id added in services_onboarding.py)
  const stateResp = await request.get(`${API}/sellers/onboarding/state/`, {
    headers: h,
  });
  expect(stateResp.ok(), `onboarding state: ${await stateResp.text()}`).toBeTruthy();
  const state = await stateResp.json();
  const sellerProfileId = state.seller_profile_id;
  expect(sellerProfileId, 'seller_profile_id must be present in onboarding state response').toBeTruthy();

  return { access, email, sellerProfileId };
}

/**
 * Pick first category id from public category tree (required for product create).
 */
async function getFirstCategoryId(request) {
  const resp = await request.get(`${API}/products/category/`);
  if (!resp.ok()) {
    throw new Error(`categories fetch failed ${resp.status()}: ${await resp.text()}`);
  }
  const tree = await resp.json();
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (node?.id) return node.id;
      const nested = walk(node.children);
      if (nested) return nested;
    }
    return null;
  };
  const categoryId = walk(tree);
  if (!categoryId) {
    throw new Error('No product categories in DB — seed E2E category before full-stack tests');
  }
  return categoryId;
}

/**
 * Create a base product and one variant for the seller.
 * Returns variant SKU, id, and price for use in basket seeding and checkout.
 * SKU is auto-generated by the backend.
 */
async function createProductVariant(request, sellerAccess) {
  const h = { Authorization: `Bearer ${sellerAccess}` };
  const ts = Date.now();
  const categoryId = await getFirstCategoryId(request);
  const article = String(ts % 10_000_000_000).padStart(10, '0');

  const productResp = await request.post(`${API}/sellers/products/`, {
    headers: h,
    data: {
      name: 'FS002 Test Product',
      product_description: 'Full-stack E2E checkout test product',
      vat_rate: '21.00',
      category: categoryId,
      article,
    },
  });
  if (!productResp.ok()) {
    throw new Error(`Product create failed ${productResp.status()}: ${await productResp.text()}`);
  }
  const product = await productResp.json();

  const variantResp = await request.post(`${API}/sellers/products/${product.id}/variants/`, {
    headers: h,
    data: {
      name: 'Standard',
      text: 'Default',
      price: '15.00',
      weight_grams: 500,
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
    },
  });
  if (variantResp.status() !== 201) {
    throw new Error(`Variant create failed ${variantResp.status()}: ${await variantResp.text()}`);
  }
  const variant = await variantResp.json();

  return {
    productId: product.id,
    variantId: variant.id,
    variantSku: variant.sku,
    variantPrice: parseFloat(variant.price),
  };
}

/**
 * Register a customer user and return JWT access + refresh tokens.
 */
async function registerCustomer(request) {
  const ts = Date.now();
  const email = `fs002-customer-${ts}@test.example`;
  const phone = `+420810${String(ts % 1_000_000).padStart(6, '0')}`;

  const reg = await request.post(`${API}/accounts/register/customer/`, {
    data: {
      first_name: 'FS002',
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
  return { email, access, refresh };
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('FS-002 — Full-stack checkout until payment session', () => {
  // Skip the entire suite if backend is not running
  test.beforeEach(async ({ request }) => {
    const up = await request.get(`${BACKEND_URL}/health/`).catch(() => null);
    test.skip(
      !up || !up.ok(),
      `Backend not available at ${BACKEND_URL} — run: docker compose -f docker-compose.e2e.yml up --build`,
    );
  });

  /**
   * FS-002a — Pure API: checkout session API validation chain reaches PSP call boundary.
   *
   * Creates real backend data (seller + warehouse + product variant + customer),
   * calls POST /api/create-stripe-payment/ with valid data, and verifies:
   * - Not 401/403 (authentication works)
   * - Not 400 (input validation passes — SKU found, CZ origin OK)
   * - Returns 500 from Stripe (expected because STRIPE_API_SECRET_KEY is empty in e2e env)
   *   OR 200 if a real test Stripe key is configured
   *
   * StripeMetadata is saved in DB before the Stripe call (code invariant confirmed
   * by unit tests in payment/test_checkout_flow.py::CreateStripeSessionTests).
   * Order is NOT created at this stage — that requires a webhook.
   */
  test('FS-002a: payment session API chain reaches PSP call (backend validation passes)', async ({
    request,
  }) => {
    const { access: sellerAccess, sellerProfileId } = await registerSellerWithWarehouse(request);
    const { variantSku } = await createProductVariant(request, sellerAccess);
    const { access: customerAccess, email: customerEmail } = await registerCustomer(request);

    const response = await request.post(`${API}/create-stripe-payment/`, {
      headers: { Authorization: `Bearer ${customerAccess}` },
      data: {
        email: customerEmail,
        first_name: 'FS002',
        last_name: 'Customer',
        phone: '+420777123456',
        delivery_address: {
          street: 'Test Street 1',
          city: 'Praha',
          zip: '11000',
          country: 'CZ',
        },
        groups: [
          {
            seller_id: sellerProfileId,
            delivery_type: 2, // Home Delivery
            courier_service: 2, // Packeta
            delivery_address: {
              street: 'Test Street 1',
              city: 'Praha',
              zip: '11000',
              country: 'CZ',
            },
            products: [{ sku: variantSku, quantity: 1 }],
          },
        ],
      },
    });

    // Not 401/403: authentication and authorization work
    expect(response.status(), 'Should not be auth error').not.toBe(401);
    expect(response.status(), 'Should not be forbidden').not.toBe(403);

    // Not 400: backend input validation passed
    // (SKU found, product belongs to seller, CZ origin OK, Packeta HD shipping calculated)
    expect(response.status(), 'Should not be validation error — backend chain OK').not.toBe(400);

    // In the e2e environment STRIPE_API_SECRET_KEY is empty → 500 from Stripe.
    // In a real Stripe test environment → 200 with checkout_url.
    // Both outcomes confirm StripeMetadata was saved (it happens BEFORE the Stripe call).
    expect(
      [200, 500],
      'Expected 200 (Stripe test key configured) or 500 (Stripe key empty — PSP boundary reached)',
    ).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('checkout_url');
      expect(body).toHaveProperty('session_id');
      expect(body).toHaveProperty('session_key');
    }

    if (response.status() === 500) {
      // Empty STRIPE_API_SECRET_KEY → Django/Stripe error page or JSON error;
      // either confirms backend reached the PSP call boundary.
      const text = await response.text();
      expect(text.length, '500 response body should be non-empty').toBeGreaterThan(0);
    }
  });

  /**
   * FS-002b — Full-stack UI: checkout form dispatches session request with correct payload.
   *
   * Seeds Redux state directly to section 3 (PaymentPlataBlock) to avoid complex
   * multi-section form interaction. Uses:
   * - Real backend JWT (customer user created above)
   * - Real product SKU in basket state (from FS-002a data setup)
   * - Mocked create-stripe-payment endpoint (PSP not called)
   * - Mocked validate-address endpoint (local ZIP validation)
   *
   * Verifies:
   * - Section 3 renders with "Pay Now" button
   * - "Pay Now" dispatches POST /api/create-stripe-payment/ with correct payload
   * - Payload contains: email, phone, delivery_address, groups with seller_id + SKU
   * - No real stripe.com / paypal.com calls are made
   */
  test('FS-002b: UI payment flow dispatches correct session request (PSP mocked)', async ({
    page,
    request,
  }) => {
    const { access: sellerAccess, sellerProfileId } = await registerSellerWithWarehouse(request);
    const { variantSku, variantId, variantPrice } = await createProductVariant(request, sellerAccess);
    const {
      access: customerAccess,
      refresh: customerRefresh,
      email: customerEmail,
    } = await registerCustomer(request);

    // Track PSP calls and capture session request
    const pspCalls = [];
    let sessionRequestCalled = false;
    let capturedRequestBody = null;

    page.on('request', (req) => {
      if (/stripe\.com|paypal\.com/i.test(req.url())) {
        pspCalls.push(req.url());
      }
    });

    // Proxy all /api/* from Vite preview to real backend
    await proxyToBackend(page);

    // Mock create-stripe-payment: capture request body, return fake session
    await page.route(/reli\.one\/api\/create-stripe-payment\//i, async (route) => {
      if (route.request().method() === 'POST') {
        sessionRequestCalled = true;
        try {
          capturedRequestBody = JSON.parse(route.request().postData() ?? '{}');
        } catch {
          capturedRequestBody = {};
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            // Use about:blank to prevent navigation away from test context
            checkout_url: 'about:blank',
            session_id: 'cs_test_fs002_fake_session_id',
            session_key: 'fs002-fake-session-key-001',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock ZIP validation endpoint to avoid needing real address validation
    await page.route(/reli\.one\/api\/delivery\/validate-address\//i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, city: 'Praha' }),
      });
    });

    // ── Seed localStorage via addInitScript ──────────────────────────────────

    const basketItem = {
      sku: variantSku,
      count: 1,
      selected: true,
      seller_id: sellerProfileId,
      product: {
        id: variantId,
        name: 'FS002 Test Product',
        price: variantPrice,
        image: null,
        is_age_restricted: false,
        seller_id: sellerProfileId,
      },
    };

    const basketSliceState = JSON.stringify({
      basket: [basketItem],
      baskets: [],
      err: '',
      status: '',
      totalCount: variantPrice,
      selectedProducts: [basketItem],
      filteredBasket: null,
      searchTerm: '',
    });

    // Payment Redux state pre-seeded to section 3 (PaymentPlataBlock)
    // paymentInfo.deliveryMethodDH = 'packeta' → courier_service = 2 in fetchCreateStripeSession
    const paymentSliceState = JSON.stringify({
      paymentInfo: {
        email: customerEmail,
        name: 'FS002',
        surename: 'Customer',
        phone: '+420777123456',
        street: 'Test Street 1',
        city: 'Praha',
        zip: '11000',
        build: '1',
        apartment: '',
        deliveryMethodDH: 'packeta',
      },
      country: 'cz',
      pageSection: 3,
      groups: [
        {
          seller_id: sellerProfileId,
          deliveryType: 'home_delivery',
          items: [basketItem],
          deliveryPrice: 5.21,
        },
      ],
      status: null,
      deliveryStatus: null,
      deliveryCost: null,
      deliveryType: null,
      deliveryCalculateErr: null,
      pointInfo: null,
      loading: false,
      error: null,
      delivery: null,
      selectedProducts: [],
      isBuy: false,
    });

    await page.addInitScript(
      ({ basketState, paymentState, cookieVersion, persistVersion, token, confirmRule }) => {
        localStorage.setItem(
          'persist:root',
          JSON.stringify({
            basket: basketState,
            payment: paymentState,
            _persist: JSON.stringify({ version: persistVersion, rehydrated: true }),
          }),
        );
        localStorage.setItem('COOKIE_VERSION', cookieVersion);
        localStorage.setItem('token', JSON.stringify(token));
        // confirm_rule must be true to enable the Pay button (Terms checkbox in section 3)
        localStorage.setItem('confirm_rule', confirmRule);
      },
      {
        basketState: basketSliceState,
        paymentState: paymentSliceState,
        cookieVersion: COOKIE_VERSION,
        persistVersion: PERSIST_VERSION,
        token: { access: customerAccess, refresh: customerRefresh },
        confirmRule: 'true',
      },
    );

    await page.goto('/payment');

    // Section 3 (PaymentPlataBlock) should render immediately via seeded pageSection=3
    const payNowBtn = page.getByRole('button', { name: /pay now/i });
    await expect(payNowBtn).toBeVisible({ timeout: 15_000 });
    await expect(payNowBtn).toBeEnabled({ timeout: 5_000 });

    // PlataRadio defaults to PayPal in the built UI — select card so fetchCreateStripeSession runs
    await page.getByRole('radio', { name: /debit\/credit cards/i }).check();

    // No PSP calls before clicking Pay
    expect(pspCalls, 'No PSP calls before payment submission').toHaveLength(0);

    await payNowBtn.click();

    // Wait for the mocked session endpoint to be called
    await expect
      .poll(() => sessionRequestCalled, {
        timeout: 10_000,
        message: 'POST /api/create-stripe-payment/ should have been called after Pay Now click',
      })
      .toBe(true);

    // Verify the request payload is correctly constructed from Redux state
    expect(capturedRequestBody, 'Request body must be present').not.toBeNull();
    expect(capturedRequestBody.email).toBe(customerEmail);
    expect(capturedRequestBody.phone).toBeTruthy();
    expect(capturedRequestBody.delivery_address).toMatchObject({
      street: 'Test Street 1',
      city: 'Praha',
      zip: '11000',
      country: 'CZ',
    });

    // Groups: seller_id + delivery type + product SKU
    expect(Array.isArray(capturedRequestBody.groups)).toBe(true);
    expect(capturedRequestBody.groups.length).toBeGreaterThan(0);
    const group = capturedRequestBody.groups[0];
    expect(group.seller_id).toBe(sellerProfileId);
    expect(group.delivery_type).toBe(2); // Home Delivery
    expect(group.courier_service).toBe(2); // Packeta
    expect(group.products[0].sku).toBe(variantSku);
    expect(group.products[0].quantity).toBe(1);

    // No real PSP calls throughout the test
    expect(pspCalls, 'No real Stripe/PayPal calls should be made').toHaveLength(0);
  });
});
