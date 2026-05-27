import { test, expect } from '@playwright/test';

/**
 * FE-009 — Checkout Happy Path Smoke
 *
 * Покрывает frontend-only сценарий: корзина → переход на страницу оплаты.
 * Backend не поднимается. Все API-запросы к reli.one/api прерываются.
 * Stripe/PayPal не вызываются — тест останавливается на секции 1 (адресная форма).
 *
 * Стратегия:
 *  - Для тестов с товаром в корзине: localStorage заполняется через page.addInitScript
 *    (persist:root в формате redux-persist, version=20).
 *  - Для тестов без товара: корзина пустая (начальное состояние Redux).
 */

// ── Константы, совпадающие с приложением ────────────────────────────────────

const PERSIST_VERSION = 20;   // src/redux/index.js — PERSIST_VERSION
const COOKIE_VERSION = '0.0.8'; // src/configs/cookieConfig.js

/** Тестовый товар: минимальный объект, достаточный для basketSlice */
const E2E_PRODUCT = {
  sku: 'E2E-TEST-001',
  count: 1,
  selected: true,
  product: { id: 9999, name: 'E2E Test Product', price: 9.99, image: null },
};

// ── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Строит JSON-строку basketSlice-состояния для persist:root.
 * Вызывается в Node-контексте теста (не в браузере).
 */
function buildBasketSliceState(items) {
  const selected = items.filter((i) => i.selected);
  return JSON.stringify({
    basket: items,
    baskets: [],
    err: '',
    status: '',
    totalCount: selected.reduce((s, i) => s + i.count * i.product.price, 0),
    selectedProducts: selected,
    filteredBasket: null,
    searchTerm: '',
  });
}

/**
 * Инжектирует localStorage до загрузки страницы:
 * - persist:root   — Redux-persist state с корзиной
 * - COOKIE_VERSION — предотвращает сброс состояния хуком cookieConfig
 */
async function seedBasket(page, items) {
  const basketState = buildBasketSliceState(items);
  await page.addInitScript(
    ({ basketState, cookieVersion, persistVersion }) => {
      localStorage.setItem(
        'persist:root',
        JSON.stringify({
          basket: basketState,
          _persist: JSON.stringify({ version: persistVersion, rehydrated: true }),
        }),
      );
      localStorage.setItem('COOKIE_VERSION', cookieVersion);
    },
    { basketState, cookieVersion: COOKIE_VERSION, persistVersion: PERSIST_VERSION },
  );
}

/**
 * Прерывает все вызовы к backend API (reli.one/api).
 * Защита от случайных запросов к production при запуске e2e.
 */
async function blockBackendApi(page) {
  await page.route(/reli\.one\/api\//, (route) => route.abort());
}

// ── Тесты ────────────────────────────────────────────────────────────────────

test.describe('FE-009 — Checkout happy path', () => {

  // ── /basket — пустая корзина ────────────────────────────────────────────────

  test('basket page: opens without crash (empty cart)', async ({ page }) => {
    page.on('requestfailed', () => { /* no backend — expected */ });

    await page.goto('/basket');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL('/basket');
  });

  test('basket page: shows empty-basket message when no items', async ({ page }) => {
    page.on('requestfailed', () => {});

    await page.goto('/basket');

    // BasketCardBlock — `t("basket_empty")` → "The basket is still empty" (en)
    await expect(page.getByText('The basket is still empty')).toBeVisible({ timeout: 10_000 });
  });

  // ── /basket — корзина с товаром (seeded localStorage) ──────────────────────

  test('basket page: renders item count after Redux rehydration', async ({ page }) => {
    page.on('requestfailed', () => {});
    await seedBasket(page, [E2E_PRODUCT]);

    await page.goto('/basket');

    // BasketCardBlock: `${basket.length} ${t("count")}` → "1 goods"
    await expect(page.getByText('1 goods')).toBeVisible({ timeout: 10_000 });
  });

  // ── /basket → /payment навигация ───────────────────────────────────────────

  test('basket → payment: Continue button enabled and navigates to /payment', async ({ page }) => {
    page.on('requestfailed', () => {});
    await seedBasket(page, [E2E_PRODUCT]);

    await page.goto('/basket');

    // BasketTotalBlock: кнопка активна когда selectedProducts.length > 0
    // t("basket_continue") → "Continue" (en)
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeEnabled({ timeout: 10_000 });

    await continueBtn.click();

    await page.waitForURL('**/payment', { timeout: 10_000 });
    await expect(page).toHaveURL('/payment');
    await expect(page.locator('#root')).toBeAttached();
  });

  // ── /payment — section 1: адресная форма ───────────────────────────────────

  test('payment page: section 1 (address form) loads without crash', async ({ page }) => {
    page.on('requestfailed', () => {});
    await blockBackendApi(page);

    await page.goto('/payment');

    await expect(page.locator('#root')).toBeAttached();
    await expect(page).toHaveURL('/payment');

    // PaymentContentBlock рендерит email input в section 1
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 });
  });

  test('payment page: no Stripe / PayPal calls on section 1', async ({ page }) => {
    const pspUrls = [];
    page.on('request', (req) => {
      if (/stripe\.com|paypal\.com/i.test(req.url())) {
        pspUrls.push(req.url());
      }
    });
    page.on('requestfailed', () => {});
    await blockBackendApi(page);

    await page.goto('/payment');

    // Ждём полного рендера section 1 перед проверкой
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 });

    expect(pspUrls).toHaveLength(0);
  });
});
