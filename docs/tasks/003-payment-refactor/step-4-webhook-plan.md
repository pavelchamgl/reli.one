# Task 003 — Step 4: Webhook isolation (план)

**Режим:** только план. Код не меняется в этом документе.

**Контекст:** Steps 1–3 и 3.1 выполнены; `create_orders_and_payment` / `WebhookPaymentData` уже в `payment/services/webhook_processing.py`. В `payment/views.py` остаётся толстый HTTP-слой **StripeWebhookView** и **PayPalWebhookView** (верификация, маршрутизация событий, разбор payload, загрузка metadata, вызов сервиса).

**Цель Step 4:** вынести провайдер-специфичную логику из views в `payment/services/stripe_webhook.py` и `payment/services/paypal_webhook.py`, оставив во view только тонкий мост: `request`/`Response`, `@extend_schema`, декораторы, вызов сервис-handler и формирование ответа **бит-в-бит** по текущим контрактам.

---

## 1. StripeWebhookView — текущее поведение (зафиксировать)

**Файл:** `backend/payment/views.py`, класс `StripeWebhookView`.

| Шаг | Действие | HTTP при текущей реализации |
|-----|----------|-----------------------------|
| 1 | `payload = request.body.decode("utf-8")`, `HTTP_STRIPE_SIGNATURE` | — |
| 2 | `stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)` | Ошибка `ValueError` / `SignatureVerificationError` → **Response(status=400)** без тела |
| 3 | Фильтр `event["type"]` ∈ `checkout.session.completed`, `checkout.session.async_payment_succeeded` | Иначе log + **Response(status=200)** без тела |
| 4 | `session = event["data"]["object"]`, `session_id`, `metadata.session_key` | Нет `session_key` → **400** `{"error": "Missing session_key"}` |
| 5 | `StripeMetadata.objects.get(session_key=...)` | `DoesNotExist` → **400** `{"error": "Session metadata not found"}` |
| 6 | `amount` из `amount_total` / 100, `currency`; опционально сравнение с `meta.description_data.gross_total` → только **warning** в лог | — |
| 7 | Сборка `WebhookPaymentData` (поля как сейчас, включая `conv_cache_id=session_id`) | — |
| 8 | `create_orders_and_payment(data)` | `None` → **500** `{"error": "Order creation failed"}` |
| 9 | `result.is_replay` | **200** пустое тело (без JSON) |
| 10 | Успех | **200** `{"status": "<n> order(s) created successfully"}` |

**Секрет:** модульный `endpoint_secret` в `views.py` (из settings) — передать в сервис параметром или читать `settings` внутри сервиса (предпочтительно **явный аргумент** `endpoint_secret` из view для тестируемости).

**Зависимости:** `stripe`, `Decimal`, `ROUND_HALF_UP`, `StripeMetadata`, `WebhookPaymentData`, `create_orders_and_payment`.

---

## 2. PayPalWebhookView — текущее поведение (зафиксировать)

**Файл:** `backend/payment/views.py`, класс `PayPalWebhookView(PayPalMixin, APIView)`.

**Вложенные методы класса (сейчас):** `_paypal_api_get`, `_paypal_api_capture` — REST-вызовы с токеном; логично перенести в `paypal_webhook.py` как функции или маленький внутренний helper, **не меняя URL/методы/таймауты**.

| Шаг | Действие | HTTP |
|-----|----------|------|
| 1 | `body` decode, `json.loads` | Невалидный JSON → **400** `{"error": "Invalid JSON"}` |
| 2 | `event_type` whitelist | Вне списка → log + **200** `{"status": "ignored"}` |
| 3 | `self.verify_webhook(request, body)` (логика в `payment/mixins.py`) | False → **403** `{"error": "Invalid webhook signature"}` |
| 4 | Ветвление `PAYMENT.CAPTURE.COMPLETED` / `CHECKOUT.ORDER.COMPLETED` / `CHECKOUT.ORDER.APPROVED` | Извлечение `order_id`, `session_key` (reference_id), `amount`, `currency`; ошибки валидации → **400** с текущими `error` строками; при APPROVED — capture, при сбое capture → **500** `{"error": "Capture failed"}` |
| 5 | Проверка полноты полей | **400** `{"error": "Incomplete data"}` |
| 6 | `PayPalMetadata.objects.get(session_key=...)` | Нет записи → **400** `{"error": "Metadata not found"}` |
| 7 | `WebhookPaymentData` (в т.ч. `conv_cache_id=session_key`, `customer_id` из metadata) | — |
| 8 | `create_orders_and_payment(webhook_data)` | `None` → **500** `{"error": "Order creation failed"}` |
| 9 | `is_replay` | Только **log**, ответ тот же, что и успех |
| 10 | Ответ | **Всегда 200** с телом `{"status": f"{len(result.orders)} order(s) created successfully"}` |

