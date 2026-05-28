import { test, expect } from '@playwright/test';

/**
 * FE-015 — Foundation smoke (home + seller login).
 * Запуск против dev: npm run test:e2e:dev:fe015
 * Запуск против preview: npm run test:e2e -- e2e/fe015-foundation-smoke.spec.js
 */

test('FE-015: home page mounts after Tailwind/shadcn CSS', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeAttached();
  await expect(page).toHaveURL('/');
});

test('FE-015: seller login form renders (no layout crash)', async ({ page }) => {
  page.on('requestfailed', () => {});

  await page.goto('/seller/login');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});
