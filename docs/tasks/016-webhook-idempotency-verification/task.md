# Task 016 — Webhook Idempotency Verification

**Priority:** P1 (documentation / audit)
**Complexity:** Low
**Type:** Audit + documentation — без runtime-кода
**Status:** **DONE (repo-scope documentation verification)** — аудит подтвердил полное покрытие; новые тесты не потребовались.

---

## Goal

Зафиксировать и верифицировать текущее покрытие webhook idempotency для Stripe и PayPal, определить пробелы, исключить дублирование тестов. Результат — аудиторский документ с матрицей покрытия и явным выводом: нужны ли дополнительные тесты.

---

## Context

Payment flow — бизнес-критический контур. Повторная доставка webhook (Stripe / PayPal могут повторить событие при сетевых сбоях или таймаутах) не должна создавать дублирующих `Order`, `Payment`, `Invoice` и не должна повторно запускать side effects (PDF, email, parcels).

Idempotency достигается через:
- `UniqueConstraint(payment_system, session_id)` на модели `Payment` (внедрён в Task 003)
- `_replay_if_payment_exists` — pre-atomic проверка перед `transaction.atomic()` в `webhook_processing.create_orders_and_payment`
- ветку `IntegrityError` → replay (TOCTOU-защита при гонке двух воркеров)

К моменту этой задачи (май 2026) идемпотентность уже реализована и покрыта тестами. Цель данной задачи — **зафиксировать это покрытие документально** и убедиться, что пробелов нет.

---

## Scope

- Аудит тестов в `backend/payment/tests.py`, `backend/payment/test_checkout_flow.py`, `backend/order/test_webhook_lifecycle.py`
- Составление матрицы покрытия
- Gap analysis: нужны ли новые тесты
- Создание данного документа

---

## Out of Scope

- Изменение runtime-кода (`payment/`, `order/`)
- Изменение payment/order services
- Изменение CI workflows, docker-compose, Frontend кода
- Написание новых тестов (если покрытие достаточное — подтверждено аудитом, см. ниже)
- Обновление `docs/test-coverage-snapshot.md` (новые тесты не добавлялись)

---

## Existing Coverage Matrix

### Файлы с idempotency-тестами

| Файл | Тип тестов |
|------|-----------|
| `backend/payment/tests.py` | Unit + Integration |
| `backend/payment/test_checkout_flow.py` | Integration (HTTP API) |
| `backend/order/test_webhook_lifecycle.py` | Integration (service layer) |

### Матрица покрытия

| Сценарий | Тест | Файл | Тип |
|----------|------|------|-----|
| **Stripe webhook duplicate delivery** | `test_webhook_idempotent_no_duplicate_orders` | `test_checkout_flow.py` | Integration |
| **PayPal webhook duplicate delivery** | `test_paypal_webhook_idempotent_no_duplicate_orders` | `test_checkout_flow.py` | Integration |
| **Duplicate order prevention** (service layer) | `test_repeated_webhook_does_not_duplicate_order_or_invoice` | `test_webhook_lifecycle.py` | Integration |
| **Duplicate invoice prevention** | `test_repeated_webhook_does_not_duplicate_order_or_invoice` | `test_webhook_lifecycle.py` | Integration |
| **Payment replay behavior** (Stripe, unit) | `TestCreateOrdersIdempotency::test_returns_replay_result_when_payment_exists` | `tests.py` | Unit |
| **Payment replay behavior** (PayPal conv_cache_id) | `TestCreateOrdersIdempotency::test_paypal_replay_uses_conv_cache_id` | `tests.py` | Unit |
| **IntegrityError replay fallback** (TOCTOU) | `TestCreateOrdersIntegrityReplayCheckout::test_duplicate_payment_integrity_returns_replay_and_no_orders` | `tests.py` | Integration |
| **PayPal view HTTP contract on replay** | `TestPayPalWebhookViewHttp::test_replay_returns_200_zero_orders_message` | `tests.py` | View/Unit |

### Модели, проверяемые в тестах

| Модель | Что проверяется |
|--------|----------------|
| `Payment` | Создаётся ровно 1 запись при повторной доставке (`Payment.objects.count() == 1`); `UniqueConstraint` не нарушается |
| `Order` | Создаётся ровно 1 запись при повторной доставке (`Order.objects.count() == 1`) |
| `Invoice` | Создаётся ровно 1 инвойс; `Invoice.objects.count() == 1`; PDF не генерируется дважды (`mock_pdf.assert_called_once()`) |
| `OrderProduct` | Не создаётся при replay (orders == [], нет повторных вставок) |
| `WarehouseItem` | `quantity_in_stock` не уменьшается при replay (проверяется в checkout-тестах) |

### Повторные события, моделируемые в тестах

| Событие | Уровень |
|---------|---------|
| Stripe `checkout.session.completed` отправлен дважды (HTTP POST) | HTTP |
| PayPal `CHECKOUT.ORDER.COMPLETED` отправлен дважды (HTTP POST) | HTTP |
| `create_orders_and_payment` вызван дважды с одним `session_id` | Service layer |
| TOCTOU: `Payment` уже существует до входа в `transaction.atomic()`, `_replay_if_payment_exists` не перехватил (гонка) | DB / atomic |

### Assertions в существующих тестах

