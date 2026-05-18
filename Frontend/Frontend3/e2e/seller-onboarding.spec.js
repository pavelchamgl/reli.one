import { test, expect } from '@playwright/test';

/**
 * FE-010 — Seller Onboarding E2E Smoke
 *
 * Покрывает frontend-only сценарий: точки входа seller onboarding flow.
 * Backend не поднимается. Вызовы к reli.one/api/sellers/onboarding/state/
 * замоканы через Playwright route.fulfill().
 * Реальные KYC/документы не отправляются — тест не доходит до submit.
 *
 * Маршруты (из main.jsx — без ProtectedRoute):
 *   /seller/login         — публичный, API не вызывается на монтировании
 *   /seller/create-account — публичный, API не вызывается на монтировании
 *   /seller/seller-type    — вызывает GET /sellers/onboarding/state/ на монтировании
 *   /seller/application-sub — вызывает GET /sellers/onboarding/state/ на монтировании
 */

// ── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Мокирует GET /sellers/onboarding/state/ через Playwright route.fulfill().
 * Вызывать до page.goto().
 */
async function mockOnboardingState(page, state) {
  await page.route(/reli\.one\/api\/sellers\/onboarding\/state\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state),
    }),
  );
}

/**
 * Прерывает все вызовы к backend API (reli.one/api).
 * Используется как страховка там, где конкретный endpoint не нужен.
 */
async function blockBackendApi(page) {
  await page.route(/reli\.one\/api\//, (route) => route.abort());
}

// ── Тесты ────────────────────────────────────────────────────────────────────

test.describe('FE-010 — Seller Onboarding smoke', () => {

  // ── Публичные страницы (без API на mount) ────────────────────────────────────

  test('seller login page: loads with login form', async ({ page }) => {
    page.on('requestfailed', () => { /* no backend — expected */ });

    await page.goto('/seller/login');

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

    await page.goto('/seller/create-account');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL(/\/seller\/create-account/);

    // CreateForm — TitleAndDesc title: tOnb('reg.title') → "Create Your Seller Account" (en)
    await expect(page.getByText('Create Your Seller Account')).toBeVisible({ timeout: 10_000 });
  });

  // ── Страница выбора типа продавца (с мок API) ────────────────────────────────

  test('seller-type page: shows type selection from mocked onboarding state', async ({ page }) => {
    // Мокируем GET /sellers/onboarding/state/ — возвращаем состояние "нужен выбор типа"
    await mockOnboardingState(page, {
      requires_onboarding: true,
      is_editable: true,
      next_step: 'seller_type',
      status: 'new',
      seller_type: null,
    });
    // Всё остальное API — блокируем
    await blockBackendApi(page);

    await page.goto('/seller/seller-type');

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
    // Мокируем GET /sellers/onboarding/state/ — статус pending_verification (заявка на ревью)
    // При requires_onboarding:true + is_editable:false → navigate("/seller/application-sub")
    // Мы уже на /seller/application-sub, поэтому re-navigate безвреден
    await mockOnboardingState(page, {
      requires_onboarding: true,
      is_editable: false,
      next_step: null,
      status: 'pending_verification',
      seller_type: 'self_employed',
    });
    await blockBackendApi(page);

    await page.goto('/seller/application-sub');

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
});