**Критично:** при idempotent replay у PayPal `orders == []` → текст `"0 order(s) created successfully"` — это **текущая семантика**, её нельзя выровнять под Stripe без явной задачи на API.

**Зависимости:** `PayPalMixin.verify_webhook` + `get_paypal_access_token` (или дублировать вызов токена только внутри перенесённой verify-обёртки без изменения HTTP PayPal API verify path).

---

## 3. `create_orders_and_payment` / `WebhookPaymentData`

**Файл:** `payment/services/webhook_processing.py`.

**Ограничение задачи:** **не менять** сигнатуры, поля `WebhookPaymentData`, ветвления идемпотентности (`Payment` по `payment_system` + `session_id`), `set_conv_cache_after_commit` ключи, порядок создания заказов.

Сервисы Step 4 только **собирают** `WebhookPaymentData` так же, как view сегодня, и передают в `create_orders_and_payment` без обёрток, меняющих данные.

**Комментарий в `webhook_processing.py`** сегодня гласит: «HTTP-слой остаётся в views» — после Step 4 обновить формулировку на «HTTP в views; верификация и нормализация payload — в `stripe_webhook` / `paypal_webhook`» (в рамках того же PR или сразу после, без изменения кода сервиса заказов).

---

## 4. Загрузка StripeMetadata / PayPalMetadata

| Провайдер | Условие | Действие при отсутствии |
|-----------|---------|-------------------------|
| Stripe | `session_key` из Checkout Session `metadata` | 400 + фиксированное тело |
| Stripe | `StripeMetadata.objects.get(session_key)` | 400 + фиксированное тело |
| PayPal | `PayPalMetadata.objects.get(session_key)` после разбора заказа | 400 + фиксированное тело |

Перенос в сервис не должен менять ни запросы ORM, ни тексты ответов.

---

## 5. Verification / signature / маршрутизация событий

| Провайдер | Механизм | Где останется вызов |
|-----------|-----------|---------------------|
| Stripe | `stripe.Webhook.construct_event` + whitelist `handled_types` | Внутри `stripe_webhook.py`; view передаёт raw body + заголовок + secret |
| PayPal | `PayPalMixin.verify_webhook` (POST на `/v1/notifications/verify-webhook-signature`) | **Вариант A (минимальный риск):** оставить `verify_webhook` в mixin, view вызывает mixin и передаёт bool в сервис. **Вариант B:** скопировать тело `verify_webhook` в `paypal_webhook.verify_signature(...)` с тем же JSON/headers; view не держит логики. Рекомендация плана: **B** в одном месте, mixin может стать тонким делегатом на функцию, чтобы не дублировать — обсудить в PR (не менять контракт verify API). |

Маршрутизация по `event_type` / `event.type` — целиком в соответствующем модуле; возвращать во view уже структурированный результат («игнор», «ошибка с кодом и телом», «данные для `create_orders_and_payment`»).

---

## 6. Идемпотентность replay

- Реализована **только** в `create_orders_and_payment` (существующий `Payment` → `is_replay=True`, обновление conv cache).
- **Stripe:** после вызова `create_orders_and_payment` при `is_replay` — **пустой 200** без тела.
- **PayPal:** при `is_replay` — тот же JSON при `len(result.orders)==0`, что описано выше.

Любой рефактор желательно **подтвердить** интеграционным тестом (см. ниже).

---

## 7. Предлагаемая декомпозиция файлов

