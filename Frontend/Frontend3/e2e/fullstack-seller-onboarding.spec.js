/**
 * FS-001 — Full-stack seller onboarding E2E
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
 * - page.route() proxy → intercepts /api/* from preview, forwards to backend (CORS-safe)
 * - localStorage seeding → JWT token set before page.goto() via addInitScript
 *
 * Related docs:
 *   docs/tasks/015-full-stack-e2e-design/task.md  (FS-001)
 *   docs/testing/e2e-local-contour.md
 *   FE-021 Iteration 0
 */

import { test, expect } from '@playwright/test';

import {
  blockThirdPartyScripts,
  gotoSellerPage,
  proxyToBackend,
  seedAuthToken,
} from './helpers.js';

const BACKEND_URL = process.env.FULLSTACK_BACKEND_URL ?? 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Minimal valid PDF bytes — mirrors backend test _minimal_pdf()
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj ' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj ' +
  '3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj ' +
  'trailer<</Size 4/Root 1 0 R>>\n%%EOF',
);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function registerSellerUser(request) {
  const ts = Date.now();
  const email = `fs001-${ts}@test.example`;
  const phone = `+420730${String(ts % 1_000_000).padStart(6, '0')}`;

  const reg = await request.post(`${API}/accounts/register/seller/`, {
    data: {
      first_name: 'Fullstack',
      last_name: 'Test',
      email,
      phone_number: phone,
      password: 'Passw0rd!',
      confirm_password: 'Passw0rd!',
    },
  });
  if (!reg.ok()) {
    throw new Error(`Seller registration failed ${reg.status()}: ${await reg.text()}`);
  }

  const loginResp = await request.post(`${API}/accounts/login/`, {
    data: { email, password: 'Passw0rd!' },
  });
  if (!loginResp.ok()) {
    throw new Error(`Login failed ${loginResp.status()}: ${await loginResp.text()}`);
  }

  const { access, refresh } = await loginResp.json();
  return { email, access, refresh };
}

async function completeOnboardingViaApi(request, accessToken) {
  const h = { Authorization: `Bearer ${accessToken}` };
  const base = `${API}/sellers`;

  const r0 = await request.post(`${base}/onboarding/seller-type/`, {
    headers: h,
    data: { seller_type: 'self_employed' },
  });
  expect(r0.ok(), `seller-type: ${await r0.text()}`).toBeTruthy();

  const r1 = await request.put(`${base}/onboarding/self-employed/personal/`, {
    headers: h,
    data: { date_of_birth: '1990-01-15', nationality: 'CZ', personal_phone: '+420601000001' },
  });
  expect(r1.ok(), `personal: ${await r1.text()}`).toBeTruthy();

  const r2 = await request.put(`${base}/onboarding/self-employed/tax/`, {
    headers: h,
    data: { tax_country: 'CZ', tin: 'TIN123456' },
  });
  expect(r2.ok(), `tax: ${await r2.text()}`).toBeTruthy();

  const r3 = await request.put(`${base}/onboarding/self-employed/address/`, {
    headers: h,
    data: { street: 'Main 1', city: 'Praha', zip_code: '12000', country: 'CZ' },
  });
  expect(r3.ok(), `address: ${await r3.text()}`).toBeTruthy();

  const r4 = await request.put(`${base}/onboarding/bank/`, {
    headers: h,
    data: {
      iban: 'CZ94550000000005003011074',
      swift_bic: 'RZBCCZPP',
      account_holder: 'Fullstack Test',
    },
  });
  expect(r4.ok(), `bank: ${await r4.text()}`).toBeTruthy();

  const r5 = await request.put(`${base}/onboarding/warehouse/`, {
    headers: h,
    data: {
      street: 'Wh 2',
      city: 'Brno',
      zip_code: '60200',
      country: 'CZ',
      contact_phone: '+420602000002',
    },
  });
  expect(r5.ok(), `warehouse: ${await r5.text()}`).toBeTruthy();

  const r6 = await request.put(`${base}/onboarding/return/`, {
    headers: h,
    data: { same_as_warehouse: true },
  });
  expect(r6.ok(), `return: ${await r6.text()}`).toBeTruthy();

  for (const [doc_type, scope, name] of [
    ['identity_document', 'self_employed_personal', 'id.pdf'],
    ['proof_of_address', 'self_employed_address', 'addr.pdf'],
    ['proof_of_address', 'warehouse_address', 'wh.pdf'],
  ]) {
    const rd = await request.post(`${base}/onboarding/documents/`, {
      headers: h,
      multipart: {
        doc_type,
        scope,
        file: { name, mimeType: 'application/pdf', buffer: MINIMAL_PDF },
      },
    });
    expect(rd.status(), `doc [${scope}]: ${await rd.text()}`).toBe(201);
  }
}

async function setupFullstackPage(page) {
  await blockThirdPartyScripts(page);
  await proxyToBackend(page, API);
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('FS-001 — Full-stack seller onboarding', () => {
  test.beforeEach(async ({ request }) => {
    const up = await request.get(`${BACKEND_URL}/health/`).catch(() => null);
    test.skip(
      !up || !up.ok(),
      `Backend not available at ${BACKEND_URL} — run: docker compose -f docker-compose.e2e.yml up --build`,
    );
  });

  test('FS-001a: full onboarding API chain submits pending_verification', async ({ request }) => {
    const { access } = await registerSellerUser(request);
    await completeOnboardingViaApi(request, access);

    const stateResp = await request.get(`${API}/sellers/onboarding/state/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    expect(stateResp.ok()).toBeTruthy();
    const state = await stateResp.json();
    expect(state.completeness.is_submittable).toBe(true);
    expect(state.can_submit).toBe(true);

    const subResp = await request.post(`${API}/sellers/onboarding/submit/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    expect(subResp.ok()).toBeTruthy();
    const sub = await subResp.json();
    expect(sub.status).toBe('pending_verification');
    expect(sub.submitted_at).not.toBeNull();
  });

  test('FS-001b: application-sub page shows pending_verification from real backend', async ({
    page,
    request,
  }) => {
    const { access, refresh } = await registerSellerUser(request);
    await completeOnboardingViaApi(request, access);

    const subResp = await request.post(`${API}/sellers/onboarding/submit/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    expect(subResp.ok()).toBeTruthy();

    await setupFullstackPage(page);
    await seedAuthToken(page, { access, refresh });

    await gotoSellerPage(page, '/seller/application-sub');

    await expect(page.getByText('Your application has been submitted')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Pending Verification')).toBeVisible({ timeout: 10_000 });

    const checkResp = await request.get(`${API}/sellers/onboarding/state/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    const check = await checkResp.json();
    expect(check.status).toBe('pending_verification');
    expect(check.is_editable).toBe(false);
  });

  test('FS-001c: seller-type selection via UI updates backend state', async ({
    page,
    request,
  }) => {
    const { access, refresh } = await registerSellerUser(request);

    await setupFullstackPage(page);
    await seedAuthToken(page, { access, refresh });

    await gotoSellerPage(page, '/seller/seller-type');

    await expect(page.getByText('Choose your seller type')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Self-employed / sole proprietor').click();

    const continueBtn = page.getByRole('button', { name: /continue/i });
    await expect(continueBtn).toBeVisible({ timeout: 5_000 });
    await continueBtn.click();

    await page.waitForURL('**/seller/seller-info', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/seller\/seller-info/);

    const stateResp = await request.get(`${API}/sellers/onboarding/state/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    const state = await stateResp.json();
    expect(state.seller_type).toBe('self_employed');
  });
});
