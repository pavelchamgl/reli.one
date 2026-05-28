import { test, expect } from '@playwright/test';

/**
 * FE-010 / FE-020 — Seller Onboarding E2E Smoke
 *
 * Покрывает frontend-only сценарий: точки входа seller onboarding flow.
 * Backend не поднимается. Вызовы к reli.one/api/sellers/onboarding/*
 * замоканы через Playwright route.fulfill().
 *
 * Маршруты (из main.jsx — без ProtectedRoute):
 *   /seller/login              — публичный
 *   /seller/create-account      — публичный
 *   /seller/seller-type         — GET onboarding/state/
 *   /seller/application-sub     — GET onboarding/state/
 *   /seller/seller-review       — review + submit UI (FE-020)
 *   /seller/under-review        — status UI (FE-020)
 *   /seller/action-required     — status UI + GET onboarding/state/
 *   /seller/finish-verification — status UI + GET onboarding/state/
 *   /seller/verified-analyt     — approved status UI (FE-020)
 */

// ── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Единый handler для backend API: fulfill для переданных onboarding endpoints, abort для остального.
 * Покрывает и https://reli.one/api (CI/preview) и http://localhost:8000/api (.env.local).
 */
async function setupSellerOnboardingApi(page, { state, review } = {}) {
  await page.route(/\/api\//, (route) => {
    const url = route.request().url();

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

    return route.abort();
  });
}

/** Прерывает все вызовы к backend API без onboarding mocks. */
async function blockBackendApi(page) {
  await setupSellerOnboardingApi(page);
}

/** Блокирует внешние скрипты (GTM, Packeta, FB), которые тормозят navigation в e2e. */
async function blockThirdPartyScripts(page) {
  await page.route(
    /googletagmanager|googlesyndication|google-analytics|connect\.facebook|widget\.packeta/,
    (route) => route.abort(),
  );
}


async function seedReviewLocalStorage(page) {
  await page.addInitScript(() => {
    localStorage.setItem('first_name', JSON.stringify('Jan'));
    localStorage.setItem('last_name', JSON.stringify('Novak'));
    localStorage.setItem('phone', JSON.stringify('+420123456789'));
    localStorage.setItem('email', JSON.stringify('jan@example.com'));
  });
}

// ── Тесты ────────────────────────────────────────────────────────────────────

