/**
 * Захват скриншотов для инструкции «покупатель → продавец».
 * Запуск: npm run docs:seller-screenshots
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALE_CONFIGS, parseCaptureLocales } from './capture-seller-docs-labels.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, '../../../docs/seller-buyer-mismatch');
const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:5173';

const FAKE_TOKEN = {
  access: 'screenshot-docs-access-token',
  refresh: 'screenshot-docs-refresh-token',
};

const MOCK_ARES_LOOKUP = {
  found: true,
  ico: '25596641',
  business_id: '25596641',
  company_name: 'Example s.r.o.',
  registry_name: 'Example s.r.o.',
  legal_form_code: '112',
  legal_form: 's.r.o. (Czech Republic / Slovakia)',
  dic_hint: 'CZ25596641',
  dic_hint_source: 'ares',
  is_active: true,
  registered_address: {
    street: 'Václavské náměstí 1',
    city: 'Praha',
    zip_code: '11000',
    country: 'CZ',
  },
  representatives: [
    {
      first_name: 'Jan',
      last_name: 'Novák',
      role_hint: 'jednatel',
      birth_date_hint: '1980-01-15',
      nationality_hint: 'cz',
    },
  ],
};

function withAresLookupMock(handler) {
  return async (route) => {
    if (/ares-lookup/.test(route.request().url())) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ARES_LOOKUP),
      });
    }
    return handler(route);
  };
}

async function blockThirdParty(page) {
  await page.route(
    /googletagmanager|googlesyndication|google-analytics|connect\.facebook|widget\.packeta|fonts\.googleapis|fonts\.gstatic/,
    (route) => route.abort(),
  );
}

const EMPTY_ONBOARDING_GET = {
  '/sellers/onboarding/self-employed/personal/': {
    date_of_birth: null,
    nationality: '',
    personal_phone: '+420123456789',
    first_name: 'Jan',
    last_name: 'Novák',
  },
  '/sellers/onboarding/self-employed/tax/': {
    tax_country: '',
    tin: '',
    business_id: '',
    vat_id: '',
  },
  '/sellers/onboarding/self-employed/address/': {
    street: '',
    city: '',
    zip_code: '',
    country: '',
    proof_document_issue_date: null,
  },
  '/sellers/onboarding/bank/': {
    iban: '',
    swift_bic: '',
    account_holder: '',
    bank_code: '',
    local_account_number: '',
  },
  '/sellers/onboarding/warehouse/': {
    street: '',
    city: '',
    zip_code: '',
    country: '',
    contact_phone: '',
    same_as_primary_address: false,
  },
  '/sellers/onboarding/return/': {
    street: '',
    city: '',
    zip_code: '',
    country: '',
    contact_phone: '',
    same_as_warehouse: false,
  },
  '/sellers/onboarding/documents/': [],
  '/sellers/onboarding/company/info/': {
    company_name: '',
    legal_form: '',
    country_of_registration: '',
    business_id: '',
    tin: '',
    eori_number: '',
    company_phone: '',
  },
  '/sellers/onboarding/company/representative/': {
    first_name: '',
    last_name: '',
    role: '',
    date_of_birth: null,
    nationality: '',
  },
  '/sellers/onboarding/company/address/': {
    street: '',
    city: '',
    zip_code: '',
    country: '',
    proof_document_issue_date: null,
  },
};

function fulfillOnboardingGet(url) {
  for (const [path, body] of Object.entries(EMPTY_ONBOARDING_GET)) {
    if (url.includes(path)) {
      return body;
    }
  }
  return {};
}

function onboardingRoute(state, review) {
  return async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (state && /\/sellers\/onboarding\/state\//.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state),
      });
    }
    if (review && /\/sellers\/onboarding\/review\//.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(review),
      });
    }
    if (method === 'GET' && /\/sellers\/onboarding\//.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fulfillOnboardingGet(url)),
      });
    }
    if (method === 'PUT' && /\/sellers\/onboarding\//.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
    return route.continue();
  };
}

function catalogRoute() {
  return async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (/\/product\/categories/.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Doors',
            slug: 'doors',
            children: [{ id: 2, name: 'Interior doors', slug: 'interior-doors', children: [] }],
          },
        ]),
      });
    }

    if (/\/sellers\/my-products/.test(url) && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            {
              id: 101,
              name: 'Metal entrance door Model 5',
              status: 'approved',
              category_name: 'Interior doors',
              min_price: '832.00',
              total_stock: 12,
              main_image: null,
            },
            {
              id: 102,
              name: 'Glass office door',
              status: 'pending',
              category_name: 'Interior doors',
              min_price: '1240.00',
              total_stock: 4,
              main_image: null,
            },
          ],
        }),
      });
    }

    if (/\/category-attribute-schema/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          category_id: 2,
          attributes: [
            {
              id: 1,
              code: 'door_width_mm',
              name: 'Width',
              data_type: 'integer',
              is_required: true,
              unit: 'mm',
              enum_options: [],
            },
            {
              id: 2,
              code: 'door_height_mm',
              name: 'Height',
              data_type: 'integer',
              is_required: true,
              unit: 'mm',
              enum_options: [],
            },
          ],
        }),
      });
    }

    return route.continue();
  };
}


function buildScrollTargets(l) {
  return {
    '00-account-type-modal': '[role="dialog"]',
    '08-company-ares-modal': '[data-testid="company-ares-entry-modal"]',
    '08a-company-ares-modal-loaded': '[data-testid="company-ares-entry-modal"]',
    '08-self-employed-ares-modal': '[data-testid="self-employed-ares-entry-modal"]',
    '08a-self-employed-ares-modal-loaded': '[data-testid="self-employed-ares-entry-modal"]',
    '09-company-ares-preview': '[data-testid="ares-preview"]',
    '09-self-employed-ares-preview': '[data-testid="self-employed-ares-preview"]',
    '04-seller-info': `text=${l.sellerInfo}`,
    '05-seller-review': `text=${l.reviewInfo}`,
  };
}

function createStorageInitScript({ includeAresDismissed = true, extraKeys = {} } = {}) {
  return ({ authToken, language, keys }) => {
    localStorage.setItem('i18nextLng', language);
    localStorage.setItem('cookieSave', JSON.stringify(true));
    localStorage.setItem('COOKIE_VERSION', '1');
    localStorage.setItem('token', JSON.stringify(authToken));
    localStorage.setItem('email', JSON.stringify('seller@example.com'));
    localStorage.setItem('first_name', JSON.stringify('Jan'));
    localStorage.setItem('last_name', JSON.stringify('Novák'));
    localStorage.setItem('phone', JSON.stringify('+420123456789'));
    if (keys.includeAresDismissed) {
      localStorage.setItem('seller_self_employed_ares_entry_assist_dismissed_v1', '1');
    }
    for (const [key, value] of Object.entries(keys.extraKeys)) {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    }
  };
}

async function shot(page, outDir, name, selector = null) {
  const file = path.join(outDir, `${name}.png`);
  if (selector) {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 15_000 });
    await el.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}


async function shotDoc01(page, outDir, scrollTargets, name) {
  const scrollTarget = scrollTargets[name];
  return shot(page, outDir, name, scrollTarget ?? null);
}

async function goto(page, pathSuffix) {
  await page.goto(`${BASE_URL}${pathSuffix}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
}

async function captureForLocale(localeKey) {
  const localeConfig = LOCALE_CONFIGS[localeKey];
  const { l } = localeConfig;
  const outDir = path.join(DOCS_ROOT, 'screenshots', localeConfig.outSubdir);
  const scrollTargets = buildScrollTargets(l);
  const storageInit = createStorageInitScript();

  await mkdir(outDir, { recursive: true });
  console.log(`\n=== Locale: ${localeKey} → ${outDir} ===`);

  const browser = await chromium.launch({ headless: true });
  const VIEWPORT = { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: localeConfig.browserLocale,
  });
  await context.addInitScript(storageInit, {
    authToken: FAKE_TOKEN,
    language: localeConfig.i18nextLng,
    keys: { includeAresDismissed: true, extraKeys: {} },
  });

  {
    const page = await context.newPage();
    await blockThirdParty(page);
    await goto(page, '/mob_login');
    await page.getByText(l.createAccount).first().click({ timeout: 10_000 });
    await page.getByText(l.buyerAccount).waitFor({ timeout: 10_000 });
    await shotDoc01(page, outDir, scrollTargets, '00-account-type-modal');
    await page.close();
  }

  {
    const page = await context.newPage();
    await blockThirdParty(page);
    await goto(page, '/seller/create-account');
    await page.getByText(l.sellerCreateTitle).waitFor({ timeout: 10_000 });
    await shotDoc01(page, outDir, scrollTargets, '01-seller-create-account');

    await goto(page, '/seller/create-verify');
    await page.getByText(l.verifyEmail).first().waitFor({ timeout: 10_000 });
    await shotDoc01(page, outDir, scrollTargets, '02-seller-create-verify');

    await page.route(/\/api\//, onboardingRoute({
      requires_onboarding: true,
      is_editable: true,
      next_step: 'seller_type',
      status: 'draft',
      seller_type: null,
    }));
    await page.evaluate(({ authToken, language }) => {
      localStorage.setItem('i18nextLng', language);
      localStorage.setItem('token', JSON.stringify(authToken));
      localStorage.setItem('seller_self_employed_ares_entry_assist_dismissed_v1', '1');
    }, { authToken: FAKE_TOKEN, language: localeConfig.i18nextLng });
    await goto(page, '/seller/seller-type');
    await page.getByText(l.chooseSellerType).waitFor({ timeout: 10_000 });
    await shotDoc01(page, outDir, scrollTargets, '03-seller-type');

    await page.unroute(/\/api\//);
    await page.route(/\/api\//, onboardingRoute({
      requires_onboarding: true,
      is_editable: true,
      next_step: 'personal',
      status: 'draft',
      seller_type: 'self_employed',
    }));
    await page.goto(`${BASE_URL}/seller/seller-info`, { waitUntil: 'load' });
    await page.waitForURL(/\/seller\/seller-info/, { timeout: 10_000 });
    await page.waitForTimeout(1500);
    await page.getByText(l.sellerInfo).first().waitFor({ timeout: 20_000 });
    await shotDoc01(page, outDir, scrollTargets, '04-seller-info');

    await page.unroute(/\/api\//);
    await page.route(/\/api\//, onboardingRoute(
      { requires_onboarding: true, is_editable: true, next_step: 'review', status: 'draft', seller_type: 'self_employed' },
      {
        personal_complete: 'true',
        tax_complete: 'true',
        address_complete: 'true',
        bank_complete: 'true',
        warehouse_complete: 'true',
        return_complete: 'true',
        documents_complete: 'true',
      },
    ));
    await goto(page, '/seller/seller-review');
    await page.getByText(l.reviewInfo).waitFor({ timeout: 10_000 });
    await shotDoc01(page, outDir, scrollTargets, '05-seller-review');

    await page.unroute(/\/api\//);
    await page.route(/\/api\//, onboardingRoute({
      requires_onboarding: true,
      is_editable: false,
      next_step: null,
      status: 'pending_verification',
      seller_type: 'self_employed',
    }));
    await goto(page, '/seller/application-sub');
    await page.getByText(l.applicationSubmitted).waitFor({ timeout: 10_000 });
    await shotDoc01(page, outDir, scrollTargets, '06-application-submitted');
    await page.close();
  }

  {
    const aresContext = await browser.newContext({
      viewport: VIEWPORT,
      locale: localeConfig.browserLocale,
    });
    await aresContext.addInitScript(storageInit, {
      authToken: FAKE_TOKEN,
      language: localeConfig.i18nextLng,
      keys: {
        includeAresDismissed: false,
        extraKeys: {
          seller_self_employed_ares_entry_assist_dismissed_v1: null,
          seller_company_ares_entry_assist_dismissed_v1: null,
        },
      },
    });

    const selfEmployedRoute = withAresLookupMock(onboardingRoute({
      requires_onboarding: true,
      is_editable: true,
      next_step: 'personal',
      status: 'draft',
      seller_type: 'self_employed',
    }));

    const companyRoute = withAresLookupMock(onboardingRoute({
      requires_onboarding: true,
      is_editable: true,
      next_step: 'personal',
      status: 'draft',
      seller_type: 'company',
    }));

    {
      const page = await aresContext.newPage();
      await blockThirdParty(page);
      await page.route(/\/api\//, selfEmployedRoute);
      await page.goto(`${BASE_URL}/seller/seller-info`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.getByText(l.selfEmployedPrefill).waitFor({ timeout: 20_000 });
      await shotDoc01(page, outDir, scrollTargets, '08-self-employed-ares-modal');
      const selfEmployedModal = page.getByTestId('self-employed-ares-entry-modal');
      await selfEmployedModal.locator('#self-employed-ares-entry-ico').fill('25596641');
      await selfEmployedModal.getByRole('button', { name: l.loadFromRegistry }).click();
      await page.getByTestId('self-employed-ares-entry-preview').waitFor({ timeout: 15_000 });
      await shotDoc01(page, outDir, scrollTargets, '08a-self-employed-ares-modal-loaded');
      await page.close();
    }

    {
      const page = await aresContext.newPage();
      await blockThirdParty(page);
      await page.route(/\/api\//, companyRoute);
      await page.goto(`${BASE_URL}/seller/seller-company`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.getByText(l.companyPrefill).waitFor({ timeout: 20_000 });
      await shotDoc01(page, outDir, scrollTargets, '08-company-ares-modal');
      const companyModal = page.getByTestId('company-ares-entry-modal');
      await companyModal.locator('#company-ares-entry-ico').fill('25596641');
      await companyModal.getByRole('button', { name: l.loadFromRegistry }).click();
      await page.getByTestId('company-ares-entry-preview').waitFor({ timeout: 15_000 });
      await shotDoc01(page, outDir, scrollTargets, '08a-company-ares-modal-loaded');
      await page.close();
    }

    {
      const page = await aresContext.newPage();
      await blockThirdParty(page);
      await page.addInitScript(() => {
        localStorage.setItem('seller_self_employed_ares_entry_assist_dismissed_v1', 'manual');
      });
      await page.route(/\/api\//, selfEmployedRoute);
      await page.goto(`${BASE_URL}/seller/seller-info`, { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      await page.locator('input[name="ico"]').fill('25596641');
      await page.getByRole('button', { name: l.loadFromRegistry }).click();
      await page.getByText(l.publicRegistryPreview).waitFor({ timeout: 15_000 });
      await shotDoc01(page, outDir, scrollTargets, '09-self-employed-ares-preview');
      await page.close();
    }

    {
      const page = await aresContext.newPage();
      await blockThirdParty(page);
      await page.addInitScript(() => {
        localStorage.setItem('seller_company_ares_entry_assist_dismissed_v1', 'manual');
      });
      await page.route(/\/api\//, companyRoute);
      await page.goto(`${BASE_URL}/seller/seller-company`, { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      await page.locator('input[name="business_id"]').fill('25596641');
      await page.getByRole('button', { name: l.loadFromAres }).click();
      await page.getByText(l.aresPreview).waitFor({ timeout: 15_000 });
      await shotDoc01(page, outDir, scrollTargets, '09-company-ares-preview');
      await page.close();
    }

    await aresContext.close();
  }

  {
    const page = await context.newPage();
    await blockThirdParty(page);
    await goto(page, '/sign_up');
    await page.getByRole('heading', { name: l.registerHere }).waitFor({ timeout: 10_000 });
    await shot(page, outDir, '10-buyer-signup');

    await goto(page, '/seller/login');
    await page.getByText(l.sellerLogin).waitFor({ timeout: 10_000 });
    await shot(page, outDir, '11-seller-login');

    await goto(page, '/delete-my-data');
    await page.getByText(l.deleteAccount).first().waitFor({ timeout: 10_000 });
    await shot(page, outDir, '12-delete-account-info');
    await page.close();
  }

  {
    const goodsContext = await browser.newContext({
      viewport: VIEWPORT,
      locale: localeConfig.browserLocale,
    });
    await goodsContext.addInitScript(storageInit, {
      authToken: FAKE_TOKEN,
      language: localeConfig.i18nextLng,
      keys: { includeAresDismissed: true, extraKeys: {} },
    });
    const page = await goodsContext.newPage();
    await blockThirdParty(page);
    await page.route(/\/api\//, async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (/\/sellers\/onboarding\/state\//.test(url)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            requires_onboarding: false,
            is_editable: false,
            status: 'approved',
            seller_type: 'self_employed',
          }),
        });
      }
      if (method === 'GET' && /\/sellers\/onboarding\//.test(url)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fulfillOnboardingGet(url)),
        });
      }
      return catalogRoute()(route);
    });

    await goto(page, '/seller/goods-choice');
    await page.getByRole('heading', { name: l.goodsList }).waitFor({ timeout: 20_000 });
    await shot(page, outDir, '20-goods-choice');

    await goto(page, '/seller/seller-create');
    await page.getByText(l.goodsCreation).first().waitFor({ timeout: 20_000 });
    await shot(page, outDir, '21-seller-create');

    await goto(page, '/seller/seller-preview');
    await page.getByRole('button', { name: l.previewModeration }).first().waitFor({ timeout: 20_000 });
    await shot(page, outDir, '22-seller-preview');

    await goto(page, '/seller/goods-list');
    await page.getByText(l.onModeration).first().waitFor({ timeout: 20_000 });
    await shot(page, outDir, '23-goods-list');
    await goodsContext.close();
  }

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

async function main() {
  for (const localeKey of parseCaptureLocales()) {
    await captureForLocale(localeKey);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
