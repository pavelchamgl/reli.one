import { test, expect } from '@playwright/test';
import { blockThirdPartyScripts } from './helpers.js';

/**
 * Iteration 5.5 — Catalog regression browser smoke.
 *
 * Проверяет только routing/mounting существующего Frontend3 SPA.
 * Backend может быть недоступен: API failures здесь не считаются product regression.
 */

test.beforeEach(async ({ page }) => {
  await blockThirdPartyScripts(page);
  page.on('requestfailed', () => { /* backend can be absent in browser smoke */ });
});

test('catalog shell routes mount without crash', async ({ page }) => {
  for (const path of ['/', '/search', '/product/1', '/product_category/1']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeAttached();
    await expect(page.locator('body')).toBeVisible();
  }
});

test('seller catalog route remains protected for anonymous users', async ({ page }) => {
  await page.goto('/seller/goods-list', { waitUntil: 'domcontentloaded' });

  await page.waitForURL('**/seller/login', { timeout: 10_000 });

  await expect(page).toHaveURL(/\/seller\/login/);
  await expect(page.locator('#root')).toBeAttached();
});