### 7.1 `payment/services/stripe_webhook.py`

**Назначение:** вся логика после получения сырого тела до вызова `create_orders_and_payment` (не включая сам вызов — остаётся во view или в одном тонком orchestrator; рекомендация: **orchestrator-функция возвращает результат**, view только мапит в `Response`).

Предлагаемые функции (имена ориентировочные):

1. **`verify_and_resolve_stripe_checkout_event(raw_body: str, signature_header: str, *, secret: str)`**  
   - Возвращает либо `(event,)`, либо объект/тип отказа с полями `http_status`, `response_data` (для 400 без тела — отдельный флаг).  
   - **Не ловить** исключения в view — либо ловить внутри и маппить в отказ, как сейчас.

2. **`stripe_checkout_session_to_webhook_payment_data(session: dict, meta: StripeMetadata) -> WebhookPaymentData`**  
   - Сумма, валюта, warning по `gross_total`, все поля `WebhookPaymentData` как в view.

3. **Опционально:** **`handle_stripe_checkout_webhook(... ) -> StripeWebhookOutcome`**  
   - Объединяет: verify → filter type → extract session → load metadata → build data; `Outcome` = discriminated union: `ignored` | `client_error` | `ready` (`WebhookPaymentData`) | `internal_error` (если когда-либо понадобится до вызова create_orders — сейчас metadata-errors = 400 во view).

**Явно не выносить в этот шаг:** `create_orders_and_payment`, изменение `webhook_processing.py`.

### 7.2 `payment/services/paypal_webhook.py`

1. **`parse_paypal_webhook_body(raw_body: str) -> dict | PayPalWebhookReject`** — JSON + первая валидация.

2. **`route_paypal_event_and_extract_payment_ids(payload: dict, *, api_get, api_capture) -> PayPalParsedPayment | PayPalWebhookReject`**  
   - Три ветки событий; `api_get`/`api_capture` — **инъекция** для тестов (по умолчанию реальные функции с `settings.PAYPAL_API_URL` и токеном).

3. **`paypal_metadata_to_webhook_payment_data(meta: PayPalMetadata, order_id, session_key, amount, currency) -> WebhookPaymentData`**.

4. **`verify_paypal_webhook_request(request, raw_body) -> bool`** — перенос из mixin **или** вызов общей функции из mixin без дублирования HTTP-контракта (см. §5).

---

## 8. Что остаётся во `views.py`

- Декораторы: `@method_decorator(csrf_exempt)`, `@extend_schema(...)` с тем же текстом и `responses`.
- `permission_classes = [AllowAny]`.
- `StripeWebhookView.post` / `PayPalWebhookView.post`:  
  - прочитать `request.body`, заголовки;  
  - вызвать функции из `stripe_webhook` / `paypal_webhook`;  
  - собрать `Response` с **те же** `status` и телом, что в таблицах §1–2;  
  - вызвать `create_orders_and_payment` в том же месте по потоку, что сейчас (после успешной нормализации данных).

- **`PayPalWebhookView` может остаться с миксином** только для обратной совместимости с другими вьюхами, создающими PayPal (если есть); для webhook достаточно импорта сервиса.

**Не делать в Step 4 (по ограничениям):** чистка неиспользуемых импортов в `views.py` сверх минимально необходимого для вебхуков.

---

## 9. Контракты, которые нельзя менять

- Все пары **(HTTP-код, тело)** из §1–2, включая пустые ответы и **различие Stripe vs PayPal** при replay.
- Поля и значения `WebhookPaymentData` для каждого провайдера (включая `conv_cache_id`, `payment_intent_id`, `customer_id`).
- Поведение идемпотентности и содержимое conv cache (ключи, TTL — не трогаем в Step 4).
- Логи: желательно сохранить те же `logger.info/error/warning` сообщения или согласовать список изменений как отдельный микро-шаг (риск мониторинга).
- Stripe: whitelist типов событий; PayPal: whitelist `event_type`, тот же набор полей capture/order.

---

## 10. Тесты — добавить или обновить

