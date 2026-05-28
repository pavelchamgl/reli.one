/**
 * Shared Playwright helpers for Frontend3 e2e.
 * FE-021: extracted from seller-onboarding + fullstack specs.
 */

/** Блокирует GTM/Packeta/FB — синхронные внешние скрипты тормозят page.goto. */
export async function blockThirdPartyScripts(page) {
  await page.route(
    /googletagmanager|googlesyndication|google-analytics|connect\.facebook|widget\.packeta|fonts\.googleapis|fonts\.gstatic/,
    (route) => route.abort(),
  );
}

export async function gotoSellerPage(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

/**
 * Мок onboarding API для frontend-only e2e.
 * Покрывает https://reli.one/api и http://localhost:8000/api (.env.local build).
 */
export async function setupSellerOnboardingApi(page, { state, review } = {}) {
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

export async function blockBackendApi(page) {
  await setupSellerOnboardingApi(page);
}

/**
 * Проксирует browser /api/* → real Django backend (обходит CORS preview ↔ localhost).
 * @param {import('@playwright/test').Page} page
 * @param {string} apiBase — e.g. http://localhost:8000/api
 */
export async function proxyToBackend(page, apiBase) {
  await page.route(/\/api\//, async (route) => {
    const requestUrl = route.request().url();
    const apiPath = requestUrl.match(/\/api(\/.*)/)?.[1] ?? '/';
    const backendUrl = `${apiBase}${apiPath}`;

    try {
      const response = await route.fetch({
        url: backendUrl,
        method: route.request().method(),
        headers: route.request().headers(),
        postData: route.request().postData(),
      });
      await route.fulfill({ response });
    } catch {
      await route.abort('connectionrefused');
    }
  });
}

export async function seedAuthToken(page, token) {
  await page.addInitScript(
    ({ authToken }) => localStorage.setItem('token', JSON.stringify(authToken)),
    { authToken: token },
  );
}
