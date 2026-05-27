# FE-010 — Seller Onboarding E2E Smoke

**Статус:** Done  
**Phase:** 4 — P3 Playwright / E2E Expansion  
**Priority:** P3  
**После:** FE-009 (Checkout Happy Path E2E)

---

## Цель

Добавить безопасный Playwright e2e smoke для seller onboarding flow во Frontend3:
- без реального KYC/документов submit;
- без backend и реального создания аккаунта;
- onboarding state API замокан через `route.fulfill()`.

---

## Реализация

### Файл

`Frontend/Frontend3/e2e/seller-onboarding.spec.js`

### Стратегия

| Аспект | Решение |
|--------|---------|
| Backend | Не поднимается. `page.on('requestfailed', () => {})` для публичных страниц |
| Onboarding state API | `page.route(/reli\.one\/api\/sellers\/onboarding\/state\//, route.fulfill(...))` |
| Прочие API | `blockBackendApi()` — abort `**/reli.one/api/**` |
| KYC / документы | Не достигаются — тест не доходит до submit |
| Защищённые маршруты | Протестированы в `smoke.spec.js`, не дублируем |

### Сценарии (4 теста)

| # | Тест | Что проверяет |
|---|------|---------------|
| 1 | seller login page: loads with login form | `/seller/login` рендерит форму, email + password поля видимы |
| 2 | seller create-account page: loads with registration form | `/seller/create-account` рендерит заголовок "Create Your Seller Account" |
| 3 | seller-type page: shows type selection from mocked onboarding state | Mock state `{next_step:'seller_type'}` → "Choose your seller type" + оба типа продавца видимы |
| 4 | application-sub page: shows submitted confirmation from mocked state | Mock state `{status:'pending_verification', is_editable:false}` → "Your application has been submitted" + "Pending Verification" |

### Замоканные API

| Endpoint | Метод | Мок-ответ |
|----------|-------|-----------|
| `/sellers/onboarding/state/` | GET | Тест 3: `{requires_onboarding:true, is_editable:true, next_step:'seller_type', status:'new'}` |
| `/sellers/onboarding/state/` | GET | Тест 4: `{requires_onboarding:true, is_editable:false, status:'pending_verification'}` |
| `**/reli.one/api/**` | все | abort (тесты 3, 4) |

**Тесты 1–2:** API не вызывается при монтировании, route mock не нужен.

---

## Результаты validation

Из `Frontend/Frontend3`:

| Команда | Результат |
|---------|-----------|
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 122/122 passed |
| `npm run build` | ✅ OK |
| `npm run test:e2e` | ✅ 15/15 passed (4 seller + 6 checkout + 5 smoke) |

---

## Файлы

| Файл | Действие |
|------|----------|
| `Frontend/Frontend3/e2e/seller-onboarding.spec.js` | Создан |
| `docs/frontend/tasks/010-seller-onboarding-e2e-smoke/task.md` | Создан |
| `docs/frontend/tasks/README.md` | FE-010 добавлен |
| `docs/frontend/test-matrix.md` | +4 строки seller onboarding e2e |
| `docs/frontend/frontend3-roadmap.md` | PR 4.3 ✅, 4.4 обновлён |
| `docs/frontend/frontend3-audit.md` | FE-P3-002 → Fixed, таблица покрытия обновлена |

---

## Ограничения / Follow-up

- Полный onboarding flow (SellerInformation → SellerReview → Submit) требует обширного мокирования множества API-эндпоинтов; оставлен как follow-up.
- `data-testid` не добавлен: стабильные селекторы по `input[name]` и переведённым текстам достаточны.
- ProtectedRoute-редирект на `/seller/login` уже покрыт в `smoke.spec.js`.

---

## Suggested commit

```
test(frontend): add seller onboarding e2e smoke
```