| Область | Действие |
|---------|----------|
| `payment/services/webhook_processing` | Уже есть unit-тесты на `create_orders_and_payment` — **не ломать** импорты; при появлении `stripe_webhook` патчить там, где сейчас патчится stripe только в интеграциях. |
| **Новые unit-тесты** `stripe_webhook.py` | Mock `stripe.Webhook.construct_event`; кейсы: bad signature → отказ 400 без тела; ignored event → ignored; missing `session_key`; missing metadata; успешная сборка `WebhookPaymentData` (assert по полям). |
| **Новые unit-тесты** `paypal_webhook.py` | Табличные тесты на три `event_type` с фиктивным payload; verify false → 403; ignored → 200 ignored; mock `api_get`/`api_capture`; metadata missing. |
| `payment/test_checkout_flow.py` | `StripeWebhookFlowTests` — прогон после рефактора **обязателен**; при необходимости добавить тест на **replay** Stripe (пустое тело 200). |
| **PayPal webhook** | Если интеграционных тестов нет — добавить минимальный тест с `APIClient` + mocks на verify и `create_orders_and_payment`, фиксирующий **200 + строка с 0 orders** при replay (опционально, но снижает регресс). |

---

## 11. Риски (order / payment / idempotency)

| Риск | Митигация |
|------|-----------|
| Неверный маппинг ответа (особенно Stripe replay vs PayPal) | Таблица контрактов §1–2 + отдельные assert в тестах. |
| Двойной вызов `create_orders_and_payment` при рефакторинге | Один путь в view; код-ревью diff `post()`. |
| Расхождение `session_id` идемпотентности (PayPal order id) | Не менять, что кладётся в `WebhookPaymentData.session_id`. |
| PayPal capture в сервисе — необработанное исключение | Сохранить `500` / `400` ветки как сейчас; не проглатывать stack trace наружу клиенту. |
| Загрузка metadata до/после verify | Порядок как сейчас: Stripe — после проверки подписи; PayPal — после verify. |

---

## 12. Порядок выполнения (рекомендуемый)

1. Зафиксировать текущие ответы вебхуков в документе или временных golden-тестах (ручной snapshot до правок).
2. Ввести `stripe_webhook.py` + unit-тесты; перевести `StripeWebhookView.post` на вызовы; прогнать `payment/tests.py` + `test_checkout_flow.py`.
3. Ввести `paypal_webhook.py` + unit-тесты; перевести `PayPalWebhookView.post`; прогнать весь `payment/`.
4. Точечно обновить docstring в `webhook_processing.py` (только комментарий про расположение HTTP-слоя).
5. Обновить `docs/tasks/003-payment-refactor/task.md`: Step 4 → Done, краткая ссылка на этот план.

**Не смешивать** с Step «cleanup imports» в `views.py`.

---

## 13. Execution prompt для Step 4 (для агента / разработчика)

```text
Реализуй Task 003 Step 4: изоляция webhook-логики из payment/views.py в payment/services/stripe_webhook.py и payment/services/paypal_webhook.py.

Строго сохрани:
- Все HTTP статусы и тела ответов StripeWebhookView и PayPalWebhookView (включая пустой 200 при Stripe idempotent replay и JSON с "0 order(s)..." при PayPal replay).
- Вызов create_orders_and_payment и контракт WebhookPaymentData без изменений.
- Поведение verify/signature и whitelist типов событий.
- Не менять webhook_processing.py кроме комментария о месте HTTP-слоя при необходимости.
- Не трогать модели, миграции, order lifecycle, cleanup прочих импортов views.

Добавь unit-тесты на новые модули; прогони payment/tests.py и payment/test_checkout_flow.py. Обнови task.md Step 4 статус при завершении.
```

---

## Краткое резюме

Step 4 — это **чистый перенос** верификации, маршрутизации и сборки `WebhookPaymentData` в два сервисных модуля с **замороженным** HTTP-поведением и без изменений `create_orders_and_payment`. Критично зафиксировать **различие финальных ответов** Stripe (пустой 200 на replay) и PayPal (всегда JSON со счётчиком заказов). После переноса PayPal вспомогательные `_paypal_api_*` логично держать рядом с `paypal_webhook.py` с инъекцией для тестов.
