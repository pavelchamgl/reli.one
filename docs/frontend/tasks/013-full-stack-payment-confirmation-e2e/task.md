# FE-013 — Full-Stack Payment Confirmation E2E (FS-003)

**Status:** DONE  
**Type:** E2E Test — Playwright + реальный Django backend  
**Priority:** P2  
**Spec file:** `Frontend/Frontend3/e2e/fullstack-payment-confirmation.spec.js`

---

## Goal

Проверить lifecycle после создания payment session:

```
StripeMetadata (pre-created) → Stripe webhook (mock) → Order / OrderProduct / Invoice создан в БД
→ /my_orders отображает заказ в браузере
```

Сфокусироваться на связке **webhook result + UI отображение результата** без дублирования idempotency-тестов из Task 016.

---

## Что покрывает FS-003

### FS-003a — Backend webhook lifecycle (API-only)

| Шаг | Что проверяется |
|-----|----------------|
| 1 | Seller + warehouse (CZ) + product variant созданы через API |
| 2 | Customer зарегистрирован, получен user_id |
| 3 | `OrderStatus(PENDING)`, `DeliveryType(2)`, `CourierService(2)` созданы идемпотентно |
| 4 | `StripeMetadata` создана через `/api/e2e/payment/create-stripe-metadata/` |
| 5 | `POST /api/stripe-webhook/` с fake event, signature skip включён |
| 6 | Webhook возвращает 200 + `"1 order(s) created successfully"` |
| 7 | `GET /api/orders/?status=not_closed` возвращает заказ для customer |
| 8 | `GET /api/conversion-payload/?session_id=...` возвращает `{ready: true}` |

**Что создаётся в DB:** `Order`, `OrderProduct`, `Payment`, `Invoice` (PDF через reportlab)

### FS-003b — UI order visibility (Playwright + реальный backend)

| Шаг | Что проверяется |
|-----|----------------|
| 1–5 | Полный lifecycle FS-003a (данные + webhook) |
| 6 | JWT seeded в localStorage перед навигацией |
| 7 | `page.route()` proxy → real backend |
| 8 | Навигация на `/my_orders` |
| 9 | HistorySmallCard с `[class*="prodNumber"]` отображается |
| 10 | No-content placeholder отсутствует |

---

## Что НЕ покрывает FS-003

- **PayPal webhook lifecycle** — покрыт в Task 016 matrix на уровне backend integration tests.
- **Webhook idempotency** — уже проверена в Task 016 (`test_webhook_idempotent_no_duplicate_orders`). FS-003 намеренно не дублирует этот сценарий.
- **Страница `/payment_end`** — показывает только generic success message без деталей заказа; не содержит order_number или total_amount. Детали заказа недоступны на этой странице.
- **Invoice file content** — PDF генерируется реально (reportlab), но его содержимое не проверяется.
- **Celery / background tasks** — `async_parcels_and_seller_email` и `async_send_client_email` запускаются в ThreadPoolExecutor и не блокируют создание заказа. Их результат не проверяется.
- **Stock reservation** — не активирован (`STOCK_RESERVATION_ENABLED=False` по умолчанию).
- **CI автоматизация** — тест предназначен для локального запуска через docker-compose.e2e.yml.

---

## Почему PSP mock (STRIPE_WEBHOOK_SKIP_SIGNATURE=true)

Реальный Stripe webhook требует подпись (`Stripe-Signature`), которая вычисляется через HMAC-SHA256 от тела + timestamp с `STRIPE_WEBHOOK_ENDPOINT_SECRET`. В CI-контуре:
- Нет реального signing secret.
- Нельзя использовать Stripe sandbox в автоматизированных тестах без secrets.
- `stripe.Webhook.construct_event` нельзя патчить из Playwright.

Решение: `STRIPE_WEBHOOK_SKIP_SIGNATURE=true` (только в e2e env) → webhook view пропускает `construct_event` и парсит тело как JSON напрямую. Production default = `False`.

---

## Какой UI route используется

`/my_orders` → `MyOrdersPage` → `ActualSection` → `HistorySmallCard`

**Почему не `/payment_end`:** страница `/payment_end` не показывает данные заказа. Она:
- Очищает basket из localStorage
- Вызывает `getDataFromSessionId` только для GTM events
- Отображает текст `payment_end_title` (generic) и две кнопки

Реально видимые данные заказа доступны только на `/my_orders`.

---

## Backend изменения

| Файл | Изменение |
|------|----------|
| `backend/backend/settings.py` | Добавлены `STRIPE_WEBHOOK_SKIP_SIGNATURE`, `ENABLE_E2E_ENDPOINTS` (default: False) |
| `backend/payment/services/stripe_webhook.py` | Skip-signature path когда `STRIPE_WEBHOOK_SKIP_SIGNATURE=True` |
| `backend/payment/e2e_views.py` | `E2ESetupOrderDataView`, `E2ECreateStripeMetadataView` (новый файл) |
| `backend/backend/urls.py` | Условная регистрация `/api/e2e/*` когда `ENABLE_E2E_ENDPOINTS=True` |
| `envs/backend.e2e.env.example` | `ENABLE_E2E_ENDPOINTS=true`, `STRIPE_WEBHOOK_SKIP_SIGNATURE=true` |

---

## Backend entities проверяются

| Entity | Как проверяется |
|--------|----------------|
| `Payment` | Через `conversion-payload` endpoint (fallback ищет Orders by session_id) |
| `Order` | `GET /api/orders/?status=not_closed` → список заказов customer |
| `OrderProduct` | Неявно — webhook создаёт успешно (assertion через 200 + "1 order") |
| `Invoice` | Неявно — PDF генерируется, если бы не было — webhook вернул бы 500 |

---

## Follow-ups

| # | Описание | Приоритет |
|---|---------|----------|
| FU-001 | Создать UI confirmation page с деталями заказа (order_number, items, total) после payment_end. Сейчас `/payment_end` не отображает эти данные. | P3 |
| FU-002 | Добавить `OrderProduct.count` assertion через публичный API (сейчас нет endpoint для customer). | P3 |
| FU-003 | Добавить E2E тест PayPal webhook lifecycle (аналог FS-003 но для PayPal path). | P2 |
| FU-004 | Интеграция FS-003 в CI pipeline при появлении E2E docker stage. | P2 |

---

## Локальный запуск

```bash
# 1. Подготовить env
cp envs/database.e2e.env.example envs/database.e2e.env
cp envs/backend.e2e.env.example  envs/backend.e2e.env
# Убедиться: ENABLE_E2E_ENDPOINTS=true, STRIPE_WEBHOOK_SKIP_SIGNATURE=true

# 2. Запустить Docker contour
docker compose -f docker-compose.e2e.yml up --build

# 3. Запустить тесты (из Frontend/Frontend3)
npm run build && npm run test:e2e -- e2e/fullstack-payment-confirmation.spec.js
```

---

## Связанные документы

- `docs/tasks/015-full-stack-e2e-design/task.md` — дизайн full-stack E2E стратегии
- `docs/tasks/016-webhook-idempotency-verification/task.md` — аудит webhook idempotency coverage
- `docs/frontend/tasks/012-full-stack-checkout-payment-session-e2e/task.md` — FS-002 (предыдущий шаг)
- `docs/test-coverage-snapshot.md` — сводный snapshot тестового покрытия
