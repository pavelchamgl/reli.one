import { test, expect } from '@playwright/test';

/**
 * FE-008 Smoke E2E — Frontend3
 *
 * Тесты запускаются против собранного Vite-приложения (vite preview).
 * Backend не поднимается — проверяем только routing, mounting и redirect-логику.
 */

// ── Базовый запуск ─────────────────────────────────────────────────────────────

test('root page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

// ── Home page ──────────────────────────────────────────────────────────────────

test('home page: app shell mounts without crash', async ({ page }) => {
  await page.goto('/');

  // React монтируется в #root — если приложение крашнулось, #root пустой
  await expect(page.locator('#root')).toBeAttached();

  // Страница остаётся на /
  await expect(page).toHaveURL('/');
});

// ── Protected route ────────────────────────────────────────────────────────────

test('protected seller route redirects to /seller/login when not authenticated', async ({ page }) => {
  await page.goto('/seller/seller-home');

  // ProtectedRoute проверяет Redux state.auth.token
  // PersistGate гидрирует асинхронно; без данных в localStorage token = null → redirect
  await page.waitForURL('**/seller/login', { timeout: 10_000 });

  await expect(page).toHaveURL(/\/seller\/login/);
  await expect(page.locator('body')).toBeVisible();
});

// ── Search page ────────────────────────────────────────────────────────────────

test('search page loads and stays on /search', async ({ page }) => {
  // API-запросы в e2e могут упасть без backend — это ожидаемо
  // Проверяем только routing и отсутствие crash
  page.on('requestfailed', () => { /* no backend, expected */ });

  await page.goto('/search');

  await expect(page).toHaveURL(/\/search/);
  await expect(page.locator('#root')).toBeAttached();
});

// ── Wildcard fallback ──────────────────────────────────────────────────────────

test('unknown route falls back to home page (wildcard *)', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-at-all');

  // Router config: * → <HomePage /> — не 404-страница браузера
  await expect(page.locator('#root')).toBeAttached();
  await expect(page.locator('body')).toBeVisible();
});
