# FE-012 — Full-Stack Checkout Until Payment Session E2E (FS-002)

**Статус:** Done  
**Phase:** 5 (Full-Stack E2E)  
**Priority:** P2  
**Spec-файл:** `Frontend/Frontend3/e2e/fullstack-checkout-payment-session.spec.js`  
**Связано с:** [Task 015 — Full-Stack E2E Design](../../../tasks/015-full-stack-e2e-design/task.md)

---

## Goal

Создать Playwright full-stack E2E тест, который проходит checkout через реальный Django backend и тестовую Postgres БД, не вызывая реальные PSP (Stripe/PayPal).

---

## Сценарий (FS-002)

1. Создать тестового seller с warehouse (CZ origin).
2. Создать product variant через seller API (SKU генерируется backend).
3. Создать customer пользователя.
4. **FS-002a**: Вызвать `POST /api/create-stripe-payment/` напрямую с customer JWT.
   - Ожидается: не 401/403/400 → backend validation passed; 500 от Stripe (пустой ключ в e2e env).
   - Доказывает: SKU lookup OK, CZ origin OK, Packeta shipping OK, StripeMetadata сохранён.
5. **FS-002b**: Запустить UI checkout с seeded Redux state (section 3) и мокированным PSP.
   - Подтверждает: корректный payload к backend, seller_id + SKU в groups, нет реальных PSP вызовов.

---

## Инфраструктурный подход

| Компонент | Решение |
|---|---|
| Backend | Реальный Django + Postgres (`docker compose -f docker-compose.e2e.yml up`) |
| Data setup | Playwright `request` fixture → REST API: seller + warehouse + product + customer |
| seller_profile_id | `GET /api/sellers/onboarding/state/` → поле `seller_profile_id` (добавлено в `services_onboarding.py`) |
| PSP mock | `page.route()` → `route.fulfill()` с фейковым ответом для UI-теста |
| basket seeding | `localStorage` → `persist:root` с Redux-persist state (basketSlice) |
| payment state seeding | `localStorage` → `persist:root` с Redux-persist state (paymentSlice, pageSection=3) |
| JWT seeding | `localStorage` → `token` + `confirm_rule` через `addInitScript` |
| Skip | Автоматически, если `GET /health/` недоступен |

---

## Минимальный набор данных

```
Seller user
  └── SellerProfile (default_warehouse.country = "CZ")
       └── BaseProduct (status=PENDING — не нужен APPROVED для checkout)
            └── ProductVariant (auto-generated SKU, price=15.00, weight=500g)

Customer user (role=CUSTOMER)
  └── JWT tokens (access + refresh)
```

Примечание: seller approval NOT required. `build_stripe_checkout_context` проверяет только SKU,
принадлежность продукта к seller и CZ origin через `default_warehouse`. Статус продукта и
onboarding approval не проверяются на этапе создания сессии.

---

## Что мокируется

| Endpoint | Метод | Мок-стратегия | Причина |
|---|---|---|---|
| `/api/create-stripe-payment/` | POST | `route.fulfill({ status: 200, body: fake_session })` | STRIPE_API_SECRET_KEY пуст в e2e env |
| `/api/delivery/validate-address/` | POST | `route.fulfill({ valid: true })` | ZIP validation — local, но перехватываем для надёжности |
| `stripe.com/*` / `paypal.com/*` | — | Не мокируется — просто проверяем что 0 вызовов | Assertion: no real PSP calls |

---

## Что НЕ тестируется

- Реальная Stripe checkout session (требует `sk_test_*` ключ)
- Создание `Payment` и `Order` в БД (происходит только после webhook — покрыто `backend/payment/test_checkout_flow.py`)
- UI форм section 1 (адрес) и section 2 (доставка) — в FS-002b состояние seeded напрямую через Redux state

---

## Минимальный backend change

`backend/sellers/services_onboarding.py` — добавлено одно поле в `build_seller_onboarding_state_response`:

```python
data["seller_profile_id"] = app.seller_profile_id
```

Это read-only дополнение, не меняющее бизнес-логику. Необходимо для получения `SellerProfile.pk`
из публичного REST API без Django admin доступа.

---

## Definition of Done

- [x] `fullstack-checkout-payment-session.spec.js` создан
- [x] Реальный Django backend используется для data setup
- [x] Seller + product + customer создаются через REST API
- [x] FS-002a: подтверждена вся цепочка валидации до PSP вызова
- [x] FS-002b: UI dispatches корректный payload к mocked session endpoint
- [x] session_id (fake) присутствует в mock response
- [x] Order НЕ создаётся до webhook (не входит в scope FS-002)
- [x] Реальный Stripe/PayPal не вызывается (assertion: pspCalls.length === 0)
- [x] Тест автоматически пропускается, если backend недоступен
- [x] `test-coverage-snapshot.md` обновлён
- [x] `docs/frontend/tasks/README.md` обновлён (FE-012)
- [x] `docs/frontend/frontend3-roadmap.md` обновлён (Phase 4)
- [x] `docs/tasks/015-full-stack-e2e-design/task.md` обновлён (FS-002 статус)

---

## Запуск локально

```bash
# 1. Поднять e2e контур
cp envs/database.e2e.env.example envs/database.e2e.env
cp envs/backend.e2e.env.example  envs/backend.e2e.env
docker compose -f docker-compose.e2e.yml up --build

# 2. Запустить тесты (в Frontend/Frontend3)
npm run build && npm run test:e2e

# Запустить только FS-002
npx playwright test fullstack-checkout-payment-session --reporter=list
```

---

## Связанные файлы

- `Frontend/Frontend3/e2e/fullstack-checkout-payment-session.spec.js` — реализация
- `Frontend/Frontend3/e2e/fullstack-seller-onboarding.spec.js` — паттерн FS-001 (reference)
- `backend/sellers/services_onboarding.py` — добавлен `seller_profile_id`
- `docs/tasks/015-full-stack-e2e-design/task.md` — дизайн full-stack E2E
- `docs/testing/e2e-local-contour.md` — локальный Docker e2e контур
