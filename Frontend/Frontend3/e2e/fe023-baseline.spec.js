/**
 * FE-023 Iteration 0 — Baseline screenshots & field contract snapshot.
 *
 * Requires:
 *   docker compose -f docker-compose.e2e.yml up --build
 *   npm run build && npm run test:e2e -- e2e/fe023-baseline.spec.js
 *
 * Output: screenshots/ — company data step, review step.
 */

import { test, expect } from '@playwright/test';
import { blockThirdPartyScripts, proxyToBackend, seedAuthToken } from './helpers.js';

const BACKEND_URL = process.env.FULLSTACK_BACKEND_URL ?? 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj ' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj ' +
  '3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj ' +
  'trailer<</Size 4/Root 1 0 R>>\n%%EOF',
);

async function registerCompanySeller(request) {
  const ts = Date.now();
  const email = `fe023-${ts}@test.example`;
  const phone = `+420730${String(ts % 1_000_000).padStart(6, '0')}`;

  const reg = await request.post(`${API}/accounts/register/seller/`, {
    data: {
      first_name: 'FE023',
      last_name: 'Baseline',
      email,
      phone_number: phone,
      password: 'Passw0rd!',
      confirm_password: 'Passw0rd!',
    },
  });
  if (!reg.ok()) throw new Error(`Register failed ${reg.status()}: ${await reg.text()}`);

  const login = await request.post(`${API}/accounts/login/`, {
    data: { email, password: 'Passw0rd!' },
  });
  if (!login.ok()) throw new Error(`Login failed ${login.status()}: ${await login.text()}`);

  const { access, refresh } = await login.json();

  // Set seller type to company
  const r0 = await request.post(`${API}/sellers/onboarding/seller-type/`, {
    headers: { Authorization: `Bearer ${access}` },
    data: { seller_type: 'company' },
  });
  if (!r0.ok()) throw new Error(`seller-type failed ${r0.status()}: ${await r0.text()}`);

  return { email, access, refresh };
}

test.describe('FE-023 — Baseline screenshots', () => {
  test.beforeEach(async ({ request }) => {
    const up = await request.get(`${BACKEND_URL}/health/`).catch(() => null);
    test.skip(!up || !up.ok(), `Backend not available at ${BACKEND_URL}`);
  });

  test('fe023-0a: screenshot of /seller/seller-company (company data step)', async ({
    page,
    request,
  }) => {
    const { access, refresh } = await registerCompanySeller(request);

    await blockThirdPartyScripts(page);
    await proxyToBackend(page, API);
    await seedAuthToken(page, { access, refresh });

    await page.goto('/seller/seller-company', { waitUntil: 'domcontentloaded' });

    // Wait for form to render
    await expect(page.locator('#root')).toBeAttached({ timeout: 15_000 });
    await page.waitForTimeout(1_000);

    await page.screenshot({
      path: 'e2e/screenshots/fe023-company-data-step.png',
      fullPage: true,
    });

    // Field contract presence check — record what's visible
    const fields = {
      company_name: await page.locator('[name="company_name"]').isVisible(),
      business_id: await page.locator('[name="business_id"]').isVisible(),
      tin: await page.locator('[name="tin"]').isVisible(),
      eori_number: await page.locator('[name="eori_number"]').isVisible(),
      company_phone: await page.locator('[name="company_phone"]').isVisible(),
      first_name: await page.locator('[name="first_name"]').isVisible(),
      last_name: await page.locator('[name="last_name"]').isVisible(),
      date_of_birth: await page.locator('[name="date_of_birth"]').isVisible(),
      iban: await page.locator('[name="iban"]').isVisible(),
      swift_bic: await page.locator('[name="swift_bic"]').isVisible(),
      account_holder: await page.locator('[name="account_holder"]').isVisible(),
      bank_code: await page.locator('[name="bank_code"]').isVisible(),
      local_account_number: await page.locator('[name="local_account_number"]').isVisible(),
      contact_phone: await page.locator('[name="contact_phone"]').isVisible(),
      rContact_phone: await page.locator('[name="rContact_phone"]').isVisible(),
    };

    console.log('FE-023 field visibility baseline:', JSON.stringify(fields, null, 2));

    // Submit button state
    const submitBtn = page.getByRole('button', { name: /continue to review/i });
    const isDisabled = await submitBtn.isDisabled();
    console.log('FE-023 submit button disabled on empty form:', isDisabled);
  });

  test('fe023-0b: company form — section titles visible', async ({ page, request }) => {
    const { access, refresh } = await registerCompanySeller(request);

    await blockThirdPartyScripts(page);
    await proxyToBackend(page, API);
    await seedAuthToken(page, { access, refresh });

    await page.goto('/seller/seller-company', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    // Verify all 6 section cards are present
    const sections = [
      'Company information',
      'Representative',
      'Business address',
      'Bank account',
      'Warehouse address',
      'Return address',
    ];

    for (const section of sections) {
      const el = page.getByText(section, { exact: false });
      const visible = await el.first().isVisible();
      console.log(`Section "${section}" visible: ${visible}`);
    }

    // Step indicator
    const stepText = page.getByText(/step 4 of 6/i);
    const stepVisible = await stepText.isVisible();
    console.log('Step 4 of 6 indicator visible:', stepVisible);

    await page.screenshot({
      path: 'e2e/screenshots/fe023-company-sections.png',
      fullPage: false,
    });
  });
});