| Assertion | Тест |
|-----------|------|
| `result.is_replay == True` | Unit + Integration |
| `result.is_replay == False` (первый вызов) | `test_webhook_lifecycle.py` |
| `result.orders == []` при replay | Unit + Integration |
| `Order.objects.count() == 1` после двух вызовов | `test_checkout_flow.py`, `test_webhook_lifecycle.py` |
| `Payment.objects.filter(session_id=...).count() == 1` | `test_checkout_flow.py`, `test_webhook_lifecycle.py` |
| `Invoice.objects.count() == 1` | `test_webhook_lifecycle.py` |
| `mock_pdf.assert_called_once()` (PDF не дублируется) | `test_webhook_lifecycle.py` |
| `WarehouseItem.quantity_in_stock` не уменьшился при replay | `test_checkout_flow.py` |
| `set_conv_cache_after_commit` вызван с правильным `conv_cache_id` (не `session_id`) у PayPal | `tests.py` |
| HTTP-ответ `"0 order(s) created successfully"` при replay (PayPal view) | `tests.py` |
| Email/parcels side-effects **не** вызываются при IntegrityError → replay | `tests.py::TestCreateOrdersIntegrityReplayCheckout` |

---

## Gap Analysis

### Требуются ли новые тесты?

**Нет. Существующее покрытие достаточно.**

Детальная проверка:

| Зона | Покрытие | Вывод |
|------|----------|-------|
| Stripe webhook duplicate — HTTP уровень | `test_webhook_idempotent_no_duplicate_orders` — два POST, assertions по Order/Payment/WarehouseItem | Покрыто |
| PayPal webhook duplicate — HTTP уровень | `test_paypal_webhook_idempotent_no_duplicate_orders` — два POST, assertions по Order/Payment/WarehouseItem + HTTP status | Покрыто |
| Replay на service layer (pre-atomic check) | `TestCreateOrdersIdempotency` (unit), `test_repeated_webhook_does_not_duplicate_order_or_invoice` (integration) | Покрыто |
| IntegrityError TOCTOU replay | `TestCreateOrdersIntegrityReplayCheckout` — Payment pre-created, `_replay_if_payment_exists` отключён патчем | Покрыто |
| Invoice не дублируется | `test_repeated_webhook_does_not_duplicate_order_or_invoice` — `Invoice.objects.count() == 1`, `mock_pdf.assert_called_once()` | Покрыто |
| Side effects не повторяются при replay | `TestCreateOrdersIntegrityReplayCheckout` — `mock_async_parcels.assert_not_called()`, `mock_async_email.assert_not_called()` | Покрыто |
| PayPal conv_cache_id корректен при replay | `test_paypal_replay_uses_conv_cache_id` | Покрыто |
| PayPal HTTP-контракт на replay | `test_replay_returns_200_zero_orders_message` | Покрыто |

**Итог:** все ключевые сценарии idempotency покрыты на нескольких уровнях (unit, integration, HTTP). Дублирований и пробелов не обнаружено.

---

## Recommended Follow-ups

Пробелов в покрытии idempotency не выявлено. Потенциальные направления расширения — только при появлении новых веток в бизнес-логике:

- Если в webhook-processing появятся новые event types (например `payment_intent.succeeded` для Stripe или `PAYMENT.CAPTURE.COMPLETED` для PayPal) — добавить idempotency-тесты для этих веток.
- Если будет реализован Task 013 (stock reservation / decrease_stock в webhook) — добавить проверку, что списание не дублируется при replay.
- Если будет включена поддержка промокодов в оплате — добавить проверку, что increment_used_count не срабатывает дважды при replay.

---

## Relation to Prior Tasks

### Task 003 — Payment Refactor

Task 003 ввёл `UniqueConstraint(payment_system, session_id)` на `Payment` и реализовал `_replay_if_payment_exists` + ветку `IntegrityError` → replay в `webhook_processing`. Тесты idempotency из `payment/tests.py` и `payment/test_checkout_flow.py` являются **регрессиями** для этих изменений. Task 016 верифицирует, что регрессии актуальны и достаточны.

### Task 004 — Order Consistency

Task 004 зафиксировал payment cleanup по repo-scope (Final DoD table). В таблице DoD явно указано: «Webhook replay / идемпотентность — Done». Task 016 подтверждает этот статус через аудит конкретных тестов.

### Task 012 — Order Lifecycle Extended Tests

Task 012 добавил `SellerOrderActionsLifecycleTests` и `OrderStatusStringFragilityTests`. В scope Task 012 явно указано: «Дублирование интеграционных тестов webhook — они уже в payment». Task 016 верифицирует, что это разделение ответственности корректно и idempotency полностью закрыта в payment/order тестах.

### Task 015 — Full-Stack E2E Design

Task 015 (Tier 2, BE-I-001) определил сценарий «Webhook idempotency» как **backend API integration** (DRF test client, без браузера): «Повторная доставка одного события → второй заказ не создаётся». Task 016 подтверждает, что BE-I-001 уже реализован в `test_checkout_flow.py` и `test_webhook_lifecycle.py` и **не требует** дополнительной реализации.

---

## Definition of Done

- [x] Создан `docs/tasks/016-webhook-idempotency-verification/task.md`
- [x] Проведён аудит тестов в `payment/tests.py`, `payment/test_checkout_flow.py`, `order/tests.py`, `order/test_webhook_lifecycle.py`
- [x] Зафиксирована матрица покрытия (8 тестовых классов / методов, 4 уровня)
- [x] Выполнен gap analysis: пробелы не обнаружены
- [x] Вывод: **новые тесты не потребовались** — существующее покрытие достаточно
- [x] `docs/tasks/README.md` обновлён (Task 016 добавлена в таблицу и список файлов)
- [ ] `docs/test-coverage-snapshot.md` — **не обновлялся** (новые тесты не добавлялись)