async function gotoSellerPage(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

test.describe('FE-010 — Seller Onboarding smoke', () => {
  test.beforeEach(async ({ page }) => {
    await blockThirdPartyScripts(page);
  });

  // ── Публичные страницы (без API на mount) ────────────────────────────────────

  test('seller login page: loads with login form', async ({ page }) => {
    page.on('requestfailed', () => { /* no backend — expected */ });

    await gotoSellerPage(page, '/seller/login');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/login/);

    // LoginForm — TitleAndDesc title: t('auth.login_title') → "Log in to seller panel" (en)
    await expect(page.getByText('Log in to seller panel')).toBeVisible({ timeout: 10_000 });

    // Email и password поля формы видимы
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10_000 });
  });

  test('seller create-account page: loads with registration form', async ({ page }) => {
    page.on('requestfailed', () => {});

    await gotoSellerPage(page, '/seller/create-account');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/create-account/);

    // CreateForm — TitleAndDesc title: tOnb('reg.title') → "Create Your Seller Account" (en)
    await expect(page.getByText('Create Your Seller Account')).toBeVisible({ timeout: 10_000 });
  });

  // ── Страница выбора типа продавца (с мок API) ────────────────────────────────

  test('seller-type page: shows type selection from mocked onboarding state', async ({ page }) => {
    await setupSellerOnboardingApi(page, {
      state: {
        requires_onboarding: true,
        is_editable: true,
        next_step: 'seller_type',
        status: 'new',
        seller_type: null,
      },
    });

    await gotoSellerPage(page, '/seller/seller-type');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/seller-type/);

    // SellerTypeContent — t('onboard.selection.choose_type') → "Choose your seller type"
    await expect(page.getByText('Choose your seller type')).toBeVisible({ timeout: 10_000 });

    // Обе кнопки выбора типа видимы
    // t('onboard.selection.self_employed') → "Self-employed / sole proprietor"
    await expect(page.getByText('Self-employed / sole proprietor')).toBeVisible({ timeout: 10_000 });
    // t('onboard.selection.company_legal') → "Company / legal entity"
    await expect(page.getByText('Company / legal entity')).toBeVisible({ timeout: 10_000 });
  });

  // ── Страница "заявка подана" (с мок API — pending_verification) ──────────────

  test('application-sub page: shows submitted confirmation from mocked state', async ({ page }) => {
    await setupSellerOnboardingApi(page, {
      state: {
        requires_onboarding: true,
        is_editable: false,
        next_step: null,
        status: 'pending_verification',
        seller_type: 'self_employed',
      },
    });

    await gotoSellerPage(page, '/seller/application-sub');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/application-sub/);

    // ApplicationSubmitedContent — t('onboard.status.submitted_title')
    // → "Your application has been submitted"
    await expect(
      page.getByText('Your application has been submitted'),
    ).toBeVisible({ timeout: 10_000 });

    // t('onboard.status.pending_status') → "Pending Verification"
    await expect(page.getByText('Pending Verification')).toBeVisible({ timeout: 10_000 });
  });

  // ── FE-020: review page (mock review API) ───────────────────────────────────

  test('seller-review page: shows review sections and submit CTA from mocked review API', async ({
    page,
  }) => {
    await seedReviewLocalStorage(page);
    await setupSellerOnboardingApi(page, {
      review: {
        personal_complete: 'true',
        tax_complete: 'true',
        address_complete: 'true',
        bank_complete: 'true',
      },
    });

    await gotoSellerPage(page, '/seller/seller-review');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/seller-review/);
    await expect(page.getByText('Review your information')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Submit for Verification' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Account information')).toBeVisible({ timeout: 10_000 });
  });

  // ── FE-020: post-submit status pages ────────────────────────────────────────

  test('under-review page: shows pending verification status UI', async ({ page }) => {
    await blockBackendApi(page);

    await gotoSellerPage(page, '/seller/under-review');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/under-review/);
    await expect(page.getByRole('heading', { name: 'Under review' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Pending verification')).toBeVisible({ timeout: 10_000 });
  });

  test('action-required page: shows rejected state CTA from mocked onboarding state', async ({
    page,
  }) => {
    await setupSellerOnboardingApi(page, {
      state: {
        requires_onboarding: true,
        is_editable: true,
        next_step: 'personal',
        status: 'rejected',
        seller_type: 'self_employed',
      },
    });

    await gotoSellerPage(page, '/seller/action-required');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/action-required/);
    await expect(page.getByRole('heading', { name: 'Action required' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Fix and resubmit' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('finish-verification page: shows progress and continue CTA from mocked state', async ({
    page,
  }) => {
    await setupSellerOnboardingApi(page, {
      state: {
        requires_onboarding: true,
        is_editable: true,
        next_step: 'bank',
        status: 'draft',
        seller_type: 'self_employed',
        completeness: {
          personal_complete: 'true',
          tax_complete: 'true',
          address_complete: 'false',
          bank_complete: 'false',
        },
      },
    });

    await gotoSellerPage(page, '/seller/finish-verification');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/finish-verification/);
    await expect(page.getByRole('heading', { name: 'Finish your verification' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Continue onboarding' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Continue onboarding' })).toBeEnabled({
      timeout: 15_000,
    });
  });

  test('verified-analyt page: shows approved seller status UI', async ({ page }) => {
    await blockBackendApi(page);

    await gotoSellerPage(page, '/seller/verified-analyt');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/verified-analyt/);
    await expect(page.getByRole('heading', { name: "You're verified!" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Verified Seller', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Go to dashboard' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
