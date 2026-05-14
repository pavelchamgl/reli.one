# FE-T004 — Playwright: фундамент и smoke-сценарии

**Priority:** P1  
**Complexity:** Medium  
**Status:** Done

## Цель

Настроить **Playwright** для **Frontend3** (при необходимости позже — Frontend2), добавить **1–3 smoke-сценария** по критичным пользовательским путям и задокументировать запуск локально и в CI.

## Контекст

RTL не заменяет проверку реального браузера, Cookie, редиректов OAuth и полного стека Vite+прокси; узкий e2e слой снижает риск регрессий интеграции.

## Scope

- Инициализация: `Frontend/Frontend3/playwright.config.js`, каталог **`e2e/`**.
- Конфиг: **baseURL** `http://127.0.0.1:4173`, **webServer** — `vite preview` на том же порту.
- Сценарий: открытие `/` и видимость `body`.
- CI: job **`e2e_frontend3`** в `.github/workflows/ci.yml` (build → `playwright install chromium` → `npm run test:e2e`).

## Не входит в задачу

- Полный регрессионный e2e-набор.
- Нагрузочное тестирование.
- Реальные платежи Stripe/PayPal в e2e (использовать существующие **ручные чеклисты** в `docs/testing/` при необходимости).

## Зависимости

- **FE-T002** (желательно стабильный билд/превью).

## Риски

- Нестабильность CI из-за портов — отдельный job, `workers: 1` в CI в `playwright.config.js`.
- Блокировки капчей / OAuth — сценарии должны быть **реализуемы** без ручного вмешательства.

## Definition of Done

- [x] Локально: `npm run build && npm run test:e2e` (переменная `CI=1` для отключения `reuseExistingServer` при необходимости).
- [x] Минимум один сценарий в `e2e/smoke.spec.js`.
- [x] Документировано в [test-matrix.md](../../test-matrix.md); секреты не в git.

---

# Iterations

## Iteration 1 — Bootstrap

### Статус

- [x] 

## Iteration 2 — Smoke

### Статус

- [x] 
